// The accessibility gate (phase 3C.5; a scoping probe before that): runs axe
// on every live screen, writes test-results/a11y-audit.json, and FAILS on any
// critical or serious violation. Moderate and minor ones are listed, not
// fatal. Runs in CI after the e2e suite. Locally:
//   npm run audit:a11y   (PW_CHROMIUM as for e2e)
import { test, expect } from '@playwright/test';
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
  await scan('onboarding');
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
  // three entries, no space yet: the dashboard shows its one suggestion (3D.3)
  await expect(page.getByRole('note', { name: 'Suggestion' })).toBeVisible();
  await scan('dashboard-suggestion');

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

  await setPacks(page, { wellbeing: { enabled: true, isPermanent: true }, reports: { enabled: true, isPermanent: true }, aiReflectionCoach: { enabled: true, isPermanent: true } });
  await scan('dashboard-all-packs');
  await page.getByRole('button', { name: 'Spaces', exact: true }).click();
  await scan('spaces-hub');
  await page.getByRole('button', { name: /Difficult Conversation/ }).click();
  await scan('space');

  await fs.mkdir('test-results', { recursive: true });
  await fs.writeFile('test-results/a11y-audit.json', JSON.stringify(rows, null, 2));

  const fatal = rows.filter((r) => r.impact === 'critical' || r.impact === 'serious');
  const describe = (r: Row) => `${r.impact} ${r.id} on ${r.screen} (${r.nodes}): ${r.help} — ${r.sample}`;
  if (rows.length) console.log('axe findings:\n' + rows.map(describe).join('\n'));
  expect(fatal.map(describe), 'critical or serious accessibility violations').toEqual([]);
});
