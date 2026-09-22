/**
 * Crypto Service
 * AES-256-GCM encryption/decryption using the Web Crypto API (SubtleCrypto).
 * Key is stored in a separate IndexedDB database for isolation.
 */

import { openDB } from 'idb';

const KEYSTORE_DB = 'reflexia-keystore';
const KEYSTORE_VERSION = 1;
const KEYSTORE_STORE = 'keys';
const ENCRYPTION_KEY_ID = 'entry-encryption-key';

// --- Key management ---

async function getKeystore() {
  return openDB(KEYSTORE_DB, KEYSTORE_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(KEYSTORE_STORE)) {
        db.createObjectStore(KEYSTORE_STORE);
      }
    },
  });
}

/**
 * Small secrets that must never travel in a backup or a bundle live in the
 * same keystore database as the entry-encryption key (see aiKeyService.ts).
 * Ids other than ENCRYPTION_KEY_ID are free for callers to use.
 */
export async function keystoreGet<T = unknown>(id: string): Promise<T | undefined> {
  const db = await getKeystore();
  return (await db.get(KEYSTORE_STORE, id)) as T | undefined;
}

export async function keystorePut(id: string, value: unknown): Promise<void> {
  const db = await getKeystore();
  await db.put(KEYSTORE_STORE, value, id);
}

export async function keystoreDelete(id: string): Promise<void> {
  const db = await getKeystore();
  await db.delete(KEYSTORE_STORE, id);
}

export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable so we can store it
    ['encrypt', 'decrypt'],
  );
}

async function exportKeyToRaw(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

async function importKeyFromRaw(raw: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Get or create the encryption key.
 * Key is stored as raw bytes in a separate IndexedDB keystore.
 */
export async function getOrCreateKey(): Promise<CryptoKey> {
  const db = await getKeystore();

  // Try to load existing key
  const stored = await db.get(KEYSTORE_STORE, ENCRYPTION_KEY_ID) as ArrayBuffer | undefined;
  if (stored) {
    return importKeyFromRaw(stored);
  }

  // Generate new key and persist it
  const key = await generateKey();
  const raw = await exportKeyToRaw(key);
  await db.put(KEYSTORE_STORE, raw, ENCRYPTION_KEY_ID);
  return key;
}

// --- Encryption / Decryption ---

interface EncryptedPayload {
  iv: string;   // base64-encoded IV (12 bytes)
  ct: string;   // base64-encoded ciphertext
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt a JSON-serializable value.
 * Returns a JSON string containing { iv, ct } both base64-encoded.
 */
export async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );

  const payload: EncryptedPayload = {
    iv: arrayBufferToBase64(iv.buffer),
    ct: arrayBufferToBase64(ciphertext),
  };

  return JSON.stringify(payload);
}

/**
 * Decrypt a string produced by encrypt().
 * Returns the original plaintext string.
 */
export async function decrypt(encrypted: string, key: CryptoKey): Promise<string> {
  const payload: EncryptedPayload = JSON.parse(encrypted);
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const ciphertext = base64ToArrayBuffer(payload.ct);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(plaintext);
}

/**
 * Check if SubtleCrypto is available (requires HTTPS or localhost).
 */
export function isCryptoAvailable(): boolean {
  try {
    return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
  } catch {
    return false;
  }
}
