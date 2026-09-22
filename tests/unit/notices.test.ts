import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';

/** Phase 3C.4: no native dialogs in the core; the notice service is safe without a provider. */
describe('notices', () => {
  beforeEach(() => vi.resetModules());

  it('no live source calls alert(), confirm() or prompt()', () => {
    const hits: string[] = [];
    const walk = (d: string) => {
      for (const f of fs.readdirSync(d, { withFileTypes: true })) {
        const p = `${d}/${f.name}`;
        if (f.isDirectory()) {
          if (p.includes('modules/professional')) continue; // parked; the module gets its own pass when it is built
          walk(p);
        } else if (/\.tsx?$/.test(f.name)) {
          const src = fs.readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
          // a call, not a method declaration like `prompt(): Promise<void>` on an interface
          if (/(^|[^.\w])(alert|confirm|prompt)\s*\((?!\)\s*:)/.test(src)) hits.push(p);
        }
      }
    };
    walk('src');
    expect(hits).toEqual([]);
  });

  it('without a provider, notify() logs and a confirmation answers No', async () => {
    const n = await import('../../src/services/noticeService');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    n.notify('hello');
    n.notify('bad', 'error');
    expect(log).toHaveBeenCalledWith('[notice:info] hello');
    expect(err).toHaveBeenCalledWith('[notice:error] bad');
    expect(await n.confirmAction({ title: 'Delete everything?' })).toBe(false);
    expect(warn).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('with a provider, notices carry a lifetime (errors none) and confirmations resolve with the answer', async () => {
    const n = await import('../../src/services/noticeService');
    const seen: Array<[string, string, number | null]> = [];
    const unbind = n.bindNoticeSink({
      notify: (kind, message, ttl) => { seen.push([kind, message, ttl]); },
      confirm: async (o) => o.title.startsWith('yes'),
    });
    n.notify('saved', 'success');
    n.notify('broke', 'error');
    n.notify('quick', 'info', 1000);
    expect(seen).toEqual([['success', 'saved', 5000], ['error', 'broke', null], ['info', 'quick', 1000]]);
    expect(await n.confirmAction({ title: 'yes please' })).toBe(true);
    expect(await n.confirmAction({ title: 'no thanks' })).toBe(false);
    unbind();
    expect(await n.confirmAction({ title: 'yes please' })).toBe(false);
  });
});
