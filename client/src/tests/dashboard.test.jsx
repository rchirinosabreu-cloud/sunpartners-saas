import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { nombre: 'Test User', email: 'test@example.com' },
    loading: false
  })
}));

describe('Dashboard Page', () => {
  it('renders metrics and events table', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(screen.getByText(/Eventos Activos/i)).toBeInTheDocument();
    expect(screen.getByText(/Próximos Eventos/i)).toBeInTheDocument();
    expect(screen.getByText(/Boda Martínez Silva/i)).toBeInTheDocument();
  });
});
