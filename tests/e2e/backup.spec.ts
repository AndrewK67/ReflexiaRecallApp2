import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs/promises';
import { openFresh, skipOnboarding, quickCapture, goHome, captureBackup, rawEntryRecords, dashboardCount } from './helpers';

test.describe('backup and restore', () => {
  // Would have caught the saveAllEntries transaction bug at the UI (PHASE-0-SCOPE §0.1).
  test('export, save another entry, restore: the backup contents come back intact', async ({ page }, testInfo) => {
    await openFresh(page);
    await skipOnboarding(page);
    await quickCapture(page, 'entry one');
    await quickCapture(page, 'entry two');

    await page.getByRole('button', { name: 'View profile and settings' }).click();
    const backupText = await captureBackup(page);
    const backup = JSON.parse(backupText);
    expect(backup.version).toBe(1);
    expect(backup.entries).toHaveLength(2);
    expect(backupText).toContain('entry one'); // the backup itself is plaintext JSON

    await goHome(page);
    await quickCapture(page, 'entry three, saved after the backup');
    expect(await dashboardCount(page)).toBe(3);

    await fs.mkdir(testInfo.outputDir, { recursive: true });
    const file = path.join(testInfo.outputDir, 'backup.json');
    await fs.writeFile(file, backupText);
    await page.getByRole('button', { name: 'View profile and settings' }).click();
    await page.locator('input[type=file]').setInputFiles(file);
    // importBackup() then window.location.reload(); the restored profile is onboarded, so we land on the dashboard
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();

    expect(await dashboardCount(page)).toBe(2);
    expect(await rawEntryRecords(page)).toHaveLength(2);
    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await expect(page.getByText(/2 of 2 entries/)).toBeVisible();
  });
});
