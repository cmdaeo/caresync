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
      // For now, we'll use a temporary secret for development
      // In production, this should use the actual device public key with proper crypto
      const secret = process.env.JWT_SECRET || 'carebox-secret-key-temporary';

      const decoded = await verifyJwt(token, secret, {
        algorithms: ['HS256'], // Using HS256 for now, will switch to ES256 in production
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
    const secret = process.env.JWT_SECRET || 'carebox-secret-key-temporary';
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
      const secret = process.env.JWT_SECRET || 'carebox-secret-key-temporary';
      return await verifyJwt(token, secret);
    } catch (error) {
      logger.error('Access token verification error:', error.message);
      throw new Error('Invalid access token');
    }
  }
}

module.exports = JwtUtils;