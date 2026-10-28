const crypto = require('crypto');
const { encrypt, decrypt } = require('../src/utils/encryption');

describe('AES-256-GCM encryption (src/utils/encryption.js)', () => {
  test('round-trips plaintext without loss', () => {
    const plain = 'PHI: paciente João Silva, dose 500mg';
    const enc = encrypt(plain);
    expect(enc).not.toBe(plain);
    expect(decrypt(enc)).toBe(plain);
  });

  test('produces a different ciphertext for identical input (random IV)', () => {
    const a = encrypt('Repeated message');
    const b = encrypt('Repeated message');
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe('Repeated message');
    expect(decrypt(b)).toBe('Repeated message');
  });

  test('new ciphertexts use GCM format (gcm:iv:tag:ct)', () => {
    const parts = encrypt('x').split(':');
    expect(parts[0]).toBe('gcm');
    expect(parts).toHaveLength(4);
    expect(parts[1]).toMatch(/^[0-9a-f]{24}$/);   // 12-byte IV → 24 hex chars
    expect(parts[2]).toMatch(/^[0-9a-f]{32}$/);   // 16-byte auth tag → 32 hex
    expect(parts[3]).toMatch(/^[0-9a-f]+$/);
  });

  test('returns null/empty inputs unchanged', () => {
    expect(encrypt(null)).toBeNull();
    expect(encrypt('')).toBe('');
    expect(decrypt(null)).toBeNull();
  });

  test('tampered ciphertext fails authentication', () => {
    const parts = encrypt('secret').split(':');
    parts[3] = (parts[3][0] === '0' ? '1' : '0') + parts[3].slice(1);
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  test('tampered IV fails authentication', () => {
    const parts = encrypt('secret').split(':');
    parts[1] = (parts[1][0] === '0' ? '1' : '0') + parts[1].slice(1);
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  test('tampered auth tag fails authentication', () => {
    const parts = encrypt('secret').split(':');
    parts[2] = (parts[2][0] === '0' ? '1' : '0') + parts[2].slice(1);
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  test('legacy CBC-format ciphertext still decrypts (backward compat)', () => {
    const key = crypto.createHash('sha256').update(process.env.MASTER_KEY).digest();
    const iv = crypto.randomBytes(16);
    const c = crypto.createCipheriv('aes-256-cbc', key, iv);
    const ct = Buffer.concat([c.update('legacy secret'), c.final()]);
    const legacy = `${iv.toString('hex')}:${ct.toString('hex')}`;
    expect(decrypt(legacy)).toBe('legacy secret');
  });
});