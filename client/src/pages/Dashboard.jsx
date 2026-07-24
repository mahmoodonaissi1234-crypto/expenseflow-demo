import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, fromFilter, toFilter]);

  async function loadExpenses() {
    try {
      const params = {};
      if (categoryFilter) params.categoryId = categoryFilter;
      if (fromFilter) params.from = fromFilter;
      if (toFilter) params.to = toFilter;
      const res = await api.get('/expenses', { params });
      setExpenses(res.data.expenses);
    } catch (err) {
      setError('Failed to load expenses');
    }
  }

  async function handleCreate(expense) {
    const res = await api.post('/expenses', expense);
    setExpenses((prev) => [res.data.expense, ...prev]);
  }

  async function handleUpdate(id, changes) {
    const res = await api.patch(`/expenses/${id}`, changes);
    setExpenses((prev) => prev.map((expense) => (expense.id === id ? res.data.expense : expense)));
  }

  async function handleDelete(id) {
    await api.delete(`/expenses/${id}`);
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  }

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>ExpenseFlow</h1>
        <div>
          <span>{user?.name}</span>
          <Link to="/categories" className="link-button">
            Categories
          </Link>
          <button className="link-button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <ExpenseForm onCreate={handleCreate} />

      <div className="filter-bar">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={fromFilter}
          onChange={(e) => setFromFilter(e.target.value)}
          aria-label="From date"
        />
        <input
          type="date"
          value={toFilter}
          onChange={(e) => setToFilter(e.target.value)}
          aria-label="To date"
        />
      </div>

      <p className="total">Total: ${total.toFixed(2)}</p>

      <ExpenseList
        expenses={expenses}
        categories={categories}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
