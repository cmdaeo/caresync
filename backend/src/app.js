require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// General rate limiter: 100 requests per minute per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Strict auth limiter: 5 attempts per 15 minutes per IP (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});
const { Server } = require('socket.io');
const http = require('http');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const medicationRoutes = require('./routes/medications');
const caregiverRoutes = require('./routes/caregivers');
const patientRoutes = require('./routes/patients');
const deviceRoutes = require('./routes/devices');
const notificationRoutes = require('./routes/notifications');
<<<<<<< HEAD
const snsRoutes = require('./routes/sns');

=======
>>>>>>> upstream/main
const reportsRoutes = require('./routes/reports');
const apiDocsRoutes = require('./routes/api-docs');

// Import middleware
const { authMiddleware } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const db = require('./config/database');
const generateSampleData = require('./utils/sampleDataGenerator');

// Swagger setup
const { specs, swaggerUi } = require('./swagger');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
app.set('io', io);

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Allow Google Fonts
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      // Allow localhost API and WebSockets
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
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'x-app-version'],
}));

app.use(generalLimiter);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// DETAILED REQUEST LOGGER
app.use((req, res, next) => {
  const safeBody = { ...req.body };
  if (safeBody.password) safeBody.password = '[REDACTED]';
  if (safeBody.newPassword) safeBody.newPassword = '[REDACTED]';
  if (safeBody.token) safeBody.token = '[REDACTED]';

  logger.info(`Incoming: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    query: req.query,
    body: safeBody
  });
  next();
});

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

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
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/medications', authMiddleware, medicationRoutes);
app.use('/api/caregivers', authMiddleware, caregiverRoutes);
app.use('/api/patients', authMiddleware, patientRoutes);
app.use('/api/devices', authMiddleware, deviceRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
<<<<<<< HEAD
app.use('/api/sns', authMiddleware, snsRoutes);
app.use('/api/adherence',authMiddleware, reportsRoutes);
=======
app.use('/api/reports', authMiddleware, reportsRoutes);
if (process.env.NODE_ENV === 'development') {
  const apiDocsRoutes = require('./routes/api-docs');
  app.use('/api/api-docs', apiDocsRoutes);
}
>>>>>>> upstream/main

// Socket.IO
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  socket.on('join-user', (userId) => socket.join(`user-${userId}`));
  socket.on('join-caregiver', (caregiverId) => socket.join(`caregiver-${caregiverId}`));
  socket.on('disconnect', () => logger.info(`User disconnected: ${socket.id}`));
});

// 404 Handler
app.use('*', (req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    message: 'Frontend requested a non-existent route'
  });
  res.status(404).json({ success: false, message: 'Route not found', path: req.originalUrl });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await db.authenticate();
    logger.info('Database connection established successfully.');

    if (process.env.NODE_ENV === 'development') {
      try {
        // 1. Try safe sync (alter: true)
        // This attempts to update tables without losing data
        await db.query('PRAGMA foreign_keys = OFF;');
        await db.sync({ alter: true });
        await db.query('PRAGMA foreign_keys = ON;');
        logger.info('Database models synchronized (ALTER).');
      } catch (syncError) {
        // 2. Fallback: If ALTER fails (like your SQLite Unique Constraint error),
        // we force a hard reset. This wipes data but fixes the error.
        logger.warn('Safe sync failed. Falling back to FORCE sync (Recreating tables)...');
        logger.error(syncError.message);
        
        await db.query('PRAGMA foreign_keys = OFF;');
        await db.sync({ force: true });
        await db.query('PRAGMA foreign_keys = ON;');
        logger.info('Database models synchronized (FORCE).');
      }

      // 3. Always run sample data generator in dev
      // It handles checking if users exist, so safe to run often.
      await generateSampleData();
    } else if (process.env.NODE_ENV === 'test') {
      // For test environment, we can use force sync to ensure clean state
      await db.query('PRAGMA foreign_keys = OFF;');
      await db.sync({ force: true });
      await db.query('PRAGMA foreign_keys = ON;');
      logger.info('Database models synchronized (FORCE) for test environment.');
    }

    server.listen(PORT, () => {
      logger.info(`🚀 CareSync Backend Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    try {
      await db.close();
      logger.info('Database connection closed.');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    try {
      await db.close();
      logger.info('Database connection closed.');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

module.exports = app;
