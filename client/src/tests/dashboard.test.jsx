import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Dashboard from '../pages/Dashboard';

vi.mock('axios');
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', nombre: 'Test User', email: 'test@example.com', role: 'ADMIN' },
    loading: false,
  }),
}));

const announcement = {
  id: 'a1', contenido: 'Información importante para el equipo', tipo: 'INFO',
  authorId: 'u1', author: { id: 'u1', nombre: 'Test User' }, createdAt: '2026-10-06T12:00:00Z',
};
const alert = {
  id: 'active', productName: 'Mesa de prueba', deficit: 3, quotationId: 'q1',
  startDate: '2026-10-08T14:00:00Z', endDate: '2099-10-09T23:00:00Z', resolvedAt: null,
  quotation: { nombre_evento: 'Evento próximo', consecutivo: 123, client: { razon_social: 'Cliente' } },
};
let alerts;

beforeEach(() => {
  alerts = [alert, { ...alert, id: 'past', productName: 'Mesa vencida', endDate: '2026-06-17T23:00:00Z' }];
  axios.get.mockImplementation(async url => {
    const data = {
      '/api/tasks/dashboard-stats': {
        progresoMes: 50, totalRealizados: 10, completedInMonth: 5,
        totalCreatedInMonth: 10, logrosRecientes: [],
      },
      '/api/announcements': [announcement],
      '/api/settings/global_motivational_quote': { value: 'Test Quote' },
      '/api/inventory/alerts': alerts,
    };
    if (!(url in data)) throw new Error(`Unexpected request: ${url}`);
    return { data: data[url] };
  });
});

function renderDashboard() {
  return render(<MemoryRouter><Dashboard /></MemoryRouter>);
}

describe('Dashboard Page', () => {
  it('keeps announcements visible before inventory alerts and achievements', async () => {
    renderDashboard();
    expect(await screen.findByText(/Progreso del mes/i)).toBeInTheDocument();
    expect(screen.getByText(/Total realizados/i)).toBeInTheDocument();
    const announcements = screen.getByRole('region', { name: 'Anuncios' });
    const inventory = screen.getByRole('region', { name: 'Alertas de Inventario Comprometido' });
    expect(within(announcements).getByText(announcement.contenido)).toBeVisible();
    expect(announcements.compareDocumentPosition(inventory) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Logros Recientes' })).toBeInTheDocument();
  });

  it('hides expired inventory alerts and shows the current count', async () => {
    renderDashboard();
    expect(await screen.findByText('Mesa de prueba')).toBeInTheDocument();
    expect(screen.queryByText('Mesa vencida')).not.toBeInTheDocument();
    expect(screen.getByText('1 vigente')).toBeInTheDocument();
  });

  it('keeps the announcements and achievements when no inventory alerts are active', async () => {
    alerts = [];
    renderDashboard();
    expect(await screen.findByText(announcement.contenido)).toBeVisible();
    expect(screen.getByText('Sin alertas de inventario vigentes')).toBeInTheDocument();
    expect(screen.getByText('Sin logros registrados esta semana')).toBeInTheDocument();
  });
});
