/**
 * What someone has tried — learning the app, not scoring it (phase 3D).
 *
 * CLAUDE.md decision 4: nothing rewards entry count, no streaks, and a
 * lesson completes by doing the real thing once, not by clicking through a
 * tour. So each track below is worked out from what the app already holds —
 * the entries, the profile — plus two flags for things an entry cannot show
 * (a search that found something, a backup file saved). Nothing is ticked
 * for looking at a screen, for time spent, or for pressing "I tried it".
 *
 * Shown in two places only: Profile → "What you've tried" (a checklist, no
 * numbers), and at most one quiet line on the dashboard (pickNudge). Never in
 * the composer: progression is invisible while someone is writing.
 */

import type { Entry, MediaItem, UserProfile } from '../types';
import { isCapture, isReflection } from '../utils/entryKind';
import { THREE_PART, getFramework, isSpaceFrameworkId } from '../frameworks';

export type TrackId =
  | 'capture'
  | 'three-questions'
  | 'just-write'
  | 'framework'
  | 'space'
  | 'sketch'
  | 'voice'
  | 'photo'
  | 'search'
  | 'backup'
  | 'lock';

export interface Track {
  id: TrackId;
  /** Past tense, shown ticked or not: "Captured something". */
  label: string;
  /** Where to find it, shown only while it is untried. */
  how: string;
}

/** In the order Profile lists them: the core loop first, then the extras, then looking after your data. */
export const TRACKS: Track[] = [
  { id: 'capture', label: 'Captured something', how: 'Dashboard → Capture. A sentence is enough.' },
  { id: 'three-questions', label: 'Answered the three questions', how: "Dashboard → Reflect: what happened, what stood out, what you'll carry forward." },
  { id: 'just-write', label: 'Just wrote', how: "Reflect → Just write, for when you don't want questions." },
  { id: 'framework', label: 'Tried a framework', how: 'Reflect → Use a framework: Gibbs, STAR and four others.' },
  { id: 'space', label: 'Went into a space', how: 'Dashboard → Spaces, for a specific moment: a difficult conversation, a decision, a loss.' },
  { id: 'sketch', label: 'Added a sketch', how: 'Reflect → Sketch opens a drawing pad.' },
  { id: 'voice', label: 'Added a voice note', how: 'Capture → Audio, or Voice while you reflect.' },
  { id: 'photo', label: 'Added a photo', how: 'Capture → Photo.' },
  { id: 'search', label: 'Found an entry again', how: 'Archive → type a word you remember into the search box.' },
  { id: 'backup', label: 'Saved a backup file', how: 'Profile → Backup & Restore → Export. Keep the file somewhere other than this device.' },
  { id: 'lock', label: 'Locked the app', how: 'Profile → Privacy Lock asks for a PIN when the app opens.' },
];

// ---- The two flags an entry cannot show ----

const KEY = 'reflexia.learning.v1';

export interface LearningFlags {
  /** First time an Archive search found something. */
  foundAt?: string;
  /** Last time a backup file was exported. */
  backedUpAt?: string;
  /** Dashboard suggestions put away, and how many entries there were at the time. */
  dismissed?: Array<{ id: TrackId; atCount: number }>;
}

export function loadFlags(): LearningFlags {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveFlags(flags: LearningFlags): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(flags));
  } catch {
    // storage full or unavailable: a checklist tick is never worth an error
  }
}

/** Archive calls this when a search returns something. Written once. */
export function markFound(now: Date = new Date()): void {
  const flags = loadFlags();
  if (flags.foundAt) return;
  saveFlags({ ...flags, foundAt: now.toISOString() });
}

/** storageService.exportBackup() calls this. */
export function markBackedUp(now: Date = new Date()): void {
  saveFlags({ ...loadFlags(), backedUpAt: now.toISOString() });
}

/** The dashboard's ×: that suggestion never comes back, and the next waits a while. */
export function dismissNudge(id: TrackId, entryCount: number): void {
  const flags = loadFlags();
  const dismissed = (flags.dismissed ?? []).filter((d) => d.id !== id);
  saveFlags({ ...flags, dismissed: [...dismissed, { id, atCount: entryCount }] });
}

// ---- What has been tried ----

function mediaOf(e: Entry): MediaItem[] {
  const own = Array.isArray(e.attachments) ? e.attachments : [];
  const capture = isCapture(e) && Array.isArray(e.media) ? e.media : [];
  return [...own, ...capture].filter((m) => m && typeof m === 'object');
}

const filled = (s: unknown): boolean => typeof s === 'string' && s.trim().length > 0;

export function triedTracks(
  entries: Entry[],
  profile: Pick<UserProfile, 'privacyLockEnabled'>,
  flags: LearningFlags = loadFlags(),
): Set<TrackId> {
  const tried = new Set<TrackId>();

  for (const e of entries) {
    if (isCapture(e)) tried.add('capture');

    if (isReflection(e)) {
      const model = e.model ?? e.modelId;
      const answers = e.answers ?? {};
      if (model === THREE_PART.id && THREE_PART.stages.every((s) => filled(answers[s.id]))) tried.add('three-questions');
      if (model === 'FREE' && Object.values(answers).some(filled)) tried.add('just-write');
      if (isSpaceFrameworkId(model)) tried.add('space');
      else if (model && getFramework(model).kind === 'framework') tried.add('framework');
    }

    for (const m of mediaOf(e)) {
      if (m.type === 'SKETCH' || m.type === 'DRAWING') tried.add('sketch');
      if (m.type === 'AUDIO') tried.add('voice');
      if (m.type === 'PHOTO') tried.add('photo');
    }
  }

  if (flags.foundAt) tried.add('search');
  if (flags.backedUpAt) tried.add('backup');
  if (profile.privacyLockEnabled) tried.add('lock');
  return tried;
}

// ---- The one dashboard line ----

export interface Nudge {
  id: TrackId;
  text: string;
  /** The button: where it goes and what it says. */
  action: { label: string; view: 'REFLECTION' | 'HOLODECK' | 'NEURAL_LINK' };
}

/** Nothing is suggested before this many entries: someone new has the four doors and that is enough. */
export const NUDGE_AFTER = 3;
/** After a suggestion is put away, this many more entries before the next. */
export const NUDGE_COOL_DOWN = 3;

const CANDIDATES: Array<{ nudge: Nudge; untried: (t: Set<TrackId>) => boolean }> = [
  {
    // Only captures so far: they have not met Reflect in any form.
    untried: (t) => !t.has('three-questions') && !t.has('just-write') && !t.has('framework'),
    nudge: {
      id: 'three-questions',
      text: 'When you have a few minutes, Reflect asks three short questions about something that happened.',
      action: { label: 'Reflect', view: 'REFLECTION' },
    },
  },
  {
    untried: (t) => !t.has('space'),
    nudge: {
      id: 'space',
      text: 'There are spaces for specific moments — a difficult conversation, a decision, a loss. Try one when you need it.',
      action: { label: 'See the spaces', view: 'HOLODECK' },
    },
  },
  {
    untried: (t) => !t.has('backup'),
    nudge: {
      id: 'backup',
      text: 'Everything you write stays on this device. A backup file keeps a copy somewhere else.',
      action: { label: 'Back up in Profile', view: 'NEURAL_LINK' },
    },
  },
];

/**
 * At most one suggestion: none before NUDGE_AFTER entries, none within
 * NUDGE_COOL_DOWN entries of the last one put away, never one already put
 * away, never for something already tried.
 */
export function pickNudge(tried: Set<TrackId>, entryCount: number, flags: LearningFlags = loadFlags()): Nudge | null {
  if (entryCount < NUDGE_AFTER) return null;
  const dismissed = flags.dismissed ?? [];
  if (dismissed.some((d) => entryCount < d.atCount + NUDGE_COOL_DOWN)) return null;
  const gone = new Set(dismissed.map((d) => d.id));
  const next = CANDIDATES.find((c) => !gone.has(c.nudge.id) && c.untried(tried));
  return next ? next.nudge : null;
}
