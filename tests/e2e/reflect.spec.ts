import { test, expect } from '@playwright/test';
import { openFresh, skipOnboarding, goHome, rawEntryRecords, dashboardCount } from './helpers';

/** The one text box on a step; its placeholder changes with the step. */
const writeBox = (page: import('@playwright/test').Page) => page.locator('textarea');
const NEXT = /Next Stage|^Complete/; // the last step's button reads "Complete"

test.describe('reflection composer', () => {
  test('Three-Part is the default: three questions, save, listed under its name', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await page.getByRole('button', { name: /Reflect$/ }).first().click();
    await expect(page.getByText(/Three-Part/)).toBeVisible();
    await expect(page.getByText(/Step 1 of 3/)).toBeVisible();
    await expect(page.getByText('What happened?')).toBeVisible();

    const answers = ['A hard conversation at work.', 'How quickly it turned defensive.', 'Ask one question before I answer next time.'];
    for (const a of answers) {
      await writeBox(page).fill(a);
      await page.getByRole('button', { name: NEXT }).click();
    }
    await expect(page.getByRole('heading', { name: 'Complete' })).toBeVisible();
    await page.getByRole('button', { name: /Save Reflection/ }).click();
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();

    expect(await dashboardCount(page)).toBe(1);
    expect(await rawEntryRecords(page)).toHaveLength(1);
    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await expect(page.getByText(/1 of 1 entries/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Three-Part' })).toBeVisible();
    // the stored id never shows on screen
    await expect(page.getByText('SIMPLE', { exact: true })).toHaveCount(0);

    // and the entry opens with the stage labels, not the answer keys
    await page.getByRole('heading', { name: 'Three-Part' }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toContainText('Reflection • Three-Part');
    await expect(modal).toContainText('What stood out or mattered?');
    await expect(modal).not.toContainText('what_mattered');
  });

  test('Just write: one open field, no step counter, saved as Open Entry', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await page.getByRole('button', { name: /Reflect$/ }).first().click();
    await page.getByRole('button', { name: 'Just write' }).click();

    await expect(page.getByText('Open Entry')).toBeVisible();
    await expect(page.getByText(/Step 1 of/)).toHaveCount(0);
    await page.getByPlaceholder(/Just start/).fill('No structure tonight, just getting it down.');
    await page.getByRole('button', { name: /^Complete/ }).click();
    await expect(page.getByRole('heading', { name: 'Complete' })).toBeVisible();
    await page.getByRole('button', { name: /Save Reflection/ }).click();
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();

    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await expect(page.getByRole('heading', { name: 'Open Entry' })).toBeVisible();
  });

  test('Use a framework: the catalogue offers Gibbs among others, never SBAR or SOAP, and Gibbs saves', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await page.getByRole('button', { name: /Reflect$/ }).first().click();
    await page.getByRole('button', { name: /Use a framework/ }).click();

    await expect(page.getByRole('heading', { name: 'Choose a framework' })).toBeVisible();
    for (const name of [/Gibbs/, /What\? So what\? Now what\?/, /Experience, Reflection, Action/, /STAR/, /Morning Check-in/, /Evening Review/]) {
      await expect(page.getByRole('button', { name })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /SBAR|SOAP/ })).toHaveCount(0);
    await expect(page.getByText('Graham Gibbs, 1988')).toBeVisible();

    await page.getByRole('button', { name: /Gibbs/ }).click();
    await expect(page.getByText(/Gibbs/)).toBeVisible();
    await expect(page.getByText(/Step 1 of 6/)).toBeVisible();

    // fill the first step and skip the rest (every step is optional)
    await writeBox(page).fill('What happened, briefly.');
    for (let i = 0; i < 6; i++) {
      await page.getByRole('button', { name: NEXT }).click();
    }
    await expect(page.getByRole('heading', { name: 'Complete' })).toBeVisible();
    await page.getByRole('button', { name: /Save Reflection/ }).click();
    await goHome(page).catch(() => {});
    expect(await rawEntryRecords(page)).toHaveLength(1);

    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await expect(page.getByRole('heading', { name: /Gibbs/ })).toBeVisible();
    await expect(page.getByText('GIBBS', { exact: true })).toHaveCount(0);
  });

  test('offline Coach gives the stage its own tip', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await page.getByRole('button', { name: /Reflect$/ }).first().click();
    await page.getByRole('button', { name: /^Coach/ }).click();
    await expect(page.getByText(/Start with the plain facts/)).toBeVisible();
    await page.getByRole('button', { name: NEXT }).click();
    await page.getByRole('button', { name: /^Coach/ }).click();
    await expect(page.getByText(/the one moment you keep coming back to/)).toBeVisible();
  });

  test('text typed on the first question survives switching to Just write', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await page.getByRole('button', { name: /Reflect$/ }).first().click();
    await writeBox(page).fill('Started under three questions.');
    await page.getByRole('button', { name: 'Just write' }).click();
    await expect(page.getByPlaceholder(/Just start/)).toHaveValue('Started under three questions.');
  });

  test('a legacy SBAR entry from an older build still opens with readable labels', async ({ page }) => {
    // Seed the pre-IndexedDB storage the app migrates on launch: a saved
    // profile past onboarding and one entry written by the old professional
    // composer, whose framework no longer ships in the core.
    await openFresh(page); // wait for the app to be up before touching its storage
    await page.evaluate(() => {
      // The first launch above already ran the (empty) migration and set its
      // flag; an old build never had the flag, so clear it to model one.
      localStorage.removeItem('reflexia.entries.idb_migrated');
      localStorage.setItem('reflexia.profile.v1', JSON.stringify({ name: 'Sam', profession: 'NURSING', isOnboarded: true, aiEnabled: false }));
      localStorage.setItem('reflexia.entries.v1', JSON.stringify([{
        id: 'reflection_1700000000000',
        type: 'REFLECTION',
        date: '2025-11-14T21:20:00.000Z',
        modelId: 'SBAR',
        model: 'SBAR',
        answers: { SBAR_Situation: 'Handover was rushed.', SBAR_Recommendation: 'Use the checklist.' },
        createdAt: 1700000000000,
      }]));
    });
    await page.reload();
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
    await expect.poll(async () => (await rawEntryRecords(page)).length).toBe(1);

    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await expect(page.getByRole('heading', { name: 'SBAR' })).toBeVisible();
    await page.getByRole('heading', { name: 'SBAR' }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toContainText('Reflection • SBAR');
    await expect(modal).toContainText('Situation');
    await expect(modal).toContainText('Handover was rushed.');
    await expect(modal).toContainText('Recommendation');
    await expect(modal).not.toContainText('SBAR_Situation');
  });
});
