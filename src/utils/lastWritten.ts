/**
 * "Last written today" / "yesterday" / "on Tuesday" / "on 14 September".
 * The dashboard shows this instead of an entry count (phase 3B.2,
 * docs/PHASE-3-SCOPE.md §4 decision 6): it is about coming back, not about
 * piling up.
 */

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function lastWrittenLabel(iso: string | undefined | null, now: Date = new Date()): string | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const days = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000);
  if (days <= 0) return 'Last written today';
  if (days === 1) return 'Last written yesterday';
  if (days < 7) return `Last written on ${then.toLocaleDateString('en-GB', { weekday: 'long' })}`;
  const sameYear = then.getFullYear() === now.getFullYear();
  const date = then.toLocaleDateString('en-GB', sameYear ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' });
  return `Last written on ${date}`;
}

/** The newest `date` among the entries, or undefined. */
export function newestDate(entries: Array<{ date?: string }>): string | undefined {
  let best: string | undefined;
  let bestT = -Infinity;
  for (const e of entries) {
    const t = e.date ? Date.parse(e.date) : NaN;
    if (!Number.isNaN(t) && t > bestT) {
      bestT = t;
      best = e.date;
    }
  }
  return best;
}
