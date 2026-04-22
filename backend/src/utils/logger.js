const winston = require('winston');

// ── PHI/PII Scrubber ────────────────────────────────────────────
// Intercepts every log entry and masks sensitive data patterns
// ─────────────────────────────────────────────────────────────────

const PII_PATTERNS = [
  // JWT tokens  (eyJ...)
  { regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, replacement: '[REDACTED_JWT]' },
  // Email addresses
  { regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, replacement: '[REDACTED_EMAIL]' },
  // Phone numbers
  { regex: /\+\d[\d\s()-]{8,}\d/g, replacement: '[REDACTED_PHONE]' },
  { regex: /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g, replacement: '[REDACTED_PHONE]' },
  { regex: /(?<![A-Za-z0-9-])\d{9,15}(?![A-Za-z0-9-])/g, replacement: '[REDACTED_PHONE]' },
];

function scrub(value) {
  if (typeof value === 'string') {
    let scrubbed = value;
    for (const { regex, replacement } of PII_PATTERNS) {
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
  if (typeof info.message === 'string') {
    info.message = scrub(info.message);
  }

  const SKIP_KEYS = new Set(['level', 'message', 'timestamp', 'service', 'stack']);
  for (const key of Object.keys(info)) {
    if (!SKIP_KEYS.has(key)) {
      info[key] = scrub(info[key]);
    }
  }

  if (typeof info.stack === 'string') {
    info.stack = scrub(info.stack);
  }

  return info;
});

// Define log format for serverless
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  piiScrubber(),
  winston.format.json()
);

// Create serverless-compatible logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'caresync-backend' },
  transports: [],
});

// Always add console transport (works in serverless)
logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
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

// Only add file transports in non-serverless environments
if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME && process.env.NODE_ENV !== 'production') {
  try {
    const path = require('path');
    const fs = require('fs');

    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    logger.add(new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }));

    logger.add(new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }));
  } catch (error) {
    // Silently fail if file logging is not available
    console.warn('File logging not available in this environment');
  }
}

// Create a stream object with a 'write' function for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;