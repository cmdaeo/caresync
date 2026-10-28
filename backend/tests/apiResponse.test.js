const ApiResponse = require('../src/utils/ApiResponse');

describe('ApiResponse uniform envelope', () => {
  test('success() includes success:true, data, timestamp', () => {
    const r = ApiResponse.success({ id: 1 }, 'OK', 201);
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ id: 1 });
    expect(r.message).toBe('OK');
    expect(r.statusCode).toBe(201);
    expect(r.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('error() is a failure envelope', () => {
    const r = ApiResponse.error('Not found', 404);
    expect(r.success).toBe(false);
    expect(r.message).toBe('Not found');
    expect(r.statusCode).toBe(404);
  });

  test('toJSON() omits null fields', () => {
    const json = ApiResponse.success(null, null).toJSON();
    expect(json).not.toHaveProperty('data');
    expect(json).not.toHaveProperty('message');
    expect(json.success).toBe(true);
  });

  test('constructor does not throw for empty input', () => {
    expect(() => new ApiResponse(true)).not.toThrow();
  });
});