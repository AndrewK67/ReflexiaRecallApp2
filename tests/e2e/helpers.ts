import { expect, type Page } from '@playwright/test';

/** A brand-new visitor: fresh origin storage, first screen is onboarding. */
export async function openFresh(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome to Reflexia' })).toBeVisible();
}

/** Get past onboarding without giving a name (no-op if already on the dashboard). */
export async function skipOnboarding(page: Page) {
  const start = page.getByRole('button', { name: 'Start', exact: true });
  if (await start.count()) await start.click();
  await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
}

/** Complete onboarding with a name. */
export async function completeOnboarding(page: Page, name: string) {
  await page.getByLabel(/What should we call you/).fill(name);
  await expect(page.locator('select')).toHaveCount(0); // the profession picker left in phase 1B
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
}

export async function goHome(page: Page) {
  await page.getByRole('button', { name: 'Go to dashboard' }).click();
  await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
}

/** Dashboard → Capture → type → Save → back on the dashboard. */
export async function quickCapture(page: Page, text: string) {
  await page.getByRole('button', { name: /Capture$/ }).first().click();
  await page.getByPlaceholder(/Describe what happened/).fill(text);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
}

export function profile(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('reflexia.profile.v1') || 'null'));
}

export function rawEntryRecords(page: Page): Promise<Array<Record<string, unknown>>> {
  return page.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('reflexia-entries');
    req.onerror = () => resolve([]);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('entries')) { resolve([]); return; }
      const all = db.transaction('entries').objectStore('entries').getAll();
      all.onsuccess = () => resolve(all.result);
      all.onerror = () => resolve([]);
    };
  }));
}

/** How many entries are stored (the dashboard no longer shows a count, phase 3B.2). */
export async function entryCount(page: Page): Promise<number> {
  return (await rawEntryRecords(page)).length;
}

/** Turn packs on by writing the stored state the app reads at boot, then reload. */
export async function setPacks(page: Page, state: Record<string, { enabled: boolean; isPermanent: boolean }>) {
  await page.evaluate((s) => localStorage.setItem('reflexia.packs.v2', JSON.stringify({ core: { enabled: true, isPermanent: true }, ...s })), state);
  await page.reload();
  // Wait for the app to get past its loading screen; skipOnboarding() counts the
  // Start button without waiting, so calling it during the loading screen misses.
  await expect(page.getByRole('button', { name: /^Start$|Capture$/ }).first()).toBeVisible();
}

/**
 * Capture what Profile → Export would download, without the browser download
 * pipeline: stub the anchor click and read the blob before the app revokes it.
 */
export async function captureBackup(page: Page): Promise<string> {
  await page.evaluate(() => {
    const w = window as unknown as { __backup?: string };
    w.__backup = undefined;
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      if (this.download) fetch(this.href).then((r) => r.text()).then((t) => { w.__backup = t; });
      else orig.call(this);
    };
  });
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __backup?: string }).__backup)).toBeTruthy();
  return page.evaluate(() => (window as unknown as { __backup: string }).__backup);
}
