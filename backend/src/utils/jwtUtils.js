const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const logger = require('./logger');

const verifyJwt = promisify(jwt.verify);

class JwtUtils {
  /**
   * Verify device registration signature
   * @param {string} token - JWT token
   * @param {string} devicePublicKey - Device public key for verification
   * @returns {Promise<object>} - Decoded token payload
   */
  static async verifyDeviceSignature(token, devicePublicKey) {
    try {
      // Use the JWT_SECRET environment variable
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
      }

      const secret = process.env.JWT_SECRET;

      const decoded = await verifyJwt(token, secret, {
        algorithms: ['HS256'],
        ignoreExpiration: false
      });

      // Validate required claims
      if (!decoded.iss || decoded.iss !== 'caresync-mobile-app') {
        throw new Error('Invalid issuer');
      }

      if (!decoded.sub || !decoded.aud) {
        throw new Error('Missing required claims');
      }

      // Validate timestamp (should be within last 24 hours)
      const now = Math.floor(Date.now() / 1000);
      if (decoded.iat && (now - decoded.iat) > 86400) { // 24 hours
        throw new Error('Token too old');
      }

      return decoded;
    } catch (error) {
      logger.error('JWT verification error:', error.message);
      throw new Error('Invalid device signature');
    }
  }

  /**
   * Generate device registration token (for testing purposes)
   * @param {object} payload - Token payload
   * @returns {string} - JWT token
   */
  static generateDeviceToken(payload) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const secret = process.env.JWT_SECRET;
    return jwt.sign(payload, secret, {
      algorithm: 'HS256',
      expiresIn: '1h'
    });
  }

  /**
   * Verify access token for device operations
   * @param {string} token - Access token
   * @returns {Promise<object>} - Decoded token
   */
  static async verifyAccessToken(token) {
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
      }

      const secret = process.env.JWT_SECRET;
      return await verifyJwt(token, secret);
    } catch (error) {
      logger.error('Access token verification error:', error.message);
      throw new Error('Invalid access token');
    }
  }
}

module.exports = JwtUtils;