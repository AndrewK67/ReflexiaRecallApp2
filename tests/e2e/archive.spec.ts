import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs/promises';
import { openFresh, skipOnboarding, quickCapture, goHome } from './helpers';

test.describe('archive', () => {
  test.beforeEach(async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await quickCapture(page, 'Walked by the canal and felt calmer');
    await quickCapture(page, 'The meeting with Priya went badly');
    await goHome(page).catch(() => {});
    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await expect(page.getByText(/2 of 2 entries/)).toBeVisible();
  });

  test('search finds entry text', async ({ page }) => {
    // the counter reads "<filtered> of <total> entries"
    await page.getByPlaceholder('Search entries...').fill('canal');
    await expect(page.getByText(/1 of 2 entries/)).toBeVisible();
    await page.getByPlaceholder('Search entries...').fill('nothing matches this');
    await expect(page.getByText(/0 of 2 entries/)).toBeVisible();
    await expect(page.getByText('No entries found')).toBeVisible();
  });

  test('the type filter narrows the list', async ({ page }) => {
    await page.getByRole('button', { name: /Filters/ }).click();
    await page.locator('select').first().selectOption('reflection');
    await expect(page.getByText(/0 of 2 entries/)).toBeVisible();
    await page.locator('select').first().selectOption('capture');
    await expect(page.getByText(/2 of 2 entries/)).toBeVisible();
    await page.locator('select').first().selectOption('all');
    await expect(page.getByText(/2 of 2 entries/)).toBeVisible();
  });

  test('a capture is a capture on every screen, never an "incident"', async ({ page }) => {
    // the rows
    await expect(page.getByRole('heading', { name: 'Capture' })).toHaveCount(2);
    await expect(page.getByText(/incident/i)).toHaveCount(0);
    // the filter panel offers no severity
    await page.getByRole('button', { name: /Filters/ }).click();
    await expect(page.getByText(/severity/i)).toHaveCount(0);
    await expect(page.locator('select option', { hasText: 'Captures' })).toHaveCount(1);
    // the entry modal
    await page.getByRole('heading', { name: 'Capture' }).first().click();
    const modal = page.getByRole('dialog');
    await expect(modal).toContainText('Capture');
    await expect(modal).toContainText('The meeting with Priya went badly');
    await expect(modal).not.toContainText(/incident/i);
  });

  test('Export CSV has every entry\'s own words, under their questions, and calls a capture a capture', async ({ page }) => {
    // a reflection too, so the export has answers as well as notes
    await goHome(page);
    await page.getByRole('button', { name: 'Reflect', exact: true }).click();
    for (const answer of ['A tense budget meeting.', 'I stayed calm, just.', 'Ask for the figures first.']) {
      await page.locator('textarea').fill(answer);
      await page.getByRole('button', { name: /Next Stage|^Complete/ }).click();
    }
    await page.getByRole('button', { name: /Save Reflection/ }).click();
    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await expect(page.getByText(/3 of 3 entries/)).toBeVisible();

    const csv = await exportCsv(page);
    expect(csv.charCodeAt(0)).toBe(0xfeff); // a BOM, so Excel reads the file as UTF-8
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe('"Date","Time","Kind","Framework or space","Mood (1-5)","What you wrote","Insight","Attachments"');
    expect(lines.filter((l) => /^"\d{4}-\d{2}-\d{2}"/.test(l))).toHaveLength(3);
    expect(csv).toContain('Walked by the canal and felt calmer');
    expect(csv).toContain('The meeting with Priya went badly');
    expect(csv).toContain('What happened?: A tense budget meeting.');
    expect(csv).toContain('What will you carry forward?: Ask for the figures first.');
    expect(csv).toMatch(/"Capture"/);
    expect(csv).toMatch(/"Reflection","Three-Part"/);
    expect(csv).not.toMatch(/INCIDENT/i);

    // with a search, only what the search found
    await page.getByPlaceholder('Search entries...').fill('canal');
    await expect(page.getByText(/1 of 3 entries/)).toBeVisible();
    const found = await exportCsv(page);
    expect(found).toContain('canal');
    expect(found).not.toContain('Priya');
  });

  test('each row previews what was written, and a search highlights it', async ({ page }) => {
    const row = page.getByRole('button', { name: /Capture/ }).filter({ hasText: 'canal' });
    await expect(row).toContainText('Walked by the canal and felt calmer');
    await page.getByPlaceholder('Search entries...').fill('canal');
    await expect(page.locator('mark')).toHaveText(['canal']);
  });

  test('a search with regular-expression characters in it is just text, even sorted by relevance', async ({ page }) => {
    // two entries that contain the characters, so the relevance sort has to compare them
    await goHome(page);
    await quickCapture(page, 'Tea (again) with Sam [kitchen] *later*');
    await quickCapture(page, 'More tea (again) \\ and cake');
    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await page.getByRole('button', { name: /Filters/ }).click();
    await page.getByRole('combobox', { name: /Sort/ }).selectOption('relevance');
    for (const [q, n] of [['(again', 2], ['(again)', 2], ['[kitchen', 1], ['*later', 1], ['\\', 1]] as const) {
      await page.getByPlaceholder('Search entries...').fill(q);
      await expect(page.getByText(`${n} of 4 entries`)).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: 'Archive' })).toBeVisible(); // still standing
  });
});

async function exportCsv(page: Page): Promise<string> {
  await page.evaluate(() => {
    const w = window as unknown as { __csv?: string };
    w.__csv = undefined;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      if (this.download) fetch(this.href).then((r) => r.arrayBuffer()).then((b) => { w.__csv = new TextDecoder('utf-8', { ignoreBOM: true }).decode(b); });
    };
  });
  await page.getByRole('button', { name: /Export CSV/ }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __csv?: string }).__csv)).toBeTruthy();
  return page.evaluate(() => (window as unknown as { __csv: string }).__csv);
}

test.describe('archive and a hostile backup file', () => {
  test('text from an imported backup is shown as text, never run as page code', async ({ page }, testInfo) => {
    await openFresh(page);
    await skipOnboarding(page);
    const payload = '<img src=x onerror="window.__pwned=1">Looks like a note';
    const backup = {
      version: 1,
      profile: { name: 'Sam', profession: 'NONE', isOnboarded: true },
      entries: [
        { id: 'x1', type: 'INCIDENT', date: '2026-09-20T10:00:00.000Z', notes: payload, content: payload, title: payload },
        { id: 'x2', type: 'REFLECTION', date: '2026-09-21T10:00:00.000Z', model: 'FREE', answers: { FREE_Writing: payload }, content: payload },
      ],
    };
    await fs.mkdir(testInfo.outputDir, { recursive: true });
    const file = path.join(testInfo.outputDir, 'hostile.json');
    await fs.writeFile(file, JSON.stringify(backup));
    await page.getByRole('button', { name: 'View profile and settings' }).click();
    await page.locator('input[type=file]').setInputFiles(file);
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();

    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await expect(page.getByText(/2 of 2 entries/)).toBeVisible();
    await page.getByPlaceholder('Search entries...').fill('note');
    await expect(page.getByText(/2 of 2 entries/)).toBeVisible();
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
    await expect(page.locator('main img[src="x"]')).toHaveCount(0);
    await expect(page.getByText('onerror', { exact: false }).first()).toBeVisible(); // shown, as the text it is
  });
});
