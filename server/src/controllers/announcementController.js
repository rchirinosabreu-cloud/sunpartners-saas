const prisma = require('../db');
const { getSignedUrlHelper } = require('../utils/s3Client');

exports.getAll = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { deletedAt: null },
      include: {
        author: { select: { id: true, nombre: true, fotoPerfilUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const announcementsWithUrls = await Promise.all(announcements.map(async (ann) => {
      if (ann.author?.fotoPerfilUrl) {
        ann.author.fotoPerfilUrl = await getSignedUrlHelper(ann.author.fotoPerfilUrl);
      }
      return ann;
    }));

    res.json(announcementsWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await prisma.announcement.findUnique({ where: { id } });

    if (!announcement) return res.status(404).json({ error: 'Anuncio no encontrado' });

    // Check permissions: ADMIN or author
    if (req.userRole !== 'ADMIN' && announcement.authorId !== req.userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este anuncio' });
    }

    await prisma.announcement.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'Anuncio eliminado correctamente' });
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
        author: { select: { id: true, nombre: true, fotoPerfilUrl: true } }
      }
    });

    if (announcement.author?.fotoPerfilUrl) {
      announcement.author.fotoPerfilUrl = await getSignedUrlHelper(announcement.author.fotoPerfilUrl);
    }

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
