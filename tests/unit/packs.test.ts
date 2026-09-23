import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetBrowserStorage } from './helpers';

async function loadPacks() {
  return import('../../src/packs');
}

const KEY = 'reflexia.packs.v2';
const OLD_KEY = 'reflexia.packs.v1';

describe('packs', () => {
  beforeEach(() => resetBrowserStorage());

  it('registers exactly four packs: core and three optional ones (no professional, no scenario)', async () => {
    const p = await loadPacks();
    expect(Object.keys(p.PACK_REGISTRY).sort()).toEqual(['aiReflectionCoach', 'core', 'reports', 'wellbeing']);
    expect(p.getOptionalPacks().map((x) => x.id).sort()).toEqual(['aiReflectionCoach', 'reports', 'wellbeing']);
  });

  it('has no trial machinery left (phase 3B.3)', async () => {
    const p = (await loadPacks()) as Record<string, unknown>;
    for (const gone of ['isTrialExpired', 'getRemainingTrialDays', 'cleanupExpiredTrials']) {
      expect(gone in p, gone).toBe(false);
    }
  });

  it('defaults to core on, everything else off', async () => {
    const p = await loadPacks();
    expect(p.isPackEnabled('core')).toBe(true);
    for (const id of ['wellbeing', 'aiReflectionCoach', 'reports'] as const) expect(p.isPackEnabled(id)).toBe(false);
  });

  it('enables a pack, stores it as a plain switch, and disables it again', async () => {
    const p = await loadPacks();
    p.enablePack('wellbeing');
    expect(p.isPackEnabled('wellbeing')).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEY)!).wellbeing).toEqual({ enabled: true });
    p.disablePack('wellbeing');
    expect(p.isPackEnabled('wellbeing')).toBe(false);
    expect(p.getPackInfo('wellbeing')).toEqual({ enabled: false });
  });

  it('never disables or toggles off the core pack', async () => {
    const p = await loadPacks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    p.disablePack('core');
    expect(p.isPackEnabled('core')).toBe(true);
    expect(p.togglePack('core')).toBe(true);
    expect(p.isPackEnabled('core')).toBe(true);
  });

  it('togglePack flips and reports the new state', async () => {
    const p = await loadPacks();
    expect(p.togglePack('reports')).toBe(true);
    expect(p.isPackEnabled('reports')).toBe(true);
    expect(p.togglePack('reports')).toBe(false);
    expect(p.isPackEnabled('reports')).toBe(false);
    expect(p.getEnabledPacks()).toEqual(['core']);
  });

  it('ignores keys for packs that no longer exist, and drops them on the next save', async () => {
    localStorage.setItem(KEY, JSON.stringify({
      core: { enabled: true, isPermanent: true },
      professional: { enabled: true, isPermanent: true },
      scenario: { enabled: true, isPermanent: true },
      wellbeing: { enabled: true, isPermanent: true },
    }));
    const p = await loadPacks();
    expect(p.isPackEnabled('wellbeing')).toBe(true);
    expect(p.getEnabledPacks().sort()).toEqual(['core', 'wellbeing']);
    p.enablePack('reports');
    const saved = JSON.parse(localStorage.getItem(KEY)!);
    expect(Object.keys(saved).sort()).toEqual(['aiReflectionCoach', 'core', 'reports', 'wellbeing']);
  });

  it('reads state written by the trial builds: an ended trial is off, anything else enabled stays on', async () => {
    localStorage.setItem(KEY, JSON.stringify({
      core: { enabled: true, isPermanent: true },
      wellbeing: { enabled: true, isPermanent: false, trialStartDate: '2026-09-01T00:00:00Z', trialEndDate: '2026-09-08T00:00:00Z', trialDuration: 7 },
      reports: { enabled: true, isPermanent: false, trialStartDate: '2099-01-01T00:00:00Z', trialEndDate: '2099-01-08T00:00:00Z', trialDuration: 7 },
      aiReflectionCoach: { enabled: true, isPermanent: true },
    }));
    const p = await loadPacks();
    expect(p.isPackEnabled('wellbeing')).toBe(false); // trial ended before today
    expect(p.isPackEnabled('reports')).toBe(true);    // trial still running: kept on, now for good
    expect(p.isPackEnabled('aiReflectionCoach')).toBe(true);
    expect(p.normaliseStoredState({ wellbeing: { enabled: false } }).wellbeing).toEqual({ enabled: false });
    expect(p.normaliseStoredState('garbage').core).toEqual({ enabled: true });
  });

  it('migrates the v1 boolean format once and removes the old key', async () => {
    localStorage.setItem(OLD_KEY, JSON.stringify({ core: true, wellbeing: true, reports: false }));
    const p = await loadPacks();
    expect(p.isPackEnabled('wellbeing')).toBe(true);
    expect(p.isPackEnabled('reports')).toBe(false);
    expect(localStorage.getItem(OLD_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(KEY)!).wellbeing).toEqual({ enabled: true });
  });

  it('always forces core back on even if stored state says otherwise', async () => {
    localStorage.setItem(KEY, JSON.stringify({ core: { enabled: false } }));
    const p = await loadPacks();
    expect(p.isPackEnabled('core')).toBe(true);
  });

  it('maps gated views to their packs; Spaces and the other core views are ungated', async () => {
    const p = await loadPacks();
    expect(p.getRequiredPack('HOLODECK')).toBeNull();
    expect(p.getRequiredPack('BIO_RHYTHM')).toBe('wellbeing');
    expect(p.getRequiredPack('ORACLE')).toBe('aiReflectionCoach');
    expect(p.getRequiredPack('REPORTS')).toBe('reports');
    expect(p.getRequiredPack('CPD')).toBeNull();
    expect(p.getRequiredPack('REFLECTION')).toBeNull();
  });

  it('describes each pack without prices, trials or promises the build does not keep', async () => {
    const p = await loadPacks();
    const text = JSON.stringify(p.PACK_REGISTRY);
    expect(text).not.toMatch(/£|\$|trial|subscri|Pro\b|Lifetime|Enterprise|PDF|ZIP|Holodeck|Scenario/i);
  });
});
