import { test, expect } from '@playwright/test';
import { openFresh, skipOnboarding, setPacks } from './helpers';

test.describe('packs', () => {
  test('three optional packs, off by default, each a plain switch with no prices or trials', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await expect(page.getByText('ENABLED PACKS')).toHaveCount(0);
    await page.getByRole('button', { name: /Explore Optional Packs/ }).click();
    const switches = page.getByRole('switch');
    await expect(switches).toHaveCount(3);
    for (const name of ['Wellbeing Tools', 'AI Reflection Coach', 'Analytics & Reports']) {
      await expect(page.getByRole('switch', { name })).toHaveAttribute('aria-checked', 'false');
    }
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/£|trial|subscri|Lifetime|Enterprise|Scenario|Holodeck|Professional|CPD|NMC/i);
  });

  test('switching a pack on adds its tiles to the dashboard; switching it off removes them', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await page.getByRole('button', { name: /Explore Optional Packs/ }).click();
    await page.getByRole('switch', { name: 'Wellbeing Tools' }).click();
    await expect(page.getByRole('switch', { name: 'Wellbeing Tools' })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('button', { name: 'Go back' }).click();
    await expect(page.getByRole('button', { name: /BioRhythm/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Grounding/ })).toBeVisible();

    await page.getByRole('button', { name: /Explore Optional Packs/ }).click();
    await page.getByRole('switch', { name: 'Wellbeing Tools' }).click();
    await page.getByRole('button', { name: 'Go back' }).click();
    await expect(page.getByRole('button', { name: /BioRhythm/ })).toHaveCount(0);
  });

  test('stale professional and scenario keys are inert, and Spaces needs no pack', async ({ page }) => {
    await openFresh(page);
    await setPacks(page, {
      professional: { enabled: true, isPermanent: true },
      scenario: { enabled: false, isPermanent: false },
      wellbeing: { enabled: true, isPermanent: true },
    });
    await skipOnboarding(page);
    await expect(page.getByRole('button', { name: /BioRhythm/ })).toBeVisible();
    await expect(page.getByText(/CPD|Professional Development/)).toHaveCount(0);
    await page.getByRole('button', { name: 'Spaces', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Spaces' })).toBeVisible();
  });
});
