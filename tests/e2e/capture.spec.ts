import { test, expect } from '@playwright/test';
import { openFresh, skipOnboarding, quickCapture, rawEntryRecords, dashboardCount } from './helpers';

test.describe('quick capture', () => {
  test('saves an entry encrypted in IndexedDB, and it survives a reload', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await quickCapture(page, 'Smoke test entry - saved from Playwright.');
    expect(await dashboardCount(page)).toBe(1);

    const raw = await rawEntryRecords(page);
    expect(raw).toHaveLength(1);
    expect(Object.keys(raw[0]).sort()).toEqual(['_encrypted', 'id']);
    expect(JSON.stringify(raw)).not.toContain('Smoke test entry');

    await page.reload();
    expect(await rawEntryRecords(page)).toHaveLength(1);
  });

  test('the saved entry is listed in Archive', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await quickCapture(page, 'Something worth keeping.');
    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await expect(page.getByText(/1 of 1 entries/)).toBeVisible();
  });
});
