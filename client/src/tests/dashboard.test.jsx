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
  it('renders metrics and announcements section', async () => {
    // Mock global fetch
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/tasks/dashboard-stats') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            progresoMes: 50,
            totalRealizados: 10,
            completedInMonth: 5,
            totalCreatedInMonth: 10,
            logrosRecientes: []
          })
        });
      }
      if (url === '/api/announcements') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for loading to finish
    expect(await screen.findByText(/Progreso del mes/i)).toBeInTheDocument();
    expect(screen.getByText(/Total realizados/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Anuncios/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Logros Recientes/i)).toBeInTheDocument();
  });
});
