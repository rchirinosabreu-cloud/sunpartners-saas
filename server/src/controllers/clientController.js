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
      include: { contacts: { where: { isActive: true } } },
      orderBy: { razon_social: 'asc' }
    });
    res.json(clients);
  } catch (error) {
    handlePrismaError(error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nit_id, email, contacts, ...rest } = req.body;

    // Backend-level duplicate validation (Excluding current client)
    if (nit_id || email) {
      const duplicate = await prisma.client.findFirst({
        where: {
          id: { not: id },
          OR: [
            nit_id ? { nit_id } : null,
            email ? { email } : null
          ].filter(Boolean)
        }
      });

      if (duplicate) {
        const field = duplicate.nit_id === nit_id ? 'NIT' : 'Email';
        return res.status(400).json({ error: `${field} ya registrado por otro cliente.` });
      }
    }

    const client = await prisma.$transaction(async (tx) => {
      // 1. Update the Client
      await tx.client.update({
        where: { id },
        data: {
          ...rest,
          nit_id,
          email
        }
      });

      // 2. Handle contacts if provided (strictly only if the array exists in payload)
      if (req.body.hasOwnProperty('contacts') && Array.isArray(contacts)) {
        // Mark existing contacts NOT in the payload as inactive
        const payloadContactIds = contacts.filter(c => c.id).map(c => c.id);
        await tx.clientContact.updateMany({
          where: {
            clientId: id,
            id: { notIn: payloadContactIds },
            isActive: true
          },
          data: {
            deletedAt: new Date(),
            deletedJustification: 'Removido por actualización de cliente',
            isActive: false
          }
        });

        // Upsert contacts
        for (const contact of contacts) {
          if (contact.id) {
            await tx.clientContact.update({
              where: { id: contact.id },
              data: {
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                role: contact.role,
                isPrimary: !!contact.isPrimary,
                isActive: true,
                deletedAt: null
              }
            });
          } else {
            await tx.clientContact.create({
              data: {
                clientId: id,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                role: contact.role,
                isPrimary: !!contact.isPrimary
              }
            });
          }
        }
      }

      return await tx.client.findUnique({
        where: { id },
        include: { contacts: { where: { isActive: true } } }
      });
    });

    res.json(client);
  } catch (error) {
    handlePrismaError(error, res);
  }
};

exports.cleanupZombies = async (req, res) => {
  try {
    const result = await prisma.client.updateMany({
      where: {
        OR: [
          { razon_social: { equals: 'SIN EMPRESA', mode: 'insensitive' } },
          { razon_social: { equals: 'Sin Empresa', mode: 'insensitive' } }
        ]
      },
      data: {
        deletedAt: new Date(),
        deletedJustification: 'Limpieza de registros de migración fallida'
      }
    });
    res.json({ message: `Limpieza completa. ${result.count} registros eliminados.` });
  } catch (error) {
    handlePrismaError(error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    // Usar update directamente para evitar depender de extensiones "hallucinated" según reviewer
    await prisma.client.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedJustification: 'Ajuste manual del administrador'
      }
    });
    res.json({ message: 'Cliente eliminado correctamente.' });
  } catch (error) {
    handlePrismaError(error, res);
  }
};

exports.checkDuplicates = async (req, res) => {
  const { nit_id, email, excludeId } = req.query;
  try {
    const filters = [];
    if (nit_id) filters.push({ nit_id });
    if (email) filters.push({ email });

    if (filters.length === 0) {
      return res.json({ nitExists: false, emailExists: false });
    }

    const duplicates = await prisma.client.findMany({
      where: {
        OR: filters,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    });

    res.json({
      nitExists: duplicates.some(d => d.nit_id === nit_id),
      emailExists: duplicates.some(d => d.email === email)
    });
  } catch (error) {
    handlePrismaError(error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const { nit_id, email, contacts, ...rest } = req.body;

    const existingNit = nit_id ? await prisma.client.findUnique({ where: { nit_id } }) : null;
    const existingEmail = email ? await prisma.client.findUnique({ where: { email } }) : null;

    if (existingNit || existingEmail) {
      return res.status(400).json({ error: 'NIT o Email ya registrados' });
    }

    const client = await prisma.$transaction(async (tx) => {
      const newClient = await tx.client.create({
        data: {
          ...rest,
          nit_id,
          email,
          contacts: contacts && Array.isArray(contacts) ? {
            create: contacts.map(c => ({
              name: c.name,
              email: c.email,
              phone: c.phone,
              role: c.role,
              isPrimary: !!c.isPrimary
            }))
          } : undefined
        },
        include: { contacts: { where: { isActive: true } } }
      });
      return newClient;
    });

    res.status(201).json(client);
  } catch (error) {
    handlePrismaError(error, res);
  }
};
