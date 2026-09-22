/**
 * Which kind of entry is this? The stored `type` literals come in two
 * spellings from different builds ("INCIDENT" / "incident",
 * "REFLECTION" / "reflection"); nothing outside this file should compare
 * them by hand.
 *
 * A capture is stored as "INCIDENT" (see CaptureEntry in src/types.ts).
 */

import type { Entry, CaptureEntry, ReflectionEntry } from '../types';

/** The literal Quick Capture writes. Stored data; do not change without a migration. */
export const CAPTURE_TYPE = 'INCIDENT' as const;

export function isCapture(e: Entry | null | undefined): e is CaptureEntry {
  return !!e && (e.type === 'INCIDENT' || e.type === 'incident');
}

export function isReflection(e: Entry | null | undefined): e is ReflectionEntry {
  return !!e && (e.type === 'REFLECTION' || e.type === 'reflection');
}
