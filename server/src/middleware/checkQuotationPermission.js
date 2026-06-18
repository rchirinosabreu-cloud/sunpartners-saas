const prisma = require('../db');

const checkQuotationPermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    if (!id) {
      return res.status(400).json({ error: 'ID de cotización es requerido' });
    }

    // Role hierarchy optimization: ADMIN has full access.
    if (userRole === 'ADMIN') {
      return next();
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      select: { consultantId: true }
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    // CONSULTOR only has access if they are the owner.
    if (quotation.consultantId === userId) {
      return next();
    }

    return res.status(403).json({ error: 'Acceso Denegado. No tienes permisos para modificar esta cotización.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al verificar permisos de la cotización' });
  }
};

module.exports = checkQuotationPermission;
