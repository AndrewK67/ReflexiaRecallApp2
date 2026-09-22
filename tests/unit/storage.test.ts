import { describe, it, expect, beforeEach } from 'vitest';
import { resetBrowserStorage, quickCapture, silenceConsoleError } from './helpers';

async function loadStorage() {
  const m = await import('../../src/services/storageService');
  return m.storageService;
}

describe('storageService', () => {
  beforeEach(() => resetBrowserStorage());

  describe('profile', () => {
    it('returns defaults when nothing is stored', async () => {
      const s = await loadStorage();
      expect(s.loadProfile()).toMatchObject({ name: '', profession: 'NONE', isOnboarded: false, aiEnabled: false, themeMode: 'DARK' });
    });

    it('saveProfile merges with the stored profile and back-fills missing toggles', async () => {
      const s = await loadStorage();
      s.saveProfile({ name: 'Andrew' });
      localStorage.setItem('reflexia.profile.v1', JSON.stringify({ name: 'Andrew' })); // an old, sparse profile
      const merged = s.saveProfile({ themeMode: 'LIGHT' });
      expect(merged).toMatchObject({ name: 'Andrew', themeMode: 'LIGHT', aiEnabled: false, showDisclaimers: true, isOnboarded: false });
      expect(s.loadProfile()).toEqual(merged);
    });

    it('patchProfile and setOnboarded change only what they say', async () => {
      const s = await loadStorage();
      s.saveProfile({ name: 'Andrew', aiEnabled: true });
      s.setOnboarded(true);
      expect(s.loadProfile()).toMatchObject({ name: 'Andrew', aiEnabled: true, isOnboarded: true });
      s.patchProfile({ blurHistory: true });
      expect(s.loadProfile()).toMatchObject({ name: 'Andrew', aiEnabled: true, isOnboarded: true, blurHistory: true });
    });

    it('resetToggles turns the four toggles off and nothing else', async () => {
      const s = await loadStorage();
      s.saveProfile({ name: 'Andrew', aiEnabled: true, gamificationEnabled: true, privacyLockEnabled: true, blurHistory: true, themeMode: 'LIGHT' });
      const p = s.resetToggles();
      expect(p).toMatchObject({ name: 'Andrew', themeMode: 'LIGHT', aiEnabled: false, gamificationEnabled: false, privacyLockEnabled: false, blurHistory: false });
    });

    it('survives corrupt JSON in localStorage', async () => {
      const s = await loadStorage();
      localStorage.setItem('reflexia.profile.v1', '{not json');
      expect(s.loadProfile().profession).toBe('NONE');
    });
  });

  describe('stats', () => {
    it('fills missing fields from defaults when older data is stored', async () => {
      const s = await loadStorage();
      localStorage.setItem('reflexia.stats.v1', JSON.stringify({ totalEntries: 7 }));
      const stats = await s.loadStats();
      expect(stats).toMatchObject({ totalEntries: 7, level: 1, currentXP: 0, achievements: [] });
    });

    it('patchStats merges and persists', async () => {
      const s = await loadStorage();
      s.patchStats({ currentXP: 250 });
      expect((await s.loadStats()).currentXP).toBe(250);
    });
  });

  describe('backup', () => {
    it('buildBackup carries profile, entries and stats with version 1', async () => {
      const s = await loadStorage();
      s.saveProfile({ name: 'Andrew' });
      s.patchStats({ currentXP: 10 });
      const entryStorage = await import('../../src/services/entryStorageService');
      await entryStorage.initEntryStorage();
      await entryStorage.saveEntry(quickCapture('e1', 'in the backup'));

      const backup = await s.buildBackup();
      expect(backup.version).toBe(1);
      expect(backup.profile.name).toBe('Andrew');
      expect(backup.stats?.currentXP).toBe(10);
      expect(backup.entries).toMatchObject([{ id: 'e1', notes: 'in the backup' }]);
      expect(Date.parse(backup.exportedAt)).not.toBeNaN();
    });

    it('importBackup restores profile, stats and entries from a File', async () => {
      const s = await loadStorage();
      const file = new File([JSON.stringify({
        version: 1,
        profile: { name: 'Restored', profession: 'NONE' },
        stats: { currentXP: 99 },
        entries: [quickCapture('b1', 'from backup'), quickCapture('b2', 'from backup too')],
      })], 'reflexia-backup.json', { type: 'application/json' });

      expect(await s.importBackup(file)).toBe(true);
      expect(s.loadProfile().name).toBe('Restored');
      expect((await s.loadStats()).currentXP).toBe(99);
      const entryStorage = await import('../../src/services/entryStorageService');
      await entryStorage.initEntryStorage();
      expect((await entryStorage.loadEntries()).map((e) => e.id).sort()).toEqual(['b1', 'b2']);
    });

    it('a backup round-trips through build → import unchanged', async () => {
      const s = await loadStorage();
      s.saveProfile({ name: 'Andrew', themeMode: 'LIGHT' });
      const entryStorage = await import('../../src/services/entryStorageService');
      await entryStorage.initEntryStorage();
      await entryStorage.saveEntry(quickCapture('e1', 'round trip'));
      const backup = await s.buildBackup();

      resetBrowserStorage();
      const s2 = await loadStorage();
      expect(await s2.importBackup(new File([JSON.stringify(backup)], 'b.json'))).toBe(true);
      const es2 = await import('../../src/services/entryStorageService');
      await es2.initEntryStorage();
      expect(await es2.loadEntries()).toMatchObject([{ id: 'e1', notes: 'round trip' }]);
      expect(s2.loadProfile()).toMatchObject({ name: 'Andrew', themeMode: 'LIGHT' });
    });

    it('importBackup returns false on a file that is not JSON', async () => {
      silenceConsoleError();
      const s = await loadStorage();
      expect(await s.importBackup(new File(['definitely not json'], 'x.json'))).toBe(false);
    });
  });

  describe('recent names', () => {
    it('keeps the ten most recent, most recent first, without duplicates', async () => {
      const s = await loadStorage();
      for (let i = 1; i <= 12; i++) s.saveRecentName(`name${i}`);
      s.saveRecentName('name5');
      const names = s.getRecentNames();
      expect(names).toHaveLength(10);
      expect(names[0]).toBe('name5');
      expect(new Set(names).size).toBe(10);
    });
  });
});
