const prisma = require('../db');

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
      include: {
        client: true,
        items: { include: { inventory: true } },
        planning: true,
        logs: { include: { user: true }, orderBy: { createdAt: 'desc' } }
      }
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
        items,
        estado = 'BORRADOR'
    } = req.body;

    // items: [{ inventoryId, cantidad, precio_pactado, clase_asignada }]

    const quotation = await prisma.quotation.create({
      data: {
        clientId,
        nombre_evento: nombre_evento || 'Evento sin nombre',
        tipo_evento: tipo_evento || 'Corporativo',
        ubicacion: ubicacion || 'Por definir',
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin),
        estado,
        items: {
          create: items.map(item => ({
            inventoryId: item.inventoryId,
            cantidad: parseInt(item.cantidad),
            precio_pactado: parseFloat(item.precio_pactado),
            clase_asignada: item.clase_asignada || 'A'
          }))
        },
        logs: {
          create: {
            message: 'Cotización creada en el sistema',
            userId: req.userId
          }
        }
      },
      include: { items: true }
    });

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { estado, details } = req.body;
    const current = await prisma.quotation.findUnique({ where: { id: req.params.id } });

    if (estado === 'APROBADA' || estado === 'EJECUCION') {
      // Check availability before allowing approval
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

  // Find all confirmed/executing quotations that overlap
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

  // Calculate total committed stock for each item in the overlap period
  const committed = {};
  overlaps.forEach(overlap => {
    overlap.items.forEach(item => {
      committed[item.inventoryItemId] = (committed[item.inventoryItemId] || 0) + item.quantity;
    });
  });

  // Check each item in current quotation against total stock (claseA + claseB)
  for (const item of q.items) {
    const inv = await prisma.inventoryItem.findUnique({ where: { id: item.inventoryItemId } });
    const totalAvailable = (inv.claseA || 0) + (inv.claseB || 0);
    const alreadyCommitted = committed[item.inventoryItemId] || 0;

    if (alreadyCommitted + item.quantity > totalAvailable) {
      return `Stock insuficiente para "${inv.nombre}". Disponible total (A+B): ${totalAvailable}, Comprometido en otras fechas: ${alreadyCommitted}, Solicitado: ${item.quantity}`;
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
