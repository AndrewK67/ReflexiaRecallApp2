/**
 * Durability of what the person writes (phase 3A.1).
 *
 * Browsers may evict a site's storage under pressure unless the site has
 * asked for, and been granted, persistence. This module asks once (after
 * the first successful save), reports the answer and the usage for Profile,
 * and holds the PWA install prompt so Profile can offer "Install" — an
 * installed app is the surest way to be granted persistence.
 *
 * Every function is safe where the APIs are missing (older WebViews, tests):
 * it answers "unknown" rather than throwing.
 */

const PERSIST_REQUESTED_KEY = 'reflexia.storage.persist_requested';

export type PersistenceState = 'persisted' | 'best-effort' | 'unknown';

function storageManager(): StorageManager | null {
  try {
    return typeof navigator !== 'undefined' && navigator.storage ? navigator.storage : null;
  } catch {
    return null;
  }
}

/** Has this device already been asked? (Firefox shows a prompt; asking once is enough.) */
export function persistenceRequested(): boolean {
  try {
    return localStorage.getItem(PERSIST_REQUESTED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Ask the browser to keep this app's storage. Returns the browser's answer,
 * or null where the API does not exist. Call after the first successful
 * save; harmless to call again.
 */
export async function requestPersistence(): Promise<boolean | null> {
  const sm = storageManager();
  if (!sm || typeof sm.persist !== 'function') return null;
  try {
    localStorage.setItem(PERSIST_REQUESTED_KEY, 'true');
  } catch {
    // no localStorage: still ask
  }
  try {
    return await sm.persist();
  } catch {
    return null;
  }
}

/** Ask once per device. Returns true if a request was made now. */
export async function requestPersistenceOnce(): Promise<boolean> {
  if (persistenceRequested()) return false;
  await requestPersistence();
  return true;
}

export async function persistenceState(): Promise<PersistenceState> {
  const sm = storageManager();
  if (!sm || typeof sm.persisted !== 'function') return 'unknown';
  try {
    return (await sm.persisted()) ? 'persisted' : 'best-effort';
  } catch {
    return 'unknown';
  }
}

export interface StorageUsage {
  usageBytes: number;
  quotaBytes: number;
}

export async function storageUsage(): Promise<StorageUsage | null> {
  const sm = storageManager();
  if (!sm || typeof sm.estimate !== 'function') return null;
  try {
    const e = await sm.estimate();
    return { usageBytes: e.usage ?? 0, quotaBytes: e.quota ?? 0 };
  } catch {
    return null;
  }
}

/** "1.2 MB", "340 KB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// --- Install prompt ---

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredInstall: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<() => void>();

/** Call once at boot (main.tsx). Chromium fires this when the app is installable. */
export function captureInstallPrompt(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e as BeforeInstallPromptEvent;
    installListeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferredInstall = null;
    installListeners.forEach((l) => l());
  });
}

export function canInstall(): boolean {
  return deferredInstall !== null;
}

/** Subscribe to installability changes; returns an unsubscribe. */
export function onInstallAvailabilityChange(listener: () => void): () => void {
  installListeners.add(listener);
  return () => installListeners.delete(listener);
}

/** Show the browser's install dialog. Resolves true if the person accepted. */
export async function promptInstall(): Promise<boolean> {
  const evt = deferredInstall;
  if (!evt) return false;
  deferredInstall = null;
  try {
    await evt.prompt();
    const choice = await evt.userChoice;
    return choice.outcome === 'accepted';
  } catch {
    return false;
  }
}

/** Running as an installed app (home screen / dock) rather than in a tab. */
export function isStandalone(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
    return (navigator as unknown as { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}
