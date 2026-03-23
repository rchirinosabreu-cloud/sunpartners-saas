const prisma = require('../db');

const calculateComputedFields = (item) => {
  const claseA = parseInt(item.claseA) || 0;
  const claseB = parseInt(item.claseB) || 0;
  const claseC = parseInt(item.claseC) || 0;
  const existenciaTotal = claseA + claseB + claseC;
  const vlrUnitario = parseFloat(item.vlrUnitario) || 0;

  return {
    ...item,
    existenciaTotal,
    disponibles: claseA + claseB,
    enReparacion: claseC,
    vlrTotal: existenciaTotal * vlrUnitario
  };
};

exports.getAll = async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany();
    res.json(items.map(calculateComputedFields));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: req.params.id }
    });
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    res.json(calculateComputedFields(item));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, claseA, claseB, claseC, bodega, seccion, vlrUnitario, observaciones } = req.body;

    const newItem = await prisma.inventoryItem.create({
      data: {
        nombre,
        claseA: parseInt(claseA) || 0,
        claseB: parseInt(claseB) || 0,
        claseC: parseInt(claseC) || 0,
        bodega,
        seccion,
        vlrUnitario: parseFloat(vlrUnitario) || 0,
        observaciones
      }
    });

    res.status(201).json(calculateComputedFields(newItem));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };

    if (data.claseA !== undefined) data.claseA = parseInt(data.claseA);
    if (data.claseB !== undefined) data.claseB = parseInt(data.claseB);
    if (data.claseC !== undefined) data.claseC = parseInt(data.claseC);
    if (data.vlrUnitario !== undefined) data.vlrUnitario = parseFloat(data.vlrUnitario);

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data
    });

    res.json(calculateComputedFields(updatedItem));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.softDelete = async (req, res) => {
  try {
    const { justification } = req.body;
    await prisma.inventoryItem.softDelete(req.params.id, justification);
    res.json({ message: 'Artículo archivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
