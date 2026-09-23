/**
 * Pack Service - which optional packs are on. Local-first, localStorage.
 *
 * The storage key is still reflexia.packs.v2, and state written by older
 * builds loads unchanged in meaning (phase 3B.3):
 *   - v1 ({ wellbeing: true }) is migrated once and the old key removed;
 *   - v2 entries with trial fields: a pack whose trial had ended is off, a
 *     pack enabled any other way stays on;
 *   - keys for packs that no longer exist (professional, scenario) are
 *     ignored, and dropped the next time state is saved.
 */

import type { PackId, PackInfo, PackState } from './packTypes';
import { PACK_REGISTRY } from './packRegistry';

const STORAGE_KEY = 'reflexia.packs.v2';
const OLD_STORAGE_KEY = 'reflexia.packs.v1';

const KNOWN: PackId[] = Object.keys(PACK_REGISTRY) as PackId[];

function isKnown(id: string): id is PackId {
  return (KNOWN as string[]).includes(id);
}

function defaults(): PackState {
  const state: PackState = {};
  for (const id of KNOWN) state[id] = { enabled: PACK_REGISTRY[id].isCore };
  return state;
}

/** What an older build's stored entry means today. */
function wasOn(raw: unknown, now = new Date()): boolean {
  if (raw === true) return true; // v1
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as { enabled?: unknown; isPermanent?: unknown; trialEndDate?: unknown };
  if (r.enabled !== true) return false;
  const trialEnded =
    r.isPermanent === false && typeof r.trialEndDate === 'string' && now > new Date(r.trialEndDate);
  return !trialEnded;
}

export function normaliseStoredState(raw: unknown, now = new Date()): PackState {
  const state = defaults();
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
      if (isKnown(id) && !PACK_REGISTRY[id].isCore) state[id] = { enabled: wasOn(value, now) };
    }
  }
  state.core = { enabled: true };
  return state;
}

export function loadPackState(): PackState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normaliseStoredState(JSON.parse(stored));

    const old = localStorage.getItem(OLD_STORAGE_KEY);
    if (old) {
      const migrated = normaliseStoredState(JSON.parse(old));
      savePackState(migrated);
      localStorage.removeItem(OLD_STORAGE_KEY);
      return migrated;
    }
  } catch (error) {
    console.error('[PackService] Error loading pack state:', error);
  }
  return defaults();
}

export function savePackState(state: PackState): void {
  try {
    const clean: PackState = {};
    for (const id of KNOWN) clean[id] = { enabled: id === 'core' ? true : state[id]?.enabled === true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch (error) {
    console.error('[PackService] Error saving pack state:', error);
  }
}

export function isPackEnabled(packId: PackId): boolean {
  return loadPackState()[packId]?.enabled === true;
}

export function getPackInfo(packId: PackId): PackInfo {
  return { enabled: isPackEnabled(packId) };
}

export function enablePack(packId: PackId): void {
  const state = loadPackState();
  state[packId] = { enabled: true };
  savePackState(state);
}

export function disablePack(packId: PackId): void {
  if (PACK_REGISTRY[packId]?.isCore) {
    console.warn('[PackService] Cannot disable core pack:', packId);
    return;
  }
  const state = loadPackState();
  state[packId] = { enabled: false };
  savePackState(state);
}

/** Flip a pack; returns whether it is now on. Core is always on. */
export function togglePack(packId: PackId): boolean {
  if (PACK_REGISTRY[packId]?.isCore) return true;
  if (isPackEnabled(packId)) {
    disablePack(packId);
    return false;
  }
  enablePack(packId);
  return true;
}

export function getEnabledPacks(): PackId[] {
  const state = loadPackState();
  return KNOWN.filter((id) => state[id]?.enabled === true);
}

export function resetPacksToDefault(): void {
  savePackState(defaults());
}

/** Which pack a view needs, or null for core views (Spaces is core since 3B.3). */
export function getRequiredPack(featureId: string): PackId | null {
  const featurePackMap: Record<string, PackId> = {
    BIO_RHYTHM: 'wellbeing',
    GROUNDING: 'wellbeing',
    ORACLE: 'aiReflectionCoach',
    REPORTS: 'reports',
  };
  return featurePackMap[featureId] || null;
}
