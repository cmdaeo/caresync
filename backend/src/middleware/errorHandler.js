const logger = require('../utils/logger');
const { logError, logDatabaseError, logAuthError, logCsrfError, logRateLimitError, generateRequestId } = require('./requestLogger');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
    this.isOperational = true;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.isOperational = true;
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.isOperational = true;
  }
}

class CsrfError extends AppError {
  constructor(message = 'Invalid CSRF token', code = 'INVALID_CSRF') {
    super(message, 403, code);
    this.isOperational = true;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.isOperational = true;
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
    this.isOperational = true;
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
    this.isOperational = false;
  }
}

const errorHandler = (err, req, res, next) => {
  req.requestId = req.requestId || generateRequestId();
  
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.code || 'INTERNAL_ERROR';
  let isOperational = err.isOperational || false;

  const errorLog = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
    errorName: err.name,
    errorMessage: err.message,
    stack: err.stack,
  };

  if (err.name === 'CastError') {
    message = 'Invalid resource identifier';
    statusCode = 404;
    errorCode = 'INVALID_ID';
    isOperational = true;
    logger.warn(`CastError: ${message}`, { ...errorLog, field: err.path, value: err.value });
  }

  else if (err.code === 11000 || err.name === 'SequelizeUniqueConstraintError') {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY';
    isOperational = true;
    logger.warn(`Duplicate key: ${field}`, { ...errorLog, field });
  }

  else if (err.name === 'SequelizeDatabaseError' || err.name === 'SequelizeConnectionError') {
    message = 'Database operation failed';
    statusCode = 500;
    errorCode = 'DATABASE_ERROR';
    isOperational = false;
    logDatabaseError('query', err, req);
  }

  else if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeAccessDeniedError') {
    message = 'Database connection failed';
    statusCode = 503;
    errorCode = 'DB_CONNECTION_ERROR';
    isOperational = false;
    logDatabaseError('connection', err, req);
  }

  else if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token';
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    isOperational = true;
    logAuthError(req, err, { tokenError: err.message });
  }

  else if (err.name === 'TokenExpiredError') {
    message = 'Authentication token has expired';
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    isOperational = true;
    logAuthError(req, err, { expiredAt: err.expiredAt });
  }

  else if (err.name === 'SequelizeValidationError') {
    const errors = err.errors?.map(e => ({ field: e.path, message: e.message })) || [];
    message = 'Validation failed';
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    isOperational = true;
    logger.warn(`Validation error: ${JSON.stringify(errors)}`, { ...errorLog, validationErrors: errors });
  }

  else if (errorCode === 'MISSING_CSRF_TOKEN' || errorCode === 'INVALID_CSRF' || errorCode === 'TOKEN_EXPIRED') {
    statusCode = 403;
    isOperational = true;
    logCsrfError(req, err, { csrfError: errorCode });
  }

  else if (err.name === 'TooManyRequestsError' || err.code === 'RATE_LIMIT_EXCEEDED') {
    message = 'Too many requests, please try again later';
    statusCode = 429;
    errorCode = 'RATE_LIMIT_EXCEEDED';
    isOperational = true;
    logRateLimitError(req);
  }

  else if (err.name === 'SyntaxError' && err.status === 400) {
    message = 'Invalid JSON in request body';
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    isOperational = true;
    logger.warn('JSON parse error', { ...errorLog, body: err.body });
  }

  if (!isOperational && statusCode >= 500) {
    logger.error('CRITICAL SERVER ERROR', {
      ...errorLog,
      statusCode,
      errorCode,
      originalError: {
        name: err.name,
        message: err.message,
        code: err.code,
        parentError: err.parent?.message,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const response = {
    success: false,
    message,
    errorCode,
    ...(process.env.NODE_ENV !== 'production' && {
      requestId: req.requestId,
      stack: err.stack,
    }),
  };

  if (err.errors) {
    response.validationErrors = err.errors.map(e => ({
      field: e.path || e.path,
      message: e.message,
    }));
  }

  res.status(statusCode).json(response);
};

module.exports = {
  asyncHandler,
  errorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  CsrfError,
  NotFoundError,
  ConflictError,
  DatabaseError,
};