const pool = require('../db');

async function listExpenses(req, res) {
  const result = await pool.query(
    'SELECT id, description, amount, category, spent_on, created_at FROM expenses WHERE user_id = $1 ORDER BY spent_on DESC, id DESC',
    [req.user.id]
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

  const result = await pool.query(
    `INSERT INTO expenses (user_id, description, amount, category, spent_on)
     VALUES ($1, $2, $3, COALESCE($4, 'general'), COALESCE($5, CURRENT_DATE))
     RETURNING id, description, amount, category, spent_on, created_at`,
    [req.user.id, description, amount, category, spentOn]
  );

  return res.status(201).json({ expense: result.rows[0] });
}

async function updateExpense(req, res) {
  const { id } = req.params;
  const { description, amount, category, spentOn } = req.body;

  const result = await pool.query(
    `UPDATE expenses
     SET description = COALESCE($1, description),
         amount = COALESCE($2, amount),
         category = COALESCE($3, category),
         spent_on = COALESCE($4, spent_on)
     WHERE id = $5 AND user_id = $6
     RETURNING id, description, amount, category, spent_on, created_at`,
    [description, amount, category, spentOn, id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'expense not found' });
  }
  return res.json({ expense: result.rows[0] });
}

async function deleteExpense(req, res) {
  const { id } = req.params;
  const result = await pool.query(
    'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'expense not found' });
  }
  return res.status(204).send();
}

module.exports = { listExpenses, createExpense, updateExpense, deleteExpense };
