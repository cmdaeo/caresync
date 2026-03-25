const winston = require('winston');
const path = require('path');
const fs = require('fs');

// ── Environment Check ───────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

// ── Directory Logic ─────────────────────────────────────────────
// Vercel is Read-Only. We only create /logs if we are local.
const logDir = path.join(__dirname, '../../logs');
if (!isProduction && !fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create log directory:', err);
  }
}

// ── PHI/PII Scrubber ────────────────────────────────────────────
const PII_PATTERNS = [
  { regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, replacement: '[REDACTED_JWT]' },
  { regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, replacement: '[REDACTED_EMAIL]' },
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
  if (Array.isArray(value)) return value.map(scrub);
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
  if (typeof info.message === 'string') info.message = scrub(info.message);
  const SKIP_KEYS = new Set(['level', 'message', 'timestamp', 'service', 'stack']);
  for (const key of Object.keys(info)) {
    if (!SKIP_KEYS.has(key)) info[key] = scrub(info[key]);
  }
  if (typeof info.stack === 'string') info.stack = scrub(info.stack);
  return info;
});

// ── Transport Configuration ─────────────────────────────────────
const logLevels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const transports = [];

// 1. Console Transport (Always active, but formatted differently for Dev/Prod)
if (isProduction) {
  // Production Console (JSON format for Vercel/CloudWatch)
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        piiScrubber(),
        winston.format.json()
      ),
    })
  );
} else {
  // Development Console (Pretty and Colorful)
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        piiScrubber(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const serviceTag = service ? `[${service}] ` : '';
          const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
          return `${timestamp} ${serviceTag}${level}: ${message}${metaStr}`;
        })
      ),
    })
  );
}

// 2. File Transports (Only active when LOCAL)
if (!isProduction) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

// ── Create Logger ───────────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  levels: logLevels,
  defaultMeta: { service: 'caresync-backend' },
  transports: transports,
});

logger.stream = {
  write: (message) => logger.info(message.trim()),
};

module.exports = logger;