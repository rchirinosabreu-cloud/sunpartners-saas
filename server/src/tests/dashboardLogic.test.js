import { describe, it, expect } from 'vitest';

/**
 * Lógica de cálculo de estadísticas del Dashboard
 * formula: (Tasks Realizadas este mes / Total Tasks creadas este mes) * 100
 */
export function calculateMonthlyProgress(completedInMonth, totalCreatedInMonth) {
  if (totalCreatedInMonth === 0) return 0;
  return Math.round((completedInMonth / totalCreatedInMonth) * 100);
}

/**
 * Filtrado de logros recientes (últimos 7 días)
 */
export function filterRecentAchievements(tasks, now = new Date()) {
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  return tasks.filter(task => {
    if (task.status !== 'REALIZADO' || !task.updatedAt) return false;
    const completedDate = new Date(task.updatedAt);
    return completedDate >= sevenDaysAgo && completedDate <= now;
  });
}

describe('Dashboard Logic', () => {
  describe('calculateMonthlyProgress', () => {
    it('should return 0 if no tasks were created', () => {
      expect(calculateMonthlyProgress(0, 0)).toBe(0);
    });

    it('should return 50 if half of the tasks are completed', () => {
      expect(calculateMonthlyProgress(5, 10)).toBe(50);
    });

    it('should return 100 if all tasks are completed', () => {
      expect(calculateMonthlyProgress(10, 10)).toBe(100);
    });

    it('should round the result', () => {
      expect(calculateMonthlyProgress(1, 3)).toBe(33);
    });
  });

  describe('filterRecentAchievements', () => {
    const now = new Date('2025-05-15T12:00:00Z');

    it('should filter tasks completed in the last 7 days', () => {
      const tasks = [
        { id: '1', status: 'REALIZADO', updatedAt: '2025-05-14T10:00:00Z' }, // Recent
        { id: '2', status: 'REALIZADO', updatedAt: '2025-05-07T10:00:00Z' }, // Too old (8 days ago)
        { id: '3', status: 'PENDIENTE', updatedAt: '2025-05-14T10:00:00Z' }, // Not completed
        { id: '4', status: 'REALIZADO', updatedAt: '2025-05-15T11:00:00Z' }, // Very recent
      ];

      const achievements = filterRecentAchievements(tasks, now);
      expect(achievements).toHaveLength(2);
      expect(achievements.map(a => a.id)).toContain('1');
      expect(achievements.map(a => a.id)).toContain('4');
    });

    it('should return empty array if no tasks are completed', () => {
      const tasks = [
        { id: '1', status: 'PENDIENTE', updatedAt: '2025-05-14T10:00:00Z' },
      ];
      expect(filterRecentAchievements(tasks, now)).toHaveLength(0);
    });
  });
});
