const prisma = require('../db');

const handlePrismaError = (error, res) => {
  console.error('Prisma Error:', error);
  if (error.code === 'P2002') {
    return res.status(400).json({ error: 'Ya existe un registro con este NIT o Email.' });
  }
  if (error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1003') {
    return res.status(503).json({ error: 'Base de datos temporalmente inaccesible. Por favor, intente de nuevo en un momento.' });
  }
  res.status(500).json({ error: 'Error interno del servidor. Por favor, reporte este incidente si persiste.' });
};

exports.getAll = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { razon_social: 'asc' }
    });
    res.json(clients);
  } catch (error) {
    handlePrismaError(error, res);
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
    handlePrismaError(error, res);
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
    handlePrismaError(error, res);
  }
};
