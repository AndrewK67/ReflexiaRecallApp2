/**
 * The person's own AI API key (phase 3E).
 *
 * The key never appears in a build: there is no VITE_* variable for it any
 * more. It is pasted in Profile → Neural Link, kept in the reflexia-keystore
 * IndexedDB next to the entry-encryption key, and left out of backups on
 * purpose (a backup is a copy of your writing, not your credentials).
 *
 * Without IndexedDB (a private window on some browsers) the key is held in
 * memory only and forgotten on reload; the UI says so.
 */

import { keystoreGet, keystorePut, keystoreDelete } from './cryptoService';

const AI_KEY_ID = 'gemini-api-key';

let memoryKey: string | null = null;

function idbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

/** A key is plausible when it is long enough to be one; nothing else is checked here. */
export function looksLikeAIKey(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 10;
}

export async function loadAIKey(): Promise<string | null> {
  if (!idbAvailable()) return memoryKey;
  try {
    const stored = await keystoreGet<string>(AI_KEY_ID);
    memoryKey = looksLikeAIKey(stored) ? stored.trim() : null;
  } catch {
    // keystore unreadable: fall back to whatever this session has
  }
  return memoryKey;
}

export async function saveAIKey(key: string): Promise<void> {
  const trimmed = key.trim();
  if (!looksLikeAIKey(trimmed)) throw new Error('AI key too short');
  memoryKey = trimmed;
  if (!idbAvailable()) return;
  await keystorePut(AI_KEY_ID, trimmed);
}

export async function clearAIKey(): Promise<void> {
  memoryKey = null;
  if (!idbAvailable()) return;
  await keystoreDelete(AI_KEY_ID);
}

/** Last four characters, for "key ending …abcd" in the UI. */
export function keyHint(key: string | null): string {
  return key ? key.slice(-4) : '';
}
