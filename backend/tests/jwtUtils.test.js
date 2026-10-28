const jwt = require('jsonwebtoken');
const JwtUtils = require('../src/utils/jwtUtils');

// DON'T include exp/iat - let generateDeviceToken's expiresIn: '1h' handle it.
const baseClaims = () => ({
  iss: 'caresync-mobile-app',
  sub: 'user-uuid-123',
  aud: 'carebox-device-01',
});

describe('JWT device-signature verification', () => {
  test('accepts a valid token', async () => {
    const token = JwtUtils.generateDeviceToken(baseClaims());
    const decoded = await JwtUtils.verifyDeviceSignature(token, 'public-key');
    expect(decoded.sub).toBe('user-uuid-123');
    expect(decoded.aud).toBe('carebox-device-01');
  });

  test('rejects token signed with wrong secret', async () => {
    const bad = jwt.sign(baseClaims(), 'wrong-secret', { algorithm: 'HS256' });
    await expect(JwtUtils.verifyDeviceSignature(bad, 'pk')).rejects.toThrow('Invalid device signature');
  });

  test('rejects token with wrong issuer', async () => {
    const token = JwtUtils.generateDeviceToken({ ...baseClaims(), iss: 'evil-app' });
    await expect(JwtUtils.verifyDeviceSignature(token, 'pk')).rejects.toThrow();
  });

  test('rejects token missing required claims', async () => {
    const token = jwt.sign({ iss: 'caresync-mobile-app' }, process.env.JWT_SECRET, { algorithm: 'HS256' });
    await expect(JwtUtils.verifyDeviceSignature(token, 'pk')).rejects.toThrow();
  });

  test('rejects token issued more than 24h ago', async () => {
    // Bypass generateDeviceToken (which forces 1h expiry) so we can
    // craft an old-but-not-yet-expired token that hits the 24h check.
    const now = Math.floor(Date.now() / 1000);
    const old = jwt.sign(
      {
        ...baseClaims(),
        iat: now - 25 * 3600,          // 25h ago
        exp: now + 3600,               // still valid per exp
      },
      process.env.JWT_SECRET,
      { algorithm: 'HS256' }
    );
    await expect(JwtUtils.verifyDeviceSignature(old, 'pk')).rejects.toThrow();
  });
});