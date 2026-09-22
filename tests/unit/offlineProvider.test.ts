import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineProvider } from '../../src/services/providers/offlineProvider';

import { ALL, DEFAULT_COACHING, GIBBS, THREE_PART } from '../../src/frameworks';

// Every id the core ships plus two legacy ids entries on devices may still carry.
const MODELS = [...ALL.map((f) => f.id), 'SBAR', 'SOAP'];

describe('OfflineProvider', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => { fetchSpy = vi.fn(); vi.stubGlobal('fetch', fetchSpy); });
  afterEach(() => vi.unstubAllGlobals());

  it('never touches the network', async () => {
    const p = new OfflineProvider();
    await p.generateDailyPrompt();
    await p.getStageCoaching('GIBBS', 'Description', 'text');
    await p.analyzeReflection({ a: 'text' }, 'NONE', 'SIMPLE');
    await p.askOracle('what now?', '[]');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('daily prompt is deterministic for a date and varies across dates', async () => {
    const p = new OfflineProvider();
    const a = await p.generateDailyPrompt('2026-09-22');
    expect(a).toBe(await p.generateDailyPrompt('2026-09-22'));
    expect(a.trim().length).toBeGreaterThan(10);
    const week = await Promise.all(Array.from({ length: 7 }, (_, i) => p.generateDailyPrompt(`2026-09-${String(22 + i).padStart(2, '0')}`)));
    expect(new Set(week).size).toBeGreaterThan(1);
  });

  it('coaches from the framework registry, with a default for unknown stages', async () => {
    const p = new OfflineProvider();
    expect(await p.getStageCoaching('GIBBS', 'Feelings', '')).toBe(GIBBS.stages[1].coaching);
    expect(await p.getStageCoaching('SIMPLE', 'what_happened', 'some text')).toBe(THREE_PART.stages[0].coaching);
    expect(await p.getStageCoaching('SBAR', 'SBAR_Situation', '')).toBe(DEFAULT_COACHING);
    expect(await p.getStageCoaching('', '', '')).toBe(DEFAULT_COACHING);
  });

  it('analyses empty and non-empty reflections for every model', async () => {
    const p = new OfflineProvider();
    for (const model of MODELS) {
      const empty = await p.analyzeReflection({}, 'NONE', model);
      const full = await p.analyzeReflection({ what_happened: 'A hard conversation' }, 'NONE', model);
      expect(empty).toMatch(/Summary:/);
      expect(full).toMatch(/Summary:/);
      expect(full).not.toBe(empty);
    }
  });

  it('answers the Oracle without needing entries', async () => {
    const p = new OfflineProvider();
    expect((await p.askOracle('Should I change jobs?')).length).toBeGreaterThan(10);
  });
});
