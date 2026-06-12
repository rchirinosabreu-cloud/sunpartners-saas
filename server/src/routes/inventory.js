const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authMiddleware, checkRole } = require('../middleware/auth');

// v60.9: Closed inventory security gaps - require authentication for all routes
router.use(authMiddleware);

// Helper for write permissions
const canWrite = checkRole(['ADMIN', 'EDITOR']);

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
