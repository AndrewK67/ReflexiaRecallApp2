import { test, expect, type Page } from '@playwright/test';
import { openFresh, skipOnboarding, rawEntryRecords } from './helpers';

// Phase 3C.3: the whole capture and reflect paths work from the keyboard,
// and whatever has focus shows it.

async function activeText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return '';
    return (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.tagName).trim();
  });
}

/** Press Tab until the focused element's name matches, then assert focus is visibly shown. */
async function tabTo(page: Page, name: RegExp, maxTabs = 40): Promise<void> {
  const seen: string[] = [];
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    const t = await activeText(page);
    seen.push(t.slice(0, 24));
    if (name.test(t)) {
      await expectVisibleFocus(page);
      return;
    }
  }
  throw new Error(`Could not tab to ${name}. Sequence: ${seen.join(' | ')}`);
}

async function expectVisibleFocus(page: Page): Promise<void> {
  const shown = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || !el.matches(':focus-visible')) return 'not-focus-visible';
    const cs = getComputedStyle(el);
    const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
    const ring = cs.boxShadow !== 'none';
    return outline || ring ? 'shown' : `hidden (${cs.outlineStyle} ${cs.outlineWidth} / ${cs.boxShadow})`;
  });
  expect(shown).toBe('shown');
}

test.describe('keyboard only', () => {
  test('capture: Tab to Capture, type, Tab to Save, Enter', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await page.locator('body').focus();
    await tabTo(page, /Capture/);
    await page.keyboard.press('Enter');
    await expect(page.getByPlaceholder(/Describe what happened/)).toBeVisible();
    await tabTo(page, /Describe what happened/);
    await page.keyboard.type('Typed without a mouse.');
    await tabTo(page, /^Save$/);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
    expect(await rawEntryRecords(page)).toHaveLength(1);
  });

  test('reflect: three questions and save, Tab and Enter only', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await page.locator('body').focus();
    await tabTo(page, /Reflect/);
    await page.keyboard.press('Enter');
    // the composer is a lazy chunk; wait for it like a person would
    await expect(page.getByText(/Step 1 of 3/)).toBeVisible();
    for (const answer of ['Keyboard one.', 'Keyboard two.', 'Keyboard three.']) {
      await tabTo(page, /Tell the story|What did you notice|What's next/);
      await page.keyboard.type(answer);
      await tabTo(page, /Next Stage|^Complete/);
      await page.keyboard.press('Enter');
    }
    await expect(page.getByRole('heading', { name: 'Complete' })).toBeVisible();
    await tabTo(page, /Save Reflection/);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: /Capture$/ })).toBeVisible();
    expect(await rawEntryRecords(page)).toHaveLength(1);
  });

  test('the tab bar and the icon-only buttons are reachable and named', async ({ page }) => {
    await openFresh(page);
    await skipOnboarding(page);
    await page.locator('body').focus();
    await tabTo(page, /View archive of past reflections/);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Archive' })).toBeVisible();
    // focus moved to the top of the new screen, so Tab reaches its first control, not the tab bar
    await tabTo(page, /Search entries/, 3);
    await tabTo(page, /Filters/);
    await page.keyboard.press('Enter');
    await tabTo(page, /Entry type|All Types/);
    await tabTo(page, /Clear all filters/);
  });
});
