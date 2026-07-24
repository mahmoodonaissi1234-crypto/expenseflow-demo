const pool = require('../db');

// "Total spend" and the category breakdown are scoped to the current
// calendar month; "recent transactions" is the 5 most recent overall,
// regardless of month, since that's more useful for an at-a-glance view.
async function getSummary(req, res) {
  const totalResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM expenses
     WHERE user_id = $1
       AND spent_on >= date_trunc('month', CURRENT_DATE)
       AND spent_on < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`,
    [req.userId]
  );

  const byCategoryResult = await pool.query(
    `SELECT c.name AS category, COALESCE(SUM(e.amount), 0) AS total
     FROM expenses e
     JOIN categories c ON c.id = e.category_id
     WHERE e.user_id = $1
       AND e.spent_on >= date_trunc('month', CURRENT_DATE)
       AND e.spent_on < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
     GROUP BY c.name
     ORDER BY total DESC`,
    [req.userId]
  );

  const recentResult = await pool.query(
    `SELECT e.id, e.description, e.amount, c.name AS category, e.spent_on, e.created_at
     FROM expenses e
     JOIN categories c ON c.id = e.category_id
     WHERE e.user_id = $1
     ORDER BY e.spent_on DESC, e.id DESC
     LIMIT 5`,
    [req.userId]
  );

  return res.json({
    period: 'current_month',
    totalSpend: totalResult.rows[0].total,
    byCategory: byCategoryResult.rows,
    recentTransactions: recentResult.rows,
  });
}

module.exports = { getSummary };
