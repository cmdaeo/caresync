const crypto = require('crypto');

const CSRF_COOKIE_NAME = '_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_SIZE = 32;

function getSecret() {
  const secret = process.env.CSRF_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('CSRF_SECRET or SESSION_SECRET environment variable is required');
  }
  return secret;
}

function generateToken() {
  const secret = Buffer.from(getSecret(), 'hex').slice(0, 32);
  const token = crypto.randomBytes(TOKEN_SIZE).toString('base64url');
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${token}.${timestamp}`)
    .digest('base64url');
  return `${token}.${timestamp}.${signature}`;
}

function validateToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'MISSING_TOKEN', message: 'CSRF token is required' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'INVALID_FORMAT', message: 'Invalid CSRF token format' };
  }

  const [tokenValue, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) {
    return { valid: false, error: 'INVALID_TIMESTAMP', message: 'Invalid token timestamp' };
  }

  const age = Date.now() - timestamp;
  const maxAge = 60 * 60 * 1000;
  if (age > maxAge) {
    return { valid: false, error: 'TOKEN_EXPIRED', message: 'CSRF token has expired' };
  }

  const secret = Buffer.from(getSecret(), 'hex').slice(0, 32);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${tokenValue}.${timestampStr}`)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return { valid: false, error: 'INVALID_SIGNATURE', message: 'CSRF token signature mismatch' };
  }

  return { valid: true };
}

function csrfProtection(req, res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const token = req.headers[CSRF_HEADER_NAME] || req.body?._csrf || req.query?._csrf;
  
  if (!token) {
    const error = new Error('CSRF token is required');
    error.statusCode = 403;
    error.code = 'MISSING_CSRF_TOKEN';
    error.isOperational = true;
    return next(error);
  }

  const validation = validateToken(token);
  if (!validation.valid) {
    const error = new Error(validation.message);
    error.statusCode = 403;
    error.code = validation.error;
    error.isOperational = true;
    return next(error);
  }

  next();
}

module.exports = {
  generateToken,
  validateToken,
  csrfProtection,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
};