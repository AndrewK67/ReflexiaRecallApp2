import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetBrowserStorage } from './helpers';

async function loadPacks() {
  return import('../../src/packs');
}

const KEY = 'reflexia.packs.v2';
const OLD_KEY = 'reflexia.packs.v1';

describe('packs', () => {
  beforeEach(() => resetBrowserStorage());

  it('registers exactly the five packs and no professional pack', async () => {
    const p = await loadPacks();
    expect(Object.keys(p.PACK_REGISTRY).sort()).toEqual(['aiReflectionCoach', 'core', 'reports', 'scenario', 'wellbeing']);
    expect(p.getOptionalPacks().map((x) => x.id)).not.toContain('professional');
  });

  it('defaults to core on, everything else off', async () => {
    const p = await loadPacks();
    expect(p.isPackEnabled('core')).toBe(true);
    for (const id of ['wellbeing', 'aiReflectionCoach', 'scenario', 'reports'] as const) {
      expect(p.isPackEnabled(id)).toBe(false);
    }
  });

  it('enables a pack forever, persists it, and disables it again', async () => {
    const p = await loadPacks();
    p.enablePack('wellbeing');
    expect(p.isPackEnabled('wellbeing')).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEY)!).wellbeing).toMatchObject({ enabled: true, isPermanent: true });
    p.disablePack('wellbeing');
    expect(p.isPackEnabled('wellbeing')).toBe(false);
  });

  it('never disables or toggles off the core pack', async () => {
    const p = await loadPacks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    p.disablePack('core');
    expect(p.isPackEnabled('core')).toBe(true);
    expect(p.togglePack('core')).toBe(true);
    expect(p.isPackEnabled('core')).toBe(true);
  });

  it('a 7-day trial is on today and off after it ends', async () => {
    const p = await loadPacks();
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-09-22T12:00:00Z'));
      p.enablePack('scenario', 7);
      expect(p.isPackEnabled('scenario')).toBe(true);
      expect(p.getRemainingTrialDays(p.getPackInfo('scenario'))).toBe(7);

      vi.setSystemTime(new Date('2026-09-30T12:00:00Z'));
      expect(p.isPackEnabled('scenario')).toBe(false);
      expect(p.getRemainingTrialDays(p.getPackInfo('scenario'))).toBe(0);

      p.cleanupExpiredTrials();
      expect(JSON.parse(localStorage.getItem(KEY)!).scenario).toMatchObject({ enabled: false, isPermanent: false, trialDuration: 7 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('togglePack flips and reports the new state', async () => {
    const p = await loadPacks();
    expect(p.togglePack('reports')).toBe(true);
    expect(p.isPackEnabled('reports')).toBe(true);
    expect(p.togglePack('reports')).toBe(false);
    expect(p.isPackEnabled('reports')).toBe(false);
  });

  it('tolerates a stale key from a pack that no longer exists (phase 1A)', async () => {
    localStorage.setItem(KEY, JSON.stringify({
      core: { enabled: true, isPermanent: true },
      professional: { enabled: true, isPermanent: true },
      wellbeing: { enabled: true, isPermanent: true },
    }));
    const p = await loadPacks();
    expect(p.isPackEnabled('wellbeing')).toBe(true);
    expect(p.getEnabledPacks()).toContain('wellbeing');
    expect(() => p.cleanupExpiredTrials()).not.toThrow();
    expect(p.getOptionalPacks().map((x) => x.id)).not.toContain('professional');
  });

  it('migrates the v1 boolean format once and removes the old key', async () => {
    localStorage.setItem(OLD_KEY, JSON.stringify({ core: true, wellbeing: true, reports: false }));
    const p = await loadPacks();
    expect(p.isPackEnabled('wellbeing')).toBe(true);
    expect(p.isPackEnabled('reports')).toBe(false);
    expect(localStorage.getItem(OLD_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(KEY)!).wellbeing).toMatchObject({ enabled: true, isPermanent: true });
  });

  it('always forces core back on even if stored state says otherwise', async () => {
    localStorage.setItem(KEY, JSON.stringify({ core: { enabled: false, isPermanent: false } }));
    const p = await loadPacks();
    expect(p.isPackEnabled('core')).toBe(true);
  });

  it('maps gated views to their packs and leaves core views ungated', async () => {
    const p = await loadPacks();
    expect(p.getRequiredPack('HOLODECK')).toBe('scenario');
    expect(p.getRequiredPack('BIO_RHYTHM')).toBe('wellbeing');
    expect(p.getRequiredPack('ORACLE')).toBe('aiReflectionCoach');
    expect(p.getRequiredPack('REPORTS')).toBe('reports');
    expect(p.getRequiredPack('CPD')).toBeNull();
    expect(p.getRequiredPack('REFLECTION')).toBeNull();
  });
});
