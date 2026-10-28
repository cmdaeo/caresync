jest.mock('../src/models', () => ({
  User: { findByPk: jest.fn() },
  CaregiverPatient: { findOne: jest.fn() },
}));

const jwt = require('jsonwebtoken');
const { User, CaregiverPatient } = require('../src/models');
const { authMiddleware, requireRole, requirePatientAccess } = require('../src/middleware/auth');

function makeReq(authHeader, extra = {}) {
  return { headers: authHeader ? { authorization: authHeader } : {}, ip: '127.0.0.1', ...extra };
}

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

const makeToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256' });

describe('authMiddleware - JWT bearer verification', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects missing Authorization header', async () => {
    const res = makeRes();
    let nextCalled = false;
    await authMiddleware(makeReq(null), res, () => { nextCalled = true; });
    expect(res.statusCode).toBe(401);
    expect(nextCalled).toBe(false);
  });

  test('rejects malformed Bearer header', async () => {
    const res = makeRes();
    await authMiddleware(makeReq('Token abc'), res, () => {});
    expect(res.statusCode).toBe(401);
  });

  test('rejects invalid JWT signature', async () => {
    const res = makeRes();
    const bad = jwt.sign({ id: 'u1' }, 'wrong-secret');
    await authMiddleware(makeReq(`Bearer ${bad}`), res, () => {});
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });

  test('rejects expired JWT', async () => {
    const res = makeRes();
    const expired = jwt.sign({ id: 'u1', exp: Math.floor(Date.now() / 1000) - 3600 }, process.env.JWT_SECRET);
    await authMiddleware(makeReq(`Bearer ${expired}`), res, () => {});
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });

  test('rejects when user was deleted', async () => {
    User.findByPk.mockResolvedValue(null);
    const res = makeRes();
    const tok = makeToken({ id: 'u1', tokenVersion: 0 });
    await authMiddleware(makeReq(`Bearer ${tok}`), res, () => {});
    expect(res.statusCode).toBe(401);
  });

  test('rejects inactive account', async () => {
    User.findByPk.mockResolvedValue({ id: 'u1', isActive: false, tokenVersion: 0 });
    const res = makeRes();
    const tok = makeToken({ id: 'u1', tokenVersion: 0 });
    await authMiddleware(makeReq(`Bearer ${tok}`), res, () => {});
    expect(res.statusCode).toBe(401);
  });

  test('rejects token invalidated by password change (tokenVersion bump)', async () => {
    User.findByPk.mockResolvedValue({ id: 'u1', isActive: true, tokenVersion: 5 });
    const res = makeRes();
    const tok = makeToken({ id: 'u1', tokenVersion: 1 });
    await authMiddleware(makeReq(`Bearer ${tok}`), res, () => {});
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('TOKEN_INVALIDATED');
  });

  test('accepts valid token & attaches user', async () => {
    const fakeUser = { id: 'u1', isActive: true, tokenVersion: 0, role: 'patient' };
    User.findByPk.mockResolvedValue(fakeUser);
    const req = makeReq(`Bearer ${makeToken({ id: 'u1', tokenVersion: 0 })}`);
    const res = makeRes();
    let called = false;
    await authMiddleware(req, res, () => { called = true; });
    expect(called).toBe(true);
    expect(req.user).toBe(fakeUser);
  });
});

describe('requireRole - RBAC guard', () => {
  function makeMwReq(role) {
    return { user: { role }, params: {}, body: {}, query: {} };
  }

  test('allows matching single role', () => {
    const res = makeRes();
    let called = false;
    requireRole('caregiver')(makeMwReq('caregiver'), res, () => { called = true; });
    expect(called).toBe(true);
  });

  test('allows any role in array', () => {
    const res = makeRes();
    let called = false;
    requireRole(['caregiver', 'healthcare_provider'])(makeMwReq('healthcare_provider'), res, () => { called = true; });
    expect(called).toBe(true);
  });

  test('denies non-matching role with 403', () => {
    const res = makeRes();
    requireRole('admin')(makeMwReq('patient'), res, () => {});
    expect(res.statusCode).toBe(403);
  });
});

describe('requirePatientAccess - IDOR guard', () => {
  beforeEach(() => jest.clearAllMocks());

  test('allows patient to access own data', async () => {
    const req = { user: { id: 'p1', role: 'patient' }, params: { patientId: 'p1' }, body: {}, query: {} };
    const res = makeRes();
    let called = false;
    await requirePatientAccess(req, res, () => { called = true; });
    expect(called).toBe(true);
  });

  test('allows caregiver with verified active relationship', async () => {
    CaregiverPatient.findOne.mockResolvedValue({ hasAccess: () => true });
    const req = { user: { id: 'c1', role: 'caregiver' }, params: { patientId: 'p1' }, body: {}, query: {} };
    const res = makeRes();
    let called = false;
    await requirePatientAccess(req, res, () => { called = true; });
    expect(called).toBe(true);
  });

  test('denies caregiver without relationship', async () => {
    CaregiverPatient.findOne.mockResolvedValue(null);
    const req = { user: { id: 'c1', role: 'caregiver' }, params: { patientId: 'p1' }, body: {}, query: {} };
    const res = makeRes();
    await requirePatientAccess(req, res, () => {});
    expect(res.statusCode).toBe(403);
  });
});