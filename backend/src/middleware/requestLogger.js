const crypto = require('crypto');
const logger = require('../utils/logger');

function generateRequestId() {
  return `req_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

function sanitizeHeaders(headers) {
  const sanitized = {};
  const sensitive = ['authorization', 'cookie', 'x-csrf-token', 'x-api-key', 'proxy-authorization'];
  for (const [key, value] of Object.entries(headers)) {
    sanitized[key] = sensitive.includes(key.toLowerCase()) ? '[REDACTED]' : value;
  }
  return sanitized;
}

function sanitizeBody(body) {
  if (!body) return null;
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'confirmPassword', 'token', 'refreshToken', 'accessToken', 'code', 'secret', 'secretKey', 'apiKey', 'oldPassword'];
  for (const field of sensitiveFields) {
    if (sanitized[field]) sanitized[field] = '[REDACTED]';
  }
  return sanitized;
}

function logRequest(req, level = 'info') {
  const requestId = req.requestId || generateRequestId();
  const logData = {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id || req.userId || 'anonymous',
    userAgent: req.headers?.['user-agent'],
    timestamp: new Date().toISOString(),
    headers: sanitizeHeaders(req.headers),
    query: req.query,
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
  };
  logger[level](`${req.method} ${req.originalUrl || req.url}`, logData);
  return requestId;
}

function logError(req, error, context = {}) {
  const requestId = req.requestId || generateRequestId();
  const errorLog = {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id || req.userId || 'anonymous',
    timestamp: new Date().toISOString(),
    errorName: error.name,
    errorMessage: error.message,
    errorCode: error.code || 'UNKNOWN',
    statusCode: error.statusCode || 500,
    stack: error.stack,
    database: {
      piiConnected: req._dbPiiConnected || false,
      medicalConnected: req._dbMedicalConnected || false,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      platform: process.env.PLATFORM || process.env.RUNNING_IN,
    },
    ...context,
  };

  if (error.isOperational || error.statusCode < 500) {
    logger.warn(`Operational Error: ${error.message} [${error.statusCode}]`, errorLog);
  } else {
    logger.error(`CRITICAL: ${error.message} [500]`, errorLog);
  }

  return requestId;
}

function logDatabaseError(operation, error, req) {
  logger.error(`Database Error during ${operation}`, {
    requestId: req.requestId,
    operation,
    error: error.message,
    stack: error.stack,
    code: error.code,
    parentError: error.parent?.message,
    sqlState: error.parent?.sqlState,
    hostname: error.parent?.hostname,
    database: error.parent?.database,
    timestamp: new Date().toISOString(),
  });
}

function logAuthError(req, error, context = {}) {
  logger.warn('Authentication Error', {
    requestId: req.requestId,
    url: req.originalUrl,
    ip: req.ip,
    errorName: error.name,
    errorMessage: error.message,
    code: error.code,
    ...context,
  });
}

function logCsrfError(req, error, context = {}) {
  logger.warn('CSRF Validation Error', {
    requestId: req.requestId,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers?.['user-agent'],
    csrfTokenReceived: req.headers?.['x-csrf-token'] ? '[PRESENT]' : '[MISSING]',
    csrfCookieReceived: req.cookies?._csrf || req.cookies?.['__Host-caresync.x-csrf-token'] ? '[PRESENT]' : '[MISSING]',
    errorMessage: error.message,
    errorCode: error.code,
    ...context,
  });
}

function logRateLimitError(req, context = {}) {
  logger.warn('Rate Limit Exceeded', {
    requestId: req.requestId,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    ...context,
  });
}

module.exports = {
  generateRequestId,
  sanitizeHeaders,
  sanitizeBody,
  logRequest,
  logError,
  logDatabaseError,
  logAuthError,
  logCsrfError,
  logRateLimitError,
};