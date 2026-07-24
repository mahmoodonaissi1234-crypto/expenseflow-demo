import { useState } from 'react';

export default function ExpenseList({ expenses, categories, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  if (expenses.length === 0) {
    return <p className="empty">No expenses yet. Add your first one above.</p>;
  }

  function startEdit(expense) {
    setEditingId(expense.id);
    setDraft({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      spentOn: expense.spent_on.slice(0, 10),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(id) {
    setSaving(true);
    try {
      await onUpdate(id, { ...draft, amount: Number(draft.amount) });
      setEditingId(null);
      setDraft(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <table className="expense-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Category</th>
          <th>Amount</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((expense) =>
          editingId === expense.id ? (
            <tr key={expense.id}>
              <td>
                <input
                  type="date"
                  value={draft.spentOn}
                  onChange={(e) => setDraft({ ...draft, spentOn: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </td>
              <td>
                <select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={draft.amount}
                  onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                />
              </td>
              <td>
                <button className="link-button" onClick={() => saveEdit(expense.id)} disabled={saving}>
                  Save
                </button>
                <button className="link-button" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </button>
              </td>
            </tr>
          ) : (
            <tr key={expense.id}>
              <td>{expense.spent_on.slice(0, 10)}</td>
              <td>{expense.description}</td>
              <td>{expense.category}</td>
              <td>${Number(expense.amount).toFixed(2)}</td>
              <td>
                <button className="link-button" onClick={() => startEdit(expense)}>
                  Edit
                </button>
                <button className="link-button" onClick={() => onDelete(expense.id)}>
                  Delete
                </button>
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}
