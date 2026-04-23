const prisma = require('../db');

exports.getAll = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      include: {
        author: { select: { id: true, nombre: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { contenido, tipo } = req.body;
    const authorId = req.userId; // Securely take from session

    const announcement = await prisma.announcement.create({
      data: {
        contenido,
        tipo: tipo || 'INFO',
        authorId
      },
      include: {
        author: { select: { id: true, nombre: true } }
      }
    });
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
