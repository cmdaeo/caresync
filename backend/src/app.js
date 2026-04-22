require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Import middleware (core functionality)
const { errorHandler } = require('./middleware/errorHandler');
const { csrfProtection, generateToken, CSRF_COOKIE_NAME } = require('./middleware/csrf');
const { logRequest, generateRequestId } = require('./middleware/requestLogger');
const logger = require('./utils/logger');

// Lazy load routes and database (only when needed)
let routesLoaded = false;
let authRoutes, userRoutes, medicationRoutes, caregiverRoutes, patientRoutes,
    deviceRoutes, notificationRoutes, reportsRoutes, consentRoutes,
    twoFactorRoutes, prescriptionRoutes, apiDocsRoutes;
let authMiddleware, sequelizePii, sequelizeMedical, generateSampleData, specs, swaggerUi;

function loadRoutes() {
  if (routesLoaded) return;

  try {
    // Import routes
    authRoutes = require('./routes/auth');
    userRoutes = require('./routes/users');
    medicationRoutes = require('./routes/medications');
    caregiverRoutes = require('./routes/caregivers');
    patientRoutes = require('./routes/patients');
    deviceRoutes = require('./routes/devices');
    notificationRoutes = require('./routes/notifications');
    reportsRoutes = require('./routes/reports');
    consentRoutes = require('./routes/consent');
    twoFactorRoutes = require('./routes/twoFactor');
    prescriptionRoutes = require('./routes/prescriptions');
    apiDocsRoutes = require('./routes/api-docs');

    // Import middleware and database
    authMiddleware = require('./middleware/auth').authMiddleware;
    const db = require('./config/database');
    sequelizePii = db.sequelizePii;
    sequelizeMedical = db.sequelizeMedical;
    generateSampleData = require('./utils/sampleDataGenerator');

    // Swagger setup
    const swagger = require('./swagger');
    specs = swagger.specs;
    swaggerUi = swagger.swaggerUi;

    routesLoaded = true;
  } catch (error) {
    logger.error('Failed to load routes:', error);
    throw error;
  }
}

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

// Routes that require database access
const dbRequiredRoutes = [
  '/api/auth',
  '/api/users',
  '/api/medications',
  '/api/caregivers',
  '/api/patients',
  '/api/devices',
  '/api/notifications',
  '/api/reports',
  '/api/consent',
  '/api/prescriptions'
];

// Database initialization middleware (lazy, serverless-compatible)
let dbInitialized = false;

async function initializeDatabase() {
  if (dbInitialized) return;

  try {
    logger.info('Initializing database connections...');

    // Check if we have a proper database URL in production
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required for production deployment');
    }

    await sequelizePii.authenticate();
    logger.info('Database connection established.');

    // In production, try to sync tables if they don't exist
    // This is safe to run multiple times and will only create missing tables
    if (process.env.NODE_ENV === 'production') {
      try {
        logger.info('Checking database schema in production...');
        await syncDatabase(sequelizePii, 'Database');
        logger.info('Database schema verified/created successfully.');
      } catch (syncError) {
        logger.warn('Database sync failed, but continuing:', syncError.message);
        // Don't throw here - the app might still work if tables already exist
      }
    } else if (process.env.NODE_ENV === 'development') {
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
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
        vercel: process.env.VERCEL,
      },
    });
    throw error;
  }
}

// Lazy database init for serverless - only initialize for routes that need it
app.use(async (req, res, next) => {
  // Skip database initialization for routes that don't need it
  const needsDb = dbRequiredRoutes.some(route => req.path.startsWith(route));
  if (!needsDb) {
    return next();
  }

  if (!dbInitialized) {
    try {
      logger.info('Initializing database for route:', { requestId: req.requestId, path: req.path });
      await initializeDatabase();
      logger.info('Database initialized successfully', { requestId: req.requestId });
    } catch (error) {
      logger.error('Database init failed on request:', {
        requestId: req.requestId,
        url: req.url,
        error: error.message,
        stack: error.stack,
      });
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: error.message,
        requestId: req.requestId
      });
    }
  }
  next();
});

// CSRF token endpoint (no database required)
app.get('/api/csrf-token', (req, res) => {
  try {
    logger.info('Generating CSRF token', { requestId: req.requestId });
    const token = generateToken();
    logger.info('CSRF token generated successfully', { requestId: req.requestId });

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
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSRF token',
      error: error.message,
      requestId: req.requestId
    });
  }
});

// Health check endpoint (no database required)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    requestId: req.requestId
  });
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

// Swagger UI route (lazy loaded)
app.use('/api-docs', (req, res, next) => {
  loadRoutes();
  swaggerUi.serve(req, res, next);
}, (req, res) => {
  loadRoutes();
  swaggerUi.setup(specs)(req, res);
});

// --- API ROUTES (lazy loaded) ---
app.use('/api/auth', (req, res, next) => {
  loadRoutes();
  authRoutes(req, res, next);
});
app.use('/api/auth/2fa', (req, res, next) => {
  loadRoutes();
  twoFactorRoutes(req, res, next);
});
app.use('/api/users', (req, res, next) => {
  loadRoutes();
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    userRoutes(req, res, next);
  });
});
app.use('/api/medications', (req, res, next) => {
  loadRoutes();
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    medicationRoutes(req, res, next);
  });
});
app.use('/api/caregivers', (req, res, next) => {
  loadRoutes();
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    caregiverRoutes(req, res, next);
  });
});
app.use('/api/patients', (req, res, next) => {
  loadRoutes();
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    patientRoutes(req, res, next);
  });
});
app.use('/api/devices', (req, res, next) => {
  loadRoutes();
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    deviceRoutes(req, res, next);
  });
});
app.use('/api/notifications', (req, res, next) => {
  loadRoutes();
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    notificationRoutes(req, res, next);
  });
});
app.use('/api/reports', (req, res, next) => {
  loadRoutes();
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    reportsRoutes(req, res, next);
  });
});
app.use('/api/consent', (req, res, next) => {
  loadRoutes();
  consentRoutes(req, res, next);
});
app.use('/api/prescriptions', (req, res, next) => {
  loadRoutes();
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    prescriptionRoutes(req, res, next);
  });
});
if (process.env.NODE_ENV === 'development') {
  app.use('/api/api-docs', (req, res, next) => {
    loadRoutes();
    apiDocsRoutes(req, res, next);
  });
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
  loadRoutes(); // Ensure database is loaded
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
    if (routesLoaded && sequelizePii && sequelizeMedical) {
      await sequelizePii.close();
      await sequelizeMedical.close();
      logger.info('Both database connections closed.');
    }
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  try {
    if (routesLoaded && sequelizePii && sequelizeMedical) {
      await sequelizePii.close();
      await sequelizeMedical.close();
      logger.info('Both database connections closed.');
    }
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
