const BOGOTA_UTC_OFFSET_HOURS = 5;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

function getCurrentBogotaMonth(now = new Date()) {
  const bogotaTime = new Date(now.getTime() - BOGOTA_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  const year = bogotaTime.getUTCFullYear();
  const month = String(bogotaTime.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getBogotaMonthRange(completedMonth = getCurrentBogotaMonth()) {
  const match = MONTH_PATTERN.exec(completedMonth);
  const monthNumber = match ? Number(match[2]) : 0;

  if (!match || monthNumber < 1 || monthNumber > 12) {
    const error = new Error('completedMonth must use YYYY-MM format');
    error.code = 'INVALID_COMPLETED_MONTH';
    throw error;
  }

  const year = Number(match[1]);
  const monthIndex = monthNumber - 1;
  const offsetMilliseconds = BOGOTA_UTC_OFFSET_HOURS * 60 * 60 * 1000;

  return {
    start: new Date(Date.UTC(year, monthIndex, 1) + offsetMilliseconds),
    end: new Date(Date.UTC(year, monthIndex + 1, 1) + offsetMilliseconds),
  };
}

function buildTaskBoardWhere({ completedMonth, now = new Date() } = {}) {
  const month = completedMonth || getCurrentBogotaMonth(now);
  const { start, end } = getBogotaMonthRange(month);

  return {
    OR: [
      { status: { not: 'REALIZADO' } },
      {
        status: 'REALIZADO',
        updatedAt: {
          gte: start,
          lt: end,
        },
      },
    ],
  };
}

module.exports = {
  buildTaskBoardWhere,
  getBogotaMonthRange,
  getCurrentBogotaMonth,
};
