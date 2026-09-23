import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Entry } from '../../src/types';
import { resetBrowserStorage, quickCapture } from './helpers';

// Phase 3D.2: what someone has tried, worked out from the real thing only.

async function learning() {
  return import('../../src/services/learningService');
}

const NO_LOCK = { privacyLockEnabled: false };

function reflection(id: string, model: string, answers: Record<string, string>, extra: Partial<Entry> = {}): Entry {
  return { id, type: 'REFLECTION', date: '2026-09-20T10:00:00.000Z', model, answers, ...extra } as Entry;
}

describe('learningService: tracks', () => {
  beforeEach(() => resetBrowserStorage());

  it('a fresh profile has tried nothing', async () => {
    const l = await learning();
    expect([...l.triedTracks([], NO_LOCK)]).toEqual([]);
  });

  it('every track has a label and, while untried, says where to find it', async () => {
    const l = await learning();
    expect(l.TRACKS.map((t) => t.id)).toEqual([
      'capture', 'three-questions', 'just-write', 'framework', 'space', 'sketch', 'voice', 'photo', 'search', 'backup', 'lock',
    ]);
    for (const t of l.TRACKS) {
      expect(t.label.length).toBeGreaterThan(5);
      expect(t.how.length).toBeGreaterThan(10);
      // no scoring vocabulary anywhere in the checklist
      expect(`${t.label} ${t.how}`).not.toMatch(/\bXP\b|\blevels?\b|\bstreaks?\b|\bpoints\b|achievement|unlock|badge/i);
    }
  });

  it('a capture is "Captured something"', async () => {
    const l = await learning();
    expect(l.triedTracks([quickCapture('c1', 'a note')], NO_LOCK)).toEqual(new Set(['capture']));
  });

  it('the three questions count only when all three are answered', async () => {
    const l = await learning();
    const two = reflection('r1', 'SIMPLE', { what_happened: 'A', what_mattered: 'B', what_forward: '  ' });
    const three = reflection('r2', 'SIMPLE', { what_happened: 'A', what_mattered: 'B', what_forward: 'C' });
    expect(l.triedTracks([two], NO_LOCK).has('three-questions')).toBe(false);
    expect(l.triedTracks([three], NO_LOCK).has('three-questions')).toBe(true);
  });

  it('Just write counts only with something written', async () => {
    const l = await learning();
    expect(l.triedTracks([reflection('f1', 'FREE', { FREE_Writing: '' })], NO_LOCK).has('just-write')).toBe(false);
    expect(l.triedTracks([reflection('f2', 'FREE', { FREE_Writing: 'Just this.' })], NO_LOCK).has('just-write')).toBe(true);
  });

  it('a catalogue framework is a framework; a space is a space, not a framework; SBAR from an old build is neither', async () => {
    const l = await learning();
    expect([...l.triedTracks([reflection('g', 'GIBBS', { Description: 'x' })], NO_LOCK)]).toEqual(['framework']);
    expect([...l.triedTracks([reflection('s', 'SPACE_DIFFICULT_CONVERSATION', { SPACE_DIFFICULT_CONVERSATION_1: 'x' })], NO_LOCK)]).toEqual(['space']);
    expect([...l.triedTracks([reflection('b', 'SBAR', { situation: 'x' })], NO_LOCK)]).toEqual([]);
  });

  it('media counts wherever it is kept: a reflection\'s sketches and voice notes, a capture\'s photo and audio', async () => {
    const l = await learning();
    const sketch = reflection('r', 'FREE', {}, { attachments: [{ id: 'a', type: 'SKETCH', url: 'idb://s.png', createdAt: 1 }] });
    const drawing = reflection('r2', 'FREE', {}, { attachments: [{ id: 'd', type: 'DRAWING', url: 'data:x', createdAt: 1 }] });
    const capture = { ...quickCapture('c', 'with media'), media: [{ id: 'p', type: 'PHOTO', url: 'data:x', createdAt: 1 }, { id: 'v', type: 'AUDIO', url: 'idb://v.webm', createdAt: 1 }] } as Entry;
    expect(l.triedTracks([sketch], NO_LOCK)).toEqual(new Set(['sketch']));
    expect(l.triedTracks([drawing], NO_LOCK)).toEqual(new Set(['sketch']));
    expect(l.triedTracks([capture], NO_LOCK)).toEqual(new Set(['capture', 'photo', 'voice']));
  });

  it('search, backup and lock come from their flags and the profile', async () => {
    const l = await learning();
    l.markFound();
    l.markBackedUp();
    expect(l.triedTracks([], { privacyLockEnabled: true })).toEqual(new Set(['search', 'backup', 'lock']));
  });

  it('nothing is ticked by what the old tutorial stored: no dwell, no "I tried it", no bonus points', async () => {
    localStorage.setItem('reflexia_tutorial_progress', JSON.stringify({ completedSteps: ['FIRST_REFLECTION', 'HOLODECK', 'ARCHIVE', 'NEURAL_LINK'], isCompleted: true }));
    localStorage.setItem('reflexia_bonus_xp', '1300');
    localStorage.setItem('reflexia.stats.v1', JSON.stringify({ level: 9, achievements: [{ id: 'FIRST_ENTRY' }] }));
    const l = await learning();
    expect([...l.triedTracks([], NO_LOCK)]).toEqual([]);
  });

  it('markFound keeps the first time; markBackedUp keeps the latest', async () => {
    const l = await learning();
    l.markFound(new Date('2026-09-01T00:00:00Z'));
    l.markFound(new Date('2026-09-10T00:00:00Z'));
    l.markBackedUp(new Date('2026-09-01T00:00:00Z'));
    l.markBackedUp(new Date('2026-09-10T00:00:00Z'));
    expect(l.loadFlags()).toMatchObject({ foundAt: '2026-09-01T00:00:00.000Z', backedUpAt: '2026-09-10T00:00:00.000Z' });
  });

  it('corrupt or odd flag storage reads as nothing, not an error', async () => {
    const l = await learning();
    for (const raw of ['{not json', '[1,2]', 'null', '"x"']) {
      localStorage.setItem('reflexia.learning.v1', raw);
      expect(l.loadFlags()).toEqual({});
    }
  });
});

describe('storageService.exportBackup marks a backup as tried', () => {
  const g = globalThis as unknown as { document?: unknown };
  let hadDocument: boolean;

  beforeEach(() => {
    resetBrowserStorage();
    hadDocument = 'document' in g;
    g.document = { createElement: () => ({ click: () => {} }) };
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    if (!hadDocument) delete g.document;
    vi.restoreAllMocks();
  });

  it('after an export, "Saved a backup file" is ticked', async () => {
    const { storageService } = await import('../../src/services/storageService');
    const l = await learning();
    expect(l.triedTracks([], NO_LOCK).has('backup')).toBe(false);
    await storageService.exportBackup();
    expect(l.triedTracks([], NO_LOCK).has('backup')).toBe(true);
  });
});

describe('learningService: the one dashboard suggestion', () => {
  beforeEach(() => resetBrowserStorage());

  const captures = (n: number) => Array.from({ length: n }, (_, i) => quickCapture(`c${i}`, `note ${i}`));

  it('nothing before three entries', async () => {
    const l = await learning();
    const two = captures(2);
    expect(l.pickNudge(l.triedTracks(two, NO_LOCK), two.length)).toBeNull();
  });

  it('three captures and nothing else: Reflect first', async () => {
    const l = await learning();
    const three = captures(3);
    const n = l.pickNudge(l.triedTracks(three, NO_LOCK), three.length);
    expect(n?.id).toBe('three-questions');
    expect(n?.action.view).toBe('REFLECTION');
  });

  it('someone who reflects in any form is not told about Reflect; spaces come next, then backup', async () => {
    const l = await learning();
    const entries = [...captures(2), reflection('g', 'GIBBS', { Description: 'x' })];
    expect(l.pickNudge(l.triedTracks(entries, NO_LOCK), entries.length)?.id).toBe('space');
    const withSpace = [...entries, reflection('s', 'SPACE_DECISION_SPACE', { SPACE_DECISION_SPACE_1: 'x' })];
    expect(l.pickNudge(l.triedTracks(withSpace, NO_LOCK), withSpace.length)?.id).toBe('backup');
    l.markBackedUp();
    expect(l.pickNudge(l.triedTracks(withSpace, NO_LOCK), withSpace.length)).toBeNull();
  });

  it('put away, a suggestion never returns, and the next waits three more entries', async () => {
    const l = await learning();
    let entries = captures(3);
    expect(l.pickNudge(l.triedTracks(entries, NO_LOCK), entries.length)?.id).toBe('three-questions');
    l.dismissNudge('three-questions', 3);
    for (const count of [3, 4, 5]) {
      entries = captures(count);
      expect(l.pickNudge(l.triedTracks(entries, NO_LOCK), count)).toBeNull();
    }
    entries = captures(6);
    expect(l.pickNudge(l.triedTracks(entries, NO_LOCK), 6)?.id).toBe('space');
  });

  it('the suggestions say nothing about scores, counts or days', async () => {
    const l = await learning();
    const seen: string[] = [];
    let entries = captures(3);
    for (let i = 0; i < 3; i++) {
      const n = l.pickNudge(l.triedTracks(entries, NO_LOCK), entries.length);
      if (!n) break;
      seen.push(`${n.text} ${n.action.label}`);
      l.dismissNudge(n.id, entries.length);
      entries = captures(entries.length + 3);
    }
    expect(seen).toHaveLength(3);
    for (const s of seen) expect(s).not.toMatch(/\bXP\b|\blevels?\b|\bstreaks?\b|\bpoints\b|\d+ (entries|days)|well done|great job/i);
  });
});
