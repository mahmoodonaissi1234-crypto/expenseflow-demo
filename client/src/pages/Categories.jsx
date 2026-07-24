import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories);
    } catch (err) {
      setError('Failed to load categories');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/categories', { name });
      setCategories((prev) =>
        [...prev, res.data.category].sort((a, b) => a.name.localeCompare(b.name))
      );
      setName('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((category) => category.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete category');
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Categories</h1>
        <Link to="/" className="link-button">
          Back to dashboard
        </Link>
      </header>

      {error && <p className="error">{error}</p>}

      <form className="category-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add category'}
        </button>
      </form>

      {categories.length === 0 ? (
        <p className="empty">No categories yet.</p>
      ) : (
        <ul className="category-list">
          {categories.map((category) => (
            <li key={category.id}>
              <span>{category.name}</span>
              <button className="link-button" onClick={() => handleDelete(category.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
