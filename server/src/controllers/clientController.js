const prisma = require('../db');

exports.getAll = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const client = await prisma.client.create({
      data: req.body
    });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
