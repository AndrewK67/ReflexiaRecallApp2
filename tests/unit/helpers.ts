import { vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import type { Entry } from '../../src/types';

/**
 * The storage services cache their DB handle and crypto key at module scope,
 * so a test that needs a clean slate needs a fresh IndexedDB *and* a fresh
 * module graph. Call this at the start of each test (or in beforeEach).
 */
export function resetBrowserStorage(): void {
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  localStorage.clear();
  vi.resetModules();
}

export async function loadEntryStorage() {
  return import('../../src/services/entryStorageService');
}

export function quickCapture(id: string, notes: string, date = new Date().toISOString()): Entry {
  return { id, type: 'INCIDENT', date, notes, media: [], createdAt: Date.now() } as Entry;
}

/** Raw records from the entries store, bypassing the service (and decryption). */
export function rawEntryRecords(): Promise<Array<Record<string, unknown>>> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('reflexia-entries');
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('entries')) { resolve([]); return; }
      const all = db.transaction('entries', 'readonly').objectStore('entries').getAll();
      all.onsuccess = () => resolve(all.result);
      all.onerror = () => reject(all.error);
    };
  });
}

export function silenceConsoleError() {
  return vi.spyOn(console, 'error').mockImplementation(() => {});
}
