const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, taskController.getAll);
router.get('/dashboard-stats', authMiddleware, taskController.getDashboardStats);
router.get('/history', authMiddleware, taskController.getHistory);
router.post('/', authMiddleware, taskController.create);
router.put('/:id', authMiddleware, taskController.update);
router.delete('/:id', authMiddleware, taskController.remove);

module.exports = router;
