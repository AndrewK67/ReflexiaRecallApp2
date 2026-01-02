/**
 * Pack Service - Manages pack state with trial system
 * Local-first storage using localStorage
 */

import type { PackId, PackState, PackTrialInfo, TrialDuration } from './packTypes';
import { PACK_REGISTRY } from './packRegistry';

const STORAGE_KEY = 'reflexia.packs.v2';
const OLD_STORAGE_KEY = 'reflexia.packs.v1';

/**
 * Migrate old boolean pack state to new trial info structure
 */
function migrateOldPackState(): PackState | null {
  try {
    const oldStored = localStorage.getItem(OLD_STORAGE_KEY);
    if (!oldStored) return null;

    const oldParsed = JSON.parse(oldStored);
    const newState: PackState = {};

    Object.keys(oldParsed).forEach(packId => {
      const wasEnabled = oldParsed[packId] === true;
      const pack = PACK_REGISTRY[packId as PackId];

      newState[packId] = {
        enabled: wasEnabled,
        isPermanent: wasEnabled || pack?.isCore || false,
      };
    });

    // Save migrated state and remove old key
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    localStorage.removeItem(OLD_STORAGE_KEY);

    return newState;
  } catch (error) {
    console.error('[PackService] Error migrating old pack state:', error);
    return null;
  }
}

/**
 * Get default pack state
 * Core is always enabled permanently, all others disabled
 */
function getDefaultPackState(): PackState {
  const state: PackState = {};

  Object.keys(PACK_REGISTRY).forEach(packId => {
    const pack = PACK_REGISTRY[packId as PackId];
    state[packId] = {
      enabled: pack.isCore,
      isPermanent: pack.isCore,
    };
  });

  return state;
}

/**
 * Load pack state from localStorage
 */
export function loadPackState(): PackState {
  try {
    // Try to load from new storage key
    let stored = localStorage.getItem(STORAGE_KEY);

    // If not found, try to migrate from old key
    if (!stored) {
      const migrated = migrateOldPackState();
      if (migrated) {
        return migrated;
      }
      return getDefaultPackState();
    }

    const parsed = JSON.parse(stored) as PackState;

    // Ensure core is always enabled permanently (safety)
    parsed.core = {
      enabled: true,
      isPermanent: true,
    };

    // Merge with defaults to handle new packs
    const defaults = getDefaultPackState();
    return { ...defaults, ...parsed };
  } catch (error) {
    console.error('[PackService] Error loading pack state:', error);
    return getDefaultPackState();
  }
}

/**
 * Save pack state to localStorage
 */
export function savePackState(state: PackState): void {
  try {
    // Ensure core is always enabled permanently
    state.core = {
      enabled: true,
      isPermanent: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[PackService] Error saving pack state:', error);
  }
}

/**
 * Check if a trial has expired
 */
export function isTrialExpired(info: PackTrialInfo): boolean {
  if (info.isPermanent) return false;
  if (!info.trialEndDate) return false;

  const now = new Date();
  const endDate = new Date(info.trialEndDate);
  return now > endDate;
}

/**
 * Get remaining trial time in days
 */
export function getRemainingTrialDays(info: PackTrialInfo): number {
  if (info.isPermanent || !info.trialEndDate) return Infinity;

  const now = new Date();
  const endDate = new Date(info.trialEndDate);
  const diffMs = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Check if a pack is enabled (and trial hasn't expired)
 */
export function isPackEnabled(packId: PackId): boolean {
  const state = loadPackState();
  const info = state[packId];

  if (!info) return false;
  if (!info.enabled) return false;
  if (info.isPermanent) return true;

  // Check if trial has expired
  return !isTrialExpired(info);
}

/**
 * Get pack trial info
 */
export function getPackInfo(packId: PackId): PackTrialInfo {
  const state = loadPackState();
  return state[packId] || {
    enabled: false,
    isPermanent: false,
  };
}

/**
 * Enable a pack with trial duration
 */
export function enablePack(packId: PackId, duration: TrialDuration = 'forever'): void {
  const state = loadPackState();
  const now = new Date();

  if (duration === 'forever') {
    state[packId] = {
      enabled: true,
      isPermanent: true,
    };
  } else {
    // Calculate trial end date
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + duration);

    state[packId] = {
      enabled: true,
      isPermanent: false,
      trialStartDate: now.toISOString(),
      trialEndDate: endDate.toISOString(),
      trialDuration: duration,
    };
  }

  savePackState(state);
}

/**
 * Disable a pack (if not core)
 */
export function disablePack(packId: PackId): void {
  const pack = PACK_REGISTRY[packId];
  if (pack?.isCore) {
    console.warn('[PackService] Cannot disable core pack:', packId);
    return;
  }

  const state = loadPackState();
  state[packId] = {
    enabled: false,
    isPermanent: false,
  };
  savePackState(state);
}

/**
 * Toggle a pack on/off (defaults to forever)
 */
export function togglePack(packId: PackId, duration: TrialDuration = 'forever'): boolean {
  const pack = PACK_REGISTRY[packId];
  if (pack?.isCore) {
    console.warn('[PackService] Cannot toggle core pack:', packId);
    return true;
  }

  const info = getPackInfo(packId);
  const isCurrentlyEnabled = info.enabled && !isTrialExpired(info);

  if (isCurrentlyEnabled) {
    disablePack(packId);
    return false;
  } else {
    enablePack(packId, duration);
    return true;
  }
}

/**
 * Get all enabled packs (excluding expired trials)
 */
export function getEnabledPacks(): PackId[] {
  const state = loadPackState();
  return Object.keys(state).filter(packId => {
    const info = state[packId];
    return info.enabled && (info.isPermanent || !isTrialExpired(info));
  }) as PackId[];
}

/**
 * Reset all packs to default (core only)
 */
export function resetPacksToDefault(): void {
  savePackState(getDefaultPackState());
}

/**
 * Clean up expired trials
 */
export function cleanupExpiredTrials(): void {
  const state = loadPackState();
  let hasChanges = false;

  Object.keys(state).forEach(packId => {
    const info = state[packId];
    if (info.enabled && !info.isPermanent && isTrialExpired(info)) {
      // Disable expired trial
      state[packId] = {
        enabled: false,
        isPermanent: false,
        trialStartDate: info.trialStartDate,
        trialEndDate: info.trialEndDate,
        trialDuration: info.trialDuration,
      };
      hasChanges = true;
    }
  });

  if (hasChanges) {
    savePackState(state);
  }
}

/**
 * Check if any feature is gated by a pack that's not enabled
 * Used to show "Enable Pack" messages
 */
export function getRequiredPack(featureId: string): PackId | null {
  // Map features to required packs
  const featurePackMap: Record<string, PackId> = {
    // Wellbeing
    'BIO_RHYTHM': 'wellbeing',
    'GROUNDING': 'wellbeing',

    // AI
    'ORACLE': 'aiReflectionCoach',

    // Gamification
    'GAMIFICATION': 'gamification',
    'REWARDS': 'gamification',

    // Scenario
    'HOLODECK': 'scenario',

    // Professional
    'CPD': 'professional',
    'PROFESSIONAL_DOC': 'professional',

    // Visual Tools
    'CANVAS': 'visualTools',
    'MENTAL_ATLAS': 'visualTools',
    'CALENDAR': 'visualTools',
    'LIBRARY': 'visualTools',

    // Reports
    'REPORTS': 'reports',

    // Drive Voice Notes
    'DRIVE_MODE': 'driveVoiceNotes'
  };

  return featurePackMap[featureId] || null;
}
