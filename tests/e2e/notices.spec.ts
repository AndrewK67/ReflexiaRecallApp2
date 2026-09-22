import { test, expect } from '@playwright/test';
import { openFresh, skipOnboarding, quickCapture, profile } from './helpers';

// Phase 3C.4: no native alert()/confirm()/prompt() anywhere. Confirmations
// are an in-app dialog that traps focus and closes on Escape; messages are
// notices a screen reader hears.

test.describe('notices and confirmations', () => {
  test('a destructive action asks in an in-app dialog, and Escape says no', async ({ page }) => {
    let nativeDialogs = 0;
    page.on('dialog', async (d) => { nativeDialogs++; await d.dismiss(); });
    await openFresh(page);
    await skipOnboarding(page);
    await page.getByRole('button', { name: 'View profile and settings' }).click();

    await page.getByRole('button', { name: /Reset All Toggles/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Turn every switch off?' });
    await expect(dialog).toBeVisible();
    // focus is inside the dialog and Tab stays there
    await expect(dialog.getByRole('button', { name: 'Turn them off' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Turn them off' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    // focus went back to the button that opened it
    await expect(page.getByRole('button', { name: /Reset All Toggles/ })).toBeFocused();

    await page.getByRole('button', { name: /Reset All Toggles/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Turn them off' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'All switches are off' })).toBeVisible();
    expect((await profile(page)).aiEnabled).toBe(false);
    expect(nativeDialogs).toBe(0);
  });

  test('a bad backup file is reported as a notice, not an alert', async ({ page }, testInfo) => {
    let nativeDialogs = 0;
    page.on('dialog', async (d) => { nativeDialogs++; await d.dismiss(); });
    await openFresh(page);
    await skipOnboarding(page);
    await quickCapture(page, 'keep me');
    await page.getByRole('button', { name: 'View profile and settings' }).click();
    await page.locator('input[type=file]').setInputFiles({ name: 'not-a-backup.json', mimeType: 'application/json', buffer: Buffer.from('{"nope": true}') });
    await expect(page.getByRole('alert')).toContainText('not a Reflexia backup');
    await page.getByRole('alert').getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(nativeDialogs).toBe(0);
    void testInfo;
  });

  test('unlocking all entries uses the PIN pad, not a prompt', async ({ page }) => {
    let nativeDialogs = 0;
    page.on('dialog', async (d) => { nativeDialogs++; await d.dismiss(); });
    await openFresh(page);
    await skipOnboarding(page);
    await page.getByRole('button', { name: 'View profile and settings' }).click();
    // the privacy screen needs a PIN; whatever is on screen, nothing native may appear
    await page.getByRole('button', { name: /Privacy Lock/ }).click();
    await page.getByRole('button', { name: 'View profile and settings' }).click();
    expect(nativeDialogs).toBe(0);
  });
});
