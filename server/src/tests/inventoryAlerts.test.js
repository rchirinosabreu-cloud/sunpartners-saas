import { describe, expect, it, vi } from 'vitest';
import { getActiveInventoryAlerts } from '../utils/inventoryAlerts';

describe('dashboard inventory alert lifecycle', () => {
  const now = new Date('2026-10-06T10:00:00-05:00');

  it('queries only unresolved alerts for active, unarchived and undeleted quotations whose dismantling has not ended', async () => {
    const db = { inventoryAlert: { findMany: vi.fn().mockResolvedValue([]) } };
    await getActiveInventoryAlerts(db, now);
    const query = db.inventoryAlert.findMany.mock.calls[0][0];
    expect(query.where).toEqual({
      resolvedAt: null,
      quotation: { is: {
        estado: { in: ['APROBADA', 'EJECUCION', 'CONFIRMED'] },
        archivedAt: null, deletedAt: null, desmontaje_fin: { gt: now },
      } },
    });
    expect(query.orderBy).toEqual({ quotation: { montaje_inicio: 'asc' } });
  });

  it('uses the current quotation dates even when the stored alert dates are stale', async () => {
    const quotation = {
      id: 'q1', consecutivo: 123, nombre_evento: 'Evento reprogramado',
      montaje_inicio: new Date('2026-10-08T09:00:00-05:00'),
      desmontaje_fin: new Date('2026-10-09T18:00:00-05:00'),
      client: { razon_social: 'Cliente' },
    };
    const storedAlert = {
      id: 'alert1', quotationId: 'q1', deficit: 3,
      startDate: new Date('2026-06-16T09:00:00-05:00'),
      endDate: new Date('2026-06-17T18:00:00-05:00'), quotation,
    };
    const db = { inventoryAlert: { findMany: vi.fn().mockResolvedValue([storedAlert]) } };
    const [result] = await getActiveInventoryAlerts(db, now);
    expect(result.startDate).toEqual(quotation.montaje_inicio);
    expect(result.endDate).toEqual(quotation.desmontaje_fin);
    expect(result.deficit).toBe(3);
    expect(storedAlert.endDate.getMonth()).toBe(5);
    expect(db.inventoryAlert.findMany.mock.calls[0][0].include.quotation.select)
      .toMatchObject({ montaje_inicio: true, desmontaje_fin: true });
  });

  it('compares the exact instant in Bogota, including the midnight boundary', async () => {
    const midnight = new Date('2026-10-07T00:00:00-05:00');
    const db = { inventoryAlert: { findMany: vi.fn().mockResolvedValue([]) } };
    await getActiveInventoryAlerts(db, midnight);
    const cutoff = db.inventoryAlert.findMany.mock.calls[0][0].where.quotation.is.desmontaje_fin;
    expect(cutoff.gt.toISOString()).toBe('2026-10-07T05:00:00.000Z');
    expect(cutoff.gte).toBeUndefined();
  });
});
