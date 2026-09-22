import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { resetBrowserStorage } from './helpers';

/**
 * The AI boundary (phase 3E): nothing reaches the network unless the person
 * has both pasted their own key and turned AI on. These tests stub fetch and
 * count calls; a Gemini request is any fetch to generativelanguage.googleapis.com.
 */

const KEY = 'AIzaSyTEST-not-a-real-key-0123456789';

function okJson(text: string) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
  } as Response);
}

async function loadAI() {
  return import('../../src/services/aiService');
}
async function loadKeys() {
  return import('../../src/services/aiKeyService');
}
async function loadStorage() {
  return (await import('../../src/services/storageService')).storageService;
}

/** Drive every exported call once; returns how many Gemini requests they made. */
async function exerciseAll(fetchSpy: ReturnType<typeof vi.fn>) {
  const ai = await loadAI();
  await ai.generateDailyPrompt('2026-09-22');
  await ai.getStageCoaching('SIMPLE', 'what_happened', 'some text');
  await ai.analyzeReflection({ what_happened: 'x' }, 'SIMPLE');
  await ai.askOracle({ question: 'what now?', entriesJson: '[]' });
  return fetchSpy.mock.calls.filter((c) => String(c[0]).includes('generativelanguage.googleapis.com')).length;
}

describe('the AI gate', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    resetBrowserStorage();
    fetchSpy = vi.fn(() => okJson('from gemini'));
    vi.stubGlobal('fetch', fetchSpy);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('is closed by default: no key, AI off', async () => {
    const ai = await loadAI();
    await ai.initAI();
    expect(ai.aiStatus()).toMatchObject({ enabled: false, hasKey: false, active: false, keyLoaded: true });
    expect(await exerciseAll(fetchSpy)).toBe(0);
  });

  it('stays closed with AI on but no key', async () => {
    const storage = await loadStorage();
    storage.saveProfile({ ...storage.loadProfile(), aiEnabled: true });
    const ai = await loadAI();
    await ai.initAI();
    expect(ai.isAIEnabled()).toBe(true);
    expect(ai.isAIActive()).toBe(false);
    expect(await exerciseAll(fetchSpy)).toBe(0);
  });

  it('stays closed with a key but AI off', async () => {
    const keys = await loadKeys();
    await keys.saveAIKey(KEY);
    const ai = await loadAI();
    await ai.initAI();
    expect(ai.hasAIKey()).toBe(true);
    expect(ai.isAIActive()).toBe(false);
    expect(await exerciseAll(fetchSpy)).toBe(0);
  });

  it('opens only with both, and every feature then uses the key', async () => {
    const storage = await loadStorage();
    storage.saveProfile({ ...storage.loadProfile(), aiEnabled: true });
    const keys = await loadKeys();
    await keys.saveAIKey(KEY);
    const ai = await loadAI();
    await ai.initAI();
    expect(ai.isAIActive()).toBe(true);
    expect(await exerciseAll(fetchSpy)).toBe(4);
    for (const call of fetchSpy.mock.calls) {
      expect(String(call[0])).toContain(`key=${KEY}`);
      expect(String(call[0])).toContain(ai.GEMINI_MODEL);
    }
    expect(await ai.askOracle('again?')).toBe('from gemini');
  });

  it('closes again the moment the toggle goes off or the key is removed', async () => {
    const storage = await loadStorage();
    storage.saveProfile({ ...storage.loadProfile(), aiEnabled: true });
    const keys = await loadKeys();
    await keys.saveAIKey(KEY);
    const ai = await loadAI();
    await ai.initAI();
    expect(await exerciseAll(fetchSpy)).toBe(4);

    storage.saveProfile({ ...storage.loadProfile(), aiEnabled: false });
    expect(ai.isAIActive()).toBe(false);
    expect(await exerciseAll(fetchSpy)).toBe(4);

    storage.saveProfile({ ...storage.loadProfile(), aiEnabled: true });
    ai.setAIKey(null);
    expect(ai.isAIActive()).toBe(false);
    expect(await exerciseAll(fetchSpy)).toBe(4);
  });

  it('answers from the offline provider, not an error, when closed', async () => {
    const ai = await loadAI();
    await ai.initAI();
    expect((await ai.getStageCoaching('GIBBS', 'Feelings', '')).length).toBeGreaterThan(20);
    expect(await ai.analyzeReflection({}, 'SIMPLE')).toMatch(/Summary:/);
    expect((await ai.askOracle('x')).length).toBeGreaterThan(10);
    expect((await ai.generateDailyPrompt()).length).toBeGreaterThan(10);
  });

  it('falls back to the offline daily prompt when the provider fails', async () => {
    const storage = await loadStorage();
    storage.saveProfile({ ...storage.loadProfile(), aiEnabled: true });
    const keys = await loadKeys();
    await keys.saveAIKey(KEY);
    fetchSpy.mockImplementation(() => Promise.reject(new Error('offline')));
    const ai = await loadAI();
    await ai.initAI();
    expect((await ai.generateDailyPrompt()).length).toBeGreaterThan(10);
  });
});

describe('the key store', () => {
  beforeEach(() => resetBrowserStorage());

  it('round-trips through the keystore and survives a fresh module graph', async () => {
    let keys = await loadKeys();
    expect(await keys.loadAIKey()).toBeNull();
    await keys.saveAIKey(`  ${KEY}  `);
    vi.resetModules();
    keys = await loadKeys();
    expect(await keys.loadAIKey()).toBe(KEY);
    expect(keys.keyHint(KEY)).toBe('6789');
    await keys.clearAIKey();
    vi.resetModules();
    keys = await loadKeys();
    expect(await keys.loadAIKey()).toBeNull();
  });

  it('rejects something too short to be a key', async () => {
    const keys = await loadKeys();
    await expect(keys.saveAIKey('abc')).rejects.toThrow();
    expect(keys.looksLikeAIKey('abc')).toBe(false);
    expect(keys.looksLikeAIKey(KEY)).toBe(true);
  });

  it('is not in localStorage and so not in a backup', async () => {
    const keys = await loadKeys();
    await keys.saveAIKey(KEY);
    const storage = await loadStorage();
    const backup = JSON.stringify(await storage.buildBackup());
    expect(backup).not.toContain(KEY);
    for (let i = 0; i < localStorage.length; i++) {
      expect(localStorage.getItem(localStorage.key(i)!)).not.toContain(KEY);
    }
  });
});

describe('no build-time key', () => {
  it('aiService.ts does not read import.meta.env at all', () => {
    const src = fs.readFileSync('src/services/aiService.ts', 'utf8');
    expect(src).not.toMatch(/import\.meta\.env/);
    expect(src).not.toMatch(/VITE_GEMINI/);
  });

  it('nothing under src/ reads VITE_GEMINI_API_KEY', () => {
    const hits: string[] = [];
    const walk = (d: string) => {
      for (const f of fs.readdirSync(d, { withFileTypes: true })) {
        const p = `${d}/${f.name}`;
        if (f.isDirectory()) walk(p);
        else if (/\.tsx?$/.test(f.name) && fs.readFileSync(p, 'utf8').includes('VITE_GEMINI_API_KEY')) hits.push(p);
      }
    };
    walk('src');
    expect(hits).toEqual([]);
  });
});
