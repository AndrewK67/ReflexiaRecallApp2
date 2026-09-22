import { it, expect, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
it('saves a blob and reads it back', async () => {
  (globalThis as any).indexedDB = new IDBFactory(); vi.resetModules();
  const m = await import('../../src/services/fileStorageService');
  const blob = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/webm' });
  const path = await m.saveMediaFile(blob, 'audio');
  const url = await m.readMediaFile(path);
  expect(path.startsWith('idb://')).toBe(true);
  expect(url.startsWith('data:audio/webm;base64,') || url.startsWith('blob:')).toBe(true);
});
