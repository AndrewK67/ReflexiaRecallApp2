import { defineConfig } from 'vitest/config';

// Unit tests run in Node against the real service modules. IndexedDB comes
// from fake-indexeddb, WebCrypto from Node itself, localStorage from a small
// shim in tests/unit/setup.ts. No app module is mocked.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/unit/setup.ts'],
  },
});
