import { test, expect } from '@playwright/test';
import { openFresh, skipOnboarding, quickCapture } from './helpers';

// Headless Chromium rarely grants persistence, so these specs record the
// request rather than expect a grant, and drive the "granted" branch by
// stubbing the API before the app loads.

test.describe('storage durability', () => {
  test('the first save asks the browser to keep the data — once', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __persistCalls: number };
      w.__persistCalls = 0;
      const sm = navigator.storage;
      const original = sm.persist.bind(sm);
      sm.persist = async () => { w.__persistCalls += 1; return original(); };
    });
    await openFresh(page);
    await skipOnboarding(page);
    const calls = () => page.evaluate(() => (window as unknown as { __persistCalls: number }).__persistCalls);
    expect(await calls()).toBe(0);

    await quickCapture(page, 'first thing worth keeping');
    await expect.poll(calls).toBe(1);
    await quickCapture(page, 'second thing');
    await quickCapture(page, 'third thing');
    expect(await calls()).toBe(1);
    expect(await page.evaluate(() => localStorage.getItem('reflexia.storage.persist_requested'))).toBe('true');
  });

  test('Profile says the browser agreed when it did', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.storage.persist = async () => true;
      navigator.storage.persisted = async () => true;
    });
    await openFresh(page);
    await skipOnboarding(page);
    await quickCapture(page, 'kept');
    await page.getByRole('button', { name: 'View profile and settings' }).click();
    const section = page.getByRole('region', { name: 'Your data' });
    await expect(section).toContainText('Stored encrypted on this device. The browser has agreed to keep it.');
    await expect(section).toContainText('1 entry');
    await expect(section.getByRole('button', { name: /Ask the browser/ })).toHaveCount(0);
  });

  test('Profile says so, and offers to ask again, when the browser has not agreed', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.storage.persist = async () => false;
      navigator.storage.persisted = async () => false;
    });
    await openFresh(page);
    await skipOnboarding(page);
    await quickCapture(page, 'not yet kept');
    await page.getByRole('button', { name: 'View profile and settings' }).click();
    const section = page.getByRole('region', { name: 'Your data' });
    await expect(section).toContainText('has not promised to keep it');
    await expect(section).toContainText('Installing the app or exporting a backup');
    await expect(section.getByRole('button', { name: /Ask the browser to keep it/ })).toBeVisible();
    await expect(section.getByRole('button', { name: /Install the app/ })).toHaveCount(0);
  });

  test('the page carries the iOS home-screen icon and it exists', async ({ page, request }) => {
    // The web manifest is only injected in production builds; its icons are
    // checked against public/ in tests/unit/pwa.test.ts.
    await openFresh(page);
    const href = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
    expect(href).toBe('/icon-192.png');
    const res = await request.get(href!);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  });
});
