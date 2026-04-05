const prisma = require('../db');
const bcrypt = require('bcrypt');

exports.getAll = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
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
    const { nombre, email, password, role, department } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        role,
        department,
        isActive: true
      },
      select: { id: true, nombre: true, email: true, role: true, isActive: true }
    });

    res.status(201).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un usuario con este email.' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, role, department, isActive, password } = req.body;

    const data = { nombre, role, department, isActive };

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
      }
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, nombre: true, email: true, role: true, isActive: true }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
