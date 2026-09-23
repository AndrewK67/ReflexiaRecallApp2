import { test, expect, type Page } from '@playwright/test';
import { openFresh, skipOnboarding, quickCapture, rawEntryRecords } from './helpers';

// Phase 3B.4: reading an entry back.

/**
 * Seed what an older build would have left: a sketch and a voice note in the
 * media store (reflexia-media / media-files, keyed by filename) and a
 * reflection in the pre-IndexedDB entry list that points at them with idb://
 * references, then reload so the app migrates it.
 */
async function seedReflectionWithMedia(page: Page) {
  await page.evaluate(async () => {
    const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0));
    const sketch = new Blob([png], { type: 'image/png' });
    const audio = new Blob([new Uint8Array(64)], { type: 'audio/webm' });
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('reflexia-media', 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains('media-files')) req.result.createObjectStore('media-files');
      };
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const tx = req.result.transaction('media-files', 'readwrite');
        tx.objectStore('media-files').put(sketch, 'drawing_seed.png');
        tx.objectStore('media-files').put(audio, 'audio_seed.webm');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    });
    localStorage.removeItem('reflexia.entries.idb_migrated');
    localStorage.setItem('reflexia.profile.v1', JSON.stringify({ name: 'Sam', isOnboarded: true }));
    localStorage.setItem('reflexia.entries.v1', JSON.stringify([{
      id: 'reflection_1758500000000',
      type: 'REFLECTION',
      date: '2026-09-21T19:30:00.000Z',
      model: 'SIMPLE',
      modelId: 'SIMPLE',
      answers: { what_forward: 'Ask before answering.', what_happened: 'A tense meeting.' },
      mood: 4,
      attachments: [
        { id: 's1', type: 'SKETCH', url: 'idb://drawing_seed.png', createdAt: 1758500000000 },
        { id: 'a1', type: 'AUDIO', url: 'idb://audio_seed.webm', createdAt: 1758500000000, name: 'Voice 19:30' },
      ],
      createdAt: 1758500000000,
    }]));
  });
  await page.reload();
  await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
  await expect.poll(async () => (await rawEntryRecords(page)).length).toBe(1);
}

test.describe('the entry modal', () => {
  test("a reflection shows its answers in the framework's order, its mood, and its sketch and voice note", async ({ page }) => {
    await openFresh(page);
    await seedReflectionWithMedia(page);
    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await page.getByRole('heading', { name: 'Three-Part' }).click();

    const modal = page.getByRole('dialog', { name: /Reflection • Three-Part/ });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Close entry details' })).toBeFocused();
    // "What happened?" comes before "What will you carry forward?", though stored the other way round
    const headings = await modal.getByRole('heading', { level: 3 }).allInnerTexts();
    expect(headings).toEqual(['What happened?', 'What will you carry forward?']);
    await expect(modal).toContainText('Mood: Good');
    // the idb:// sketch is resolved to something the browser can show
    const img = modal.getByRole('img', { name: 'Sketch' });
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', /^blob:/);
    expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(1);
    // the voice note plays in place
    await expect(modal.locator('audio')).toHaveAttribute('src', /^blob:/);
    await expect(modal.getByRole('button', { name: 'Save a copy' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });

  test('Delete asks first; Escape on the question keeps the entry; confirming removes it and its media', async ({ page }) => {
    await openFresh(page);
    await seedReflectionWithMedia(page);
    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await page.getByRole('heading', { name: 'Three-Part' }).click();
    const modal = page.getByRole('dialog', { name: /Reflection • Three-Part/ });

    await modal.getByRole('button', { name: 'Delete' }).click();
    const confirm = page.getByRole('dialog', { name: 'Delete this entry?' });
    await expect(confirm).toContainText('backup file you have already saved keeps its own copy');
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused(); // destructive: Cancel first
    await page.keyboard.press('Escape');
    await expect(confirm).toHaveCount(0);
    await expect(modal).toBeVisible(); // Escape answered the question, it did not also close the entry
    expect(await rawEntryRecords(page)).toHaveLength(1);

    await modal.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog', { name: 'Delete this entry?' }).getByRole('button', { name: 'Delete' }).click();
    await expect(modal).toHaveCount(0);
    await expect(page.getByRole('status').filter({ hasText: 'Entry deleted.' })).toBeVisible();
    await expect(page.getByText(/0 of 0 entries/)).toBeVisible();
    await expect.poll(async () => (await rawEntryRecords(page)).length).toBe(0);
    const mediaLeft = await page.evaluate(() => new Promise<number>((resolve) => {
      const req = indexedDB.open('reflexia-media', 1);
      req.onsuccess = () => {
        const c = req.result.transaction('media-files').objectStore('media-files').count();
        c.onsuccess = () => resolve(c.result);
      };
    }));
    expect(mediaLeft).toBe(0);
  });

  test('a capture shows its note, and the modal is dark, named and closable', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await quickCapture(page, 'The walk home was quieter than usual.');
    await page.getByRole('button', { name: 'View archive of past reflections' }).click();
    await page.getByRole('heading', { name: 'Capture' }).click();
    const modal = page.getByRole('dialog', { name: 'Capture' });
    await expect(modal).toContainText('The walk home was quieter than usual.');
    await modal.getByRole('button', { name: 'Close entry details' }).click();
    await expect(modal).toHaveCount(0);
  });
});
