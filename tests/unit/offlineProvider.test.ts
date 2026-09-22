import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineProvider } from '../../src/services/providers/offlineProvider';

const MODELS = ['SIMPLE', 'GIBBS', 'SBAR', 'ERA', 'ROLFE', 'STAR', 'SOAP', 'MORNING', 'EVENING', 'FREE'];

describe('OfflineProvider', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => { fetchSpy = vi.fn(); vi.stubGlobal('fetch', fetchSpy); });
  afterEach(() => vi.unstubAllGlobals());

  it('never touches the network', async () => {
    const p = new OfflineProvider();
    await p.generateDailyPrompt();
    await p.getStageCoaching('Description', 'text');
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

  it('gives a non-empty coaching tip for known and unknown stages', async () => {
    const p = new OfflineProvider();
    expect((await p.getStageCoaching('Feelings', '')).length).toBeGreaterThan(10);
    expect((await p.getStageCoaching('what_happened', '')).length).toBeGreaterThan(10);
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
