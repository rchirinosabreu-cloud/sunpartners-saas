import { describe, expect, it } from 'vitest';
import { resolveDropStatus } from '../utils/kanbanDragLogic';

describe('resolveDropStatus', () => {
  const tasks = [
    { id: 'task-1', status: 'PENDIENTE' },
    { id: 'task-2', status: 'EN_PROCESO' },
  ];

  it('uses the column status when dropping directly on a column', () => {
    expect(resolveDropStatus({
      activeId: 'task-1',
      overId: 'EN_PROCESO',
      tasks,
      lastTargetStatus: 'PENDIENTE',
    })).toBe('EN_PROCESO');
  });

  it('preserves the synchronous drag target when React state is still stale', () => {
    expect(resolveDropStatus({
      activeId: 'task-1',
      overId: 'task-1',
      tasks,
      lastTargetStatus: 'EN_PROCESO',
    })).toBe('EN_PROCESO');
  });

  it('uses the status of another card as the destination', () => {
    expect(resolveDropStatus({
      activeId: 'task-1',
      overId: 'task-2',
      tasks,
      lastTargetStatus: 'PENDIENTE',
    })).toBe('EN_PROCESO');
  });
});
