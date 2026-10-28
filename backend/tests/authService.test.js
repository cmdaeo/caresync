jest.mock('../src/models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Medication: { destroy: jest.fn() },
  Adherence: { destroy: jest.fn() },
  Prescription: { destroy: jest.fn() },
  Device: { destroy: jest.fn() },
  Notification: { destroy: jest.fn() },
  DeviceAccessPermission: { destroy: jest.fn() },
  DeviceInvitation: { destroy: jest.fn() },
  CaregiverPatient: { destroy: jest.fn() },
  ConsentLog: { destroy: jest.fn() },
  sequelizePii: { transaction: jest.fn() },
  sequelizeMedical: { transaction: jest.fn() },
}));

jest.mock('../src/services/auditLogService', () => ({
  logAction: jest.fn().mockResolvedValue({}),
}));

const bcrypt = require('bcryptjs');
const { User } = require('../src/models');
const authService = require('../src/services/authService');

function makeFakeUser(overrides = {}) {
  const hashed = bcrypt.hashSync('correctpassword', 4);
  return {
    id: 'uuid-user-1',
    email: 'test@test.com',
    password: hashed,
    isActive: true,
    isTwoFactorEnabled: false,
    twoFactorSecret: null,
    role: 'patient',
    tokenVersion: 0,
    save: jest.fn().mockResolvedValue(),
    comparePassword: function (candidate) { return bcrypt.compare(candidate, this.password); },
    ...overrides,
  };
}

describe('authService - login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects unknown email', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(authService.login('nope@x.pt', 'pw')).rejects.toThrow('Invalid credentials');
  });

  test('rejects inactive account', async () => {
    User.findOne.mockResolvedValue(makeFakeUser({ isActive: false }));
    await expect(authService.login('test@test.com', 'correctpassword')).rejects.toThrow('inactive');
  });

  test('rejects wrong password', async () => {
    User.findOne.mockResolvedValue(makeFakeUser());
    await expect(authService.login('test@test.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
  });

  test('returns JWT + refresh for valid credentials (no 2FA)', async () => {
    User.findOne.mockResolvedValue(makeFakeUser());
    const result = await authService.login('test@test.com', 'correctpassword');
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user.email).toBe('test@test.com');
    expect(result.requiresTwoFactor).toBeFalsy();
  });

  test('returns partial auth state when 2FA is enabled', async () => {
    User.findOne.mockResolvedValue(makeFakeUser({ isTwoFactorEnabled: true, twoFactorSecret: 'BASE32' }));
    const result = await authService.login('test@test.com', 'correctpassword');
    expect(result.requiresTwoFactor).toBe(true);
    expect(result.tempToken).toBeTruthy();
    expect(result.token).toBeUndefined();
  });
});

describe('authService - register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects duplicate email with ConflictError', async () => {
    User.findOne.mockResolvedValue({ id: 'exists', email: 'x@y.z' });
    await expect(
      authService.register({ email: 'x@y.z', password: 'pw', firstName: 'A', lastName: 'B' })
    ).rejects.toThrow('already exists');
  });

  test('hashes password before storage (delegated to model hook)', async () => {
  User.findOne.mockResolvedValue(null);
  // Simulate the real User model's beforeCreate hook:
  User.create.mockImplementation(async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, 4);
    return makeFakeUser({ ...data, password: hashedPassword });
  });

  const { user } = await authService.register({
    email: 'new@x.pt',
    password: 'NewPassword123',
    firstName: 'A',
    lastName: 'B',
  });
  expect(user.id).toBeDefined();
  expect(user.password.startsWith('$2')).toBe(true);
  expect(user.password).not.toBe('NewPassword123');
});
});

describe('authService - refresh token', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects missing refresh token', async () => {
    await expect(authService.refreshToken(null)).rejects.toThrow();
  });

  test('rejects malformed refresh token', async () => {
    await expect(authService.refreshToken('garbage')).rejects.toThrow('Invalid refresh token');
  });

  test('rejects refresh token whose hash does not match DB', async () => {
    // refresh token signed correctly but hash comparison will fail against a fake hash
    const authRefresh = require('jsonwebtoken').sign(
      { id: 'u1', type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    User.findByPk.mockResolvedValue(makeFakeUser({ refreshTokenHash: '$2a$04$fakehashfakehashfakehashfakehashfakehashfa' }));
    await expect(authService.refreshToken(authRefresh)).rejects.toThrow('Invalid refresh token');
  });
});

describe('authService - changePassword', () => {
  test('rejects incorrect current password', async () => {
    User.findByPk.mockResolvedValue(makeFakeUser());
    await expect(
      authService.changePassword('uuid', 'wrong', 'newpassword123')
    ).rejects.toThrow(/incorrect/);
  });

  test('accepts correct password and bumps tokenVersion', async () => {
    const fakeUser = makeFakeUser({ tokenVersion: 2 });
    User.findByPk.mockResolvedValue(fakeUser);
    await authService.changePassword(fakeUser.id, 'correctpassword', 'newpassword123');
    expect(fakeUser.tokenVersion).toBe(3);
    expect(fakeUser.save).toHaveBeenCalled();
  });
});

describe('authService - logout', () => {
  test('clears refreshTokenHash and saves', async () => {
    const fakeUser = makeFakeUser({ refreshTokenHash: 'stale' });
    await authService.logout(fakeUser);
    expect(fakeUser.refreshTokenHash).toBeNull();
    expect(fakeUser.save).toHaveBeenCalled();
  });
});

describe('authService - forgotPassword', () => {
  test('returns true for unknown email (no user enumeration)', async () => {
    User.findOne.mockResolvedValue(null);
    expect(await authService.forgotPassword('nobody@x.pt')).toBe(true);
  });

  test('returns true for inactive user (no enumeration)', async () => {
    User.findOne.mockResolvedValue(makeFakeUser({ isActive: false }));
    expect(await authService.forgotPassword('test@test.com')).toBe(true);
  });

  test('generates reset token + expiry for valid user', async () => {
    const fakeUser = makeFakeUser({ isActive: true, passwordResetToken: null, passwordResetExpires: null });
    User.findOne.mockResolvedValue(fakeUser);
    expect(await authService.forgotPassword('test@test.com')).toBe(true);
    expect(fakeUser.passwordResetToken).toHaveLength(64); // sha256 hex
    expect(fakeUser.passwordResetExpires).toBeInstanceOf(Date);
    expect(fakeUser.save).toHaveBeenCalled();
  });
});

describe('authService - resetPassword', () => {
  test('rejects invalid token', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(authService.resetPassword('bad-token', 'newpassword123')).rejects.toThrow();
  });

  test('accepts valid token, bumps tokenVersion, clears reset fields', async () => {
    const fakeUser = makeFakeUser({ tokenVersion: 3, refreshTokenHash: 'old', passwordResetToken: 'hash' });
    User.findOne.mockResolvedValue(fakeUser);
    await authService.resetPassword('valid-token', 'newpassword123');
    expect(fakeUser.password).toBe('newpassword123');
    expect(fakeUser.tokenVersion).toBe(4);
    expect(fakeUser.refreshTokenHash).toBeNull();
    expect(fakeUser.passwordResetToken).toBeNull();
    expect(fakeUser.passwordResetExpires).toBeNull();
  });
});

describe('authService - profile', () => {
  test('getProfile throws when user not found', async () => {
    User.findByPk.mockResolvedValue(null);
    await expect(authService.getProfile({ id: 'missing' })).rejects.toThrow(/not found/);
  });

  test('updateProfile mutates and saves provided fields', async () => {
    const fakeUser = makeFakeUser({ firstName: 'Old', lastName: 'Name', save: jest.fn().mockResolvedValue() });
    await authService.updateProfile(fakeUser, { firstName: 'New', lastName: 'Person' });
    expect(fakeUser.firstName).toBe('New');
    expect(fakeUser.lastName).toBe('Person');
    expect(fakeUser.save).toHaveBeenCalled();
  });
});

describe('authService - deleteAccount', () => {
  test('rejects incorrect password', async () => {
    const fakeUser = makeFakeUser();
    User.findByPk.mockResolvedValue(fakeUser);
    await expect(
      authService.deleteAccount({ id: fakeUser.id }, 'wrong')
    ).rejects.toThrow(/Password is incorrect/);
  });
});