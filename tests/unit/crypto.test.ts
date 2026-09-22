import { describe, it, expect, beforeEach } from 'vitest';
import { resetBrowserStorage } from './helpers';

async function loadCrypto() {
  return import('../../src/services/cryptoService');
}

describe('cryptoService', () => {
  beforeEach(() => resetBrowserStorage());

  it('reports WebCrypto as available in this environment', async () => {
    const c = await loadCrypto();
    expect(c.isCryptoAvailable()).toBe(true);
  });

  it('creates a key once and reloads the same key from the keystore', async () => {
    const c = await loadCrypto();
    const k1 = await c.getOrCreateKey();
    const k2 = await c.getOrCreateKey();
    const [r1, r2] = await Promise.all([crypto.subtle.exportKey('raw', k1), crypto.subtle.exportKey('raw', k2)]);
    expect(Buffer.from(r1).equals(Buffer.from(r2))).toBe(true);
    expect(r1.byteLength).toBe(32); // AES-256
  });

  it('persists the key across a fresh module graph (same IndexedDB)', async () => {
    const c1 = await loadCrypto();
    const k1 = await c1.getOrCreateKey();
    const { vi } = await import('vitest');
    vi.resetModules();
    const c2 = await loadCrypto();
    const k2 = await c2.getOrCreateKey();
    const [r1, r2] = await Promise.all([crypto.subtle.exportKey('raw', k1), crypto.subtle.exportKey('raw', k2)]);
    expect(Buffer.from(r1).equals(Buffer.from(r2))).toBe(true);
  });

  it('round-trips text, including unicode', async () => {
    const c = await loadCrypto();
    const key = await c.getOrCreateKey();
    const text = 'Reflexia — “quotes”, emoji 🙂, and a newline\nhere';
    expect(await c.decrypt(await c.encrypt(text, key), key)).toBe(text);
  });

  it('produces a fresh IV and different ciphertext for the same plaintext', async () => {
    const c = await loadCrypto();
    const key = await c.getOrCreateKey();
    const a = JSON.parse(await c.encrypt('same', key));
    const b = JSON.parse(await c.encrypt('same', key));
    expect(a.iv).not.toBe(b.iv);
    expect(a.ct).not.toBe(b.ct);
    expect(Buffer.from(a.iv, 'base64')).toHaveLength(12);
  });

  it('never leaks the plaintext into the payload', async () => {
    const c = await loadCrypto();
    const key = await c.getOrCreateKey();
    const payload = await c.encrypt('secret words', key);
    expect(payload).not.toContain('secret words');
    expect(Object.keys(JSON.parse(payload)).sort()).toEqual(['ct', 'iv']);
  });

  it('rejects tampered ciphertext (GCM authentication)', async () => {
    const c = await loadCrypto();
    const key = await c.getOrCreateKey();
    const payload = JSON.parse(await c.encrypt('secret words', key));
    const bytes = Buffer.from(payload.ct, 'base64');
    bytes[0] ^= 0xff;
    payload.ct = bytes.toString('base64');
    await expect(c.decrypt(JSON.stringify(payload), key)).rejects.toThrow();
  });

  it('rejects decryption with a different key', async () => {
    const c = await loadCrypto();
    const key = await c.getOrCreateKey();
    const other = await c.generateKey();
    const payload = await c.encrypt('secret words', key);
    await expect(c.decrypt(payload, other)).rejects.toThrow();
  });
});
