const prisma = require('../db');
const bcrypt = require('bcrypt');
const { s3Client, BUCKET_NAME, getSignedUrlHelper, DeleteObjectCommand } = require('../utils/s3Client');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

exports.getAll = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nombre: true,
        username: true,
        email: true,
        position: true,
        role: true,
        isActive: true,
        fotoPerfilUrl: true,
        createdAt: true,
        department: true
      },
      orderBy: { nombre: 'asc' }
    });

    // Generate signed URLs for users with profile pictures
    const usersWithUrls = await Promise.all(users.map(async (user) => {
      if (user.fotoPerfilUrl) {
        try {
          user.fotoPerfilUrl = await getSignedUrlHelper(user.fotoPerfilUrl);
        } catch (err) {
          console.error(`Error generating signed URL for user ${user.id}:`, err);
          user.fotoPerfilUrl = null;
        }
      }
      return user;
    }));

    res.json(usersWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, username, email, position, password, role, department } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'El nombre de usuario es obligatorio.' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        nombre,
        username,
        email: email || null,
        position,
        password: hashedPassword,
        role,
        department,
        isActive: true
      },
      select: { id: true, nombre: true, username: true, email: true, role: true, isActive: true }
    });

    res.status(201).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.includes('username') ? 'nombre de usuario' : 'email';
      return res.status(400).json({ error: `Ya existe un registro con este ${field}.` });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, username, email, position, role, department, isActive, password } = req.body;

    const data = { nombre, username, email: email || null, position, role, department, isActive };

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
      }
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, nombre: true, username: true, email: true, role: true, isActive: true, fotoPerfilUrl: true }
    });

    if (user.fotoPerfilUrl) {
      user.fotoPerfilUrl = await getSignedUrlHelper(user.fotoPerfilUrl);
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  try {
    const targetUserId = req.params.id || req.userId;
    const currentUser = req.user; // Full user payload from authMiddleware

    // 0. Strict Authorization Lock
    const isSelf = currentUser.userId === targetUserId;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'No tienes autorización para cambiar la foto de este usuario.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, fotoPerfilUrl: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // 1. Delete old photo if it exists
    if (user.fotoPerfilUrl) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: user.fotoPerfilUrl
        }));
      } catch (err) {
        console.error('Error deleting old profile picture from S3:', err);
        // Continue anyway
      }
    }

    // 2. Upload new photo
    const fileExtension = path.extname(req.file.originalname);
    const key = `profiles/user-${targetUserId}-${Date.now()}${fileExtension}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    // 3. Update database
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { fotoPerfilUrl: key },
      select: { id: true, fotoPerfilUrl: true }
    });

    // 4. Return signed URL
    const signedUrl = await getSignedUrlHelper(key);
    res.json({ fotoPerfilUrl: signedUrl });

  } catch (error) {
    console.error('Error en uploadProfilePicture:', error);
    res.status(500).json({ error: 'Error al cargar la fotografía de perfil.' });
  }
};
