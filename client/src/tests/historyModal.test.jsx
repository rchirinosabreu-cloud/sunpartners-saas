import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HistoryModal from '../components/modals/HistoryModal';

let fetchMock;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-07T02:30:00Z'));
  fetchMock = vi.fn(async () => ({ ok: true, json: async () => [] }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('history modal opens with one calendar day', () => {
  it('requests all completions from today in Bogota rather than all-time history', async () => {
    render(<HistoryModal isOpen onClose={() => {}} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks/history?startDate=2026-10-06&endDate=2026-10-06', expect.any(Object),
    ));
    expect(screen.getByLabelText('Filtrar por Día')).toHaveValue('2026-10-06');
  });

  it('keeps an empty date selection scoped to today', async () => {
    render(<HistoryModal isOpen onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Filtrar por Día'), { target: { value: '' } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByLabelText('Filtrar por Día')).toHaveValue('2026-10-06');
    expect(fetchMock.mock.calls.filter(([url]) => url.startsWith('/api/tasks/history'))
      .every(([url]) => url.includes('startDate=2026-10-06&endDate=2026-10-06'))).toBe(true);
  });
});
