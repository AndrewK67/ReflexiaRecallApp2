import { test, expect } from '@playwright/test';
import { openFresh, skipOnboarding, setPacks } from './helpers';

test.describe('packs', () => {
  test('optional packs are off by default and the browser lists exactly four', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await expect(page.getByText('ENABLED PACKS')).toHaveCount(0);
    await page.getByRole('button', { name: /Explore Optional Packs/ }).click();
    for (const name of ['Wellbeing Tools', 'AI Reflection Coach', 'Scenario Practice', 'Analytics & Reports']) {
      await expect(page.getByText(name)).toBeVisible();
    }
    await expect(page.getByText(/Professional|CPD|NMC/)).toHaveCount(0);
  });

  test('enabling a pack adds its tiles; disabling removes them', async ({ page }) => {
    await openFresh(page);
    await setPacks(page, { wellbeing: { enabled: true, isPermanent: true }, scenario: { enabled: true, isPermanent: true } });
    await skipOnboarding(page);
    await expect(page.getByRole('button', { name: /BioRhythm/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Holodeck/ })).toBeVisible();
    await page.getByRole('button', { name: /Holodeck/ }).click();
    await expect(page.getByRole('heading', { name: 'Holodeck' })).toBeVisible();

    await setPacks(page, {});
    await skipOnboarding(page);
    await expect(page.getByRole('button', { name: /BioRhythm/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Holodeck/ })).toHaveCount(0);
  });

  test('a stale professional key in stored state is inert (phase 1A)', async ({ page }) => {
    await openFresh(page);
    await setPacks(page, { professional: { enabled: true, isPermanent: true }, wellbeing: { enabled: true, isPermanent: true } });
    await skipOnboarding(page);
    await expect(page.getByRole('button', { name: /BioRhythm/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^CPD$/ })).toHaveCount(0);
    await expect(page.getByText(/CPD|Professional Development/)).toHaveCount(0);
  });
});
