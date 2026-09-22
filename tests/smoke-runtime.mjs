// tests/smoke-runtime.mjs
//
// Runtime smoke test for Reflexia. Seed of phase 0 — not a substitute for it.
//
// What it checks, in order:
//   1. The app mounts with zero page errors.
//   2. Onboarding completes and writes reflexia.profile.v1.
//   3. A Quick Capture entry saves to IndexedDB (reflexia-entries / entries), encrypted.
//   4. The entry survives a reload.
//   5. A returning user is NOT sent back through onboarding, and Skip does not
//      overwrite their name/profession (bug B1 in docs/PHASE-1-SCOPE.md — this
//      assertion fails until 1B.2 lands; that is intentional).
//   6. Archive lists the entry; the reflection composer opens.
//
// Usage:
//   npm run dev                                  (terminal 1)
//   npx playwright install chromium              (first time only)
//   node tests/smoke-runtime.mjs [url]         (terminal 2)
//
// Defaults to https://localhost:5173/ and accepts the dev server's self-signed cert.
// Screenshots land in .smoke/ (add it to .gitignore).
// Set PW_CHROMIUM=/path/to/chrome to use a specific browser binary.

import { chromium } from '@playwright/test';
import fs from 'node:fs';

const url = process.argv[2] || 'https://localhost:5173/';
const outDir = '.smoke';
fs.mkdirSync(outDir, { recursive: true });

const failures = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures.push(name);
};

const launchOpts = { headless: true, args: ['--ignore-certificate-errors'] };
if (process.env.PW_CHROMIUM) launchOpts.executablePath = process.env.PW_CHROMIUM;
if (process.platform === 'linux') launchOpts.args.push('--no-sandbox');

const browser = await chromium.launch(launchOpts);
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 430, height: 900 } });
const page = await ctx.newPage();

const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e?.message || e)));
// The browser's own /favicon.ico probe logs a generic "Failed to load resource" 404 that
// never appears as a page response, so ignore that console line and track real 4xx/5xx here.
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) pageErrors.push('console: ' + m.text()); });
page.on('response', (r) => { if (r.status() >= 400) pageErrors.push(`${r.status()} ${r.url()}`); });

const profile = () => page.evaluate(() => JSON.parse(localStorage.getItem('reflexia.profile.v1') || 'null'));
const idbEntries = () => page.evaluate(() => new Promise((res) => {
  const req = indexedDB.open('reflexia-entries');
  req.onerror = () => res(null);
  req.onsuccess = () => {
    try {
      const all = req.result.transaction('entries', 'readonly').objectStore('entries').getAll();
      all.onsuccess = () => res(all.result);
      all.onerror = () => res(null);
    } catch { res(null); }
  };
}));
const bodyText = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));

try {
  // 1. Mount
  await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${outDir}/01-first-screen.png` });
  check('app mounts', (await page.evaluate(() => document.getElementById('root')?.innerHTML.length ?? 0)) > 100);
  check('first screen is onboarding', /Capture Anything/.test(await bodyText()));

  // 2. Onboarding
  await page.getByRole('button', { name: /^Next/ }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /^Next/ }).click();
  await page.waitForTimeout(300);
  await page.getByPlaceholder('Your name').fill('Smoke');
  const select = page.locator('select');
  if (await select.count()) await select.selectOption('OTHER'); // profession picker, until 1B.2 removes it; non-default so the Skip check below means something
  await page.getByRole('button', { name: /Start Capturing/ }).click();
  await page.waitForTimeout(1500);
  const p1 = await profile();
  check('profile written after onboarding', p1?.isOnboarded === true && p1?.name === 'Smoke', JSON.stringify(p1));
  await page.screenshot({ path: `${outDir}/02-dashboard.png` });
  check('dashboard greets by name', /Smoke/.test(await bodyText()));

  // 3. Quick Capture → Save
  await page.getByRole('button', { name: /Capture/i }).first().click();
  await page.waitForTimeout(1500);
  await page.getByPlaceholder(/Describe what happened/).fill('Smoke test entry.');
  await page.getByRole('button', { name: /^Save$/ }).click();
  await page.waitForTimeout(2000);
  const e1 = await idbEntries();
  check('entry saved to IndexedDB', Array.isArray(e1) && e1.length === 1, `count=${e1?.length}`);
  check('entry is encrypted at rest', !!e1?.[0]?._encrypted && !JSON.stringify(e1[0]).includes('Smoke test entry'));

  // 4. Reload — persistence
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const e2 = await idbEntries();
  check('entry survives reload', Array.isArray(e2) && e2.length === 1, `count=${e2?.length}`);

  // 5. Returning user (B1)
  const t = await bodyText();
  check('returning user skips onboarding (B1)', !/Capture Anything/.test(t), 'onboarding replayed');
  const skip = page.getByRole('button', { name: /Skip/ });
  if (await skip.count()) {
    await skip.click();
    await page.waitForTimeout(1500);
  }
  const p2 = await profile();
  check('Skip does not overwrite name (B1)', p2?.name === 'Smoke', `name=${p2?.name}`);
  check('Skip does not overwrite profession (B1)', p2?.profession === p1?.profession, `${p1?.profession} → ${p2?.profession}`);

  // 6. Archive + composer
  await page.getByRole('button', { name: /archive/i }).first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${outDir}/03-archive.png` });
  check('archive lists the entry', /1 of 1 entries/.test(await bodyText()));
  await page.getByRole('button', { name: /dashboard|home/i }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /Reflect/i }).first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${outDir}/04-composer.png` });
  check('reflection composer opens', /What happened\?/.test(await bodyText()));
} catch (err) {
  check('script completed without throwing', false, String(err?.message || err));
} finally {
  check('zero page/console errors', pageErrors.length === 0, pageErrors.join(' | '));
  await browser.close();
}

console.log(`\n${failures.length === 0 ? 'ALL PASS' : failures.length + ' FAILED: ' + failures.join(', ')}`);
process.exit(failures.length === 0 ? 0 : 1);
