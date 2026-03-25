const logger = require('../utils/logger');

// --- ASYNC HANDLER (Restored) ---
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error classes
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
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Context for logs
  const errorLog = {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  };

  // --- Specific Error Type Handling ---

  // Mongoose/Sequelize bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource identifier';
    error = new NotFoundError(message);
    logger.warn('CastError:', errorLog);
  }

  // Duplicate key errors
  if (err.code === 11000 || err.name === 'SequelizeUniqueConstraintError') {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `${field} already exists`;
    error = new ConflictError(message);
    logger.warn('Duplicate key error:', { ...errorLog, field });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token';
    error = new AuthenticationError(message);
    logger.warn('JWT Error:', { ...errorLog, jwtError: err.message });
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired';
    error = new AuthenticationError(message);
    logger.warn('JWT Expired:', errorLog);
  }

  // --- Final Response Handling ---

  // 1. Operational (Trusted) Errors - 4xx
  if (error.isOperational || error.statusCode < 500) {
    // We log these as warnings to keep error logs clean
    // (Except JWT errors which are noisy and already logged above if needed)
    if (!['JsonWebTokenError', 'TokenExpiredError'].includes(err.name)) {
        logger.warn(`Operational Error (${error.statusCode}): ${error.message}`, {
            url: req.originalUrl,
            method: req.method
        });
    }
    
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errorCode: error.code
    });
  }

  // 2. Programming or Unknown Errors - 500
  logger.error('CRITICAL SERVER ERROR (500)', {
    ...errorLog,
    originalError: err 
  });

  return res.status(500).json({
    success: false,
    message: 'Something went wrong on the server',
    ref: errorLog.timestamp
  });
};

module.exports = {
  asyncHandler,
  errorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
};
