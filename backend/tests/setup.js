// Runs BEFORE every test file - sets env vars + prevents app.listen()
process.env.NODE_ENV = 'test';

process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-abcdefghijklmnopqrstuvwxyz';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars-abcdefghij';
process.env.JWT_EXPIRE = '7d';
process.env.JWT_REFRESH_EXPIRE = '30d';

// 64 hex chars → 32 bytes when hex-decoded; also 64 UTF-8 bytes (either works)
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.MASTER_KEY = 'test-master-key-12345678901234567890123456789012';
process.env.CSRF_SECRET = 'test-csrf-secret-1234567890abcdef';
process.env.SESSION_SECRET = 'test-session-secret-1234567890abc';

// Prevent Sequelize from actually connecting (no real DB in tests)
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/test_does_not_exist';

// Forces app.js to skip `app.listen(5000)` (avoids port conflicts)
process.env.VERCEL = '1';
process.env.VERCEL_URL = 'test.local';

// Silence logging during tests
process.env.LOG_LEVEL = 'error';
process.env.CSRF_TEST_BYPASS = '1';

process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key-for-jest-only';