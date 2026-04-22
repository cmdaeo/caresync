// Test CSRF endpoint without database
require('dotenv').config({ path: '../.env' });
const { generateToken } = require('./src/middleware/csrf');

console.log('Testing CSRF token generation without database...');

try {
  const token = generateToken();
  console.log('✅ CSRF token generated successfully:', token);

  // Test that it can be parsed
  const parts = token.split('.');
  console.log('Token parts:', parts.length, '(should be 3)');

  if (parts.length === 3) {
    console.log('✅ Token format is correct');
  } else {
    console.log('❌ Token format is incorrect');
  }
} catch (error) {
  console.log('❌ CSRF token generation failed:', error.message);
}