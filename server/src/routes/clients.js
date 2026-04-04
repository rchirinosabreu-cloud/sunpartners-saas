const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, (req, res) => clientController.getAll(req, res));
router.get('/check-duplicates', authMiddleware, (req, res) => clientController.checkDuplicates(req, res));
router.post('/', authMiddleware, (req, res) => clientController.create(req, res));
router.put('/:id', authMiddleware, (req, res) => clientController.update(req, res));
router.post('/cleanup', authMiddleware, (req, res) => clientController.cleanupZombies(req, res));
router.delete('/:id', authMiddleware, (req, res) => clientController.remove(req, res));

module.exports = router;
