import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/client';
import Spinner from './Spinner';

export default function DashboardSummary({ refreshKey }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/dashboard/summary')
      .then((res) => {
        setSummary(res.data);
        setError('');
      })
      .catch(() => setError('Failed to load dashboard summary'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) {
    return (
      <p className="loading-text">
        <Spinner />
        Loading summary...
      </p>
    );
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!summary) {
    return null;
  }

  const topCategory = summary.byCategory[0]?.category || 'None';

  return (
    <div className="summary">
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">This month</span>
          <span className="summary-value">${Number(summary.totalSpend).toFixed(2)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Top category</span>
          <span className="summary-value">{topCategory}</span>
        </div>
      </div>

      {summary.byCategory.length > 0 && (
        <div className="summary-chart">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary.byCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
              <Bar dataKey="total" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {summary.recentTransactions.length > 0 && (
        <div className="summary-recent">
          <h2>Recent transactions</h2>
          <ul className="recent-list">
            {summary.recentTransactions.map((t) => (
              <li key={t.id}>
                <span>{t.spent_on.slice(0, 10)}</span>
                <span>{t.description}</span>
                <span>{t.category}</span>
                <span>${Number(t.amount).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
