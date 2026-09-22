import { describe, it, expect, beforeEach } from 'vitest';
import { resetBrowserStorage, silenceConsoleError } from './helpers';

async function loadMedia() {
  return import('../../src/services/fileStorageService');
}
const blob = (bytes: number[], type = 'audio/webm') => new Blob([new Uint8Array(bytes)], { type });

describe('fileStorageService (web / IndexedDB path)', () => {
  beforeEach(() => resetBrowserStorage());

  it('saves a blob under an idb:// path and reads it back as an object URL', async () => {
    const m = await loadMedia();
    const path = await m.saveMediaFile(blob([1, 2, 3, 4]), 'audio');
    expect(path).toMatch(/^idb:\/\/audio_\d+_[a-z0-9]+\.webm$/);
    const url = await m.readMediaFile(path);
    expect(url).toMatch(/^blob:/);
  });

  it('passes data: URLs through readMediaFile untouched (legacy entries)', async () => {
    const m = await loadMedia();
    expect(await m.readMediaFile('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
  });

  it('rejects a read of a file that does not exist', async () => {
    const m = await loadMedia();
    await expect(m.readMediaFile('idb://nope.webm')).rejects.toThrow();
  });

  it('counts files and deletes them', async () => {
    const m = await loadMedia();
    const a = await m.saveMediaFile(blob([1]), 'photo');
    await m.saveMediaFile(blob([2]), 'audio');
    expect(await m.getStorageStats()).toMatchObject({ fileCount: 2, platform: 'web' });
    await m.deleteMediaFile(a);
    expect((await m.getStorageStats()).fileCount).toBe(1);
    await expect(m.readMediaFile(a)).rejects.toThrow();
  });

  it('migrates a base64 data URL into a stored file and leaves non-data URLs alone', async () => {
    const m = await loadMedia();
    const png = 'data:image/png;base64,' + Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString('base64');
    const path = await m.migrateBase64ToFile(png, 'drawing');
    expect(path).toMatch(/^idb:\/\/drawing_/);
    expect((await m.getStorageStats()).fileCount).toBe(1);
    expect(await m.migrateBase64ToFile('idb://already.png', 'drawing')).toBe('idb://already.png');
  });

  it('clearAllMediaFiles empties the store', async () => {
    silenceConsoleError();
    const m = await loadMedia();
    await m.saveMediaFile(blob([1]), 'photo');
    await m.saveMediaFile(blob([2]), 'video');
    await m.clearAllMediaFiles();
    expect((await m.getStorageStats()).fileCount).toBe(0);
  });
});
