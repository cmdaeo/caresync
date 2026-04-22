require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const medicationRoutes = require('./routes/medications');
const caregiverRoutes = require('./routes/caregivers');
const patientRoutes = require('./routes/patients');
const deviceRoutes = require('./routes/devices');
const notificationRoutes = require('./routes/notifications');
const reportsRoutes = require('./routes/reports');
const consentRoutes = require('./routes/consent');
const twoFactorRoutes = require('./routes/twoFactor');
const prescriptionRoutes = require('./routes/prescriptions');
const apiDocsRoutes = require('./routes/api-docs');

// Import middleware
const { authMiddleware } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { csrfProtection, generateToken, CSRF_COOKIE_NAME } = require('./middleware/csrf');
const { logRequest, generateRequestId } = require('./middleware/requestLogger');
const logger = require('./utils/logger');
const { sequelizePii, sequelizeMedical } = require('./config/database');
const generateSampleData = require('./utils/sampleDataGenerator');

// Swagger setup
const { specs, swaggerUi } = require('./swagger');

const app = express();

// Trust proxy for Vercel deployment
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      objectSrc: ["'self'", "blob:"],
      frameSrc: ["'self'", "blob:"],
      workerSrc: ["'self'", "blob:"],
      connectSrc: ["'self'", "http://localhost:5000", "https://api.caresync.com", "wss:", "ws:"],
    },
  },
}));

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:19006',
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'x-app-version', 'x-csrf-token'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request ID and logging middleware
app.use((req, res, next) => {
  req.requestId = generateRequestId();
  logRequest(req);
  next();
});

// Database initialization middleware (lazy, serverless-compatible)
let dbInitialized = false;

async function initializeDatabase() {
  if (dbInitialized) return;

  try {
    logger.info('Initializing database connections...');

    await sequelizePii.authenticate();
    logger.info('PII database connection established.');

    await sequelizeMedical.authenticate();
    logger.info('Medical database connection established.');

    if (process.env.NODE_ENV === 'development') {
      await syncDatabase(sequelizePii, 'PII');
      await syncDatabase(sequelizeMedical, 'Medical');
      await generateSampleData();
    }

    dbInitialized = true;
    logger.info('Database initialization complete.');
  } catch (error) {
    logger.error('Database initialization failed:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
    });
    throw error;
  }
}

// Lazy database init for serverless
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
    } catch (error) {
      logger.error('Database init failed on request:', {
        requestId: req.requestId,
        url: req.url,
        error: error.message,
      });
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        requestId: req.requestId
      });
    }
  }
  next();
});

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  try {
    const token = generateToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 1000, // 1 hour
    });
    res.json({
      success: true,
      data: { csrfToken: token },
      requestId: req.requestId
    });
  } catch (error) {
    logger.error('CSRF token generation failed:', {
      requestId: req.requestId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSRF token',
      requestId: req.requestId
    });
  }
});

// Apply CSRF protection globally to all mutating API routes
app.use(csrfProtection);

// --- Rate Limiting ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

const twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many 2FA attempts. Please try again later.' }
});
app.use('/api/auth/2fa/verify', twoFactorLimiter);
app.use('/api/auth/2fa/recovery', twoFactorLimiter);

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many report requests, please try again later.' }
});
app.use('/api/reports', reportLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/auth/2fa', twoFactorRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/medications', authMiddleware, medicationRoutes);
app.use('/api/caregivers', authMiddleware, caregiverRoutes);
app.use('/api/patients', authMiddleware, patientRoutes);
app.use('/api/devices', authMiddleware, deviceRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/reports', authMiddleware, reportsRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/prescriptions', authMiddleware, prescriptionRoutes);
if (process.env.NODE_ENV === 'development') {
  const apiDocsRoutes = require('./routes/api-docs');
  app.use('/api/api-docs', apiDocsRoutes);
}

// Socket.IO disabled for serverless deployment
if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  logger.info('Socket.IO disabled in serverless environment');
}

// 404 Handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, {
    requestId: req.requestId,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    message: 'Frontend requested a non-existent route'
  });
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    requestId: req.requestId
  });
});

app.use(errorHandler);

async function syncDatabase(instance, label) {
  const dialect = instance.getDialect();

  try {
    if (dialect === 'sqlite') {
      await instance.query('PRAGMA foreign_keys = OFF;');
    }
    await instance.sync({ alter: true });
    if (dialect === 'sqlite') {
      await instance.query('PRAGMA foreign_keys = ON;');
    }
    logger.info(`${label} database synchronized (ALTER).`);
  } catch (syncError) {
    logger.warn(`${label} safe sync failed. Falling back to FORCE sync...`);
    logger.error(syncError.message);
    if (dialect === 'sqlite') {
      await instance.query('PRAGMA foreign_keys = OFF;');
    }
    await instance.sync({ force: true });
    if (dialect === 'sqlite') {
      await instance.query('PRAGMA foreign_keys = ON;');
    }
    logger.info(`${label} database synchronized (FORCE).`);
  }
}

// Graceful shutdown (for local development)
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  try {
    await sequelizePii.close();
    await sequelizeMedical.close();
    logger.info('Both database connections closed.');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  try {
    await sequelizePii.close();
    await sequelizeMedical.close();
    logger.info('Both database connections closed.');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Export app for serverless deployment
module.exports = app;
