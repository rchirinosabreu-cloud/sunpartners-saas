import { describe, expect, it } from 'vitest';
import {
  getKanbanCardStyle,
  isCardVisuallyDragging,
  resolveDropStatus,
} from '../utils/kanbanDragLogic';

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

describe('getKanbanCardStyle', () => {
  it('keeps an open drag overlay clone fully visible and untransformed', () => {
    expect(getKanbanCardStyle({
      isDragging: true,
      isCompleted: false,
      isOverlay: true,
      transform: { x: 20, y: 10 },
      transition: 'transform 200ms ease',
    })).toEqual({
      transform: undefined,
      transition: undefined,
      opacity: 1,
      zIndex: 50,
    });
  });

  it('dims only the original card while it is actively being dragged', () => {
    expect(getKanbanCardStyle({
      isDragging: true,
      isCompleted: false,
      isOverlay: false,
      transform: null,
      transition: undefined,
    }).opacity).toBe(0.3);
  });

  it('keeps completed cards dimmed after the drag finishes', () => {
    expect(getKanbanCardStyle({
      isDragging: false,
      isCompleted: true,
      isOverlay: false,
      transform: null,
      transition: undefined,
    }).opacity).toBe(0.7);
  });
});

describe('isCardVisuallyDragging', () => {
  it('stops dimming immediately when the controlled active id is cleared', () => {
    expect(isCardVisuallyDragging({ cardId: 'task-1', activeId: null, isOverlay: false })).toBe(false);
  });

  it('dims only the active original card, never its overlay clone', () => {
    expect(isCardVisuallyDragging({ cardId: 'task-1', activeId: 'task-1', isOverlay: false })).toBe(true);
    expect(isCardVisuallyDragging({ cardId: 'task-1', activeId: 'task-1', isOverlay: true })).toBe(false);
  });
});
