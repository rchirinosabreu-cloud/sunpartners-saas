const prisma = require('../db');
const bcrypt = require('bcrypt');

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
        createdAt: true,
        department: true
      },
      orderBy: { nombre: 'asc' }
    });
    res.json(users);
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
      select: { id: true, nombre: true, username: true, email: true, role: true, isActive: true }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
