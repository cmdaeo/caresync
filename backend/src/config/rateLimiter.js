const { RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('redis');

let rateLimiter;

async function initializeRateLimiter() {
  try {
    // Create Redis client
    const redisClient = process.env.REDIS_URL
      ? redis.createClient({ url: process.env.REDIS_URL })
      : redis.createClient();

    // Handle Redis connection errors
    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    // Wait for Redis to connect
    await redisClient.connect();

    // Create rate limiter with Redis store
    rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rate_limit',
      points: 1000, // Number of requests
      duration: 15 * 60, // Per 15 minutes in seconds
      blockDuration: 60 * 60 // Block for 1 hour if exceeded
    });

    console.log('Rate limiter initialized with Redis store');
    return rateLimiter;
  } catch (error) {
    console.error('Failed to initialize Redis rate limiter, falling back to memory store:', error);
    
    // Fallback to memory store if Redis is not available
    const { RateLimiterMemory } = require('rate-limiter-flexible');
    rateLimiter = new RateLimiterMemory({
      points: 1000,
      duration: 15 * 60
    });
    
    return rateLimiter;
  }
}

function getRateLimiter() {
  if (!rateLimiter) {
    throw new Error('Rate limiter not initialized. Call initializeRateLimiter() first.');
  }
  return rateLimiter;
}

module.exports = {
  initializeRateLimiter,
  getRateLimiter
};