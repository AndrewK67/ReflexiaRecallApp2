import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resetBrowserStorage } from './helpers';

/**
 * Persistence and install-prompt handling (phase 3A.1) against a stubbed
 * navigator.storage; nothing here needs a browser.
 */

async function load() {
  return import('../../src/services/durabilityService');
}

function stubStorage(impl: Partial<StorageManager> | null) {
  vi.stubGlobal('navigator', impl ? { storage: impl } : {});
}

describe('durabilityService', () => {
  beforeEach(() => resetBrowserStorage());
  afterEach(() => vi.unstubAllGlobals());

  it('asks the browser once per device, and records that it asked', async () => {
    const persist = vi.fn(async () => true);
    stubStorage({ persist, persisted: async () => true } as Partial<StorageManager>);
    const d = await load();
    expect(d.persistenceRequested()).toBe(false);
    expect(await d.requestPersistenceOnce()).toBe(true);
    expect(await d.requestPersistenceOnce()).toBe(false);
    expect(await d.requestPersistenceOnce()).toBe(false);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(d.persistenceRequested()).toBe(true);
    expect(await d.persistenceState()).toBe('persisted');
  });

  it('reports best-effort when the browser declines, and can ask again explicitly', async () => {
    const persist = vi.fn(async () => false);
    stubStorage({ persist, persisted: async () => false } as Partial<StorageManager>);
    const d = await load();
    expect(await d.requestPersistence()).toBe(false);
    expect(await d.persistenceState()).toBe('best-effort');
    await d.requestPersistence();
    expect(persist).toHaveBeenCalledTimes(2);
  });

  it('answers unknown / null where the API does not exist, without throwing', async () => {
    stubStorage(null);
    const d = await load();
    expect(await d.requestPersistence()).toBeNull();
    expect(await d.persistenceState()).toBe('unknown');
    expect(await d.storageUsage()).toBeNull();
    expect(d.canInstall()).toBe(false);
    expect(await d.promptInstall()).toBe(false);
    expect(d.isStandalone()).toBe(false);
  });

  it('reports usage from estimate() and formats bytes readably', async () => {
    stubStorage({ estimate: async () => ({ usage: 1_300_000, quota: 5_000_000_000 }) } as Partial<StorageManager>);
    const d = await load();
    expect(await d.storageUsage()).toEqual({ usageBytes: 1_300_000, quotaBytes: 5_000_000_000 });
    expect(d.formatBytes(512)).toBe('512 B');
    expect(d.formatBytes(340 * 1024)).toBe('340 KB');
    expect(d.formatBytes(1_300_000)).toBe('1.2 MB');
    expect(d.formatBytes(3 * 1024 ** 3)).toBe('3.00 GB');
  });

  it('holds the install prompt and hands it over once', async () => {
    const listeners: Record<string, (e: Event) => void> = {};
    vi.stubGlobal('window', {
      addEventListener: (name: string, fn: (e: Event) => void) => { listeners[name] = fn; },
      matchMedia: () => ({ matches: false }),
    });
    stubStorage(null);
    const d = await load();
    d.captureInstallPrompt();
    const changes = vi.fn();
    d.onInstallAvailabilityChange(changes);
    expect(d.canInstall()).toBe(false);

    const prompt = vi.fn(async () => {});
    const evt = { preventDefault: vi.fn(), prompt, userChoice: Promise.resolve({ outcome: 'accepted' as const }) };
    listeners['beforeinstallprompt'](evt as unknown as Event);
    expect(evt.preventDefault).toHaveBeenCalled();
    expect(d.canInstall()).toBe(true);
    expect(changes).toHaveBeenCalledTimes(1);

    expect(await d.promptInstall()).toBe(true);
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(d.canInstall()).toBe(false);
    expect(await d.promptInstall()).toBe(false);
  });
});
