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
      include: { bodega: true }
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

exports.updateCommercial = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.valor_alquiler !== undefined) data.valor_alquiler = parseFloat(data.valor_alquiler || 0);

    // Note: Quantities sync back to Bodega via Prisma extension
    const updated = await prisma.inventory_Commercial.update({
      where: { id: req.params.id },
      data
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
