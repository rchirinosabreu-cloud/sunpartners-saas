const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, userController.getAll);
router.post('/', authMiddleware, adminMiddleware, userController.create);
router.put('/:id', authMiddleware, adminMiddleware, userController.update);

module.exports = router;
