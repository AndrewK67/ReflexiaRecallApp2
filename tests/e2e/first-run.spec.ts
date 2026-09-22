import { test, expect } from '@playwright/test';
import { openFresh, completeOnboarding, profile } from './helpers';

test.describe('first run', () => {
  test('a new visitor sees onboarding, and completing it writes the profile and shows the dashboard', async ({ page }) => {
    await openFresh(page);
    await completeOnboarding(page, 'Smoke');
    await expect(page.getByRole('heading', { name: /Smoke/ })).toBeVisible();
    expect(await profile(page)).toMatchObject({ name: 'Smoke', isOnboarded: true });
  });

  test('no professional vocabulary is visible during onboarding', async ({ page }) => {
    await openFresh(page);
    for (let i = 0; i < 3; i++) {
      const text = await page.locator('body').innerText();
      expect(text).not.toMatch(/\bNMC\b|\bCPD\b|revalidation|regulator/i);
      const next = page.getByRole('button', { name: /^Next/ });
      if (await next.count()) await next.click();
    }
  });

  // Regression for bug B1 (docs/PHASE-1-SCOPE.md §1.2), fixed in phase 1B.2.
  test('a returning user lands on the dashboard, not onboarding', async ({ page }) => {
    await openFresh(page);
    await completeOnboarding(page, 'Smoke');
    await page.reload();
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible({ timeout: 5_000 });
  });

  test('Skip never overwrites an existing name (return to onboarding from Profile, then skip)', async ({ page }) => {
    await openFresh(page);
    await completeOnboarding(page, 'Smoke');
    // The only way back into onboarding now is the profile screen's button.
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'View profile and settings' }).click();
    await page.getByRole('button', { name: /Return to Onboarding/ }).click();
    await expect(page.getByRole('heading', { name: 'Capture Anything' })).toBeVisible();
    await page.getByRole('button', { name: /Skip/ }).click();
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
    expect((await profile(page)).name).toBe('Smoke');
    await expect(page.getByRole('heading', { name: /Smoke/ })).toBeVisible();
  });

  test('a first-time user who skips is not given a profession or a placeholder name', async ({ page }) => {
    await openFresh(page);
    await page.getByRole('button', { name: /Skip/ }).click();
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
    const p = await profile(page);
    expect(p.isOnboarded).toBe(true);
    expect(p.name).toBe('');
    expect(p.profession).toBe('NONE');
    await expect(page.getByRole('heading', { name: /friend/ })).toBeVisible();
  });
});
