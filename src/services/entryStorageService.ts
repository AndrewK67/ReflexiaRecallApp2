/**
 * Entry Storage Service
 * IndexedDB-based entry storage with migration and encryption.
 * Uses the `idb` library for a clean async API.
 * Entries are encrypted at rest using AES-256-GCM via cryptoService.
 *
 * Where IndexedDB exists (every browser this app targets) entries live only
 * there, encrypted. The old plaintext copy in localStorage
 * (`reflexia.entries.v1`) is read once by the migration and then removed;
 * nothing writes it any more (phase 3A.2, docs/PHASE-0-SCOPE.md §4.2).
 * Only a browser with no IndexedDB at all falls back to plaintext
 * localStorage, and Profile says so.
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { Entry } from '../types';
import { isCryptoAvailable, getOrCreateKey, encrypt, decrypt } from './cryptoService';

const DB_NAME = 'reflexia-entries';
const DB_VERSION = 1;
const STORE_NAME = 'entries';
const MIGRATION_KEY = 'reflexia.entries.idb_migrated';
const LS_ENTRIES_KEY = 'reflexia.entries.v1';

// Encrypted record shape: { id: string, _encrypted: string }
// Unencrypted legacy: { id: string, type: string, date: string, ... }
interface EncryptedRecord {
  id: string;
  _encrypted: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;
let cryptoKey: CryptoKey | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

function isIDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

// Memoise the *promise*, not the result: two concurrent first calls (for
// example saveAllEntries encrypting a whole backup before init has run)
// must share one getOrCreateKey(), or each generates its own key and the
// entries encrypted with the loser can never be read again.
let cryptoKeyPromise: Promise<CryptoKey | null> | null = null;

function getCryptoKey(): Promise<CryptoKey | null> {
  if (cryptoKey) return Promise.resolve(cryptoKey);
  if (!isCryptoAvailable()) return Promise.resolve(null);
  if (!cryptoKeyPromise) {
    cryptoKeyPromise = getOrCreateKey()
      .then((k) => {
        cryptoKey = k;
        return k;
      })
      .catch((e) => {
        console.error('[entryStorageService] Failed to get crypto key:', e);
        cryptoKeyPromise = null;
        return null;
      });
  }
  return cryptoKeyPromise;
}

// --- Encrypt/Decrypt helpers ---

async function encryptEntry(entry: Entry): Promise<EncryptedRecord | Entry> {
  const key = await getCryptoKey();
  if (!key) return entry; // Store unencrypted if crypto unavailable

  const plaintext = JSON.stringify(entry);
  const ciphertext = await encrypt(plaintext, key);
  return { id: entry.id, _encrypted: ciphertext };
}

async function decryptRecord(record: any): Promise<Entry> {
  // Legacy unencrypted entry - has 'type' and 'date' fields
  if (!record._encrypted) return record as Entry;

  const key = await getCryptoKey();
  if (!key) {
    // Can't decrypt without key - should not happen normally
    console.error('[entryStorageService] Cannot decrypt: no crypto key');
    throw new Error('Decryption key unavailable');
  }

  const plaintext = await decrypt(record._encrypted, key);
  return JSON.parse(plaintext) as Entry;
}

// --- localStorage fallback helpers ---

function loadFromLocalStorage(): Entry[] {
  try {
    const raw = localStorage.getItem(LS_ENTRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(entries: Entry[]): void {
  try {
    localStorage.setItem(LS_ENTRIES_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('[entryStorageService] localStorage fallback write failed:', e);
  }
}

// --- Migration ---

async function migrateFromLocalStorage(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) return;

  const lsEntries = loadFromLocalStorage();
  if (lsEntries.length === 0) {
    localStorage.setItem(MIGRATION_KEY, 'true');
    return;
  }

  try {
    // Encrypt everything BEFORE opening the transaction. An IndexedDB
    // transaction auto-commits as soon as control leaves it, so awaiting
    // crypto.subtle inside the loop makes every subsequent put() throw
    // TransactionInactiveError (see tests/unit/entryStorage.test.ts).
    const records = await Promise.all(lsEntries.map(encryptEntry));

    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const record of records) store.put(record);
    await tx.done;

    localStorage.setItem(MIGRATION_KEY, 'true');
    // The plaintext copy has served its purpose; the encrypted store is
    // now the only copy on the device.
    localStorage.removeItem(LS_ENTRIES_KEY);
  } catch (e) {
    console.error('[entryStorageService] Migration from localStorage failed:', e);
  }
}

/**
 * Builds before 3A.2 kept writing the plaintext copy after migrating. On a
 * device that already migrated, drop that copy on the next launch.
 */
function dropStalePlaintextCopy(): void {
  if (localStorage.getItem(MIGRATION_KEY) && localStorage.getItem(LS_ENTRIES_KEY) !== null) {
    localStorage.removeItem(LS_ENTRIES_KEY);
  }
}

// --- Public API ---

export async function initEntryStorage(): Promise<void> {
  if (!isIDBAvailable()) return;
  // Pre-load the crypto key so it's cached for all operations
  await getCryptoKey();
  await migrateFromLocalStorage();
  dropStalePlaintextCopy();
}

/** True when entries can only be kept as plaintext in localStorage (no IndexedDB). */
export function isPlaintextFallback(): boolean {
  return !isIDBAvailable();
}

export async function loadEntries(): Promise<Entry[]> {
  if (!isIDBAvailable()) return loadFromLocalStorage();

  try {
    const db = await getDB();
    const allRecords = await db.getAll(STORE_NAME);

    const entries: Entry[] = [];
    for (const record of allRecords) {
      try {
        const entry = await decryptRecord(record);
        entries.push(entry);
      } catch (e) {
        console.error('[entryStorageService] Failed to decrypt entry:', record.id, e);
      }
    }

    // Sort by date descending (newest first) to match current behavior
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) {
    console.error('[entryStorageService] IDB loadEntries failed, falling back to localStorage:', e);
    return loadFromLocalStorage();
  }
}

export async function saveEntry(entry: Entry): Promise<void> {
  if (!isIDBAvailable()) {
    // No IndexedDB at all: plaintext localStorage is the only place there is.
    const lsEntries = loadFromLocalStorage().filter((e) => e.id !== entry.id);
    saveToLocalStorage([entry, ...lsEntries]);
    return;
  }
  try {
    const db = await getDB();
    const record = await encryptEntry(entry);
    await db.put(STORE_NAME, record);
  } catch (e) {
    console.error('[entryStorageService] IDB saveEntry failed:', e);
    throw e;
  }
}

export async function deleteEntry(id: string): Promise<void> {
  if (!isIDBAvailable()) {
    saveToLocalStorage(loadFromLocalStorage().filter((e) => e.id !== id));
    return;
  }
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  } catch (e) {
    console.error('[entryStorageService] IDB deleteEntry failed:', e);
    throw e;
  }
}

export async function saveAllEntries(entries: Entry[]): Promise<void> {
  if (!isIDBAvailable()) {
    saveToLocalStorage(entries);
    return;
  }
  try {
    // Encrypt first, then clear and refill inside one short transaction.
    // Awaiting encryption after clear() used to leave the store empty:
    // the transaction had committed and every put() threw.
    const records = await Promise.all(entries.map(encryptEntry));

    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const record of records) store.put(record);
    await tx.done;
  } catch (e) {
    console.error('[entryStorageService] IDB saveAllEntries failed:', e);
    throw e;
  }
}

export async function exportEntries(): Promise<Entry[]> {
  return loadEntries();
}

export async function importEntries(entries: Entry[]): Promise<void> {
  await saveAllEntries(entries);
}
