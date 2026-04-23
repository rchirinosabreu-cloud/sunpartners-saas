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

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Progreso del mes (Optimizado con count)
    const [totalCreatedInMonth, completedInMonth] = await Promise.all([
      prisma.task.count({
        where: {
          createdAt: { gte: firstDayOfMonth },
          deletedAt: null
        }
      }),
      prisma.task.count({
        where: {
          createdAt: { gte: firstDayOfMonth },
          status: 'REALIZADO',
          deletedAt: null
        }
      })
    ]);

    const progresoMes = totalCreatedInMonth === 0
      ? 0
      : Math.round((completedInMonth / totalCreatedInMonth) * 100);

    // 2. Total realizados (Histórico)
    const totalRealizados = await prisma.task.count({
      where: {
        status: 'REALIZADO',
        deletedAt: null
      }
    });

    // 3. Logros Recientes (Últimos 7 días)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const logrosRecientes = await prisma.task.findMany({
      where: {
        status: 'REALIZADO',
        updatedAt: { gte: sevenDaysAgo },
        deletedAt: null
      },
      include: {
        user: { select: { id: true, nombre: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      progresoMes,
      totalRealizados,
      logrosRecientes,
      totalCreatedInMonth,
      completedInMonth
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const where = {
      status: 'REALIZADO',
      deletedAt: null
    };

    if (startDate || endDate) {
      where.updatedAt = {};
      if (startDate) where.updatedAt.gte = new Date(startDate);
      if (endDate) where.updatedAt.lte = new Date(endDate);
    }

    if (userId) {
      where.userId = userId;
    }

    const history = await prisma.task.findMany({
      where,
      include: {
        user: { select: { id: true, nombre: true } },
        client: { select: { id: true, razon_social: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Group by worker
    const groupedHistory = history.reduce((acc, task) => {
      const workerId = task.userId;
      if (!acc[workerId]) {
        acc[workerId] = {
          worker: task.user,
          tasks: []
        };
      }
      acc[workerId].tasks.push(task);
      return acc;
    }, {});

    res.json(Object.values(groupedHistory));
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
    const { titulo, clientId, userId, fechaLimite, isPriority, isImprorrogable, order, comentarios, status, reason } = req.body;

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
    const { justification, reason } = req.body;

    await prisma.task.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedJustification: reason || justification || 'Ajuste manual del administrador'
      }
    });
    res.json({ message: 'Tarea eliminada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
