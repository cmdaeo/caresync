const winston = require('winston');
const path = require('path');
const { scrubPHI } = require('./phiScrubber');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

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
const logFormat = winston.format.combine(
  phiScrubFormat(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
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