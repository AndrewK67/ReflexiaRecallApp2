import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetBrowserStorage, loadEntryStorage, quickCapture, rawEntryRecords, silenceConsoleError } from './helpers';

const LS_ENTRIES = 'reflexia.entries.v1';
const MIGRATED_FLAG = 'reflexia.entries.idb_migrated';

describe('entryStorageService', () => {
  let s: Awaited<ReturnType<typeof loadEntryStorage>>;

  beforeEach(async () => {
    resetBrowserStorage();
    s = await loadEntryStorage();
    await s.initEntryStorage();
  });

  describe('save and load', () => {
    it('round-trips an entry through IndexedDB', async () => {
      await s.saveEntry(quickCapture('e1', 'hello'));
      const loaded = await s.loadEntries();
      expect(loaded).toHaveLength(1);
      expect(loaded[0]).toMatchObject({ id: 'e1', notes: 'hello' });
    });

    it('stores the IndexedDB record encrypted, with no plaintext in it', async () => {
      await s.saveEntry(quickCapture('e1', 'secret words'));
      const raw = await rawEntryRecords();
      expect(raw).toHaveLength(1);
      expect(Object.keys(raw[0]).sort()).toEqual(['_encrypted', 'id']);
      expect(JSON.stringify(raw)).not.toContain('secret words');
    });

    it('survives a reload: a fresh module graph reads the same IndexedDB', async () => {
      await s.saveEntry(quickCapture('e1', 'persist me'));
      // Simulate the page reloading: new module instances, same browser storage.
      const { vi } = await import('vitest');
      vi.resetModules();
      const again = await loadEntryStorage();
      await again.initEntryStorage();
      expect(await again.loadEntries()).toMatchObject([{ id: 'e1', notes: 'persist me' }]);
    });

    it('returns entries newest first', async () => {
      await s.saveEntry(quickCapture('old', 'a', '2026-01-01T00:00:00.000Z'));
      await s.saveEntry(quickCapture('new', 'b', '2026-06-01T00:00:00.000Z'));
      await s.saveEntry(quickCapture('mid', 'c', '2026-03-01T00:00:00.000Z'));
      expect((await s.loadEntries()).map((e) => e.id)).toEqual(['new', 'mid', 'old']);
    });

    it('overwrites an entry saved twice with the same id', async () => {
      await s.saveEntry(quickCapture('e1', 'first'));
      await s.saveEntry(quickCapture('e1', 'second'));
      const loaded = await s.loadEntries();
      expect(loaded).toHaveLength(1);
      expect(loaded[0]).toMatchObject({ notes: 'second' });
    });

    it('still loads a legacy unencrypted record', async () => {
      await s.loadEntries(); // ensures the database and store exist before we bypass the service
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('reflexia-entries');
        req.onsuccess = () => {
          const tx = req.result.transaction('entries', 'readwrite');
          tx.objectStore('entries').put(quickCapture('legacy', 'plain'));
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
      expect(await s.loadEntries()).toMatchObject([{ id: 'legacy', notes: 'plain' }]);
    });

    it('skips a corrupt record instead of failing the whole load', async () => {
      silenceConsoleError();
      await s.saveEntry(quickCapture('good', 'fine'));
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('reflexia-entries');
        req.onsuccess = () => {
          const tx = req.result.transaction('entries', 'readwrite');
          tx.objectStore('entries').put({ id: 'bad', _encrypted: '{"iv":"AAAA","ct":"AAAA"}' });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
      expect((await s.loadEntries()).map((e) => e.id)).toEqual(['good']);
    });
  });

  describe('delete', () => {
    it('removes the entry from IndexedDB', async () => {
      await s.saveEntry(quickCapture('e1', 'a'));
      await s.saveEntry(quickCapture('e2', 'b'));
      await s.deleteEntry('e1');
      expect((await s.loadEntries()).map((e) => e.id)).toEqual(['e2']);
      expect((await rawEntryRecords()).map((r) => r.id)).toEqual(['e2']);
    });
  });

  describe('migration from the localStorage-only build', () => {
    // Regression: migrateFromLocalStorage used to await encrypt() inside an
    // open transaction, which had auto-committed by then; every put threw,
    // the flag was never set, and users upgrading saw no entries.
    it('shows the old entries on first launch, sets the migrated flag and removes the plaintext copy', async () => {
      resetBrowserStorage();
      localStorage.setItem(LS_ENTRIES, JSON.stringify([quickCapture('old1', 'from the old build'), quickCapture('old2', 'also old')]));
      const m = await loadEntryStorage();
      await m.initEntryStorage();
      expect(localStorage.getItem(MIGRATED_FLAG)).toBe('true');
      expect((await m.loadEntries()).map((e) => e.id).sort()).toEqual(['old1', 'old2']);
      expect(localStorage.getItem(LS_ENTRIES)).toBeNull();
    });

    it('removes a plaintext copy left behind by a build that had already migrated', async () => {
      // Builds between the migration and 3A.2 kept dual-writing after the flag was set.
      resetBrowserStorage();
      localStorage.setItem(MIGRATED_FLAG, 'true');
      localStorage.setItem(LS_ENTRIES, JSON.stringify([quickCapture('leftover', 'still here in plaintext')]));
      const m = await loadEntryStorage();
      await m.initEntryStorage();
      expect(localStorage.getItem(LS_ENTRIES)).toBeNull();
    });

    it('sets the flag and does nothing when there is nothing to migrate', async () => {
      expect(localStorage.getItem(MIGRATED_FLAG)).toBe('true');
      expect(await s.loadEntries()).toEqual([]);
    });
  });

  describe('saveAllEntries / importEntries (backup restore)', () => {
    // Regression: same transaction-lifetime mistake as the migration. The
    // store was cleared, the refill failed, and a restored backup showed nothing.
    it('replaces the store with the imported entries', async () => {
      silenceConsoleError();
      await s.saveEntry(quickCapture('live1', 'an entry the user already had'));
      await s.importEntries([quickCapture('b1', 'from backup'), quickCapture('b2', 'from backup too')]);
      expect((await s.loadEntries()).map((e) => e.id).sort()).toEqual(['b1', 'b2']);
      expect(await rawEntryRecords()).toHaveLength(2);
    });

    it('clears the store when given an empty list', async () => {
      await s.saveEntry(quickCapture('e1', 'a'));
      await s.saveAllEntries([]);
      expect(await s.loadEntries()).toEqual([]);
    });
  });

  describe('fallbacks', () => {
    it('uses localStorage alone when IndexedDB is unavailable', async () => {
      resetBrowserStorage();
      (globalThis as unknown as { indexedDB: unknown }).indexedDB = undefined;
      const m = await loadEntryStorage();
      await m.initEntryStorage();
      await m.saveEntry(quickCapture('e1', 'no idb here'));
      expect(await m.loadEntries()).toMatchObject([{ id: 'e1', notes: 'no idb here' }]);
    });

    it('stores a plaintext record when WebCrypto is unavailable', async () => {
      resetBrowserStorage();
      const realCrypto = globalThis.crypto;
      Object.defineProperty(globalThis, 'crypto', { value: { getRandomValues: realCrypto.getRandomValues.bind(realCrypto) }, configurable: true });
      try {
        const m = await loadEntryStorage();
        await m.initEntryStorage();
        await m.saveEntry(quickCapture('e1', 'visible'));
        const raw = await rawEntryRecords();
        expect(raw[0]).toMatchObject({ id: 'e1', notes: 'visible' });
        expect(raw[0]._encrypted).toBeUndefined();
      } finally {
        Object.defineProperty(globalThis, 'crypto', { value: realCrypto, configurable: true });
      }
    });
  });

  describe('migration of finished spaces (Holodeck) into the entry store', () => {
    // Before 3A.4 a finished space went to plaintext localStorage['holodeckEntries']
    // and nothing read it back. On launch each one becomes a reflection entry
    // with the space's framework id and keyed answers; the key is removed.
    const holodeck = (over: Record<string, unknown> = {}) => ({
      id: 'holodeck_1700000000000',
      spaceId: 'difficult-conversation',
      spaceName: 'Difficult Conversation',
      date: '2025-11-20T18:00:00.000Z',
      answers: ['My manager', 'That I need clearer priorities', '', 'A calmer week', ''],
      prompts: ['Who?', 'What?', 'Tone?', 'Outcome?', 'Feeling?'],
      completed: true,
      createdAt: 1700000000000,
      ...over,
    });

    it('turns each saved space into an encrypted entry and removes the plaintext key', async () => {
      resetBrowserStorage();
      localStorage.setItem('holodeckEntries', JSON.stringify([holodeck(), holodeck({ id: 'holodeck_2', spaceId: 'gratitude-space', answers: ['Coffee'], completed: false })]));
      const m = await loadEntryStorage();
      await m.initEntryStorage();
      expect(localStorage.getItem('holodeckEntries')).toBeNull();
      const entries = await m.loadEntries();
      expect(entries.map((e) => e.id).sort()).toEqual(['holodeck_1700000000000', 'holodeck_2']);
      const dc = entries.find((e) => e.id === 'holodeck_1700000000000') as Record<string, unknown>;
      expect(dc.type).toBe('REFLECTION');
      expect(dc.model).toBe('SPACE_DIFFICULT_CONVERSATION');
      expect(dc.date).toBe('2025-11-20T18:00:00.000Z');
      expect(dc.answers).toEqual({
        SPACE_DIFFICULT_CONVERSATION_1: 'My manager',
        SPACE_DIFFICULT_CONVERSATION_2: 'That I need clearer priorities',
        SPACE_DIFFICULT_CONVERSATION_4: 'A calmer week',
      });
      expect((await rawEntryRecords()).every((r) => Object.keys(r).sort().join() === '_encrypted,id')).toBe(true);
      expect(JSON.stringify(await rawEntryRecords())).not.toContain('My manager');
    });

    it('skips spaces with nothing written and survives garbage', async () => {
      resetBrowserStorage();
      localStorage.setItem('holodeckEntries', JSON.stringify([holodeck({ answers: ['', '  ', ''] }), { nonsense: true }, 'x']));
      const m = await loadEntryStorage();
      await m.initEntryStorage();
      expect(await m.loadEntries()).toEqual([]);
      expect(localStorage.getItem('holodeckEntries')).toBeNull();

      resetBrowserStorage();
      localStorage.setItem('holodeckEntries', '{not json');
      const m2 = await loadEntryStorage();
      await m2.initEntryStorage();
      expect(localStorage.getItem('holodeckEntries')).toBeNull();
    });

    it('does nothing when the key is absent', async () => {
      const before = await rawEntryRecords();
      await s.initEntryStorage();
      expect(await rawEntryRecords()).toEqual(before);
    });
  });

  describe('key initialisation', () => {
    // Regression: getCryptoKey() memoised the resolved key, not the promise,
    // so two concurrent first calls each generated a key; whichever lost the
    // keystore write left its entries unreadable. importBackup() before
    // initEntryStorage() hit this (saveAllEntries encrypts in parallel).
    it('concurrent first writes share one key, so every entry decrypts afterwards', async () => {
      resetBrowserStorage();
      const m = await loadEntryStorage();
      await m.saveAllEntries([quickCapture('k1', 'one'), quickCapture('k2', 'two'), quickCapture('k3', 'three')]);
      vi.resetModules();
      const again = await loadEntryStorage();
      await again.initEntryStorage();
      expect((await again.loadEntries()).map((e) => e.id).sort()).toEqual(['k1', 'k2', 'k3']);
    });
  });

  describe('at-rest guarantee', () => {
    // Decided in phase 3A.2 (docs/PHASE-0-SCOPE.md §4.2): no plaintext copy.
    it('keeps no plaintext copy of the entry anywhere in localStorage', async () => {
      await s.saveEntry(quickCapture('e1', 'secret words'));
      await s.saveAllEntries([quickCapture('e1', 'secret words'), quickCapture('e2', 'more secret words')]);
      expect(localStorage.getItem(LS_ENTRIES)).toBeNull();
      for (let i = 0; i < localStorage.length; i++) {
        expect(localStorage.getItem(localStorage.key(i)!)).not.toContain('secret words');
      }
    });

    it('is only plaintext where the browser has no IndexedDB at all', async () => {
      resetBrowserStorage();
      const saved = globalThis.indexedDB;
      (globalThis as unknown as { indexedDB: unknown }).indexedDB = undefined;
      try {
        const m = await loadEntryStorage();
        expect(m.isPlaintextFallback()).toBe(true);
        await m.saveEntry(quickCapture('e1', 'no idb here'));
        expect(localStorage.getItem(LS_ENTRIES) ?? '').toContain('no idb here');
        expect((await m.loadEntries()).map((e) => e.id)).toEqual(['e1']);
        await m.deleteEntry('e1');
        expect(await m.loadEntries()).toEqual([]);
      } finally {
        (globalThis as unknown as { indexedDB: unknown }).indexedDB = saved;
      }
    });
  });
});
