import { defineConfig, devices } from '@playwright/test';

// End-to-end tests against the real app in a real browser.
//   npx playwright test            starts the Vite dev server itself, runs, stops it
//   npx playwright test --ui       same, interactively
// The dev server uses a self-signed certificate (vite-plugin-basic-ssl), hence
// the ignoreHTTPSErrors flags. Set PW_CHROMIUM=/path/to/chrome to use a
// specific browser binary instead of Playwright's own download.
const PORT = 5173;
const BASE_URL = `https://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e', // tests/audit/ is reached via playwright.audit.config.ts
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1, // every spec talks to the same origin's IndexedDB; keep them serial
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  outputDir: 'test-results',
  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
    viewport: { width: 430, height: 900 },
    trace: 'retain-on-failure',
    launchOptions: {
      ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
      args: ['--ignore-certificate-errors', ...(process.platform === 'linux' ? ['--no-sandbox'] : [])],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 430, height: 900 } } }],
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
