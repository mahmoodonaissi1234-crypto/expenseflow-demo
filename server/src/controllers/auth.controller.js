const bcrypt = require('bcryptjs');
const pool = require('../db');
const { signToken } = require('../utils/jwt');

async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
    [name, email, passwordHash]
  );

  const user = result.rows[0];
  const token = signToken({ sub: user.id, email: user.email });
  return res.status(201).json({ user, token });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const result = await pool.query(
    'SELECT id, name, email, password_hash FROM users WHERE email = $1',
    [email]
  );
  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  const token = signToken({ sub: user.id, email: user.email });
  return res.json({
    user: { id: user.id, name: user.name, email: user.email },
    token,
  });
}

async function me(req, res) {
  const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [
    req.userId,
  ]);
  const user = result.rows[0];
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }
  return res.json({ user });
}

module.exports = { register, login, me };
