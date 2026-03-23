const prisma = require('../db');

exports.getAll = async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany();
    // Calculate vlrTotal on the fly as requested
    const itemsWithTotal = items.map(item => ({
      ...item,
      vlrTotal: item.existenciaTotal * item.vlrUnitario
    }));
    res.json(itemsWithTotal);
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

    res.json({
      ...item,
      vlrTotal: item.existenciaTotal * item.vlrUnitario
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, clase, bodega, seccion, vlrUnitario, disponibles, enReparacion, observaciones } = req.body;

    // Rule: existenciaTotal = disponibles + enReparacion
    const existenciaTotal = (parseInt(disponibles) || 0) + (parseInt(enReparacion) || 0);

    const newItem = await prisma.inventoryItem.create({
      data: {
        nombre,
        clase,
        bodega,
        seccion,
        existenciaTotal,
        vlrUnitario: parseFloat(vlrUnitario),
        disponibles: parseInt(disponibles) || 0,
        enReparacion: parseInt(enReparacion) || 0,
        observaciones
      }
    });

    res.status(201).json({
      ...newItem,
      vlrTotal: newItem.existenciaTotal * newItem.vlrUnitario
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { disponibles, enReparacion, ...rest } = req.body;
    const data = { ...rest };

    if (disponibles !== undefined || enReparacion !== undefined) {
      const current = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
      const newDisponibles = disponibles !== undefined ? parseInt(disponibles) : current.disponibles;
      const newEnReparacion = enReparacion !== undefined ? parseInt(enReparacion) : current.enReparacion;

      data.disponibles = newDisponibles;
      data.enReparacion = newEnReparacion;
      data.existenciaTotal = newDisponibles + newEnReparacion;
    }

    if (data.vlrUnitario) data.vlrUnitario = parseFloat(data.vlrUnitario);

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data
    });

    res.json({
      ...updatedItem,
      vlrTotal: updatedItem.existenciaTotal * updatedItem.vlrUnitario
    });
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
