const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authMiddleware, checkRole } = require('../middleware/auth');
const prisma = require('../db');

// v60.9: Closed inventory security gaps - require authentication for all routes
router.use(authMiddleware);

// Helper for write permissions
const canWrite = checkRole(['ADMIN', 'EDITOR']);

// Inventory Alerts (v67.0: Aggregate supply alerts for Ojo al Dato)
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await prisma.inventoryAlert.findMany({
      where: { resolvedAt: null },
      include: {
        quotation: {
          select: {
            id: true,
            nombre_evento: true,
            consecutivo: true,
            client: { select: { razon_social: true } }
          }
        }
      },
      orderBy: { startDate: 'asc' }
    });
    res.json(alerts);
  } catch (error) {
    console.warn(`[InventoryAlerts] Dashboard fetch suppressed: ${error.message}`);
    res.json([]); // Return empty array to avoid Dashboard crash
  }
});

// Bodega routes
router.get('/bodega', inventoryController.getAllBodega);
router.post('/bodega', canWrite, inventoryController.createBodega);
router.put('/bodega/:id', canWrite, inventoryController.updateBodega);

// Commercial routes
router.get('/commercial', inventoryController.getAllCommercial);
router.post('/commercial', canWrite, inventoryController.createCommercial);
router.put('/commercial/:id', canWrite, inventoryController.updateCommercial);

// Soft Delete (Unified)
router.post('/soft-delete/:id', canWrite, inventoryController.softDelete);

// Legacy/Common
router.delete('/:id', canWrite, inventoryController.softDelete);

// Default to commercial for backward compatibility where needed (like wizard)
router.get('/', inventoryController.getAllCommercial);

module.exports = router;
