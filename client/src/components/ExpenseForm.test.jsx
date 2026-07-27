import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExpenseForm from './ExpenseForm';
import api from '../api/client';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ExpenseForm', () => {
  beforeEach(() => {
    api.get.mockResolvedValue({
      data: { categories: [{ id: 1, name: 'food' }, { id: 2, name: 'transport' }] },
    });
  });

  it('calls onCreate with the correct payload on submit', async () => {
    const onCreate = vi.fn().mockResolvedValue();
    render(<ExpenseForm onCreate={onCreate} />);

    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('food'));

    fireEvent.change(screen.getByPlaceholderText('Description'), {
      target: { value: 'Lunch' },
    });
    fireEvent.change(screen.getByPlaceholderText('Amount'), { target: { value: '15.5' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'transport' } });

    fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));

    const payload = onCreate.mock.calls[0][0];
    expect(payload.description).toBe('Lunch');
    expect(payload.amount).toBe(15.5);
    expect(payload.category).toBe('transport');
    expect(payload.spentOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
