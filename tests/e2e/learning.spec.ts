import { test, expect, type Page } from '@playwright/test';
import { openFresh, skipOnboarding, quickCapture, goHome, captureBackup } from './helpers';

// Phase 3D.3: "What you've tried" and the one dashboard suggestion.

const SCORING = /\bXP\b|\blevels?\b|\bstreaks?\b|\bpoints\b|achievement|trophy|unlocked/i;

async function openProfile(page: Page) {
  await page.getByRole('button', { name: 'View profile and settings' }).click();
  await expect(page.getByRole('heading', { name: "What you've tried" })).toBeVisible();
}

function track(page: Page, label: string) {
  return page.getByRole('region', { name: "What you've tried" }).getByRole('listitem').filter({ hasText: label });
}

test.describe("what you've tried", () => {
  test('a fresh profile: nothing ticked, each thing says where it is, no scores anywhere; Show me around goes there', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await expect(page.getByRole('note', { name: 'Suggestion' })).toHaveCount(0);

    await openProfile(page);
    const list = page.getByRole('region', { name: "What you've tried" });
    await expect(list.getByRole('listitem')).toHaveCount(11);
    await expect(list.getByText('Not yet:', { exact: false })).toHaveCount(11);
    await expect(track(page, 'Captured something')).toContainText('Dashboard → Capture');
    await expect(page.locator('main')).not.toContainText(SCORING);

    await page.getByRole('button', { name: 'Show me around' }).click();
    await expect(page.getByRole('heading', { name: "What you've tried" })).toBeFocused();
  });

  test('ticks come from doing the thing: a capture, a search that finds it, a backup', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await quickCapture(page, 'Walked by the canal and felt calmer');

    // visiting Archive is not searching
    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await goHome(page);
    await openProfile(page);
    await expect(track(page, 'Captured something')).toContainText('Done:');
    await expect(track(page, 'Captured something')).not.toContainText('Dashboard → Capture');
    await expect(track(page, 'Found an entry again')).toContainText('Not yet:');

    // a search that finds nothing is not finding something again
    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await page.getByPlaceholder('Search entries...').fill('nothing like this');
    await expect(page.getByText(/0 of 1 entries/)).toBeVisible();
    await goHome(page);
    await openProfile(page);
    await expect(track(page, 'Found an entry again')).toContainText('Not yet:');

    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await page.getByPlaceholder('Search entries...').fill('canal');
    await expect(page.getByText(/1 of 1 entries/)).toBeVisible();
    await goHome(page);
    await openProfile(page);
    await expect(track(page, 'Found an entry again')).toContainText('Done:');

    await expect(track(page, 'Saved a backup file')).toContainText('Not yet:');
    await captureBackup(page);
    await goHome(page);
    await openProfile(page);
    await expect(track(page, 'Saved a backup file')).toContainText('Done:');
  });
});

test.describe('the dashboard suggestion', () => {
  test('none until three entries; then one line, never in the composer; put away, it stays away', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    const note = page.getByRole('note', { name: 'Suggestion' });

    await quickCapture(page, 'One');
    await quickCapture(page, 'Two');
    await expect(note).toHaveCount(0);
    await quickCapture(page, 'Three');
    await expect(note).toHaveCount(1);
    await expect(note).toContainText('Reflect asks three short questions');
    await expect(note).not.toContainText(SCORING);

    // its button goes there, and the composer shows no suggestion
    await note.getByRole('button', { name: 'Reflect' }).click();
    await expect(page.getByText(/Three-Part/)).toBeVisible();
    await expect(page.getByRole('note', { name: 'Suggestion' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Back', exact: true }).first().click();
    await expect(note).toBeVisible();

    await note.getByRole('button', { name: 'Hide this suggestion' }).click();
    await expect(note).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
    await expect(note).toHaveCount(0);

    // the next one waits three more entries, and is a different suggestion
    await quickCapture(page, 'Four');
    await quickCapture(page, 'Five');
    await expect(note).toHaveCount(0);
    await quickCapture(page, 'Six');
    await expect(note).toContainText('spaces for specific moments');
  });
});
