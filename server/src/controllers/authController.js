const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { getSignedUrlHelper } = require('../utils/s3Client');

const login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // Dual login: Check by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier }
        ]
      }
    });

    if (!user) {
      console.warn(`Intento de login fallido: Usuario no encontrado (${identifier})`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn(`Intento de login fallido: Contraseña incorrecta para (${identifier})`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not defined in production');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret || 'dev-secret-key',
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    let fotoPerfilUrl = null;
    if (user.fotoPerfilUrl) {
      try {
        fotoPerfilUrl = await getSignedUrlHelper(user.fotoPerfilUrl);
      } catch (err) {
        console.error('Error generating signed URL on login:', err);
      }
    }

    res.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        username: user.username,
        email: user.email,
        role: user.role,
        fotoPerfilUrl
      },
    });
  } catch (error) {
    console.error('Error en el controlador de login:', error);
    res.status(500).json({
      message: 'Error en el servidor',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Sesión cerrada' });
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, nombre: true, username: true, email: true, role: true, fotoPerfilUrl: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.fotoPerfilUrl) {
      try {
        user.fotoPerfilUrl = await getSignedUrlHelper(user.fotoPerfilUrl);
      } catch (err) {
        console.error('Error generating signed URL in getMe:', err);
        user.fotoPerfilUrl = null;
      }
    }

    res.json(user);
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Contraseña actual incorrecta.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Contraseña actualizada con éxito.' });
  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { login, logout, getMe, changePassword };
