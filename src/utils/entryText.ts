/**
 * What an entry says, as text — one definition for every place that shows
 * or exports it (the entry modal, Archive's row preview, both CSV exports,
 * the Reports text export).
 *
 * Before phase 3D.6 the Archive preview and CSV read `entry.title` and
 * `entry.content`, which nothing in the app writes, so a person's words were
 * never in their export and never in the list (docs/PHASE-0-SCOPE.md §0.3).
 * The words live in a capture's `notes` and a reflection's `answers`.
 */

import type { Entry } from '../types';
import { isCapture } from './entryKind';
import { getFramework } from '../frameworks';

export interface EntrySection {
  /** The question it answers ("What happened?"), or '' for a capture's note. */
  label: string;
  text: string;
}

const filled = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;

/**
 * A capture: its note. A reflection: its answers in the framework's own
 * order, each under its question, then any answers the framework does not
 * know (an old build's ids). Blank answers are left out.
 */
export function entrySections(entry: Entry): EntrySection[] {
  if (isCapture(entry)) return filled(entry.notes) ? [{ label: '', text: entry.notes }] : [];
  const answers = entry.answers ?? {};
  const framework = getFramework(entry.model ?? entry.modelId, Object.keys(answers));
  const order = framework.stages.map((s) => s.id);
  const keys = [...order.filter((k) => k in answers), ...Object.keys(answers).filter((k) => !order.includes(k))];
  return keys
    .filter((k) => filled(answers[k]))
    .map((k) => ({ label: framework.stages.find((s) => s.id === k)?.label ?? k, text: answers[k] }));
}

/** "Capture", or the framework or space it was written in ("Three-Part", "Gibbs' Reflective Cycle"). */
export function entryTitle(entry: Entry): string {
  if (isCapture(entry)) return 'Capture';
  return getFramework(entry.model ?? entry.modelId, Object.keys(entry.answers ?? {})).name;
}

/**
 * Everything written, as plain text. With more than one section, each is
 * "Question: answer" on its own paragraph; a single section is just its text.
 */
export function entryText(entry: Entry): string {
  const sections = entrySections(entry);
  if (sections.length === 1) return sections[0].text.trim();
  return sections.map((s) => (s.label ? `${s.label}: ${s.text.trim()}` : s.text.trim())).join('\n\n');
}

/** The first `max` characters of what was written, on one line, for a list row. */
export function entryPreview(entry: Entry, max = 200): string {
  const flat = entrySections(entry)
    .map((s) => s.text.trim())
    .join(' · ')
    .replace(/\s+/g, ' ');
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

/** The AI insight saved with a reflection, if any. */
export function entryInsight(entry: Entry): string {
  if (isCapture(entry)) return '';
  return filled(entry.aiInsight) ? entry.aiInsight.trim() : '';
}

/** Photos, sketches, voice notes and videos, from either list an entry keeps them in. */
export function entryMediaCount(entry: Entry): number {
  const own = Array.isArray(entry.attachments) ? entry.attachments.length : 0;
  const capture = isCapture(entry) && Array.isArray(entry.media) ? entry.media.length : 0;
  return own + capture;
}
