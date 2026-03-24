const prisma = require('../db');
const crypto = require('crypto');

const includeAll = {
  client: true,
  items: { include: { inventory: true } },
  services: true,
  planning: true,
  logs: { include: { user: true }, orderBy: { createdAt: 'desc' } }
};

exports.getAll = async (req, res) => {
  try {
    const { estado } = req.query;
    const quotations = await prisma.quotation.findMany({
      where: estado ? { estado } : {},
      include: {
        client: true,
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
        fecha_inicio,
        fecha_fin,
        fecha_montaje_inicio,
        fecha_montaje_fin,
        fecha_desmontaje_inicio,
        fecha_desmontaje_fin,
        bitacora,
        items,
        services,
        estado = 'BORRADOR'
    } = req.body;

    const quotation = await prisma.quotation.create({
      data: {
        clientId,
        nombre_evento: nombre_evento || 'Evento sin nombre',
        tipo_evento: tipo_evento || 'Corporativo',
        ubicacion: ubicacion || 'Por definir',
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin),
        fecha_montaje_inicio: fecha_montaje_inicio ? new Date(fecha_montaje_inicio) : null,
        fecha_montaje_fin: fecha_montaje_fin ? new Date(fecha_montaje_fin) : null,
        fecha_desmontaje_inicio: fecha_desmontaje_inicio ? new Date(fecha_desmontaje_inicio) : null,
        fecha_desmontaje_fin: fecha_desmontaje_fin ? new Date(fecha_desmontaje_fin) : null,
        bitacora,
        estado,
        items: {
          create: (items || []).map(item => ({
            inventoryId: item.inventoryId,
            cantidad: parseInt(item.cantidad),
            precio_pactado: parseFloat(item.precio_pactado),
            clase_asignada: item.clase_asignada || 'A'
          }))
        },
        services: {
          create: (services || []).map(svc => ({
            tipo: svc.tipo,
            descripcion: svc.descripcion,
            cantidad: parseInt(svc.cantidad || 1),
            precio_pactado: parseFloat(svc.precio_pactado)
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
    const {
        clientId,
        nombre_evento,
        tipo_evento,
        ubicacion,
        fecha_inicio,
        fecha_fin,
        fecha_montaje_inicio,
        fecha_montaje_fin,
        fecha_desmontaje_inicio,
        fecha_desmontaje_fin,
        bitacora,
        items,
        services
    } = req.body;

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
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin),
        fecha_montaje_inicio: fecha_montaje_inicio ? new Date(fecha_montaje_inicio) : null,
        fecha_montaje_fin: fecha_montaje_fin ? new Date(fecha_montaje_fin) : null,
        fecha_desmontaje_inicio: fecha_desmontaje_inicio ? new Date(fecha_desmontaje_inicio) : null,
        fecha_desmontaje_fin: fecha_desmontaje_fin ? new Date(fecha_desmontaje_fin) : null,
        bitacora,
        items: {
          create: (items || []).map(item => ({
            inventoryId: item.inventoryId,
            cantidad: parseInt(item.cantidad),
            precio_pactado: parseFloat(item.precio_pactado),
            clase_asignada: item.clase_asignada || 'A'
          }))
        },
        services: {
          create: (services || []).map(svc => ({
            tipo: svc.tipo,
            descripcion: svc.descripcion,
            cantidad: parseInt(svc.cantidad || 1),
            precio_pactado: parseFloat(svc.precio_pactado)
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
    const quotation = await prisma.quotation.findUnique({ where: { secureHash: hash } });

    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada' });

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

  const start = q.fecha_inicio;
  const end = q.fecha_fin;

  const overlaps = await prisma.quotation.findMany({
    where: {
      id: { not: quotationId },
      estado: { in: ['APROBADA', 'EJECUCION'] },
      OR: [
        { fecha_inicio: { lte: end }, fecha_fin: { gte: start } }
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
    const inv = await prisma.inventoryItem.findUnique({ where: { id: item.inventoryId } });
    const totalAvailable = (inv.claseA || 0) + (inv.claseB || 0);
    const alreadyCommitted = committed[item.inventoryId] || 0;

    if (alreadyCommitted + item.cantidad > totalAvailable) {
      return `Stock insuficiente para "${inv.nombre}". Disponible total (A+B): ${totalAvailable}, Comprometido en otras fechas: ${alreadyCommitted}, Solicitado: ${item.cantidad}`;
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
