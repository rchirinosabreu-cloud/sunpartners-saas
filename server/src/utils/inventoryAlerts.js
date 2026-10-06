async function getActiveInventoryAlerts(prisma, now = new Date()) {
  const alerts = await prisma.inventoryAlert.findMany({
    where: {
      resolvedAt: null,
      quotation: { is: {
        estado: { in: ['APROBADA', 'EJECUCION', 'CONFIRMED'] },
        archivedAt: null,
        deletedAt: null,
        desmontaje_fin: { gt: now },
      } },
    },
    include: { quotation: { select: {
      id: true, nombre_evento: true, consecutivo: true,
      montaje_inicio: true, desmontaje_fin: true,
      client: { select: { razon_social: true } },
    } } },
    orderBy: { quotation: { montaje_inicio: 'asc' } },
  });

  // Quotation dates are authoritative when an event has been rescheduled.
  // Expiration is a read filter so historical alert records remain intact.
  return alerts.map(alert => ({
    ...alert,
    startDate: alert.quotation.montaje_inicio,
    endDate: alert.quotation.desmontaje_fin,
  }));
}

module.exports = { getActiveInventoryAlerts };
