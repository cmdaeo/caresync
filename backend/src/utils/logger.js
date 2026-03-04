const winston = require('winston');
const path = require('path');
const { scrubPHI } = require('./phiScrubber');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

<<<<<<< HEAD
// Enhanced PHI scrubbing format
const phiScrubFormat = winston.format((info) => {
  // Scrub the message
  info.message = scrubPHI(info.message);
  
  // Scrub splat arguments (used for %s, %d, etc.)
  if (info[Symbol.for('splat')]) {
    info[Symbol.for('splat')] = info[Symbol.for('splat')].map(scrubPHI);
  }
  
  // Scrub entire info object
  return scrubPHI(info);
});

// Define log format
=======
// ── PHI/PII Scrubber ────────────────────────────────────────────
// Intercepts every log entry and masks sensitive data patterns
// before they reach any transport (console, file).
// ─────────────────────────────────────────────────────────────────

const PII_PATTERNS = [
  // JWT tokens  (eyJ...)
  { regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, replacement: '[REDACTED_JWT]' },
  // Email addresses
  { regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, replacement: '[REDACTED_EMAIL]' },
  // Phone numbers — real formats only (9+ digits, with international prefix or separators)
  // Matches: +351 912 345 678, +1-555-0123456, (123) 456-7890, 912345678
  // Ignores: isolated 3-digit HTTP codes (200, 404, 500), short numbers, UUIDs
  { regex: /\+\d[\d\s()-]{8,}\d/g, replacement: '[REDACTED_PHONE]' },
  { regex: /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g, replacement: '[REDACTED_PHONE]' },
  { regex: /(?<![A-Za-z0-9-])\d{9,15}(?![A-Za-z0-9-])/g, replacement: '[REDACTED_PHONE]' },
];

/**
 * Recursively scrub a value (string, object, array).
 */
function scrub(value) {
  if (typeof value === 'string') {
    let scrubbed = value;
    for (const { regex, replacement } of PII_PATTERNS) {
      // Reset lastIndex for global regexes
      regex.lastIndex = 0;
      scrubbed = scrubbed.replace(regex, replacement);
    }
    return scrubbed;
  }

  if (Array.isArray(value)) {
    return value.map(scrub);
  }

  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = scrub(v);
    }
    return out;
  }

  return value;
}

const piiScrubber = winston.format((info) => {
  // Scrub the main message
  if (typeof info.message === 'string') {
    info.message = scrub(info.message);
  }

  // Scrub all metadata keys (except Winston internals)
  const SKIP_KEYS = new Set(['level', 'message', 'timestamp', 'service', 'stack']);
  for (const key of Object.keys(info)) {
    if (!SKIP_KEYS.has(key)) {
      info[key] = scrub(info[key]);
    }
  }

  // Scrub stack traces too
  if (typeof info.stack === 'string') {
    info.stack = scrub(info.stack);
  }

  return info;
});

// Define log format — piiScrubber runs first, before serialization
>>>>>>> 334c55291cae4312ec1bf7e30d03d736c62c5fb3
const logFormat = winston.format.combine(
  phiScrubFormat(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  piiScrubber(),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: logFormat,
  defaultMeta: { service: 'caresync-backend' },
  transports: [
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to 'combined.log'
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, log to the console with colors
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        phiScrubFormat(),
        winston.format.colorize(),
        winston.format.simple(),
        piiScrubber(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          return `${timestamp} [${service}] ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      ),
    })
  );
}

// Override logger methods to ensure scrubbing happens before any formatting
const originalMethods = {
  info: logger.info,
  warn: logger.warn,
  error: logger.error,
  debug: logger.debug,
  http: logger.http
};

Object.keys(originalMethods).forEach(method => {
  logger[method] = function(...args) {
    // Scrub all arguments before passing to winston
    const scrubbedArgs = args.map(arg => {
      if (arg instanceof Error) {
        // Create a new Error instance with scrubbed message
        const scrubbedError = new Error(scrubPHI(arg.message));
        scrubbedError.stack = scrubPHI(arg.stack);
        Object.assign(scrubbedError, arg);
        return scrubbedError;
      }
      return scrubPHI(arg);
    });
    originalMethods[method].apply(this, scrubbedArgs);
  };
});

// Create a stream object with a 'write' function for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Export logger and stream
module.exports = logger;
