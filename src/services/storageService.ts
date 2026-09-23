// src/services/storageService.ts
import type { Entry, UserProfile, UserStats } from '../types';
import { markBackedUp } from './learningService';

const KEYS = {
  profile: 'reflexia.profile.v1',
  entries: 'reflexia.entries.v1',
  // Levels/XP/streaks from builds before phase 3D. Nothing reads it; backups
  // carry it through untouched (see UserStats in types.ts).
  stats: 'reflexia.stats.v1',
  recentNames: 'reflexia.recentNames.v1',
};

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  profession: 'NONE',
  guidePersonality: 'ZEN',
  aiEnabled: false,
  themeMode: 'DARK',
  isOnboarded: false,
  privacyLockEnabled: false,
  blurHistory: false,
  // Show inline disclaimers by default; user can toggle this to reduce onscreen clutter
  showDisclaimers: true,
  // Whether the text input should auto-focus (and trigger keyboard) when opening reflection flows
  autoOpenKeyboard: false,
};

export interface BackupFile {
  profile: UserProfile;
  entries: Entry[];
  stats: UserStats | null;
  exportedAt: string;
  version: 1;
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error(`[storageService] Failed to save ${key}:`, e);
    return false;
  }
}

export const storageService = {
  // ---- Entries ----
  // Entries live in entryStorageService (IndexedDB, encrypted). This reads
  // the pre-IndexedDB plaintext copy, which exists only on a browser with no
  // IndexedDB or before the one-time migration has run. Nothing here writes it.
  loadEntries(): Entry[] {
    return safeJsonParse<Entry[]>(localStorage.getItem(KEYS.entries), []);
  },

  // ---- Profile ----
  loadProfile(): UserProfile {
    return safeJsonParse<UserProfile>(localStorage.getItem(KEYS.profile), DEFAULT_PROFILE);
  },

  saveProfile(profile: Partial<UserProfile> | UserProfile): UserProfile {
    const current = storageService.loadProfile();
    const merged = { ...current, ...(profile as any) } as UserProfile;

    // Ensure defaults always exist (prevents "toggle missing" bugs)
    if (merged.aiEnabled === undefined) merged.aiEnabled = false;
    if (!merged.themeMode) merged.themeMode = 'DARK';
    if (merged.isOnboarded === undefined) merged.isOnboarded = false;
    if (merged.privacyLockEnabled === undefined) merged.privacyLockEnabled = false;
    if (merged.blurHistory === undefined) merged.blurHistory = false;
    if (merged.showDisclaimers === undefined) merged.showDisclaimers = true;
    if (merged.autoOpenKeyboard === undefined) merged.autoOpenKeyboard = false;

    safeSetItem(KEYS.profile, JSON.stringify(merged));
    return merged;
  },

  /**
   * Patch profile with partial updates (merge with existing)
   */
  patchProfile(partial: Partial<UserProfile>): UserProfile {
    const current = storageService.loadProfile();
    const updated = { ...current, ...partial };
    return storageService.saveProfile(updated);
  },

  /**
   * Set onboarded status without affecting other profile fields
   */
  setOnboarded(value: boolean): UserProfile {
    return storageService.patchProfile({ isOnboarded: value });
  },

  /**
   * Turn the three switches Profile shows (AI, Privacy Lock, Blur History)
   * off. The levels/XP switch went in phase 3D.
   */
  resetToggles(): UserProfile {
    return storageService.patchProfile({
      aiEnabled: false,
      privacyLockEnabled: false,
      blurHistory: false,
    });
  },

  resetProfile() {
    localStorage.removeItem(KEYS.profile);
  },

  // ---- Backup / Restore ----

  /**
   * Assemble the backup object without touching the DOM, so it can be
   * tested and reused. Entries come from IndexedDB (primary) with the
   * localStorage copy as fallback.
   */
  async buildBackup(): Promise<BackupFile> {
    let entries: Entry[];
    try {
      const entryStorage = await import('./entryStorageService');
      entries = await entryStorage.loadEntries();
    } catch {
      entries = storageService.loadEntries();
    }

    return {
      profile: storageService.loadProfile(),
      entries,
      stats: safeJsonParse<UserStats | null>(localStorage.getItem(KEYS.stats), null),
      exportedAt: new Date().toISOString(),
      version: 1,
    };
  },

  async exportBackup() {
    const backup = await storageService.buildBackup();
    downloadTextFile(`reflexia-backup-${Date.now()}.json`, JSON.stringify(backup, null, 2));
    markBackedUp(); // Profile → "What you've tried" (phase 3D)
  },

  /**
   * Is this JSON a Reflexia backup? Anything else is refused before a byte
   * is written: importBackup() used to accept any JSON, report success and
   * reload (found in phase 3C.4).
   */
  looksLikeBackup(data: unknown): data is Partial<BackupFile> {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    const d = data as Record<string, unknown>;
    const entriesOk = Array.isArray(d.entries) && d.entries.every((e) => e && typeof e === 'object' && typeof (e as Entry).id === 'string' && typeof (e as Entry).type === 'string');
    const profileOk = !!d.profile && typeof d.profile === 'object' && typeof (d.profile as UserProfile).name === 'string';
    return entriesOk || (profileOk && d.entries === undefined);
  },

  async importBackup(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!storageService.looksLikeBackup(data)) return false;

      if (data?.profile) localStorage.setItem(KEYS.profile, JSON.stringify(data.profile));
      if (data?.stats) localStorage.setItem(KEYS.stats, JSON.stringify(data.stats));

      // Entries go to the encrypted store; entryStorageService itself falls
      // back to plaintext localStorage only where there is no IndexedDB.
      if (Array.isArray(data?.entries)) {
        const entryStorage = await import('./entryStorageService');
        await entryStorage.importEntries(data.entries);
      }

      return true;
    } catch {
      return false;
    }
  },

  // ---- Recent Names ----
  getRecentNames(): string[] {
    return safeJsonParse<string[]>(localStorage.getItem(KEYS.recentNames), []);
  },

  saveRecentName(name: string) {
    const n = name.trim();
    if (!n) return;
    const existing = storageService.getRecentNames().filter((x) => x !== n);
    const next = [n, ...existing].slice(0, 10);
    safeSetItem(KEYS.recentNames, JSON.stringify(next));
  },
};
