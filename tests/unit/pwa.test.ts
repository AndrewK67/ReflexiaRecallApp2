import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

/**
 * The manifest in vite.config.ts is what makes the app installable. It used
 * to name /pwa-192.png and /pwa-512.png, which never existed in public/, so
 * no browser ever offered to install the app (phase 3A.1). Every icon the
 * manifest names must be a real file, and the stale hand-written
 * public/manifest.json must not come back to contradict it.
 */
describe('PWA manifest', () => {
  const config = fs.readFileSync('vite.config.ts', 'utf8');

  it('names only icons that exist in public/', () => {
    const srcs = [...config.matchAll(/src:\s*'\/([^']+\.png)'/g)].map((m) => m[1]);
    expect(srcs.length).toBeGreaterThanOrEqual(2);
    for (const f of srcs) expect(fs.existsSync(`public/${f}`), `public/${f}`).toBe(true);
    expect(srcs).toContain('icon-192.png');
    expect(srcs).toContain('icon-512.png');
  });

  it('includes those icons as assets and is named plainly', () => {
    expect(config).toMatch(/includeAssets:\s*\['icon-192\.png',\s*'icon-512\.png'\]/);
    expect(config).toMatch(/name:\s*'Reflexia'/);
    expect(config).not.toContain('Reflexia Recall');
  });

  it('has no second, hand-written manifest or service worker in public/', () => {
    expect(fs.existsSync('public/manifest.json')).toBe(false);
    expect(fs.existsSync('public/service-worker.js')).toBe(false);
  });

  it('index.html gives iOS its icon and title', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    expect(html).toContain('rel="apple-touch-icon" href="/icon-192.png"');
    expect(fs.existsSync('public/icon-192.png')).toBe(true);
    expect(html).not.toMatch(/adsbygoogle/);
  });
});
