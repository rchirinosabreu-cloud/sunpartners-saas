import { describe, expect, it } from 'vitest';
import {
  buildTaskBoardWhere,
  getBogotaMonthRange,
} from '../utils/taskBoardFilters';

describe('task board month filtering', () => {
  it('calculates the exact UTC boundaries for a Bogota calendar month', () => {
    const range = getBogotaMonthRange('2026-09');

    expect(range.start.toISOString()).toBe('2026-09-01T05:00:00.000Z');
    expect(range.end.toISOString()).toBe('2026-10-01T05:00:00.000Z');
  });

  it('keeps every open task but limits completed tasks to the selected month', () => {
    const where = buildTaskBoardWhere({ completedMonth: '2026-09' });

    expect(where).toEqual({
      OR: [
        { status: { not: 'REALIZADO' } },
        {
          status: 'REALIZADO',
          updatedAt: {
            gte: new Date('2026-09-01T05:00:00.000Z'),
            lt: new Date('2026-10-01T05:00:00.000Z'),
          },
        },
      ],
    });
  });

  it('rejects malformed month parameters instead of widening the query', () => {
    expect(() => buildTaskBoardWhere({ completedMonth: 'september' }))
      .toThrow('completedMonth must use YYYY-MM format');
  });
});
