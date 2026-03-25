const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// otplib @12.0.1 uses this destructuring for CommonJS
const { authenticator } = require('otplib'); 
const QRCode = require('qrcode');
const { User } = require('../models');
const authService = require('../services/authService');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

// --- Helper: generate 10 recovery codes ---
function generateRecoveryCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }
  return codes;
}

// --- Helper: hash recovery codes for storage ---
async function hashRecoveryCodes(codes) {
  const hashed = [];
  for (const code of codes) {
    const hash = await bcrypt.hash(code, 10);
    hashed.push({ hash, used: false });
  }
  return hashed;
}

// --- Helper: issue full tokens and set refresh cookie ---
async function issueFullTokens(user, res) {
  const accessToken = authService.generateToken(user);
  const refreshToken = authService.generateRefreshToken(user.id);
  const refreshTokenHash = await authService.hashRefreshToken(refreshToken);

  await user.update({ lastLogin: new Date(), refreshTokenHash });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });

  return accessToken;
}

/**
 * @swagger
 * /api/auth/2fa/setup:
 * post:
 * tags: [Two-Factor Authentication]
 * summary: Begin 2FA setup — generates secret + QR code
 */
router.post(
  '/setup',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);
    if (!user) throw new AppError('User not found', 404);

    if (user.isTwoFactorEnabled) {
      throw new AppError('2FA already enabled.', 400, 'TWO_FACTOR_ALREADY_ENABLED');
    }

    // otplib v12 Syntax: authenticator.generateSecret()
    const secret = authenticator.generateSecret();
    await user.update({ twoFactorSecret: secret });

    // otplib v12 Syntax: authenticator.keyuri()
    const otpauthUrl = authenticator.keyuri(user.email, 'CareSync', secret);

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    logger.info(`2FA setup initiated for user ${user.id}`);

    res.json({
      success: true,
      data: { secret, otpauthUrl, qrCode: qrCodeDataUrl },
    });
  })
);

/**
 * @swagger
 * /api/auth/2fa/confirm-setup:
 * post:
 * tags: [Two-Factor Authentication]
 * summary: Confirm 2FA setup
 */
router.post(
  '/confirm-setup',
  authMiddleware,
  [
    body('token').isString().matches(/^\d{6}$/).withMessage('Token must be a 6-digit code'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);
    if (!user) throw new AppError('User not found', 404);

    if (!user.twoFactorSecret) {
      throw new AppError('No 2FA setup in progress.', 400, 'TWO_FACTOR_NO_SETUP');
    }

    // otplib v12 Syntax: authenticator.check(token, secret)
    const isValid = authenticator.check(req.body.token, user.twoFactorSecret);
    
    if (!isValid) {
      throw new AppError('Invalid TOTP code.', 401, 'INVALID_TOTP');
    }

    const plainCodes = generateRecoveryCodes(10);
    const hashedCodes = await hashRecoveryCodes(plainCodes);

    await user.update({ isTwoFactorEnabled: true, recoveryCodes: hashedCodes });

    logger.info(`2FA enabled for user ${user.id}`);

    res.json({
      success: true,
      message: '2FA enabled. Save your recovery codes.',
      data: { recoveryCodes: plainCodes },
    });
  })
);

/**
 * @swagger
 * /api/auth/2fa/verify:
 * post:
 * tags: [Two-Factor Authentication]
 * summary: Verify TOTP code during login
 */
router.post(
  '/verify',
  [
    body('tempToken').isString().notEmpty().withMessage('Temporary token is required'),
    body('token').isString().matches(/^\d{6}$/).withMessage('Token must be a 6-digit code'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { tempToken, token } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
      throw new AppError('Invalid temporary token.', 401, 'INVALID_TEMP_TOKEN');
    }

    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError('2FA verification failed', 401, 'TWO_FACTOR_ERROR');
    }

    // otplib v12 Syntax: authenticator.check(token, secret)
    const isValid = authenticator.check(token, user.twoFactorSecret);
    
    if (!isValid) {
      logger.warn(`Failed 2FA attempt for user ${user.id}`);
      throw new AppError('Invalid TOTP code', 401, 'INVALID_TOTP');
    }

    const accessToken = await issueFullTokens(user, res);

    logger.info(`2FA verification successful for user ${user.id}`);

    res.json({
      success: true,
      message: 'Authentication complete',
      data: { token: accessToken, user: user.toJSON() },
    });
  })
);

/**
 * @swagger
 * /api/auth/2fa/recovery:
 * post:
 * tags: [Two-Factor Authentication]
 * summary: Use a recovery code
 */
router.post(
  '/recovery',
  [
    body('tempToken').isString().notEmpty().withMessage('Temporary token is required'),
    body('recoveryCode').isString().matches(/^[A-F0-9]{4}-[A-F0-9]{4}$/i).withMessage('Recovery code invalid format'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { tempToken, recoveryCode } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
      throw new AppError('Invalid temporary token', 401, 'INVALID_TEMP_TOKEN');
    }

    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isTwoFactorEnabled) {
      throw new AppError('2FA verification failed', 401, 'TWO_FACTOR_ERROR');
    }

    const codes = user.recoveryCodes || [];
    let matchedIndex = -1;

    for (let i = 0; i < codes.length; i++) {
      if (codes[i].used) continue;
      const isMatch = await bcrypt.compare(recoveryCode.toUpperCase(), codes[i].hash);
      if (isMatch) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex === -1) {
      throw new AppError('Invalid recovery code', 401, 'INVALID_RECOVERY_CODE');
    }

    const updatedCodes = [...codes];
    updatedCodes[matchedIndex] = { ...updatedCodes[matchedIndex], used: true };
    await user.update({ recoveryCodes: updatedCodes });

    const accessToken = await issueFullTokens(user, res);

    res.json({
      success: true,
      message: 'Authentication complete via recovery code.',
      data: { token: accessToken, user: user.toJSON() },
    });
  })
);

/**
 * @swagger
 * /api/auth/2fa/disable:
 * post:
 * tags: [Two-Factor Authentication]
 * summary: Disable 2FA
 */
router.post(
  '/disable',
  authMiddleware,
  [
    body('password').isString().notEmpty().withMessage('Password required'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.isTwoFactorEnabled) {
      throw new AppError('2FA is not enabled', 400);
    }

    const isPasswordValid = await user.comparePassword(req.body.password);
    if (!isPasswordValid) throw new AppError('Invalid password', 401);

    await user.update({ isTwoFactorEnabled: false, twoFactorSecret: null, recoveryCodes: null });

    logger.info(`2FA disabled for user ${user.id}`);
    res.json({ success: true, message: '2FA has been disabled' });
  })
);

/**
 * @swagger
 * /api/auth/2fa/status:
 * get:
 * tags: [Two-Factor Authentication]
 * summary: Check 2FA status
 */
router.get(
  '/status',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'isTwoFactorEnabled', 'recoveryCodes'],
    });
    
    const codes = user.recoveryCodes || [];
    const remainingCodes = codes.filter(c => !c.used).length;

    res.json({
      success: true,
      data: {
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        remainingRecoveryCodes: user.isTwoFactorEnabled ? remainingCodes : null,
      },
    });
  })
);

module.exports = router;