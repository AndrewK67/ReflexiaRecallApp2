import { test, expect, type Page } from '@playwright/test';
import { openFresh, rawEntryRecords } from './helpers';

/**
 * Phase 3B.6: CLAUDE.md open question 3 - what does someone with no
 * background do in their first ninety seconds? This walks that person
 * through every door on a phone-sized screen, counting taps, checking that
 * nothing on the way uses professional vocabulary or promises what the app
 * cannot do, and that every screen has a way back to the dashboard.
 */

const FORBIDDEN = /incident|severity|NMC|CPD|revalidation|clinical|Holodeck|Inner Simulation|video|PDF|ZIP|trial|subscri|£/i;

async function screenText(page: Page): Promise<string> {
  return page.locator('main').innerText();
}

async function expectClean(page: Page, where: string) {
  const text = await screenText(page);
  const hit = text.match(FORBIDDEN);
  expect(hit?.[0], `"${hit?.[0]}" on ${where}`).toBeUndefined();
}

async function backToDashboard(page: Page, via: string) {
  await page.getByRole('button', { name: via, exact: true }).first().click();
  await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
}

test.describe('the first ninety seconds', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('a new person can capture, reflect, use a space and find it all again, with a way back from every screen', async ({ page }) => {
    let taps = 0;
    const tap = async (name: string | RegExp, opts: { exact?: boolean } = {}) => {
      taps++;
      await page.getByRole('button', { name, ...opts }).first().click();
    };

    // 0 s: the welcome screen
    await openFresh(page);
    await expectClean(page, 'the welcome screen');
    await tap('Start', { exact: true });
    await expect(page.getByText('Try capturing one thing. It can be a sentence.')).toBeVisible();
    await expectClean(page, 'the empty dashboard');

    // Capture: three taps from launch to a saved note (Start, Capture, Save)
    await tap(/Capture$/);
    await expectClean(page, 'Quick Capture');
    await page.getByPlaceholder(/Describe what happened/).fill('Missed the bus, walked instead. Nicer than expected.');
    await tap('Save', { exact: true });
    await expect(page.getByText('Last written today')).toBeVisible();
    expect(taps).toBe(3);
    expect(await rawEntryRecords(page)).toHaveLength(1);

    // Reflect: three questions
    await tap('Reflect', { exact: true });
    await expect(page.getByText(/Three-Part/)).toBeVisible();
    await expectClean(page, 'the composer');
    for (const answer of ['The walk home.', 'How quiet the canal was.', 'Walk more often.']) {
      await page.locator('textarea').fill(answer);
      await tap(/Next Stage|^Complete/);
    }
    await tap(/Save Reflection/);
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();

    // Spaces: straight from the dashboard, no pack to enable
    await tap('Spaces', { exact: true });
    await expect(page.getByRole('heading', { name: 'Spaces' })).toBeVisible();
    await expectClean(page, 'the Spaces hub');
    await tap(/Gratitude/);
    await expectClean(page, 'a space');
    await page.locator('textarea').fill('The bus being late, oddly.');
    for (let i = 0; i < 5; i++) await tap(/Next Stage|^Complete/);
    await tap(/Save Reflection/);
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();

    // Archive: all three, under their own names
    await tap('Archive', { exact: true });
    await expect(page.getByText(/3 of 3 entries/)).toBeVisible();
    await expectClean(page, 'the Archive');
    await expect(page.getByRole('heading', { name: 'Capture' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Three-Part' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Gratitude/ })).toBeVisible();
    await page.getByPlaceholder('Search entries...').fill('canal');
    await expect(page.getByText(/1 of 3 entries/)).toBeVisible();

    expect(await rawEntryRecords(page)).toHaveLength(3);
    // a generous ceiling: typing aside, the whole tour is about thirty taps
    expect(taps).toBeLessThanOrEqual(30);
  });

  test('every screen reachable from the dashboard has a way back', async ({ page }) => {
    await openFresh(page);
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    const doors: Array<[string, string]> = [
      ['📸 Capture', 'Go back'],               // Quick Capture's ×
      ['Reflect', 'Back'],                     // the composer's back arrow on step 1
      ['Spaces', 'Back to dashboard'],         // the hub's back arrow
      ['Archive', 'Go to dashboard'],          // the tab bar
      ['✨ Explore Optional Packs', 'Go back'], // the pack browser's back arrow
    ];
    for (const [door, back] of doors) {
      await page.getByRole('button', { name: door, exact: true }).click();
      await expectClean(page, door);
      await backToDashboard(page, back);
    }
    await page.getByRole('button', { name: 'View profile and settings' }).click();
    await backToDashboard(page, 'Go to dashboard');
  });
});
