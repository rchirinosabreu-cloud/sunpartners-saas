export const TASK_STATUSES = ['PENDIENTE', 'EN_PROCESO', 'REALIZADO'];

export function isCardVisuallyDragging({ cardId, activeId, isOverlay }) {
  return !isOverlay && activeId === cardId;
}

export function getKanbanCardStyle({
  isDragging,
  isCompleted,
  isOverlay,
  transform,
  transition,
}) {
  return {
    transform: isOverlay ? undefined : transform,
    transition: isOverlay ? undefined : transition,
    opacity: isCompleted ? 0.7 : (!isOverlay && isDragging ? 0.3 : 1),
    zIndex: isOverlay || isDragging ? 50 : undefined,
  };
}

export function resolveDropStatus({ activeId, overId, tasks, lastTargetStatus }) {
  if (TASK_STATUSES.includes(overId)) return overId;
  if (overId === activeId) return lastTargetStatus;

  const overTask = tasks.find(task => task.id === overId);
  return overTask?.status || lastTargetStatus || null;
}

export function getCurrentBogotaMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  return `${year}-${month}`;
}

export function getCurrentBogotaMonthLabel(now = new Date()) {
  const month = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    month: 'long',
  }).format(now);
  return month.charAt(0).toUpperCase() + month.slice(1);
}
