const { body, validationResult } = require('express-validator');
const { handleValidationErrors } = require('../src/middleware/validationMiddleware');

async function runValidator(validators, bodyData) {
  const req = {
    body: bodyData,
    method: 'POST',
    originalUrl: '/test',
    ip: '127.0.0.1',
  };
  for (const v of validators) await v.run(req);
  req.body = { ...bodyData, ...(req.body || {}) };
  return req;
}

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

describe('validationMiddleware - handleValidationErrors', () => {
  test('passes through when valid', async () => {
  const req = await runValidator([body('email').isEmail()], {
    email: 'test@example.com',   // TLD >= 2 chars
  });
  const res = makeRes();
  let called = false;
  handleValidationErrors(req, res, () => { called = true; });
  expect(called).toBe(true);
});

  test('returns 400 when invalid', async () => {
    const req = await runValidator([body('email').isEmail()], { email: 'not-an-email' });
    const res = makeRes();
    handleValidationErrors(req, res, () => {});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects weak password (<12 chars)', async () => {
    const req = await runValidator([body('password').isLength({ min: 12 })], { password: 'short' });
    const res = makeRes();
    handleValidationErrors(req, res, () => {});
    expect(res.statusCode).toBe(400);
  });

  test('accepts 12+ char password', async () => {
    const req = await runValidator([body('password').isLength({ min: 12 })], { password: 'longpassword123' });
    const res = makeRes();
    let called = false;
    handleValidationErrors(req, res, () => { called = true; });
    expect(called).toBe(true);
  });
});