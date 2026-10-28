const crypto = require('crypto');
const { generateToken, validateToken, csrfProtection } = require('../src/middleware/csrf');

describe('CSRF HMAC-signed tokens (src/middleware/csrf.js)', () => {
  test('generates a valid 3-segment token', () => {
    const token = generateToken();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
    expect(validateToken(token).valid).toBe(true);
  });

  test('generates unique tokens on each call', () => {
    expect(generateToken()).not.toBe(generateToken());
  });

  test('rejects missing token', () => {
    const r = validateToken('');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('MISSING_TOKEN');
  });

  test('rejects malformed token (wrong segment count)', () => {
    const r = validateToken('abc.def');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('INVALID_FORMAT');
  });

  test('rejects non-numeric timestamp', () => {
    const r = validateToken('aaaa.notanumber.sig');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('INVALID_TIMESTAMP');
  });

  test('rejects token with tampered signature (same length)', () => {
    const token = generateToken();
    const [t, ts, sig] = token.split('.');
    const flipped = (sig[0] === 'a' ? 'b' : 'a') + sig.slice(1);
    const r = validateToken(`${t}.${ts}.${flipped}`);
    expect(r.valid).toBe(false);
    expect(r.error).toBe('INVALID_SIGNATURE');
  });

  test('rejects token with wrong-length signature (timingSafeEqual guard)', () => {
    const [t, ts, sig] = generateToken().split('.');
    const short = `${t}.${ts}.${sig.slice(0, 5)}`;
    let result;
    try {
      result = validateToken(short);
    } catch (e) {
      // middleware catches this internally and maps to 403 anyway
      result = { valid: false, error: 'THROWN' };
    }
    expect(result.valid).toBe(false);
  });

  test('rejects expired token (>1h old)', () => {
    const secret = Buffer.from(process.env.CSRF_SECRET.slice(0, 32), 'utf8');
    const tokenValue = 'a'.repeat(32);
    const oldTs = String(Date.now() - 2 * 60 * 60 * 1000);
    const sig = crypto.createHmac('sha256', secret)
      .update(`${tokenValue}.${oldTs}`).digest('base64url');
    const r = validateToken(`${tokenValue}.${oldTs}.${sig}`);
    expect(r.valid).toBe(false);
    expect(r.error).toBe('TOKEN_EXPIRED');
  });
});

describe('csrfProtection - Express middleware', () => {
  const makeReq = (method, headers = {}, body = {}, query = {}) => ({ method, headers, body, query });
  const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

  // Disable the test-wide bypass so this middleware actually runs.
  let savedBypass;
  beforeAll(() => {
    savedBypass = process.env.CSRF_TEST_BYPASS;
    delete process.env.CSRF_TEST_BYPASS;
  });
  afterAll(() => {
    process.env.CSRF_TEST_BYPASS = savedBypass;
  });

  test('allows GET (safe method) with no token', () => {
    const next = jest.fn();
    csrfProtection(makeReq('GET'), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0].length).toBe(0); // called with NO args = success
  });

  test('rejects POST with no token (403 MISSING_CSRF_TOKEN)', () => {
    const next = jest.fn();
    csrfProtection(makeReq('POST'), makeRes(), next);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('MISSING_CSRF_TOKEN');
  });

  test('accepts POST with valid header token', () => {
    const next = jest.fn();
    csrfProtection(makeReq('POST', { 'x-csrf-token': generateToken() }), makeRes(), next);
    expect(next.mock.calls[0].length).toBe(0); // success
  });
});