/**
 * Entry Storage Service
 * IndexedDB-based entry storage with localStorage fallback, migration, and encryption.
 * Uses the `idb` library for a clean async API.
 * Entries are encrypted at rest using AES-256-GCM via cryptoService.
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

async function getCryptoKey(): Promise<CryptoKey | null> {
  if (cryptoKey) return cryptoKey;
  if (!isCryptoAvailable()) return null;
  try {
    cryptoKey = await getOrCreateKey();
    return cryptoKey;
  } catch (e) {
    console.error('[entryStorageService] Failed to get crypto key:', e);
    return null;
  }
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
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const entry of lsEntries) {
      const record = await encryptEntry(entry);
      await store.put(record);
    }
    await tx.done;

    localStorage.setItem(MIGRATION_KEY, 'true');
  } catch (e) {
    console.error('[entryStorageService] Migration from localStorage failed:', e);
  }
}

// --- Public API ---

export async function initEntryStorage(): Promise<void> {
  if (!isIDBAvailable()) return;
  // Pre-load the crypto key so it's cached for all operations
  await getCryptoKey();
  await migrateFromLocalStorage();
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
  // IDB: encrypt and store
  if (isIDBAvailable()) {
    try {
      const db = await getDB();
      const record = await encryptEntry(entry);
      await db.put(STORE_NAME, record);
    } catch (e) {
      console.error('[entryStorageService] IDB saveEntry failed:', e);
    }
  }

  // Dual-write to localStorage (unencrypted, for fallback)
  const lsEntries = loadFromLocalStorage();
  const filtered = lsEntries.filter((e) => e.id !== entry.id);
  saveToLocalStorage([entry, ...filtered]);
}

export async function deleteEntry(id: string): Promise<void> {
  if (isIDBAvailable()) {
    try {
      const db = await getDB();
      await db.delete(STORE_NAME, id);
    } catch (e) {
      console.error('[entryStorageService] IDB deleteEntry failed:', e);
    }
  }

  const lsEntries = loadFromLocalStorage();
  saveToLocalStorage(lsEntries.filter((e) => e.id !== id));
}

export async function saveAllEntries(entries: Entry[]): Promise<void> {
  if (isIDBAvailable()) {
    try {
      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      await store.clear();
      for (const entry of entries) {
        const record = await encryptEntry(entry);
        await store.put(record);
      }
      await tx.done;
    } catch (e) {
      console.error('[entryStorageService] IDB saveAllEntries failed:', e);
    }
  }

  saveToLocalStorage(entries);
}

export async function exportEntries(): Promise<Entry[]> {
  return loadEntries();
}

export async function importEntries(entries: Entry[]): Promise<void> {
  await saveAllEntries(entries);
}
