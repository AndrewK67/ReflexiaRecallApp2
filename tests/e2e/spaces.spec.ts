import { test, expect } from '@playwright/test';
import { openFresh, skipOnboarding, rawEntryRecords } from './helpers';

// Spaces are one of the four doors on the dashboard since phase 3B.2 (the
// view id inside the code is still HOLODECK; nobody sees that name).

test.describe('spaces', () => {
  test('a finished space is an encrypted entry that opens with its questions as labels', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await page.getByRole('button', { name: 'Spaces', exact: true }).click();
    await page.getByRole('button', { name: /Difficult Conversation/ }).click();

    await expect(page.getByText(/Difficult Conversation/)).toBeVisible();
    await expect(page.getByText(/Step 1 of 5/)).toBeVisible();
    await expect(page.getByText('Who do you need to speak with?')).toBeVisible();
    // a space is not a framework you swap out of
    await expect(page.getByRole('button', { name: 'Just write' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Use a framework/ })).toHaveCount(0);

    await page.locator('textarea').fill('My manager, about the rota.');
    await page.getByRole('button', { name: /^Coach/ }).click();
    await expect(page.getByText(/Your guide here reflects phrasing/)).toBeVisible();
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: /Next Stage|^Complete/ }).click();
    }
    await expect(page.getByRole('heading', { name: 'Complete' })).toBeVisible();
    await page.getByRole('button', { name: /Save Reflection/ }).click();
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();

    // encrypted, and nowhere in plaintext
    const raw = await rawEntryRecords(page);
    expect(raw).toHaveLength(1);
    expect(JSON.stringify(raw)).not.toContain('rota');
    expect(await page.evaluate(() => localStorage.getItem('holodeckEntries'))).toBeNull();

    // in Archive under the space's name, opening with the question as the label
    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await page.getByRole('heading', { name: 'Difficult Conversation' }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toContainText('Reflection • Difficult Conversation');
    await expect(modal).toContainText('Who do you need to speak with?');
    await expect(modal).toContainText('My manager, about the rota.');
    await expect(modal).not.toContainText('SPACE_DIFFICULT_CONVERSATION');
  });

  test('a gentle space says you can leave, and Back returns to the hub', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await page.getByRole('button', { name: 'Spaces', exact: true }).click();
    await page.getByRole('button', { name: /Crisis Rewind/ }).click();
    await expect(page.getByText(/Gentle space/)).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'Spaces' })).toBeVisible();
    expect(await rawEntryRecords(page)).toHaveLength(0);
  });

  test('spaces finished in an older build migrate into the archive on launch', async ({ page }) => {
    await openFresh(page);
    await page.evaluate(() => {
      localStorage.setItem('reflexia.profile.v1', JSON.stringify({ name: 'Sam', isOnboarded: true }));
      localStorage.setItem('holodeckEntries', JSON.stringify([{
        id: 'holodeck_1700000000000',
        spaceId: 'gratitude-space',
        spaceName: 'Gratitude Space',
        date: '2025-11-20T18:00:00.000Z',
        answers: ['The quiet before everyone woke up', '', 'Coffee, honestly', '', ''],
        prompts: [],
        completed: true,
        createdAt: 1700000000000,
      }]));
    });
    await page.reload();
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('holodeckEntries'))).toBeNull();
    await expect.poll(async () => (await rawEntryRecords(page)).length).toBe(1);

    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await page.getByRole('heading', { name: 'Gratitude Space' }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toContainText('The quiet before everyone woke up');
    await expect(modal).toContainText('Coffee, honestly');
  });
});
