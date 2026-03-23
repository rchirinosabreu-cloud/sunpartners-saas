const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Desarrollo: Si no hay base de datos, permitir acceso con credenciales por defecto
    if (process.env.NODE_ENV !== 'production' && email === 'admin@sunpartners.com' && password === 'admin_password_123') {
      return res.json({
        user: {
          id: 'dev-admin-id',
          nombre: 'Administrador Sunpartners',
          email: 'admin@sunpartners.com',
          role: 'ADMIN',
          department: 'DIRECCION'
        },
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.warn(`Intento de login fallido: Usuario no encontrado (${email})`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn(`Intento de login fallido: Contraseña incorrecta para (${email})`);
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

    res.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
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
      select: { id: true, nombre: true, email: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { login, logout, getMe };
