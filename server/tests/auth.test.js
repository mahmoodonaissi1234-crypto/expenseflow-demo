const request = require('supertest');
const app = require('../src/index.js');
const pool = require('../src/db');

afterAll(async () => {
  await pool.end();
});

describe('POST /api/auth/register', () => {
  it('rejects a duplicate email with 409', async () => {
    const email = `dup-${Date.now()}@example.com`;
    const payload = { name: 'Test User', email, password: 'password123' };

    const first = await request(app).post('/api/auth/register').send(payload);
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/auth/register').send(payload);
    expect(second.status).toBe(409);
    expect(second.body.error).toMatch(/already registered/i);
  });
});
