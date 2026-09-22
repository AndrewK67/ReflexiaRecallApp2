import { test, expect } from '@playwright/test';
import { openFresh, skipOnboarding, goHome, rawEntryRecords, dashboardCount } from './helpers';

test.describe('reflection composer', () => {
  test('simple mode: three stages, save, listed as a reflection', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await page.getByRole('button', { name: /Reflect$/ }).first().click();
    await expect(page.getByText(/Simple Mode/i)).toBeVisible();

    const answers = ['A hard conversation at work.', 'How quickly it turned defensive.', 'Ask one question before I answer next time.'];
    for (const a of answers) {
      await page.getByPlaceholder(/Write your thoughts here/).fill(a);
      // the last stage's button reads "Complete" instead of "Next Stage"
      await page.getByRole('button', { name: /Next Stage|^Complete/ }).click();
    }
    await expect(page.getByRole('heading', { name: 'Complete' })).toBeVisible();
    await page.getByRole('button', { name: /Save Reflection/ }).click();
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();

    expect(await dashboardCount(page)).toBe(1);
    expect(await rawEntryRecords(page)).toHaveLength(1);
    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await expect(page.getByText(/1 of 1 entries/)).toBeVisible();
    await expect(page.getByText('SIMPLE', { exact: true })).toBeVisible();
  });

  test('advanced mode lists frameworks and can save one', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await page.getByRole('button', { name: /Reflect$/ }).first().click();
    await page.getByRole('button', { name: /Switch to Advanced Models/ }).click();
    await expect(page.getByRole('button', { name: /Gibbs/ })).toBeVisible();
    await page.getByRole('button', { name: /Gibbs/ }).click();

    // Gibbs has six stages; fill the first and skip the rest (stages are optional)
    await page.getByPlaceholder(/Write your thoughts here|Describe/).first().fill('What happened, briefly.');
    for (let i = 0; i < 6; i++) {
      await page.getByRole('button', { name: /Next Stage|^Complete/ }).click();
    }
    await expect(page.getByRole('heading', { name: 'Complete' })).toBeVisible();
    await page.getByRole('button', { name: /Save Reflection/ }).click();
    await goHome(page).catch(() => {});
    expect(await rawEntryRecords(page)).toHaveLength(1);
  });
});
