// src/services/storageService.ts
import type { Entry, UserProfile, UserStats } from '../types';

const KEYS = {
  profile: 'reflexia.profile.v1',
  entries: 'reflexia.entries.v1',
  stats: 'reflexia.stats.v1',
  recentNames: 'reflexia.recentNames.v1',
};

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

export const storageService = {
  // ---- Entries ----
  loadEntries(): Entry[] {
    return safeJsonParse<Entry[]>(localStorage.getItem(KEYS.entries), []);
  },

  saveEntries(entries: Entry[]) {
    localStorage.setItem(KEYS.entries, JSON.stringify(entries));
  },

  saveEntry(entry: Entry) {
    const entries = storageService.loadEntries();
    storageService.saveEntries([entry, ...entries]);
  },

  deleteEntry(entryId: string) {
    const entries = storageService.loadEntries().filter((e) => e.id !== entryId);
    storageService.saveEntries(entries);
  },

  // ---- Profile ----
  loadProfile(): UserProfile {
    return safeJsonParse<UserProfile>(localStorage.getItem(KEYS.profile), {
      name: '',
      profession: 'NONE',
      guidePersonality: 'ZEN',
      aiEnabled: false,
      gamificationEnabled: false,
      themeMode: 'DARK',
      isOnboarded: false,
      privacyLockEnabled: false,
      blurHistory: false,
    });
  },

  saveProfile(profile: Partial<UserProfile> | UserProfile): UserProfile {
    const current = storageService.loadProfile();
    const merged = { ...current, ...(profile as any) } as UserProfile;

    // Ensure defaults always exist (prevents “toggle missing” bugs)
    if (merged.aiEnabled === undefined) merged.aiEnabled = false;
    if (merged.gamificationEnabled === undefined) merged.gamificationEnabled = false;
    if (!merged.themeMode) merged.themeMode = 'DARK';
    if (merged.isOnboarded === undefined) merged.isOnboarded = false;

    localStorage.setItem(KEYS.profile, JSON.stringify(merged));
    return merged;
  },

  resetProfile() {
    localStorage.removeItem(KEYS.profile);
  },

  // ---- Stats (Gamification) ----
  async loadStats(defaultStats: UserStats): Promise<UserStats> {
    const s = safeJsonParse<UserStats>(localStorage.getItem(KEYS.stats), defaultStats);
    // Hardening: fill required fields if older data exists
    return {
      level: s.level ?? defaultStats.level,
      currentXP: s.currentXP ?? defaultStats.currentXP,
      nextLevelXP: s.nextLevelXP ?? defaultStats.nextLevelXP,
      streak: s.streak ?? defaultStats.streak,
      totalReflections: s.totalReflections ?? defaultStats.totalReflections,
      cpdMinutesTotal: s.cpdMinutesTotal ?? defaultStats.cpdMinutesTotal,
      achievements: Array.isArray(s.achievements) ? s.achievements : [],
    };
  },

  saveStats(stats: UserStats) {
    localStorage.setItem(KEYS.stats, JSON.stringify(stats));
  },

  // ---- Backup / Restore ----
  exportBackup() {
    const backup = {
      profile: storageService.loadProfile(),
      entries: storageService.loadEntries(),
      stats: safeJsonParse<UserStats | null>(localStorage.getItem(KEYS.stats), null),
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    downloadTextFile(`reflexia-backup-${Date.now()}.json`, JSON.stringify(backup, null, 2));
  },

  async importBackup(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data?.profile) localStorage.setItem(KEYS.profile, JSON.stringify(data.profile));
      if (data?.entries) localStorage.setItem(KEYS.entries, JSON.stringify(data.entries));
      if (data?.stats) localStorage.setItem(KEYS.stats, JSON.stringify(data.stats));

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
    localStorage.setItem(KEYS.recentNames, JSON.stringify(next));
  },
};
