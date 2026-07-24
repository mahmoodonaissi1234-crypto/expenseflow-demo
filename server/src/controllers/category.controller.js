const pool = require('../db');

async function listCategories(req, res) {
  const result = await pool.query(
    'SELECT id, name FROM categories WHERE user_id = $1 ORDER BY name ASC',
    [req.userId]
  );
  return res.json({ categories: result.rows });
}

async function createCategory(req, res) {
  const { name } = req.body;
  const trimmed = (name || '').trim();

  if (!trimmed) {
    return res.status(400).json({ error: 'name is required' });
  }

  const existing = await pool.query('SELECT id FROM categories WHERE user_id = $1 AND name = $2', [
    req.userId,
    trimmed,
  ]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'category already exists' });
  }

  const result = await pool.query(
    'INSERT INTO categories (user_id, name) VALUES ($1, $2) RETURNING id, name',
    [req.userId, trimmed]
  );
  return res.status(201).json({ category: result.rows[0] });
}

async function deleteCategory(req, res) {
  const { id } = req.params;

  const category = await pool.query('SELECT id FROM categories WHERE id = $1 AND user_id = $2', [
    id,
    req.userId,
  ]);
  if (category.rows.length === 0) {
    return res.status(404).json({ error: 'category not found' });
  }

  const inUse = await pool.query('SELECT 1 FROM expenses WHERE category_id = $1 LIMIT 1', [id]);
  if (inUse.rows.length > 0) {
    return res.status(409).json({ error: 'category is in use by existing expenses' });
  }

  await pool.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [id, req.userId]);
  return res.status(204).send();
}

module.exports = { listCategories, createCategory, deleteCategory };
