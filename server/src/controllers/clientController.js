const prisma = require('../db');

exports.getAll = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { razon_social: 'asc' }
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkDuplicates = async (req, res) => {
  const { nit_id, email } = req.query;
  try {
    const existingNit = nit_id ? await prisma.client.findUnique({ where: { nit_id } }) : null;
    const existingEmail = email ? await prisma.client.findUnique({ where: { email } }) : null;

    res.json({
      nitExists: !!existingNit,
      emailExists: !!existingEmail
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nit_id, email } = req.body;

    const existingNit = nit_id ? await prisma.client.findUnique({ where: { nit_id } }) : null;
    const existingEmail = email ? await prisma.client.findUnique({ where: { email } }) : null;

    if (existingNit || existingEmail) {
      return res.status(400).json({ error: 'NIT o Email ya registrados' });
    }

    const client = await prisma.client.create({
      data: req.body
    });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
