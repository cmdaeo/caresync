const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorArray = errors.array();

    // Create a safe copy of the body for logging (redact sensitive info)
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '[REDACTED]';
    if (safeBody.confirmPassword) safeBody.confirmPassword = '[REDACTED]';
    if (safeBody.token) safeBody.token = '[REDACTED]';

    // Log the detailed validation failure
    logger.warn(`Validation Failed: ${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      userId: req.user?.id || 'unauthenticated',
      body: safeBody, // Logs what they sent
      validationErrors: errorArray.map(e => ({
        field: e.path || e.param,
        message: e.msg,
        rejectedValue: e.path && e.path.includes('password') ? '***' : e.value
      }))
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorArray
    });
  }
  
  next();
};

module.exports = { handleValidationErrors };
