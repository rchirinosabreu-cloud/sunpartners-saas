const DAY_MS = 24 * 60 * 60 * 1000;

function parseBogotaDay(day) {
  const date = new Date(`${day}T00:00:00-05:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) {
    const error = new Error('La fecha del historial debe ser un día válido en formato YYYY-MM-DD');
    error.code = 'INVALID_HISTORY_DATE';
    throw error;
  }
  return date;
}

function buildTaskHistoryWhere({ startDate, endDate, userId, now = new Date() } = {}) {
  const today = new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const start = parseBogotaDay(startDate || endDate || today);
  const end = parseBogotaDay(endDate || startDate || today);
  if (end < start) {
    const error = new Error('La fecha final no puede ser anterior a la fecha inicial');
    error.code = 'INVALID_HISTORY_DATE';
    throw error;
  }
  const where = {
    status: 'REALIZADO',
    deletedAt: null,
    updatedAt: { gte: start, lt: new Date(end.getTime() + DAY_MS) },
  };
  if (userId) where.userId = userId;
  return where;
}

module.exports = { buildTaskHistoryWhere };
