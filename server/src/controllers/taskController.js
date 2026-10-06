const prisma = require('../db');
const { getSignedUrlHelper } = require('../utils/s3Client');
const { buildTaskBoardWhere } = require('../utils/taskBoardFilters');
const { buildTaskHistoryWhere } = require('../utils/taskHistoryFilters');

exports.getAll = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: buildTaskBoardWhere({
        completedMonth: req.query.completedMonth,
        now: new Date()
      }),
      include: {
        client: { select: { id: true, razon_social: true } },
        user: { select: { id: true, nombre: true, username: true, fotoPerfilUrl: true } },
        collaborator: { select: { id: true, nombre: true, username: true, fotoPerfilUrl: true } }
      },
      orderBy: [
        { status: 'asc' },
        { order: 'asc' }
      ]
    });

    const tasksWithUrls = await Promise.all(tasks.map(async (task) => {
      if (task.user?.fotoPerfilUrl) {
        task.user.fotoPerfilUrl = await getSignedUrlHelper(task.user.fotoPerfilUrl);
      }
      if (task.collaborator?.fotoPerfilUrl) {
        task.collaborator.fotoPerfilUrl = await getSignedUrlHelper(task.collaborator.fotoPerfilUrl);
      }
      return task;
    }));

    res.json(tasksWithUrls);
  } catch (error) {
    const status = error.code === 'INVALID_COMPLETED_MONTH' ? 400 : 500;
    res.status(status).json({ error: error.message });
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
        user: { select: { id: true, nombre: true, fotoPerfilUrl: true } },
        client: { select: { razon_social: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const logrosWithUrls = await Promise.all(logrosRecientes.map(async (logro) => {
      if (logro.user?.fotoPerfilUrl) {
        logro.user.fotoPerfilUrl = await getSignedUrlHelper(logro.user.fotoPerfilUrl);
      }
      return logro;
    }));

    res.json({
      progresoMes,
      totalRealizados,
      logrosRecientes: logrosWithUrls,
      totalCreatedInMonth,
      completedInMonth
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const where = buildTaskHistoryWhere(req.query);

    const history = await prisma.task.findMany({
      where,
      include: {
        user: { select: { id: true, nombre: true, fotoPerfilUrl: true } },
        client: { select: { id: true, razon_social: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const historyWithUrls = await Promise.all(history.map(async (task) => {
      if (task.user?.fotoPerfilUrl) {
        task.user.fotoPerfilUrl = await getSignedUrlHelper(task.user.fotoPerfilUrl);
      }
      return task;
    }));

    // Group by worker
    const groupedHistory = historyWithUrls.reduce((acc, task) => {
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
    res.status(error.code === 'INVALID_HISTORY_DATE' ? 400 : 500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { titulo, clientId, userId, collaboratorId, fechaLimite, isPriority, isImprorrogable, order, comentarios, status } = req.body;

    const task = await prisma.task.create({
      data: {
        titulo,
        clientId: clientId || null,
        userId,
        collaboratorId: collaboratorId || null,
        fechaLimite: new Date(fechaLimite),
        isPriority: isPriority || false,
        isImprorrogable: isImprorrogable || false,
        order: order || 0,
        comentarios,
        status: status || 'PENDIENTE'
      },
      include: {
        client: { select: { id: true, razon_social: true } },
        user: { select: { id: true, nombre: true, username: true, fotoPerfilUrl: true } },
        collaborator: { select: { id: true, nombre: true, username: true, fotoPerfilUrl: true } }
      }
    });

    if (task.user?.fotoPerfilUrl) {
      task.user.fotoPerfilUrl = await getSignedUrlHelper(task.user.fotoPerfilUrl);
    }
    if (task.collaborator?.fotoPerfilUrl) {
      task.collaborator.fotoPerfilUrl = await getSignedUrlHelper(task.collaborator.fotoPerfilUrl);
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, clientId, userId, collaboratorId, fechaLimite, isPriority, isImprorrogable, order, comentarios, status, reason } = req.body;

    const data = {};
    if (titulo) data.titulo = titulo;
    if (clientId !== undefined) data.clientId = clientId || null;
    if (userId) data.userId = userId;
    if (collaboratorId !== undefined) data.collaboratorId = collaboratorId || null;
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
        user: { select: { id: true, nombre: true, username: true, fotoPerfilUrl: true } },
        collaborator: { select: { id: true, nombre: true, username: true, fotoPerfilUrl: true } }
      }
    });

    if (task.user?.fotoPerfilUrl) {
      task.user.fotoPerfilUrl = await getSignedUrlHelper(task.user.fotoPerfilUrl);
    }
    if (task.collaborator?.fotoPerfilUrl) {
      task.collaborator.fotoPerfilUrl = await getSignedUrlHelper(task.collaborator.fotoPerfilUrl);
    }

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
