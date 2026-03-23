const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/', inventoryController.getAll);
router.get('/:id', inventoryController.getById);
router.post('/', inventoryController.create);
router.put('/:id', inventoryController.update);
router.delete('/:id', inventoryController.softDelete);

module.exports = router;
