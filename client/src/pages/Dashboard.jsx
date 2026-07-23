import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data.expenses);
    } catch (err) {
      setError('Failed to load expenses');
    }
  }

  async function handleCreate(expense) {
    const res = await api.post('/expenses', expense);
    setExpenses((prev) => [res.data.expense, ...prev]);
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
          <button className="link-button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <ExpenseForm onCreate={handleCreate} />

      <p className="total">Total: ${total.toFixed(2)}</p>

      <ExpenseList expenses={expenses} onDelete={handleDelete} />
    </div>
  );
}
