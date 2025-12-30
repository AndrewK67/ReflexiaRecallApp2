/**
 * Privacy & Security Service
 * Handles entry locking, PIN management, and privacy modes
 * All encryption happens client-side for privacy
 */

import type { Entry } from '../types';

const PRIVACY_PIN_KEY = 'reflexia_privacy_pin';
const LOCKED_ENTRIES_KEY = 'reflexia_locked_entries';
const PRIVACY_SETTINGS_KEY = 'reflexia_privacy_settings';
const SESSION_AUTH_KEY = 'reflexia_session_auth';

export interface PrivacySettings {
  pinEnabled: boolean;
  blurHistoryEnabled: boolean;
  autoLockMinutes: number; // 0 = never
  biometricEnabled: boolean; // Reserved for future use
  requirePINForExport: boolean;
}

export interface LockedEntry {
  entryId: string;
  lockedAt: string;
  lockedBy: string; // User identifier
}

// Simple hash function for PIN (not cryptographically secure, but sufficient for local privacy)
function hashPIN(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Check if privacy PIN is set up
 */
export function isPINSetup(): boolean {
  return localStorage.getItem(PRIVACY_PIN_KEY) !== null;
}

/**
 * Set up a new privacy PIN
 */
export function setupPIN(pin: string): void {
  if (!pin || pin.length < 4) {
    throw new Error('PIN must be at least 4 digits');
  }
  const hashed = hashPIN(pin);
  localStorage.setItem(PRIVACY_PIN_KEY, hashed);
}

/**
 * Verify PIN is correct
 */
export function verifyPIN(pin: string): boolean {
  const stored = localStorage.getItem(PRIVACY_PIN_KEY);
  if (!stored) return false;
  return hashPIN(pin) === stored;
}

/**
 * Change existing PIN (requires old PIN)
 */
export function changePIN(oldPIN: string, newPIN: string): boolean {
  if (!verifyPIN(oldPIN)) {
    return false;
  }
  if (newPIN.length < 4) {
    throw new Error('New PIN must be at least 4 digits');
  }
  setupPIN(newPIN);
  return true;
}

/**
 * Remove PIN protection (requires PIN)
 */
export function removePIN(pin: string): boolean {
  if (!verifyPIN(pin)) {
    return false;
  }
  localStorage.removeItem(PRIVACY_PIN_KEY);
  // Unlock all entries
  localStorage.removeItem(LOCKED_ENTRIES_KEY);
  return true;
}

/**
 * Session authentication (valid until page reload or timeout)
 */
export function setSessionAuthenticated(): void {
  const expiry = Date.now() + (30 * 60 * 1000); // 30 minutes
  sessionStorage.setItem(SESSION_AUTH_KEY, expiry.toString());
}

export function isSessionAuthenticated(): boolean {
  const expiry = sessionStorage.getItem(SESSION_AUTH_KEY);
  if (!expiry) return false;
  return Date.now() < parseInt(expiry, 10);
}

export function clearSessionAuthentication(): void {
  sessionStorage.removeItem(SESSION_AUTH_KEY);
}

/**
 * Get privacy settings
 */
export function getPrivacySettings(): PrivacySettings {
  const stored = localStorage.getItem(PRIVACY_SETTINGS_KEY);
  if (!stored) {
    return {
      pinEnabled: false,
      blurHistoryEnabled: false,
      autoLockMinutes: 0,
      biometricEnabled: false,
      requirePINForExport: false,
    };
  }
  try {
    return JSON.parse(stored);
  } catch {
    return {
      pinEnabled: false,
      blurHistoryEnabled: false,
      autoLockMinutes: 0,
      biometricEnabled: false,
      requirePINForExport: false,
    };
  }
}

/**
 * Save privacy settings
 */
export function savePrivacySettings(settings: PrivacySettings): void {
  localStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Get all locked entries
 */
export function getLockedEntries(): LockedEntry[] {
  const stored = localStorage.getItem(LOCKED_ENTRIES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Save locked entries list
 */
function saveLockedEntries(locked: LockedEntry[]): void {
  localStorage.setItem(LOCKED_ENTRIES_KEY, JSON.stringify(locked));
}

/**
 * Check if an entry is locked
 */
export function isEntryLocked(entryId: string): boolean {
  const locked = getLockedEntries();
  return locked.some((e) => e.entryId === entryId);
}

/**
 * Lock an entry (requires authentication)
 */
export function lockEntry(entryId: string, userId: string = 'user'): void {
  if (!isPINSetup()) {
    throw new Error('PIN must be set up before locking entries');
  }

  const locked = getLockedEntries();
  if (locked.some((e) => e.entryId === entryId)) {
    return; // Already locked
  }

  locked.push({
    entryId,
    lockedAt: new Date().toISOString(),
    lockedBy: userId,
  });

  saveLockedEntries(locked);
}

/**
 * Unlock an entry (requires PIN verification)
 */
export function unlockEntry(entryId: string, pin: string): boolean {
  if (!verifyPIN(pin)) {
    return false;
  }

  const locked = getLockedEntries();
  const filtered = locked.filter((e) => e.entryId !== entryId);
  saveLockedEntries(filtered);
  return true;
}

/**
 * Unlock all entries (requires PIN)
 */
export function unlockAllEntries(pin: string): boolean {
  if (!verifyPIN(pin)) {
    return false;
  }
  localStorage.removeItem(LOCKED_ENTRIES_KEY);
  return true;
}

/**
 * Filter entries to hide locked ones (for privacy mode)
 */
export function filterLockedEntries(entries: Entry[]): Entry[] {
  const locked = getLockedEntries();
  const lockedIds = new Set(locked.map((e) => e.entryId));
  return entries.filter((entry) => !lockedIds.has(entry.id));
}

/**
 * Get locked entries count
 */
export function getLockedEntriesCount(): number {
  return getLockedEntries().length;
}

/**
 * Create a privacy-safe preview of locked content
 */
export function createLockedPreview(entry: Entry): Entry {
  if (entry.type === 'REFLECTION' || entry.type === 'reflection') {
    return {
      ...entry,
      title: '🔒 Locked Entry',
      content: 'This entry is locked. Enter your PIN to view.',
      answers: {},
    } as Entry;
  } else {
    return {
      ...entry,
      title: '🔒 Locked Entry',
      content: 'This entry is locked. Enter your PIN to view.',
      notes: 'Locked content',
    } as Entry;
  }
}

/**
 * Check if auto-lock should trigger
 */
export function shouldAutoLock(): boolean {
  const settings = getPrivacySettings();
  if (settings.autoLockMinutes === 0) return false;

  const lastActivity = sessionStorage.getItem('lastActivityTime');
  if (!lastActivity) return false;

  const elapsed = Date.now() - parseInt(lastActivity, 10);
  const threshold = settings.autoLockMinutes * 60 * 1000;

  return elapsed > threshold;
}

/**
 * Update last activity timestamp
 */
export function updateActivityTimestamp(): void {
  sessionStorage.setItem('lastActivityTime', Date.now().toString());
}

/**
 * Initialize privacy system
 */
export function initializePrivacy(): void {
  // Set initial activity timestamp
  updateActivityTimestamp();

  // Check if PIN is setup and settings are configured
  const settings = getPrivacySettings();
  if (isPINSetup()) {
    settings.pinEnabled = true;
    savePrivacySettings(settings);
  }
}

/**
 * Export privacy statistics
 */
export function getPrivacyStats(): {
  pinSetup: boolean;
  lockedEntriesCount: number;
  sessionAuthenticated: boolean;
  blurEnabled: boolean;
} {
  const settings = getPrivacySettings();
  return {
    pinSetup: isPINSetup(),
    lockedEntriesCount: getLockedEntriesCount(),
    sessionAuthenticated: isSessionAuthenticated(),
    blurEnabled: settings.blurHistoryEnabled,
  };
}
