const pool = require('../db');

async function resolveCategoryId(rawName) {
  const name = (rawName && rawName.trim()) || 'general';
  const existing = await pool.query('SELECT id FROM categories WHERE name = $1', [name]);
  if (existing.rows.length > 0) {
    return { id: existing.rows[0].id, name };
  }
  const inserted = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [
    name,
  ]);
  return { id: inserted.rows[0].id, name };
}

async function listExpenses(req, res) {
  const result = await pool.query(
    `SELECT e.id, e.description, e.amount, c.name AS category, e.spent_on, e.created_at
     FROM expenses e
     JOIN categories c ON c.id = e.category_id
     WHERE e.user_id = $1
     ORDER BY e.spent_on DESC, e.id DESC`,
    [req.userId]
  );
  return res.json({ expenses: result.rows });
}

async function createExpense(req, res) {
  const { description, amount, category, spentOn } = req.body;

  if (!description || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'description and amount are required' });
  }
  if (Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  const resolvedCategory = await resolveCategoryId(category);

  const result = await pool.query(
    `INSERT INTO expenses (user_id, description, amount, category_id, spent_on)
     VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE))
     RETURNING id, description, amount, spent_on, created_at`,
    [req.userId, description, amount, resolvedCategory.id, spentOn]
  );

  return res.status(201).json({ expense: { ...result.rows[0], category: resolvedCategory.name } });
}

async function updateExpense(req, res) {
  const { id } = req.params;
  const { description, amount, category, spentOn } = req.body;

  const categoryId = category !== undefined && category !== null
    ? (await resolveCategoryId(category)).id
    : null;

  const result = await pool.query(
    `UPDATE expenses
     SET description = COALESCE($1, description),
         amount = COALESCE($2, amount),
         category_id = COALESCE($3, category_id),
         spent_on = COALESCE($4, spent_on)
     WHERE id = $5 AND user_id = $6
     RETURNING id`,
    [description, amount, categoryId, spentOn, id, req.userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'expense not found' });
  }

  const updated = await pool.query(
    `SELECT e.id, e.description, e.amount, c.name AS category, e.spent_on, e.created_at
     FROM expenses e
     JOIN categories c ON c.id = e.category_id
     WHERE e.id = $1`,
    [id]
  );
  return res.json({ expense: updated.rows[0] });
}

async function deleteExpense(req, res) {
  const { id } = req.params;
  const result = await pool.query(
    'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, req.userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'expense not found' });
  }
  return res.status(204).send();
}

module.exports = { listExpenses, createExpense, updateExpense, deleteExpense };
