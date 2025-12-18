const { getRateLimiter } = require('../config/rateLimiter');
const ApiResponse = require('../utils/ApiResponse');

async function rateLimiterMiddleware(req, res, next) {
  try {
    const rateLimiter = getRateLimiter();
    const key = req.ip; // Use IP address as the key for rate limiting

    // Consume a point from the rate limiter
    const rateLimiterRes = await rateLimiter.consume(key);

    // Add rate limit headers to the response
    res.set({
      'X-RateLimit-Limit': rateLimiter.points,
      'X-RateLimit-Remaining': rateLimiterRes.remainingPoints,
      'X-RateLimit-Reset': Math.ceil(rateLimiterRes.msBeforeNext / 1000)
    });

    next();
  } catch (error) {
    // If rate limit exceeded
    if (error.message.includes('Cannot consume')) {
      const retryAfter = Math.ceil(error.msBeforeNext / 1000);
      res.set({
        'Retry-After': retryAfter,
        'X-RateLimit-Limit': rateLimiter.points,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': retryAfter
      });

      const response = ApiResponse.error(
        null,
        'Too many requests, please try again later.',
        429
      );
      return res.status(429).json(response);
    }

    // For other errors, log and continue
    console.error('Rate limiter error:', error);
    next();
  }
}

module.exports = rateLimiterMiddleware;