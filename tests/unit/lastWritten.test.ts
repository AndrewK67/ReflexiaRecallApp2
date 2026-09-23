import { describe, it, expect } from 'vitest';
import { lastWrittenLabel, newestDate } from '../../src/utils/lastWritten';

describe('lastWrittenLabel', () => {
  const now = new Date(2026, 8, 22, 21, 0); // Tuesday 22 September 2026, 9 pm local

  it('is null with nothing written', () => {
    expect(lastWrittenLabel(undefined, now)).toBeNull();
    expect(lastWrittenLabel('not a date', now)).toBeNull();
  });

  it('says today, yesterday, a weekday, then a date', () => {
    expect(lastWrittenLabel(new Date(2026, 8, 22, 7, 30).toISOString(), now)).toBe('Last written today');
    expect(lastWrittenLabel(new Date(2026, 8, 21, 23, 59).toISOString(), now)).toBe('Last written yesterday');
    expect(lastWrittenLabel(new Date(2026, 8, 17, 12, 0).toISOString(), now)).toBe('Last written on Thursday');
    expect(lastWrittenLabel(new Date(2026, 8, 15, 12, 0).toISOString(), now)).toBe('Last written on 15 September');
    expect(lastWrittenLabel(new Date(2025, 10, 14, 12, 0).toISOString(), now)).toBe('Last written on 14 November 2025');
  });

  it('treats a date in the future (clock skew) as today', () => {
    expect(lastWrittenLabel(new Date(2026, 8, 23, 9, 0).toISOString(), now)).toBe('Last written today');
  });
});

describe('newestDate', () => {
  it('finds the latest date regardless of order and ignores bad ones', () => {
    expect(newestDate([])).toBeUndefined();
    expect(newestDate([{ date: '2026-01-01T00:00:00Z' }, { date: 'x' }, { date: '2026-03-01T00:00:00Z' }, {}])).toBe('2026-03-01T00:00:00Z');
  });
});
