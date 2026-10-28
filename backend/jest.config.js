/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  verbose: true,
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true,
  collectCoverageFrom: [
    'src/utils/encryption.js',
    'src/utils/jwtUtils.js',
    'src/utils/ApiResponse.js',
    'src/middleware/csrf.js',
    'src/middleware/auth.js',
    'src/middleware/errorHandler.js',
    'src/middleware/requestLogger.js',
    'src/middleware/validationMiddleware.js',
    'src/services/authService.js',
    'src/services/medicationService.js',
  ],
};