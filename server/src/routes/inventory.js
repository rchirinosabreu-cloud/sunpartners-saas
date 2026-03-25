const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Bodega routes
router.get('/bodega', inventoryController.getAllBodega);
router.post('/bodega', inventoryController.createBodega);
router.put('/bodega/:id', inventoryController.updateBodega);

// Commercial routes
router.get('/commercial', inventoryController.getAllCommercial);
router.put('/commercial/:id', inventoryController.updateCommercial);

// Legacy/Common
router.delete('/:id', inventoryController.softDelete);

// Default to commercial for backward compatibility where needed (like wizard)
router.get('/', inventoryController.getAllCommercial);

module.exports = router;
