const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * API Key Authentication Middleware
 *
 * Authenticates requests using developer API keys sent via X-API-Key header.
 * Keys are hashed with SHA-256 before lookup to prevent plaintext storage.
 *
 * Usage: router.get('/endpoint', apiKeyAuth('medications:read'), handler)
 */
function apiKeyAuth(requiredScope) {
  return async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return next(); // No API key — fall through to JWT auth
    }

    try {
      // Lazy-load model to avoid circular deps
      const { sequelizePii } = require('../config/database');
      const { QueryTypes } = require('sequelize');

      // Hash the incoming key
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      const keyPrefix = apiKey.substring(0, 8);

      // Look up the key
      const [key] = await sequelizePii.query(
        `SELECT ak.*, u.id as "userIdRef", u.role, u."isActive" as "userActive"
         FROM api_keys ak
         JOIN users u ON ak."userId" = u.id
         WHERE ak."keyHash" = :keyHash
           AND ak."keyPrefix" = :keyPrefix
           AND ak."isActive" = true
         LIMIT 1`,
        {
          replacements: { keyHash, keyPrefix },
          type: QueryTypes.SELECT,
        }
      );

      if (!key) {
        return res.status(401).json({
          success: false,
          message: 'Invalid API key',
        });
      }

      // Check expiration
      if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
        return res.status(401).json({
          success: false,
          message: 'API key has expired',
        });
      }

      // Check user is still active
      if (!key.userActive) {
        return res.status(401).json({
          success: false,
          message: 'API key owner account is inactive',
        });
      }

      // Check scope
      if (requiredScope) {
        const scopes = Array.isArray(key.scopes) ? key.scopes : [];
        if (!scopes.includes(requiredScope) && !scopes.includes('*')) {
          return res.status(403).json({
            success: false,
            message: `API key missing required scope: ${requiredScope}`,
          });
        }
      }

      // Check rate limit (simple per-hour check)
      // In production, use Redis for distributed rate limiting
      // For now, update lastUsedAt
      await sequelizePii.query(
        `UPDATE api_keys SET "lastUsedAt" = NOW() WHERE id = :id`,
        { replacements: { id: key.id }, type: QueryTypes.UPDATE }
      );

      // Attach minimal user context
      req.apiKey = {
        id: key.id,
        name: key.name,
        scopes: key.scopes,
        userId: key.userId,
      };

      // Load user for downstream middleware compatibility
      const { User } = require('../models');
      const user = await User.findByPk(key.userId, {
        attributes: { exclude: ['password', 'refreshTokenHash', 'emailVerificationToken', 'passwordResetToken'] },
      });

      if (user) {
        req.user = user;
      }

      logger.info('API key authenticated', {
        keyId: key.id,
        keyName: key.name,
        userId: key.userId,
        scope: requiredScope,
      });

      next();
    } catch (error) {
      logger.error('API key authentication error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'API key authentication failed',
      });
    }
  };
}

/**
 * Generate a new API key (returns plaintext key + hash for storage)
 */
function generateApiKey() {
  const key = `cs_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const keyPrefix = key.substring(0, 8);
  return { key, keyHash, keyPrefix };
}

module.exports = { apiKeyAuth, generateApiKey };
