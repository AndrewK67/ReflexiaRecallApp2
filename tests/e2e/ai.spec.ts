import { test, expect } from '@playwright/test';
import { openFresh, skipOnboarding, goHome, profile, setPacks } from './helpers';

// A key that is long enough to be accepted and obviously fake. Nothing in
// these specs presses "Ask" or "Coach" with AI on, so no request is ever made.
const FAKE_KEY = 'AIzaSy-e2e-not-a-real-key-000000000';

async function openProfile(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'View profile and settings' }).click();
  await expect(page.getByRole('heading', { name: 'AI', exact: true })).toBeVisible();
}

test.describe('the AI boundary', () => {
  test('AI is off by default and cannot be turned on without a key', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await openProfile(page);

    const toggle = page.getByRole('button', { name: /AI features/ });
    await expect(toggle).toContainText('OFF');
    await toggle.click();
    await expect(page.getByRole('region', { name: 'AI' }).getByRole('status')).toContainText('Add your key first');
    await expect(toggle).toContainText('OFF');
    expect((await profile(page)).aiEnabled).not.toBe(true);
  });

  test('with a key, turning AI on shows what each feature sends and needs a second tap', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await openProfile(page);

    await page.getByLabel('Gemini API key').fill(FAKE_KEY);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText(/ending …0000/)).toBeVisible();
    await expect(page.getByRole('region', { name: 'AI' }).getByRole('status')).toContainText('Key saved on this device');

    const toggle = page.getByRole('button', { name: /AI features/ });
    await toggle.click();
    const consent = page.getByRole('region', { name: 'Before you turn this on' });
    await expect(consent).toBeVisible();
    await expect(consent).toContainText('most recent 40 entries');
    await expect(consent).toContainText('the whole reflection');
    await expect(consent).toContainText("Google's Gemini API");
    // still off until confirmed
    await expect(toggle).toContainText('OFF');
    expect((await profile(page)).aiEnabled).not.toBe(true);

    await consent.getByRole('button', { name: 'Not now' }).click();
    await expect(consent).toHaveCount(0);
    await expect(toggle).toContainText('OFF');

    await toggle.click();
    await page.getByRole('region', { name: 'Before you turn this on' }).getByRole('button', { name: 'Turn AI on' }).click();
    await expect(toggle).toContainText('ON');
    expect((await profile(page)).aiEnabled).toBe(true);

    // the key is not in localStorage, so it cannot be in a backup
    const ls = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
    expect(ls).not.toContain(FAKE_KEY);

    // and it survives a reload
    await page.reload();
    await openProfile(page);
    await expect(page.getByText(/ending …0000/)).toBeVisible();
    await expect(page.getByRole('button', { name: /AI features/ })).toContainText('ON');
  });

  test('removing the key turns AI off; the composer and Oracle say so', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await setPacks(page, { aiReflectionCoach: { enabled: true, isPermanent: true } });
    await openProfile(page);
    await page.getByLabel('Gemini API key').fill(FAKE_KEY);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('button', { name: /AI features/ }).click();
    await page.getByRole('button', { name: 'Turn AI on' }).click();

    // Oracle, AI on: says what it sends
    await goHome(page);
    await page.getByRole('button', { name: /Oracle/ }).click();
    await expect(page.getByText('AI is on')).toBeVisible();
    await expect(page.getByText(/Sends your question and your last \d+ entries to Gemini/)).toBeVisible();
    // composer, AI on: Coach is not labelled offline
    await goHome(page);
    await page.getByRole('button', { name: /Reflect$/ }).first().click();
    await expect(page.getByRole('button', { name: /^Coach/ })).not.toContainText('Offline');

    // remove the key
    await page.getByRole('button', { name: 'View profile and settings' }).click();
    await page.getByRole('button', { name: 'Remove key' }).click();
    await expect(page.getByRole('button', { name: /AI features/ })).toContainText('OFF');
    expect((await profile(page)).aiEnabled).toBe(false);

    await goHome(page);
    await page.getByRole('button', { name: /Oracle/ }).click();
    await expect(page.getByText('AI is off')).toBeVisible();
    await expect(page.getByText('Offline • Nothing leaves this device')).toBeVisible();
    await goHome(page);
    await page.getByRole('button', { name: /Reflect$/ }).first().click();
    await expect(page.getByRole('button', { name: /^Coach/ })).toContainText('Offline');
  });

  test('with AI off, Coach and the Oracle answer offline and make no request', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    await openFresh(page);
    await skipOnboarding(page);
    await setPacks(page, { aiReflectionCoach: { enabled: true, isPermanent: true } });

    await page.getByRole('button', { name: /Oracle/ }).click();
    await page.getByPlaceholder(/What have I been writing about/).fill('What now?');
    await page.getByRole('button', { name: /Ask Oracle/ }).click();
    await expect(page.getByText('Oracle Response')).toBeVisible();

    await goHome(page);
    await page.getByRole('button', { name: /Reflect$/ }).first().click();
    await page.getByRole('button', { name: /^Coach/ }).click();
    await expect(page.getByText(/Start with the plain facts/)).toBeVisible();

    expect(requests.filter((u) => u.includes('googleapis.com'))).toEqual([]);
  });
});
