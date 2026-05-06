const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// In-memory status history (persists only for the lifetime of the process)
const statusHistory = [];
const MAX_HISTORY = 50;

function addHistoryEntry(status, latencyMs = null) {
  statusHistory.push({
    status,
    latencyMs,
    timestamp: new Date().toISOString()
  });
  if (statusHistory.length > MAX_HISTORY) {
    statusHistory.shift();
  }
}

/**
 * @swagger
 * /api/status:
 *   get:
 *     tags: [Status]
 *     summary: Public health check — minimal OK/degraded info
 *     responses:
 *       200:
 *         description: System status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ok, degraded]
 *                 timestamp:
 *                   type: string
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let dbOk = false;
    try {
      const { sequelizePii } = require('../config/database');
      await sequelizePii.authenticate();
      dbOk = true;
    } catch {
      // DB is down
    }

    const status = dbOk ? 'ok' : 'degraded';
    addHistoryEntry(status);

    res.json({
      success: true,
      data: {
        status,
        timestamp: new Date().toISOString(),
        history: statusHistory
      },
    });
  })
);

/**
 * @swagger
 * /api/status/detailed:
 *   get:
 *     tags: [Status]
 *     summary: Detailed system health — admin only
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed system status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                 database:
 *                   type: object
 *                 security:
 *                   type: object
 *                 environment:
 *                   type: object
 */
router.get(
  '/detailed',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    // ── Database health ──
    let dbStatus = 'disconnected';
    let dbLatencyMs = null;
    try {
      const { sequelizePii } = require('../config/database');
      const start = Date.now();
      await sequelizePii.authenticate();
      dbLatencyMs = Date.now() - start;
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = `error: ${err.message}`;
    }

    const currentStatus = dbStatus === 'connected' ? 'ok' : 'degraded';
    addHistoryEntry(currentStatus, dbLatencyMs);

    // ── Security posture (feature flags, never secrets) ──
    const security = {
      csrfProtection: true,
      rateLimiting: true,
      helmetEnabled: true,
      corsConfigured: true,
      twoFactorAvailable: true,
      piiEncryptionEnabled: !!process.env.ENCRYPTION_KEY,
      auditLogging: true,
      passwordHashAlgorithm: 'bcrypt-12',
      jwtAccessTokenLifetime: process.env.JWT_EXPIRE || '15m',
      jwtRefreshTokenLifetime: process.env.JWT_REFRESH_EXPIRE || '30d',
    };

    // ── Environment info (safe subset) ──
    const environment = {
      nodeEnv: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      isServerless: !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME),
      criticalEnvVarsLoaded: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        JWT_SECRET: !!process.env.JWT_SECRET,
        JWT_REFRESH_SECRET: !!process.env.JWT_REFRESH_SECRET,
        ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
        MASTER_KEY: !!process.env.MASTER_KEY,
        CSRF_SECRET: !!(process.env.CSRF_SECRET || process.env.SESSION_SECRET),
      },
    };

    // ── Uptime ──
    const uptimeSeconds = process.uptime();

    logger.info('Admin status check performed', { userId: req.user.id });

    res.json({
      success: true,
      data: {
        status: dbStatus === 'connected' ? 'ok' : 'degraded',
        uptime: {
          seconds: Math.floor(uptimeSeconds),
          human: formatUptime(uptimeSeconds),
        },
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          dialect: 'postgres',
          provider: 'supabase',
        },
        security,
        environment,
        version: require('../../package.json').version || '1.0.0',
        timestamp: new Date().toISOString(),
        history: statusHistory
      },
    });
  })
);

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

module.exports = router;
