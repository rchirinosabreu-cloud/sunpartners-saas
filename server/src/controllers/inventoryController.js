const prisma = require('../db');

// --- BODEGA CONTROLLERS ---
exports.getAllBodega = async (req, res) => {
  try {
    const items = await prisma.inventory_Bodega.findMany({
      include: { commercial: true }
    });
    const processed = items.map(item => {
      const claseA = parseInt(item.claseA || 0);
      const claseB = parseInt(item.claseB || 0);
      const claseC = parseInt(item.claseC || 0);
      const existenciaTotal = claseA + claseB + claseC;
      return {
        ...item,
        existenciaTotal,
        disponibles: claseA + claseB,
        enReparacion: claseC,
        vlrTotal: existenciaTotal * parseFloat(item.vlrUnitario || 0)
      };
    });
    res.json(processed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createBodega = async (req, res) => {
  try {
    const { nombre, claseA, claseB, claseC, bodega, seccion, vlrUnitario, observaciones, estado } = req.body;
    const newItem = await prisma.inventory_Bodega.create({
      data: {
        nombre,
        claseA: parseInt(claseA || 0),
        claseB: parseInt(claseB || 0),
        claseC: parseInt(claseC || 0),
        bodega,
        seccion,
        vlrUnitario: parseFloat(vlrUnitario || 0),
        observaciones,
        estado: estado || 'ACTIVO'
      }
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateBodega = async (req, res) => {
  try {
    const data = { ...req.body };
    // Numeric conversions
    ['claseA', 'claseB', 'claseC'].forEach(f => {
       if (data[f] !== undefined) data[f] = parseInt(data[f] || 0);
    });
    if (data.vlrUnitario !== undefined) data.vlrUnitario = parseFloat(data.vlrUnitario || 0);

    const updated = await prisma.inventory_Bodega.update({
      where: { id: req.params.id },
      data
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- COMMERCIAL CONTROLLERS ---
exports.getAllCommercial = async (req, res) => {
  try {
    const items = await prisma.inventory_Commercial.findMany({
      include: {
        bodega: true,
        compositions: { include: { warehouseItem: true } }
      }
    });
    const processed = items.map(item => {
      const claseA = parseInt(item.claseA || 0);
      const claseB = parseInt(item.claseB || 0);
      const claseC = parseInt(item.claseC || 0);
      return {
        ...item,
        existenciaTotal: claseA + claseB + claseC,
        disponibles: claseA + claseB,
        enReparacion: claseC
      };
    });
    res.json(processed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCommercial = async (req, res) => {
  try {
    const { nombre_comercial, valor_alquiler, compositions, bodegaId } = req.body;
    const newItem = await prisma.inventory_Commercial.create({
      data: {
        nombre_comercial,
        valor_alquiler: parseFloat(valor_alquiler || 0),
        bodegaId: bodegaId || null,
        compositions: compositions ? {
          create: compositions.map(c => ({
            warehouseItemId: c.warehouseItemId,
            quantity: parseInt(c.quantity)
          }))
        } : undefined
      },
      include: { compositions: true }
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCommercial = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_comercial, valor_alquiler, compositions } = req.body;

    // If updating compositions, clear old ones first
    if (compositions) {
      await prisma.composition.deleteMany({ where: { catalogItemId: id } });
    }

    const updated = await prisma.inventory_Commercial.update({
      where: { id },
      data: {
        nombre_comercial,
        valor_alquiler: valor_alquiler !== undefined ? parseFloat(valor_alquiler) : undefined,
        compositions: compositions ? {
          create: compositions.map(c => ({
            warehouseItemId: c.warehouseItemId,
            quantity: parseInt(c.quantity)
          }))
        } : undefined
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.softDelete = async (req, res) => {
  try {
    const { justification, type } = req.body; // type: 'Bodega' or 'Commercial'
    const model = type === 'Commercial' ? 'inventory_Commercial' : 'inventory_Bodega';
    await prisma[model].softDelete(req.params.id, justification);
    res.json({ message: 'Artículo archivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
