import { describe, it, expect, beforeEach } from 'vitest';
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
    it('removes the entry from IndexedDB and from the localStorage copy', async () => {
      await s.saveEntry(quickCapture('e1', 'a'));
      await s.saveEntry(quickCapture('e2', 'b'));
      await s.deleteEntry('e1');
      expect((await s.loadEntries()).map((e) => e.id)).toEqual(['e2']);
      const ls = JSON.parse(localStorage.getItem(LS_ENTRIES) ?? '[]') as Array<{ id: string }>;
      expect(ls.map((e) => e.id)).toEqual(['e2']);
    });
  });

  describe('migration from the localStorage-only build', () => {
    // KNOWN BUG (docs/PHASE-0-SCOPE.md §0.1): migrateFromLocalStorage awaits
    // encrypt() inside an open transaction, which has auto-committed by then.
    // Every put throws, the flag is never set, and the user sees no entries.
    it.fails('shows the old entries on first launch and sets the migrated flag', async () => {
      resetBrowserStorage();
      localStorage.setItem(LS_ENTRIES, JSON.stringify([quickCapture('old1', 'from the old build'), quickCapture('old2', 'also old')]));
      const m = await loadEntryStorage();
      await m.initEntryStorage();
      expect(localStorage.getItem(MIGRATED_FLAG)).toBe('true');
      expect((await m.loadEntries()).map((e) => e.id).sort()).toEqual(['old1', 'old2']);
    });

    it('sets the flag and does nothing when there is nothing to migrate', async () => {
      expect(localStorage.getItem(MIGRATED_FLAG)).toBe('true');
      expect(await s.loadEntries()).toEqual([]);
    });
  });

  describe('saveAllEntries / importEntries (backup restore)', () => {
    // KNOWN BUG (docs/PHASE-0-SCOPE.md §0.1): same transaction-lifetime mistake.
    // The store is cleared, the refill fails, and the app shows nothing.
    it.fails('replaces the store with the imported entries', async () => {
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

  describe('at-rest guarantee', () => {
    // DESIGN DECISION PENDING (docs/PHASE-0-SCOPE.md §4.2): saveEntry dual-writes
    // the plaintext entry to localStorage as a fallback, so "encrypted at rest"
    // is not currently true. This pins today's behaviour until the decision.
    it.fails('keeps no plaintext copy of the entry in localStorage', async () => {
      await s.saveEntry(quickCapture('e1', 'secret words'));
      expect(localStorage.getItem(LS_ENTRIES) ?? '').not.toContain('secret words');
    });
  });
});
