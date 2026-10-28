jest.mock('../src/models', () => ({
  Medication: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  },
  Adherence: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    findOrCreate: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
  CaregiverPatient: { findOne: jest.fn(), findAll: jest.fn() },
  sequelizeMedical: {
    transaction: jest.fn(async (cb) => cb({})),
    fn: jest.fn(), col: jest.fn(), literal: jest.fn(),
  },
}));

const {
  Medication, Adherence, CaregiverPatient, sequelizeMedical,
} = require('../src/models');
const medicationService = require('../src/services/medicationService');

const user = { id: 'u1', role: 'patient', email: 'p@x.pt' };

describe('medicationService.createMedication - PRN rules', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects scheduled medication without endDate', async () => {
    await expect(medicationService.createMedication(user, {
      name: 'Aspirin', dosage: '100', dosageUnit: 'mg',
      frequency: 'Once daily', startDate: '2026-06-01T00:00:00Z',
      isPRN: false, endDate: null,
    })).rejects.toThrow(/endDate is required/i);
  });

  test('accepts PRN medication without endDate', async () => {
    Medication.create.mockResolvedValue({ id: 'm1', name: 'Ibuprofen' });
    const result = await medicationService.createMedication(user, {
      name: 'Ibuprofen', dosage: '200', dosageUnit: 'mg',
      frequency: 'As needed', startDate: '2026-06-01T00:00:00Z',
      isPRN: true,
    });
    expect(result.id).toBe('m1');
  });

  test('rejects endDate before startDate', async () => {
    await expect(medicationService.createMedication(user, {
      name: 'X', dosage: '1', dosageUnit: 'mg',
      startDate: '2026-06-15T00:00:00Z',
      endDate: '2026-06-01T00:00:00Z',
      isPRN: false,
    })).rejects.toThrow(/must be on or after/i);
  });

  test('rejects totalQuantity < 1', async () => {
    await expect(medicationService.createMedication(user, {
      name: 'X', dosage: '1', dosageUnit: 'mg',
      startDate: '2026-06-01T00:00:00Z',
      endDate: '2026-07-01T00:00:00Z',
      totalQuantity: 0, isPRN: false,
    })).rejects.toThrow(/at least 1/i);
  });

  test('strips caller-supplied remainingQuantity (inventory is system-owned)', async () => {
    let capturedData;
    Medication.create.mockImplementation((d) => { capturedData = d; return d; });
    await medicationService.createMedication(user, {
      name: 'Safe', dosage: '1', dosageUnit: 'mg',
      startDate: '2026-06-01T00:00:00Z',
      endDate: '2026-07-01T00:00:00Z',
      totalQuantity: 30,
      remainingQuantity: 9999, // attacker attempt
      isPRN: false,
    });
    expect(capturedData.remainingQuantity).toBe(30); // seeded from totalQuantity, NOT 9999
  });
});

describe('medicationService.updateMedication - immutability guards', () => {
  beforeEach(() => jest.clearAllMocks());

  test('ignores attempts to set remainingQuantity directly', async () => {
    const med = { id: 'm1', userId: 'u1', update: jest.fn() };
    Medication.findOne.mockResolvedValue(med);
    Adherence.count.mockResolvedValue(0);

    await medicationService.updateMedication(user, 'm1', {
      remainingQuantity: 1000000,
      name: 'renamed',
    });
    expect(med.update).toHaveBeenCalledWith(expect.not.objectContaining({
      remainingQuantity: expect.anything(),
    }));
  });

  test('refuses startDate after existing adherence records', async () => {
    const med = { id: 'm1', userId: 'u1', update: jest.fn() };
    Medication.findOne.mockResolvedValue(med);
    Adherence.count.mockResolvedValue(3);
    Adherence.findOne.mockResolvedValue({ scheduledTime: new Date('2026-05-01T08:00:00Z') });

    await expect(medicationService.updateMedication(user, 'm1', {
      startDate: '2026-06-01T00:00:00Z',
    })).rejects.toThrow(/orphan/i);
  });

  test('refuses totalQuantity below doses already taken', async () => {
    const med = { id: 'm1', userId: 'u1', update: jest.fn() };
    Medication.findOne.mockResolvedValue(med);
    Adherence.count
      .mockResolvedValueOnce(5)  // all adherence
      .mockResolvedValueOnce(3); // doses taken
    Adherence.findOne.mockResolvedValue({ scheduledTime: new Date('2026-04-01T08:00:00Z') });

    await expect(medicationService.updateMedication(user, 'm1', {
      totalQuantity: 2,
    })).rejects.toThrow(/already been taken/i);
  });
});

describe('medicationService.recordAdherence - safety state machine', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects dose more than 60 min in the future', async () => {
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    await expect(medicationService.recordAdherence(user, {
      medicationId: 'm1', status: 'taken', scheduledTime: future,
    })).rejects.toThrow(/in the future/i);
  });

  test('rejects takenAt more than 5 min in the future', async () => {
    const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await expect(medicationService.recordAdherence(user, {
      medicationId: 'm1', status: 'taken',
      scheduledTime: new Date().toISOString(),
      takenAt: future,
    })).rejects.toThrow(/takenAt cannot be in the future/i);
  });

  test('rejects when medication does not belong to caller (IDOR)', async () => {
    Medication.findOne.mockResolvedValue(null);
    await expect(medicationService.recordAdherence(user, {
      medicationId: 'someone-elses-med', status: 'taken',
      scheduledTime: new Date().toISOString(),
    })).rejects.toThrow('Medication not found');
  });
});

describe('medicationService.getCalendarData - resource guards', () => {
  beforeEach(() => jest.clearAllMocks());

  test('clamps absurd query windows (defensive against DoS)', async () => {
    Medication.findAll.mockResolvedValue([]);
    Adherence.findAll.mockResolvedValue([]);
    const start = new Date().toISOString();
    const farFuture = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
    const result = await medicationService.getCalendarData(user, {
      startDate: start, endDate: farFuture,
    });
    const end = new Date(result.dateRange.endDate).getTime();
    const startMs = new Date(result.dateRange.startDate).getTime();
    const days = (end - startMs) / 86400000;
    expect(days).toBeLessThanOrEqual(91); // MAX_CALENDAR_WINDOW_DAYS = 90
  });
});

jest.mock('../src/models', () => ({
  Medication: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),      // ← adicionar
  },
  Adherence: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    findOrCreate: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
  CaregiverPatient: { findOne: jest.fn(), findAll: jest.fn() },
  sequelizeMedical: {
    transaction: jest.fn(async (cb) => cb({})),
    fn: jest.fn(), col: jest.fn(), literal: jest.fn(),
  },
}));

const { Op } = require('sequelize');

describe('medicationService.getMedications', () => {
  beforeEach(() => jest.clearAllMocks());   // ← ESTA LINHA FALTAVA

  test('computes pagination offset correctly (page 3, limit 10 → offset 20)', async () => {
    Medication.findAndCountAll.mockResolvedValue({ count: 50, rows: [{ id: 'm1' }] });
    const result = await medicationService.getMedications(user, { page: 3, limit: 10 });
    const args = Medication.findAndCountAll.mock.calls[0][0];
    expect(args.limit).toBe(10);
    expect(args.offset).toBe(20);
    expect(result.pagination.currentPage).toBe(3);
    expect(result.pagination.totalItems).toBe(50);
  });

  test('applies iLike search filter', async () => {
    Medication.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await medicationService.getMedications(user, { search: 'aspirin' });
    const where = Medication.findAndCountAll.mock.calls[0][0].where;
    expect(where.name[Op.iLike]).toBe('%aspirin%');
  });

  test('status="all" omits isActive filter', async () => {
    Medication.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    await medicationService.getMedications(user, { status: 'all' });
    const where = Medication.findAndCountAll.mock.calls[0][0].where;
    expect(where.isActive).toBeUndefined();
  });

  test('denies caregiver without permission', async () => {
    CaregiverPatient.findOne.mockResolvedValue(null);
    await expect(
      medicationService.getMedications({ id: 'c1', role: 'caregiver' }, { patientId: 'p1' })
    ).rejects.toThrow(/Access denied/);
  });
});

describe('medicationService.getMedication', () => {
  beforeEach(() => jest.clearAllMocks());

  test('throws 404 when not found', async () => {
    Medication.findOne.mockResolvedValue(null);
    await expect(medicationService.getMedication(user, 'missing')).rejects.toThrow('Medication not found');
  });

  test('denies IDOR when caregiver lacks access to target patient', async () => {
    CaregiverPatient.findOne.mockResolvedValue(null);
    await expect(
      medicationService.getMedication({ id: 'c1', role: 'caregiver' }, 'med-id', 'other-patient')
    ).rejects.toThrow(/Access denied/);
  });
});

describe('medicationService.deleteMedication', () => {
  beforeEach(() => jest.clearAllMocks());

  test('cascades adherence records + destroys medication', async () => {
    const fakeMed = { id: 'm1', userId: 'u1', destroy: jest.fn().mockResolvedValue() };
    Medication.findOne.mockResolvedValue(fakeMed);
    await medicationService.deleteMedication(user, 'm1');
    expect(Adherence.destroy).toHaveBeenCalledWith({ where: { medicationId: 'm1' } });
    expect(fakeMed.destroy).toHaveBeenCalled();
  });

  test('throws 404 when not found', async () => {
    Medication.findOne.mockResolvedValue(null);
    await expect(medicationService.deleteMedication(user, 'missing')).rejects.toThrow();
  });
});

describe('medicationService.getAdherenceStats', () => {
  beforeEach(() => jest.clearAllMocks());

  test('computes rate correctly (taken+late / total)', async () => {
    Adherence.findAll.mockResolvedValue([
      { status: 'taken' }, { status: 'taken' }, { status: 'late' },
      { status: 'missed' }, { status: 'skipped' },
    ]);
    const stats = await medicationService.getAdherenceStats(user, {});
    expect(stats.total).toBe(5);
    expect(stats.taken).toBe(3);
    expect(stats.missed).toBe(1);
    expect(stats.skipped).toBe(1);
    expect(stats.rate).toBe(60);
  });

  test('returns rate=0 for empty dataset (no division by zero)', async () => {
    Adherence.findAll.mockResolvedValue([]);
    const stats = await medicationService.getAdherenceStats(user, {});
    expect(stats.rate).toBe(0);
    expect(stats.total).toBe(0);
  });
});