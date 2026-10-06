import { describe, expect, it } from 'vitest';
import { filterActiveInventoryAlerts } from '../utils/inventoryAlerts';

describe('inventory alerts expire while the dashboard remains open', () => {
  const now = new Date('2026-10-06T10:00:00-05:00');
  const alert = { id: 'active', resolvedAt: null, endDate: '2026-10-06T10:01:00-05:00' };

  it('keeps future events and the dismantling period, even when the event itself has ended', () => {
    expect(filterActiveInventoryAlerts([{ ...alert, evento_fin: '2026-10-05T18:00:00-05:00' }], now))
      .toHaveLength(1);
  });

  it('removes past, exactly expired and resolved alerts without mutating the records', () => {
    const alerts = [alert,
      { ...alert, id: 'past', endDate: '2026-06-17T18:00:00-05:00' },
      { ...alert, id: 'boundary', endDate: now.toISOString() },
      { ...alert, id: 'resolved', resolvedAt: now.toISOString() },
    ];
    expect(filterActiveInventoryAlerts(alerts, now).map(a => a.id)).toEqual(['active']);
    expect(alerts).toHaveLength(4);
    expect(filterActiveInventoryAlerts(alerts, new Date('2026-10-06T10:01:00-05:00'))).toEqual([]);
  });

  it('does not keep records with invalid or missing end dates', () => {
    expect(filterActiveInventoryAlerts([{ id: 'missing' }, { endDate: 'invalid' }], now)).toEqual([]);
    expect(filterActiveInventoryAlerts(null, now)).toEqual([]);
  });
});
