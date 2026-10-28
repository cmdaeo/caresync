jest.mock('../src/models', () => ({
  Prescription: { findOne: jest.fn() },
  CaregiverPatient: { findOne: jest.fn() },
  User: { findByPk: jest.fn() },
}));

// Prevent app.js from trying to open a Postgres connection in tests.
jest.mock('../src/config/database', () => {
  const fake = {
    authenticate: jest.fn().mockResolvedValue(),
    sync: jest.fn().mockResolvedValue(),
    close: jest.fn().mockResolvedValue(),
    transaction: jest.fn(async (cb) => cb({})),
    query: jest.fn().mockResolvedValue([[]]),
    define: jest.fn(),
    fn: jest.fn(),
    col: jest.fn(),
    literal: jest.fn(),
  };
  return { sequelizePii: fake, sequelizeMedical: fake };
});

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { Prescription, CaregiverPatient, User } = require('../src/models');

const RX_UUID = '11111111-1111-4111-8111-111111111111';
const MISSING_UUID = '99999999-9999-4999-8999-999999999999';

const provider = {
  id: 'prov-1',
  role: 'healthcare_provider',
  isActive: true,
  tokenVersion: 0,
  email: 'prov@x.pt',
};

const admin = {
  id: 'adm-1',
  role: 'admin',
  isActive: true,
  tokenVersion: 0,
  email: 'adm@x.pt',
};

const tokenFor = (u) =>
  jwt.sign(
    { id: u.id, role: u.role, tokenVersion: 0 },
    process.env.JWT_SECRET
  );

function fakePrescription(overrides = {}) {
  return {
    id: RX_UUID,
    userId: 'patient-uuid',
    prescriptionNumber: 'RX-TEST',
    isActive: true,
    update: jest.fn().mockResolvedValue(),
    ...overrides,
  };
}

describe('PUT /api/prescriptions/:id/review - BOLA/IDOR guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findByPk.mockImplementation(async (id) => {
      if (id === provider.id) return provider;
      if (id === admin.id) return admin;
      return null;
    });
  });

  test('rejects review when provider is not assigned to the patient', async () => {
    const update = jest.fn();
    Prescription.findOne.mockResolvedValue(
      fakePrescription({ userId: 'other-patient-uuid', update })
    );
    CaregiverPatient.findOne.mockResolvedValue(null);

    const res = await request(app)
      .put(`/api/prescriptions/${RX_UUID}/review`)
      .set('Authorization', `Bearer ${tokenFor(provider)}`)
      .send({ reviewNotes: 'looks fine' });

    expect(res.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  test('rejects when assignment exists but canManageMedications is false', async () => {
    const update = jest.fn();
    Prescription.findOne.mockResolvedValue(
      fakePrescription({ update })
    );
    CaregiverPatient.findOne.mockResolvedValue({
      permissions: { canManageMedications: false },
    });

    const res = await request(app)
      .put(`/api/prescriptions/${RX_UUID}/review`)
      .set('Authorization', `Bearer ${tokenFor(provider)}`)
      .send({ reviewNotes: 'looks fine' });

    expect(res.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  test('allows review when provider is assigned with canManageMedications', async () => {
    const update = jest.fn().mockResolvedValue();
    Prescription.findOne.mockResolvedValue(
      fakePrescription({ update })
    );
    CaregiverPatient.findOne.mockResolvedValue({
      permissions: { canManageMedications: true },
    });

    const res = await request(app)
      .put(`/api/prescriptions/${RX_UUID}/review`)
      .set('Authorization', `Bearer ${tokenFor(provider)}`)
      .send({ reviewNotes: 'looks fine' });

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalled();
  });

  test('admin bypasses the assignment check', async () => {
    const update = jest.fn().mockResolvedValue();
    Prescription.findOne.mockResolvedValue(
      fakePrescription({ update })
    );
    CaregiverPatient.findOne.mockResolvedValue(null);

    const res = await request(app)
      .put(`/api/prescriptions/${RX_UUID}/review`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ reviewNotes: 'ok' });

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalled();
  });

  test('returns 404 when prescription does not exist', async () => {
    Prescription.findOne.mockResolvedValue(null);

    const res = await request(app)
      .put(`/api/prescriptions/${MISSING_UUID}/review`)
      .set('Authorization', `Bearer ${tokenFor(provider)}`)
      .send({ reviewNotes: 'x' });

    expect(res.status).toBe(404);
  });
});