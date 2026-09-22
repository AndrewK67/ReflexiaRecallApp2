// Phase 3 scoping probe, not a regression test: runs axe on each live screen and
// writes a summary to test-results/a11y-audit.json. Run with:
//   npm run audit:a11y   (needs the dev server's Chromium; PW_CHROMIUM as for e2e)
import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import { openFresh, skipOnboarding, quickCapture, setPacks } from '../e2e/helpers';

type Row = { screen: string; id: string; impact: string; nodes: number; help: string; sample: string };

test('axe audit of the live screens', async ({ page }) => {
  const rows: Row[] = [];
  const scan = async (screen: string) => {
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']).analyze();
    for (const v of res.violations) {
      rows.push({
        screen,
        id: v.id,
        impact: v.impact ?? 'n/a',
        nodes: v.nodes.length,
        help: v.help,
        sample: v.nodes[0]?.html.slice(0, 120) ?? '',
      });
    }
  };

  await openFresh(page);
  await scan('onboarding-1');
  await page.getByRole('button', { name: /^Next/ }).click();
  await page.getByRole('button', { name: /^Next/ }).click();
  await scan('onboarding-3');
  await skipOnboarding(page);
  await scan('dashboard-empty');
  await page.getByRole('button', { name: 'View archive of past reflections' }).click();
  await scan('archive-empty');
  await page.getByRole('button', { name: /Filters/ }).click();
  await scan('archive-empty-filters');
  await page.getByRole('button', { name: 'Go to dashboard' }).click();

  await page.getByRole('button', { name: /Capture$/ }).first().click();
  await scan('quick-capture');
  await page.getByPlaceholder(/Describe what happened/).fill('a note');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await quickCapture(page, 'another note');
  await scan('dashboard-with-entries');

  await page.getByRole('button', { name: /Reflect$/ }).first().click();
  await scan('composer-three-part');
  await page.getByRole('button', { name: /Use a framework/ }).click();
  await scan('framework-picker');
  await page.getByRole('button', { name: /Gibbs/ }).click();
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: /Next Stage|^Complete/ }).click();
  await scan('composer-complete');
  await page.getByRole('button', { name: /Save Reflection/ }).click();

  await page.getByRole('button', { name: 'View archive of past reflections' }).click();
  await scan('archive');
  await page.getByRole('button', { name: /Filters/ }).click();
  await scan('archive-filters');
  await page.getByRole('heading', { name: /Gibbs/ }).click();
  await scan('entry-modal');
  await page.getByRole('button', { name: 'Close entry details' }).click();

  await page.getByRole('button', { name: 'View profile and settings' }).click();
  await scan('profile');

  await page.getByRole('button', { name: 'Go to dashboard' }).click();
  await page.getByRole('button', { name: /Explore Optional Packs/ }).click();
  await scan('pack-browser');

  await setPacks(page, { scenario: { enabled: true, isPermanent: true }, wellbeing: { enabled: true, isPermanent: true } });
  await page.getByRole('button', { name: /Holodeck/ }).click();
  await scan('holodeck-hub');
  await page.getByRole('button', { name: /Difficult Conversation/ }).click();
  await scan('holodeck-space');

  await fs.mkdir('test-results', { recursive: true });
  await fs.writeFile('test-results/a11y-audit.json', JSON.stringify(rows, null, 2));
});
