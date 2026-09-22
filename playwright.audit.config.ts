import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Scoping probes, not regression tests: `npm run audit:a11y` runs the axe
// accessibility scan in tests/audit/ against the dev server and writes
// test-results/a11y-audit.json. Same browser and server settings as e2e.
export default defineConfig({
  ...base,
  testDir: 'tests/audit',
});
