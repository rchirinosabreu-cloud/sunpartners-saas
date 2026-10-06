export function filterActiveInventoryAlerts(alerts, now = new Date()) {
  if (!Array.isArray(alerts)) return [];
  const cutoff = new Date(now).getTime();
  return alerts.filter(alert => !alert.resolvedAt && new Date(alert.endDate).getTime() > cutoff);
}
