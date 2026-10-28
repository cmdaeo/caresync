const {
  errorHandler,
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
} = require('../src/middleware/errorHandler');

function makeRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  return res;
}

function makeReq() {
  return { requestId: 'req_test', method: 'POST', originalUrl: '/x', ip: '127.0.0.1', headers: {} };
}

describe('Central error handler', () => {
  test('AppError(400) maps to 400 with errorCode', () => {
    const err = new AppError('bad input', 400, 'BAD_INPUT');
    const res = makeRes();
    errorHandler(err, makeReq(), res, () => {});
    expect(res.statusCode).toBe(400);
    expect(res.body.errorCode).toBe('BAD_INPUT');
  });

  test('AuthenticationError maps to 401', () => {
    const res = makeRes();
    errorHandler(new AuthenticationError('nope'), makeReq(), res, () => {});
    expect(res.statusCode).toBe(401);
  });

  test('AuthorizationError maps to 403', () => {
    const res = makeRes();
    errorHandler(new AuthorizationError('denied'), makeReq(), res, () => {});
    expect(res.statusCode).toBe(403);
  });

  test('ValidationError maps to 400 with field', () => {
    const res = makeRes();
    errorHandler(new ValidationError('invalid', 'email'), makeReq(), res, () => {});
    expect(res.statusCode).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  test('NotFoundError maps to 404', () => {
    const res = makeRes();
    errorHandler(new NotFoundError(), makeReq(), res, () => {});
    expect(res.statusCode).toBe(404);
  });

  test('ConflictError maps to 409', () => {
    const res = makeRes();
    errorHandler(new ConflictError(), makeReq(), res, () => {});
    expect(res.statusCode).toBe(409);
  });

  test('SequelizeUniqueConstraintError maps to 409', () => {
    const err = new Error('duplicate');
    err.name = 'SequelizeUniqueConstraintError';
    err.keyValue = { email: 'a@b.c' };
    const res = makeRes();
    errorHandler(err, makeReq(), res, () => {});
    expect(res.statusCode).toBe(409);
    expect(res.body.errorCode).toBe('DUPLICATE_KEY');
  });

  test('JsonWebTokenError maps to 401', () => {
    const err = new Error('invalid');
    err.name = 'JsonWebTokenError';
    const res = makeRes();
    errorHandler(err, makeReq(), res, () => {});
    expect(res.statusCode).toBe(401);
    expect(res.body.errorCode).toBe('INVALID_TOKEN');
  });

  test('TokenExpiredError maps to 401', () => {
    const err = new Error('expired');
    err.name = 'TokenExpiredError';
    const res = makeRes();
    errorHandler(err, makeReq(), res, () => {});
    expect(res.statusCode).toBe(401);
    expect(res.body.errorCode).toBe('TOKEN_EXPIRED');
  });

  test('unknown error becomes 500 without stack leak in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = makeRes();
    const err = new Error('db exploded');
    errorHandler(err, makeReq(), res, () => {});
    process.env.NODE_ENV = prev;
    expect(res.statusCode).toBe(500);
    expect(res.body.stack).toBeUndefined();
  });
});