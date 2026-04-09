const prisma = require('../db');
const crypto = require('crypto');
const { calculateLineTotal, calculateTotals } = require('../utils/quotationUtils');

const includeAll = {
  client: true,
  consultant: { select: { id: true, nombre: true, email: true } },
  items: { include: { inventory: true } },
  services: true,
  planning: true,
  logs: { include: { user: true }, orderBy: { createdAt: 'desc' } }
};

exports.getAll = async (req, res) => {
  try {
    const { estado, archived } = req.query;
    const where = estado ? { estado } : {};

    // Default: only non-archived. If archived='true', only archived.
    if (archived === 'true') {
      where.archivedAt = { not: null };
    } else {
      where.archivedAt = null;
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        client: true,
        consultant: { select: { nombre: true } },
        items: { include: { inventory: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: includeAll
    });
    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada' });
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
        clientId,
        nombre_evento,
        tipo_evento,
        ubicacion,
        montaje_inicio,
        montaje_fin,
        evento_inicio,
        evento_fin,
        desmontaje_inicio,
        desmontaje_fin,
        bitacora,
        items,
        services,
        estado = 'BORRADOR'
    } = req.body;

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    const isTaxExempt = client?.isTaxExempt || false;

    const { subtotal: vlrNeto, total: vlrTotal } = calculateTotals(items, services, isTaxExempt);

    const quotation = await prisma.quotation.create({
      data: {
        clientId,
        consultantId: req.userId,
        nombre_evento: nombre_evento || 'Evento sin nombre',
        tipo_evento: tipo_evento || 'Corporativo',
        ubicacion: ubicacion || 'Por definir',
        montaje_inicio: new Date(montaje_inicio),
        montaje_fin: new Date(montaje_fin),
        evento_inicio: new Date(evento_inicio),
        evento_fin: new Date(evento_fin),
        desmontaje_inicio: new Date(desmontaje_inicio),
        desmontaje_fin: new Date(desmontaje_fin),
        bitacora,
        estado,
        vlrNeto,
        vlrTotal,
        items: {
          create: (items || []).map(item => ({
            inventoryId: item.inventoryId,
            cantidad: parseInt(item.cantidad),
            dias: parseInt(item.dias || 1),
            precio_pactado: parseFloat(item.precio_pactado),
            precio_dia_adicional: parseFloat(item.precio_dia_adicional || 0),
            clase_asignada: item.clase_asignada || 'A'
          }))
        },
        services: {
          create: (services || []).map(svc => ({
            tipo: svc.tipo,
            descripcion: svc.descripcion,
            cantidad: parseInt(svc.cantidad || 1),
            dias: parseInt(svc.dias || 1),
            precio_pactado: parseFloat(svc.precio_pactado),
            precio_dia_adicional: parseFloat(svc.precio_dia_adicional || 0)
          }))
        },
        logs: {
          create: {
            message: 'Cotización creada en el sistema',
            userId: req.userId
          }
        }
      },
      include: { items: true, services: true }
    });

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    // Security check for CONSULTOR
    if (req.userRole === 'CONSULTOR') {
      const existing = await prisma.quotation.findUnique({ where: { id } });
      if (existing.consultantId !== req.userId) {
        return res.status(403).json({ error: 'Acceso Denegado. Los consultores solo pueden editar sus propias cotizaciones.' });
      }
    }

    const {
        clientId,
        nombre_evento,
        tipo_evento,
        ubicacion,
        montaje_inicio,
        montaje_fin,
        evento_inicio,
        evento_fin,
        desmontaje_inicio,
        desmontaje_fin,
        bitacora,
        items,
        services
    } = req.body;

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    const isTaxExempt = client?.isTaxExempt || false;

    const { subtotal: vlrNeto, total: vlrTotal } = calculateTotals(items, services, isTaxExempt);

    // Delete existing items and services to replace them
    await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
    await prisma.quotationService.deleteMany({ where: { quotationId: id } });

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        clientId,
        nombre_evento: nombre_evento || 'Evento sin nombre',
        tipo_evento: tipo_evento || 'Corporativo',
        ubicacion: ubicacion || 'Por definir',
        montaje_inicio: new Date(montaje_inicio),
        montaje_fin: new Date(montaje_fin),
        evento_inicio: new Date(evento_inicio),
        evento_fin: new Date(evento_fin),
        desmontaje_inicio: new Date(desmontaje_inicio),
        desmontaje_fin: new Date(desmontaje_fin),
        bitacora,
        vlrNeto,
        vlrTotal,
        items: {
          create: (items || []).map(item => ({
            inventoryId: item.inventoryId,
            cantidad: parseInt(item.cantidad),
            dias: parseInt(item.dias || 1),
            precio_pactado: parseFloat(item.precio_pactado),
            precio_dia_adicional: parseFloat(item.precio_dia_adicional || 0),
            clase_asignada: item.clase_asignada || 'A'
          }))
        },
        services: {
          create: (services || []).map(svc => ({
            tipo: svc.tipo,
            descripcion: svc.descripcion,
            cantidad: parseInt(svc.cantidad || 1),
            dias: parseInt(svc.dias || 1),
            precio_pactado: parseFloat(svc.precio_pactado),
            precio_dia_adicional: parseFloat(svc.precio_dia_adicional || 0)
          }))
        },
        logs: {
          create: {
            message: 'Cotización actualizada y modificada en el sistema',
            userId: req.userId
          }
        }
      },
      include: { items: true, services: true }
    });

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateSecureLink = async (req, res) => {
  try {
    const { id } = req.params;
    const secureHash = crypto.randomBytes(32).toString('hex');

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        secureHash,
        estado: 'ENVIADA',
        logs: {
          create: {
            message: 'Link seguro generado y cotización marcada como ENVIADA',
            userId: req.userId
          }
        }
      }
    });

    res.json({ hash: secureHash, url: `/q/${secureHash}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getByHash = async (req, res) => {
  try {
    const { hash } = req.params;
    const quotation = await prisma.quotation.findUnique({
      where: { secureHash: hash },
      include: includeAll
    });

    if (!quotation) return res.status(404).json({ error: 'Cotización no válida o expirada' });
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.approveByHash = async (req, res) => {
  try {
    const { hash } = req.params;
    const quotation = await prisma.quotation.findUnique({ where: { secureHash: hash }, include: { items: true } });

    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada' });

    const conflict = await checkAvailability(quotation.id);
    if (conflict) {
      return res.status(400).json({
        error: 'Disponibilidad Limitada',
        details: 'Lo sentimos, algunos elementos de esta propuesta ya no cuentan con stock suficiente para las fechas seleccionadas. Por favor, solicite una revisión para ajustar el equipamiento.'
      });
    }

    const updated = await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        estado: 'APROBADA',
        logs: {
          create: {
            message: 'Cotización APROBADA por el cliente vía portal público'
          }
        }
      }
    });

    res.json({ message: 'Cotización aprobada con éxito', status: 'APROBADA' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.rejectByHash = async (req, res) => {
  try {
    const { hash } = req.params;
    const { rejectionType, rejectionReason } = req.body;

    if (!rejectionType) return res.status(400).json({ error: 'El motivo de rechazo es obligatorio' });

    const quotation = await prisma.quotation.findUnique({ where: { secureHash: hash } });
    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada' });

    const updated = await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        estado: 'REVISION_SOLICITADA',
        rejectionType,
        rejectionReason,
        logs: {
          create: {
            message: `Cliente solicitó revisión. Motivo: ${rejectionType}. Detalle: ${rejectionReason || 'Ninguno'}`
          }
        }
      }
    });

    res.json({ message: 'Solicitud de revisión enviada', status: 'REVISION_SOLICITADA' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { estado, details } = req.body;
    const current = await prisma.quotation.findUnique({ where: { id: req.params.id } });

    if (estado === 'APROBADA' || estado === 'EJECUCION') {
      const conflict = await checkAvailability(req.params.id);
      if (conflict) {
        return res.status(400).json({
          error: 'Conflicto de disponibilidad',
          details: conflict
        });
      }
    }

    const updated = await prisma.quotation.update({
      where: { id: req.params.id },
      data: {
        estado,
        logs: {
          create: {
            message: `Estado cambiado de ${current.estado} a ${estado}. ${details || ''}`,
            userId: req.userId
          }
        }
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.upsertPlanning = async (req, res) => {
  try {
    const { id } = req.params;
    const { cronograma, personal, transporte } = req.body;

    const planning = await prisma.planningStep.upsert({
      where: { quotationId: id },
      update: { cronograma, personal, transporte },
      create: { quotationId: id, cronograma, personal, transporte }
    });

    res.json(planning);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function checkAvailability(quotationId) {
  const q = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: true }
  });

  const start = q.montaje_inicio;
  const end = q.desmontaje_fin;

  const overlaps = await prisma.quotation.findMany({
    where: {
      id: { not: quotationId },
      estado: { in: ['APROBADA', 'EJECUCION'] },
      archivedAt: null, // Only non-archived quotations consume stock
      OR: [
        { montaje_inicio: { lte: end }, desmontaje_fin: { gte: start } }
      ]
    },
    include: { items: true }
  });

  const committed = {};
  overlaps.forEach(overlap => {
    overlap.items.forEach(item => {
      committed[item.inventoryId] = (committed[item.inventoryId] || 0) + item.cantidad;
    });
  });

  for (const item of q.items) {
    const inv = await prisma.inventory_Commercial.findUnique({
      where: { id: item.inventoryId },
      include: { bodega: true }
    });
    const totalAvailable = (inv.claseA || 0) + (inv.claseB || 0);
    const alreadyCommitted = committed[item.inventoryId] || 0;

    if (alreadyCommitted + item.cantidad > totalAvailable) {
      return `Stock insuficiente para "${inv.nombre_comercial}". Disponible total (A+B): ${totalAvailable}, Comprometido en otras fechas: ${alreadyCommitted}, Solicitado: ${item.cantidad}`;
    }
  }

  return null;
}

exports.checkAvailabilityEndpoint = async (req, res) => {
    try {
        const conflict = await checkAvailability(req.params.id);
        res.json({ available: !conflict, conflict });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.archive = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await prisma.quotation.findUnique({ where: { id } });
    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada' });

    // Restriction: Only BORRADOR, ENVIADA, FINALIZADA, CANCELADA are allowed
    const allowedStatuses = ['BORRADOR', 'ENVIADA', 'FINALIZADA', 'CANCELADA'];
    if (!allowedStatuses.includes(quotation.estado)) {
      return res.status(400).json({
        error: `Restricción de Seguridad: No se pueden archivar cotizaciones en estado ${quotation.estado}. Solo se permiten estados de cierre o etapas iniciales.`
      });
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        logs: {
          create: {
            message: 'Cotización ARCHIVADA. Se libera stock reservado.',
            userId: req.userId
          }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.unarchive = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        archivedAt: null,
        logs: {
          create: {
            message: 'Cotización DESARCHIVADA. Vuelve a la línea de tiempo activa.',
            userId: req.userId
          }
        }
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
