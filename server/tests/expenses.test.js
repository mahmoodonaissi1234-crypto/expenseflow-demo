const request = require('supertest');
const app = require('../src/index.js');
const pool = require('../src/db');

afterAll(async () => {
  await pool.end();
});

describe('Expense scoping', () => {
  it('only shows expenses to the user who created them', async () => {
    const suffix = Date.now();
    const userA = { name: 'User A', email: `a-${suffix}@example.com`, password: 'password123' };
    const userB = { name: 'User B', email: `b-${suffix}@example.com`, password: 'password123' };

    const regA = await request(app).post('/api/auth/register').send(userA);
    const regB = await request(app).post('/api/auth/register').send(userB);
    const tokenA = regA.body.token;
    const tokenB = regB.body.token;

    const createRes = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ description: 'Scoped test expense', amount: 12.5, category: 'food' });
    expect(createRes.status).toBe(201);

    const listA = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(listA.body.expenses.some((e) => e.description === 'Scoped test expense')).toBe(true);

    const listB = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(listB.body.expenses.some((e) => e.description === 'Scoped test expense')).toBe(false);
  });
});
