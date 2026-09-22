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

  // Bug B1 (docs/PHASE-1-SCOPE.md §1.2). Fixed in phase 1B.2; these two flip when it lands.
  test('a returning user lands on the dashboard, not onboarding', async ({ page }) => {
    test.fail(true, 'B1: AppContext starts on ONBOARDING for everyone');
    await openFresh(page);
    await completeOnboarding(page, 'Smoke');
    await page.reload();
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible({ timeout: 5_000 });
  });

  test('Skip never overwrites an existing name', async ({ page }) => {
    test.fail(true, 'B1: handleSkip writes name || "User"');
    await openFresh(page);
    await completeOnboarding(page, 'Smoke');
    await page.reload();
    const skip = page.getByRole('button', { name: /Skip/ });
    if (await skip.count()) await skip.click();
    expect((await profile(page)).name).toBe('Smoke');
  });
});
