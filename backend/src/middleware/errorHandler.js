const logger = require('../utils/logger');

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

  // Log error details
  const errorLog = {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  };

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

  // Validation errors
  if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
    const messages = err.errors ? err.errors.map(e => e.message) : [err.message];
    const message = messages.join(', ');
    error = new ValidationError(message);
    logger.warn('Validation error:', { ...errorLog, validationErrors: err.errors });
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

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size exceeds maximum allowed limit';
    error = new ValidationError(message);
    logger.warn('File size error:', { ...errorLog, fileSize: req.file?.size });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field in request';
    error = new ValidationError(message);
    logger.warn('Unexpected file error:', errorLog);
  }

  // PDF processing errors
  if (err.message && err.message.includes('PDF')) {
    const message = 'Error processing PDF document';
    error = new AppError(message, 422, 'PDF_PROCESSING_ERROR');
    logger.error('PDF processing error:', { ...errorLog, pdfError: err.message });
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    const message = 'Too many requests, please try again later';
    error = new AppError(message, 429, 'RATE_LIMIT_ERROR');
    logger.warn('Rate limit exceeded:', errorLog);
  }

  // Database connection errors
  if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
    const message = 'Database connection error';
    error = new AppError(message, 503, 'DATABASE_ERROR');
    logger.error('Database connection error:', errorLog);
  }

  // Network/timeout errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
    const message = 'Service temporarily unavailable';
    error = new AppError(message, 503, 'NETWORK_ERROR');
    logger.error('Network error:', { ...errorLog, networkError: err.code });
  }

  // Use custom error properties if set
  const statusCode = error.statusCode || 500;
  const responseMessage = error.message || 'Internal server error';
  const errorCode = error.code || 'INTERNAL_ERROR';

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: responseMessage,
      code: errorCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    }
  };

  // Add field-specific errors for validation
  if (error instanceof ValidationError && error.field) {
    errorResponse.error.field = error.field;
  }

  // Add suggestions for common errors
  if (statusCode === 404) {
    errorResponse.suggestion = 'Please check the request URL and parameters';
  } else if (statusCode === 401) {
    errorResponse.suggestion = 'Please check your authentication credentials';
  } else if (statusCode === 403) {
    errorResponse.suggestion = 'You do not have permission to access this resource';
  } else if (statusCode >= 500) {
    errorResponse.suggestion = 'Please try again later or contact support if the problem persists';
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = {
      name: err.name,
      code: err.code,
      statusCode: err.statusCode
    };
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new NotFoundError(`Not Found - ${req.originalUrl}`);
  next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation helpers
const validateRequired = (fields, data) => {
  const missing = [];
  fields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  });
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
};

const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new ValidationError('Invalid UUID format', 'id');
  }
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>\"']/g, '');
  }
  return input;
};

const validateFileUpload = (file, allowedTypes = ['application/pdf'], maxSize = 10 * 1024 * 1024) => {
  if (!file) {
    throw new ValidationError('No file provided');
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new ValidationError(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    throw new ValidationError(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`);
  }
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  // Custom error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  // Validation helpers
  validateRequired,
  validateEmail,
  validateUUID,
  sanitizeInput,
  validateFileUpload
};