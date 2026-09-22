import { defineConfig } from 'vitest/config';

// Unit tests run in Node against the real service modules. IndexedDB comes
// from fake-indexeddb, WebCrypto from Node itself, localStorage from a small
// shim in tests/unit/setup.ts. No app module is mocked.
export default defineConfig({
  // vite.config.ts injects this at build time; constants.ts reads it at import.
  define: { __BUILD_DATE__: JSON.stringify('test') },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/unit/setup.ts'],
  },
});
