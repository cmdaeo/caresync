// Test script for CSRF functionality
require('dotenv').config({ path: '../.env' });
const { generateToken, validateToken } = require('./src/middleware/csrf');

console.log('Testing CSRF token generation and validation...');

// Generate a token
const token = generateToken();
console.log('Generated token:', token);

// Validate the token
const validation = validateToken(token);
console.log('Validation result:', validation);

if (validation.valid) {
  console.log('✅ CSRF token generation and validation working correctly');
} else {
  console.log('❌ CSRF token validation failed:', validation.message);
}

// Test invalid token
const invalidValidation = validateToken('invalid.token.here');
console.log('Invalid token validation:', invalidValidation);

console.log('CSRF middleware test complete');