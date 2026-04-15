const prisma = require('../db');

exports.getAll = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        client: { select: { id: true, razon_social: true } },
        user: { select: { id: true, nombre: true, username: true } }
      },
      orderBy: [
        { status: 'asc' },
        { order: 'asc' }
      ]
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { titulo, clientId, userId, fechaLimite, isPriority, isImprorrogable, order, comentarios, status } = req.body;

    const task = await prisma.task.create({
      data: {
        titulo,
        clientId: clientId || null,
        userId,
        fechaLimite: new Date(fechaLimite),
        isPriority: isPriority || false,
        isImprorrogable: isImprorrogable || false,
        order: order || 0,
        comentarios,
        status: status || 'PENDIENTE'
      },
      include: {
        client: { select: { id: true, razon_social: true } },
        user: { select: { id: true, nombre: true, username: true } }
      }
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, clientId, userId, fechaLimite, isPriority, isImprorrogable, order, comentarios, status } = req.body;

    const data = {};
    if (titulo) data.titulo = titulo;
    if (clientId !== undefined) data.clientId = clientId || null;
    if (userId) data.userId = userId;
    if (fechaLimite) data.fechaLimite = new Date(fechaLimite);
    if (isPriority !== undefined) data.isPriority = isPriority;
    if (isImprorrogable !== undefined) data.isImprorrogable = isImprorrogable;
    if (order !== undefined) data.order = order;
    if (comentarios !== undefined) data.comentarios = comentarios;
    if (status) data.status = status;

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, razon_social: true } },
        user: { select: { id: true, nombre: true, username: true } }
      }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { justification } = req.body;

    await prisma.task.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedJustification: justification || 'Ajuste manual del administrador'
      }
    });
    res.json({ message: 'Tarea eliminada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
