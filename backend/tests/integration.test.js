const request = require('supertest');
const app = require('../src/app');

describe('CareSync API - public endpoints (no DB required)', () => {
  test('GET /health → 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('GET /health sets Cache-Control for edge caching', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['cache-control']).toContain('s-maxage=60');
    expect(res.headers['cache-control']).toContain('stale-while-revalidate');
  });

  test('GET /api/health → 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  test('GET /api/csrf-token → 200 with valid 3-segment token', async () => {
    const res = await request(app).get('/api/csrf-token');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.csrfToken).toBeTruthy();
    expect(res.body.data.csrfToken.split('.')).toHaveLength(3);
  });

  test('unknown route → 404 with safe error shape', async () => {
    const res = await request(app).get('/api/this-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Route not found');
    // must not leak file system paths / stack traces in test env
    expect(JSON.stringify(res.body)).not.toMatch(/\/home\/|\/app\/|node_modules/);
  });
});