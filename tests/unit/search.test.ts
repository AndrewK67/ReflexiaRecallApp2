import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { searchEntries, filterEntries, highlightParts, getSearchSuggestions, extractUniqueTags } from '../../src/services/searchService';
import { entriesToCsv, csvCell, BOM } from '../../src/utils/csv';
import type { Entry } from '../../src/types';

const capture = (id: string, notes: string, extra: Partial<Entry> = {}): Entry =>
  ({ id, type: 'INCIDENT', date: '2026-03-10T10:00:00.000Z', notes, media: [], ...extra } as Entry);
const reflection = (id: string, answers: Record<string, string>, extra: Partial<Entry> = {}): Entry =>
  ({ id, type: 'REFLECTION', date: '2026-03-12T10:00:00.000Z', model: 'SIMPLE', answers, ...extra } as Entry);

const fixture: Entry[] = [
  capture('c1', 'The meeting with Priya went badly'),
  capture('c2', 'Walked by the canal, felt calmer', { type: 'incident' } as Partial<Entry>), // older lower-case spelling
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

  it('filters by entry type (both stored spellings), reflection model and date range', () => {
    expect(searchEntries(fixture, { entryType: 'reflection' }).filteredCount).toBe(2);
    expect(searchEntries(fixture, { entryType: 'capture' }).entries.map((e) => e.id).sort()).toEqual(['c1', 'c2']);
    expect(searchEntries(fixture, { reflectionModel: 'GIBBS' }).entries.map((e) => e.id)).toEqual(['r2']);
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

describe('search is literal text (phase 3D.6)', () => {
  const odd = [capture('p1', 'Tea (again) with Sam [kitchen] *later*'), capture('p2', 'More tea (again) \\ and cake + $5')];

  it('regular-expression characters are just characters, in every sort', () => {
    for (const sortBy of ['date-desc', 'date-asc', 'relevance'] as const) {
      for (const [query, ids] of [['(again', ['p1', 'p2']], ['(again)', ['p1', 'p2']], ['[kitchen', ['p1']], ['*later*', ['p1']], ['\\', ['p2']], ['+ $5', ['p2']], ['.*', []]] as const) {
        expect(() => searchEntries(odd, { query, sortBy })).not.toThrow();
        expect(searchEntries(odd, { query, sortBy }).entries.map((e) => e.id).sort(), `${query} / ${sortBy}`).toEqual([...ids].sort());
      }
    }
  });

  it('relevance ranks by how often the words appear', () => {
    const e = [capture('once', 'budget'), capture('thrice', 'budget budget, and the budget again')];
    expect(searchEntries(e, { query: 'budget', sortBy: 'relevance' }).entries.map((x) => x.id)).toEqual(['thrice', 'once']);
  });

  it('filterEntries returns every match, not a page', () => {
    const many = Array.from({ length: 45 }, (_, i) => capture(`m${i}`, `note ${i} canal`));
    expect(searchEntries(many, { query: 'canal' }).entries).toHaveLength(20);
    expect(filterEntries(many, { query: 'canal' })).toHaveLength(45);
  });
});

describe('highlightParts', () => {
  it('splits text into plain and matching parts, case-insensitively, keeping the original case', () => {
    expect(highlightParts('The Canal, the canal', 'canal')).toEqual([
      { text: 'The ', match: false },
      { text: 'Canal', match: true },
      { text: ', the ', match: false },
      { text: 'canal', match: true },
    ]);
  });

  it('handles several words, overlapping words, and characters a RegExp would choke on', () => {
    expect(highlightParts('tea (again)', '(again tea')).toEqual([
      { text: 'tea', match: true },
      { text: ' ', match: false },
      { text: '(again', match: true },
      { text: ')', match: false },
    ]);
    expect(highlightParts('banana', 'an ana').map((p) => p.text).join('')).toBe('banana');
  });

  it('returns markup as text, never as HTML', () => {
    const parts = highlightParts('<img src=x onerror=alert(1)> hello', 'hello');
    expect(parts[0]).toEqual({ text: '<img src=x onerror=alert(1)> ', match: false });
  });

  it('no query, no highlight; no text, no parts', () => {
    expect(highlightParts('abc', '  ')).toEqual([{ text: 'abc', match: false }]);
    expect(highlightParts('', 'abc')).toEqual([]);
  });
});

describe('no entry text becomes HTML anywhere in the live app', () => {
  it('src/ outside the parked module has no raw-HTML sink', () => {
    const hits: string[] = [];
    (function walk(dir: string) {
      for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
          if (p.split(path.sep).join('/') !== 'src/modules') walk(p);
        } else if (/\.(tsx?|jsx?)$/.test(f)) {
          const code = fs.readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
          if (/dangerouslySetInnerHTML|\.innerHTML\s*=|outerHTML\s*=|insertAdjacentHTML|document\.write\(/.test(code)) hits.push(p);
        }
      }
    })('src');
    expect(hits).toEqual([]);
  });
});

describe('CSV export (utils/csv.ts)', () => {
  const result = filterEntries(fixture, { query: 'budget' });

  it('has a BOM, a header row and one row per entry, CRLF between rows', () => {
    const csv = entriesToCsv(result);
    expect(csv.startsWith(BOM)).toBe(true);
    const rows = csv.slice(1).split('\r\n').filter(Boolean);
    expect(rows[0]).toBe('"Date","Time","Kind","Framework or space","Mood (1-5)","What you wrote","Insight","Attachments"');
    expect(rows.filter((r) => /^"\d{4}-\d{2}-\d{2}"/.test(r))).toHaveLength(2);
  });

  // Was it.fails since phase 0 (docs/PHASE-0-SCOPE.md §0.3): the old
  // exporter read entry.title and entry.content, which nothing writes.
  it('includes the entry text in each data row', () => {
    const csv = entriesToCsv(result);
    // 'Argued' and 'Presented' are in the matched entries' answers but not in the query,
    // so they can only appear if the rows carry the entry text.
    expect(csv).toMatch(/Argued/);
    expect(csv).toMatch(/Presented/);
  });

  it('a reflection is its answers under their questions, in the framework\'s order; a capture is its note', () => {
    const csv = entriesToCsv([
      reflection('r', { what_forward: 'Ask first.', what_happened: 'A tense meeting.' }, { mood: 4 } as Partial<Entry>),
      capture('c', 'Just the note', { media: [{ id: 'm', type: 'PHOTO', url: 'data:x', createdAt: 1 }] } as Partial<Entry>),
    ]);
    expect(csv).toContain('"Reflection","Three-Part","4","What happened?: A tense meeting.\n\nWhat will you carry forward?: Ask first.","",""');
    expect(csv).toContain('"Capture","","","Just the note","","1"');
    expect(csv).not.toMatch(/INCIDENT/);
  });

  it('quotes are doubled and line breaks stay inside their cell', () => {
    expect(csvCell('She said "no".\nThen left.')).toBe('"She said ""no"".\nThen left."');
  });

  it('a cell that a spreadsheet would run as a formula is shown as text; plain numbers are left alone', () => {
    expect(csvCell('=HYPERLINK("http://x","click")')).toBe('"\'=HYPERLINK(""http://x"",""click"")"');
    expect(csvCell("+cmd|' /C calc'!A0")).toBe('"\'+cmd|\' /C calc\'!A0"');
    expect(csvCell('-2+3+cmd')).toBe('"\'-2+3+cmd"');
    expect(csvCell('@SUM(A1)')).toBe('"\'@SUM(A1)"');
    expect(csvCell('-5')).toBe('"-5"');
    expect(csvCell(4)).toBe('"4"');
    expect(csvCell('A normal note')).toBe('"A normal note"');
  });
});
