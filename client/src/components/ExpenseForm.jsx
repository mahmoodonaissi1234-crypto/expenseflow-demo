import { useEffect, useState } from 'react';
import api from '../api/client';
import Spinner from './Spinner';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpenseForm({ onCreate }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [spentOn, setSpentOn] = useState(today());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => {
        setCategories(res.data.categories);
        if (res.data.categories.length > 0) {
          setCategory((current) => current || res.data.categories[0].name);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onCreate({ description, amount: Number(amount), category, spentOn });
      setDescription('');
      setAmount('');
      setSpentOn(today());
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="expense-form-wrapper" onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}
      <div className="expense-form">
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Amount"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={spentOn}
          onChange={(e) => setSpentOn(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting && <Spinner />}
          {submitting ? 'Adding...' : 'Add expense'}
        </button>
      </div>
    </form>
  );
}
