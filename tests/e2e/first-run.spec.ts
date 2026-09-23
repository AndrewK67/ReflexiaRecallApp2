import { test, expect } from '@playwright/test';
import { openFresh, completeOnboarding, skipOnboarding, quickCapture, profile } from './helpers';

test.describe('first run', () => {
  test('a new visitor sees one welcome screen; giving a name writes the profile and greets them', async ({ page }) => {
    await openFresh(page);
    await completeOnboarding(page, 'Smoke');
    await expect(page.getByRole('heading', { name: /Smoke/ })).toBeVisible();
    expect(await profile(page)).toMatchObject({ name: 'Smoke', isOnboarded: true });
  });

  // Phase 3B.1: the old slides promised video, "advanced models" and PDF/ZIP
  // export, none of which exist. Every sentence on this screen must be true.
  test('the welcome screen promises nothing the app cannot do', async ({ page }) => {
    await openFresh(page);
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/video|PDF|ZIP|advanced models?|export/i);
    expect(text).not.toMatch(/\bNMC\b|\bCPD\b|revalidation|regulator|profession/i);
    // what it does say, each of which the build does
    expect(text).toMatch(/photo or a\s+voice note/);
    expect(text).toMatch(/Three short questions/);
    expect(text).toMatch(/difficult conversation, a\s+decision, a loss/);
    expect(text).toMatch(/nothing is uploaded\s+unless you choose to turn on AI/);
    expect(text).toMatch(/not a substitute for advice/);
    // one screen: no Next, no Skip, one Start
    await expect(page.getByRole('button', { name: /^Next/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Skip/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Start', exact: true })).toHaveCount(1);
  });

  // Regression for bug B1 (docs/PHASE-1-SCOPE.md §1.2), fixed in phase 1B.2.
  test('a returning user lands on the dashboard, not onboarding', async ({ page }) => {
    await openFresh(page);
    await completeOnboarding(page, 'Smoke');
    await page.reload();
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible({ timeout: 5_000 });
  });

  test('going back to the welcome screen shows your name, and clearing the field never erases it', async ({ page }) => {
    await openFresh(page);
    await completeOnboarding(page, 'Smoke');
    await page.getByRole('button', { name: 'View profile and settings' }).click();
    await page.getByRole('button', { name: 'Show the welcome screen again' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Show it' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to Reflexia' })).toBeVisible();
    const field = page.getByLabel(/What should we call you/);
    await expect(field).toHaveValue('Smoke');
    await field.fill('');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
    expect((await profile(page)).name).toBe('Smoke');
    await expect(page.getByRole('heading', { name: /Smoke/ })).toBeVisible();
  });

  test('someone who gives no name is greeted without a placeholder and has no profession', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    const p = await profile(page);
    expect(p.isOnboarded).toBe(true);
    expect(p.name).toBe('');
    expect(p.profession).toBe('NONE');
    await expect(page.getByRole('heading', { name: /^Good (morning|afternoon|evening)\.$/ })).toBeVisible();
    await expect(page.getByText(/friend/)).toHaveCount(0);
  });

  test('the dashboard has four doors, each saying what it is for, and says when you last wrote', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
    for (const [name, hint] of [
      ['Reflect', /Three short questions/],
      ['Spaces', /hard conversation, a decision, a loss/],
      ['Archive', /Everything you have written/],
    ] as const) {
      const door = page.getByRole('button', { name, exact: true });
      await expect(door).toBeVisible();
      await expect(door).toHaveAccessibleDescription(hint);
    }
    await expect(page.getByText('Try capturing one thing. It can be a sentence.')).toBeVisible();
    await expect(page.getByText(/REFLECTIONS/i)).toHaveCount(0);

    await quickCapture(page, 'first thing');
    await expect(page.getByText('Last written today')).toBeVisible();
    await expect(page.getByText('Try capturing one thing')).toHaveCount(0);
  });
});
