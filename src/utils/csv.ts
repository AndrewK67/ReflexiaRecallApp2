/**
 * CSV for a person's own entries (phase 3D.6). Used by Archive → Export CSV
 * and Reports → CSV, which used to build their own and both lost the text.
 *
 * - RFC 4180: every cell quoted, quotes doubled, CRLF between rows; line
 *   breaks inside an answer stay inside its cell.
 * - A UTF-8 byte-order mark first, or Excel on Windows reads "£", "’" and
 *   emoji as mojibake.
 * - A cell that begins with = + - @ or a tab/return is prefixed with an
 *   apostrophe, so a spreadsheet shows it as text instead of running it as a
 *   formula (OWASP "CSV injection"). Entries can arrive from an imported
 *   backup file, so their text is not trusted to be harmless. Plain numbers
 *   ("-5", "3.5") are left alone.
 */

import type { Entry } from '../types';
import { isReflection } from './entryKind';
import { entryInsight, entryMediaCount, entryText, entryTitle } from './entryText';

export const BOM = '﻿';

const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (FORMULA_START.test(s) && !PLAIN_NUMBER.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows: unknown[][]): string {
  return BOM + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export const ENTRY_CSV_HEADER = ['Date', 'Time', 'Kind', 'Framework or space', 'Mood (1-5)', 'What you wrote', 'Insight', 'Attachments'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Local date and time, sortable: "2026-09-21", "19:30". An unreadable date is kept as stored. */
function dateAndTime(iso: string): [string, string] {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return [iso ?? '', ''];
  return [`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, `${pad(d.getHours())}:${pad(d.getMinutes())}`];
}

/** One row per entry, in the order given, with everything the person wrote. */
export function entriesToCsv(entries: Entry[]): string {
  const rows: unknown[][] = [ENTRY_CSV_HEADER];
  for (const e of entries) {
    const reflection = isReflection(e);
    const [date, time] = dateAndTime(e.date);
    const mood = reflection && typeof e.mood === 'number' ? e.mood : '';
    const media = entryMediaCount(e);
    rows.push([
      date,
      time,
      reflection ? 'Reflection' : 'Capture',
      reflection ? entryTitle(e) : '',
      mood,
      entryText(e),
      entryInsight(e),
      media || '',
    ]);
  }
  return toCsv(rows);
}

/** Hand a CSV string to the browser as a download. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "2026-09-21", in local time, for file names. */
export function localDateStamp(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
