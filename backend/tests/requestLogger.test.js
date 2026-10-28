const {
  sanitizeHeaders,
  sanitizeBody,
  generateRequestId,
} = require('../src/middleware/requestLogger');

describe('PII/PII scrubbing in request logger', () => {
  test('redacts Authorization header', () => {
    const safe = sanitizeHeaders({ authorization: 'Bearer jwt', 'user-agent': 'curl/8' });
    expect(safe.authorization).toBe('[REDACTED]');
    expect(safe['user-agent']).toBe('curl/8');
  });

  test('redacts Cookie and CSRF headers', () => {
    const safe = sanitizeHeaders({ cookie: 'x=y', 'x-csrf-token': 'tok' });
    expect(safe.cookie).toBe('[REDACTED]');
    expect(safe['x-csrf-token']).toBe('[REDACTED]');
  });

  test('redacts passwords in body', () => {
    const safe = sanitizeBody({ email: 'a@b.c', password: 'hunter2', newPassword: 'x' });
    expect(safe.password).toBe('[REDACTED]');
    expect(safe.newPassword).toBe('[REDACTED]');
    expect(safe.email).toBe('a@b.c');
  });

  test('redacts tokens/secrets in body', () => {
    const safe = sanitizeBody({ token: 'jwt', refreshToken: 'r', apiKey: 'k' });
    expect(safe.token).toBe('[REDACTED]');
    expect(safe.refreshToken).toBe('[REDACTED]');
    expect(safe.apiKey).toBe('[REDACTED]');
  });

  test('generateRequestId() returns unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, generateRequestId));
    expect(ids.size).toBe(100);
    expect([...ids][0]).toMatch(/^req_\d+_[0-9a-f]{16}$/);
  });
});