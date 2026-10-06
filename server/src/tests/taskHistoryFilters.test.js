import { describe, expect, it } from 'vitest';
import { buildTaskHistoryWhere } from '../utils/taskHistoryFilters';

describe('completed task history by Bogota calendar day', () => {
  it('defaults to today in Bogota even when UTC is already the following day', () => {
    const where = buildTaskHistoryWhere({ now: new Date('2026-10-07T02:30:00Z') });
    expect(where).toEqual({
      status: 'REALIZADO', deletedAt: null,
      updatedAt: { gte: new Date('2026-10-06T05:00:00Z'), lt: new Date('2026-10-07T05:00:00Z') },
    });
  });

  it('includes every completion on the selected day and excludes adjacent days', () => {
    const where = buildTaskHistoryWhere({ startDate: '2026-10-06', endDate: '2026-10-06' });
    expect(where.updatedAt).toEqual({
      gte: new Date('2026-10-06T05:00:00Z'), lt: new Date('2026-10-07T05:00:00Z'),
    });
    const matches = instant => new Date(instant) >= where.updatedAt.gte && new Date(instant) < where.updatedAt.lt;
    expect(matches('2026-10-06T04:59:59.999Z')).toBe(false);
    expect(matches('2026-10-06T05:00:00.000Z')).toBe(true);
    expect(matches('2026-10-07T04:59:59.999Z')).toBe(true);
    expect(matches('2026-10-07T05:00:00.000Z')).toBe(false);
  });

  it('keeps a member filter scoped to the chosen day', () => {
    expect(buildTaskHistoryWhere({ startDate: '2026-10-06', userId: 'worker-1' }))
      .toMatchObject({ userId: 'worker-1', updatedAt: { gte: new Date('2026-10-06T05:00:00Z') } });
  });

  it('rejects invalid dates and reversed ranges instead of returning all history', () => {
    for (const startDate of ['invalid', '2026-02-30', '2026-10-06T12:00:00Z']) {
      expect(() => buildTaskHistoryWhere({ startDate })).toThrow();
    }
    expect(() => buildTaskHistoryWhere({ startDate: '2026-10-07', endDate: '2026-10-06' })).toThrow();
  });
});
