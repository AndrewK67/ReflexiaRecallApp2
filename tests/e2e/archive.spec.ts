import { test, expect } from '@playwright/test';
import { openFresh, skipOnboarding, quickCapture, goHome } from './helpers';

test.describe('archive', () => {
  test.beforeEach(async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await quickCapture(page, 'Walked by the canal and felt calmer');
    await quickCapture(page, 'The meeting with Priya went badly');
    await goHome(page).catch(() => {});
    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await expect(page.getByText(/2 of 2 entries/)).toBeVisible();
  });

  test('search finds entry text', async ({ page }) => {
    // the counter reads "<filtered> of <total> entries"
    await page.getByPlaceholder('Search entries...').fill('canal');
    await expect(page.getByText(/1 of 2 entries/)).toBeVisible();
    await page.getByPlaceholder('Search entries...').fill('nothing matches this');
    await expect(page.getByText(/0 of 2 entries/)).toBeVisible();
    await expect(page.getByText('No entries found')).toBeVisible();
  });

  test('the type filter narrows the list', async ({ page }) => {
    await page.getByRole('button', { name: /Filters/ }).click();
    await page.locator('select').first().selectOption('reflection');
    await expect(page.getByText(/0 of 2 entries/)).toBeVisible();
    await page.locator('select').first().selectOption('all');
    await expect(page.getByText(/2 of 2 entries/)).toBeVisible();
  });

  // KNOWN BUG (docs/PHASE-0-SCOPE.md §0.3): the CSV reads entry.title/content, which nothing writes.
  test('Export CSV includes the entry text', async ({ page }) => {
    test.fail(true, 'CSV exporter reads fields the app never writes');
    await page.evaluate(() => {
      const w = window as unknown as { __csv?: string };
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        if (this.download) fetch(this.href).then((r) => r.text()).then((t) => { w.__csv = t; });
      };
    });
    await page.getByRole('button', { name: /Export CSV/ }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __csv?: string }).__csv)).toBeTruthy();
    const csv = await page.evaluate(() => (window as unknown as { __csv: string }).__csv);
    expect(csv).toContain('canal');
  });
});
