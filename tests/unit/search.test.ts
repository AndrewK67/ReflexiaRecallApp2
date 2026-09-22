import { describe, it, expect } from 'vitest';
import { searchEntries, exportSearchResultsToCSV, getSearchSuggestions, extractUniqueTags } from '../../src/services/searchService';
import type { Entry } from '../../src/types';

const capture = (id: string, notes: string, extra: Partial<Entry> = {}): Entry =>
  ({ id, type: 'INCIDENT', date: '2026-03-10T10:00:00.000Z', notes, media: [], ...extra } as Entry);
const reflection = (id: string, answers: Record<string, string>, extra: Partial<Entry> = {}): Entry =>
  ({ id, type: 'REFLECTION', date: '2026-03-12T10:00:00.000Z', model: 'SIMPLE', answers, ...extra } as Entry);

const fixture: Entry[] = [
  capture('c1', 'The meeting with Priya went badly'),
  capture('c2', 'Walked by the canal, felt calmer', { severity: 'LOW' } as Partial<Entry>),
  reflection('r1', { what_happened: 'Presented the roadmap', what_mattered: 'Nobody asked about the budget' }),
  reflection('r2', { what_happened: 'Argued about the budget again' }, { model: 'GIBBS', date: '2026-01-05T10:00:00.000Z' } as Partial<Entry>),
];

describe('searchEntries', () => {
  it('matches Quick Capture notes and reflection answers, case-insensitively', () => {
    expect(searchEntries(fixture, { query: 'priya' }).entries.map((e) => e.id)).toEqual(['c1']);
    expect(searchEntries(fixture, { query: 'BUDGET' }).entries.map((e) => e.id).sort()).toEqual(['r1', 'r2']);
  });

  it('requires every term to be present', () => {
    expect(searchEntries(fixture, { query: 'budget roadmap' }).entries.map((e) => e.id)).toEqual(['r1']);
    expect(searchEntries(fixture, { query: 'budget canal' }).entries).toHaveLength(0);
  });

  it('filters by entry type, reflection model, severity and date range', () => {
    expect(searchEntries(fixture, { entryType: 'reflection' }).filteredCount).toBe(2);
    expect(searchEntries(fixture, { entryType: 'incident' }).filteredCount).toBe(2);
    expect(searchEntries(fixture, { reflectionModel: 'GIBBS' }).entries.map((e) => e.id)).toEqual(['r2']);
    expect(searchEntries(fixture, { severity: 'LOW' }).entries.map((e) => e.id)).toEqual(['c2']);
    expect(searchEntries(fixture, { dateFrom: '2026-03-11' }).entries.map((e) => e.id)).toEqual(['r1']);
    expect(searchEntries(fixture, { dateTo: '2026-01-31' }).entries.map((e) => e.id)).toEqual(['r2']);
  });

  it('sorts newest first by default and paginates', () => {
    const all = searchEntries(fixture);
    expect(all.entries.map((e) => e.id)).toEqual(['r1', 'c1', 'c2', 'r2']);
    const page = searchEntries(fixture, {}, { page: 2, pageSize: 3 });
    expect(page.entries.map((e) => e.id)).toEqual(['r2']);
    expect(page).toMatchObject({ totalCount: 4, filteredCount: 4, totalPages: 2, hasMore: false });
  });

  it('suggests words from entry text and extracts keyword tags', () => {
    expect(getSearchSuggestions(fixture, 'bud')).toEqual(expect.arrayContaining([expect.stringMatching(/^budget/)]));
    expect(extractUniqueTags([capture('k', 'x', { keywords: ['Work', 'work', 'calm'] } as Partial<Entry>)])).toEqual(expect.arrayContaining(['calm']));
  });
});

describe('exportSearchResultsToCSV', () => {
  const result = searchEntries(fixture, { query: 'budget' });

  it('has a header row and one row per entry', () => {
    const csv = exportSearchResultsToCSV(result, { query: 'budget' });
    const rows = csv.split('\n');
    expect(rows).toContain('"Date","Type","Title","Content Preview"');
    expect(rows.filter((r) => /^"\d/.test(r))).toHaveLength(2);
  });

  // KNOWN BUG (docs/PHASE-0-SCOPE.md §0.3): the exporter reads entry.title and
  // entry.content, which nothing in the app writes. Every row's text is empty.
  it.fails('includes the entry text in each data row', () => {
    const csv = exportSearchResultsToCSV(result, { query: 'budget' });
    const dataRows = csv.split('\n').filter((r) => /^"\d/.test(r));
    // 'Argued' and 'Presented' are in the matched entries' answers but not in the query,
    // so they can only appear if the rows carry the entry text.
    expect(dataRows.join('\n')).toMatch(/Argued|Presented/);
  });
});
