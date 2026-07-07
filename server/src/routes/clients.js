const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authMiddleware, checkRole } = require('../middleware/auth');

const canWrite = checkRole(['ADMIN', 'EDITOR', 'CONSULTOR']);

router.get('/', authMiddleware, (req, res) => clientController.getAll(req, res));
router.get('/check-duplicates', authMiddleware, (req, res) => clientController.checkDuplicates(req, res));
router.post('/', authMiddleware, canWrite, (req, res) => clientController.create(req, res));
router.put('/:id', authMiddleware, canWrite, (req, res) => clientController.update(req, res));
router.post('/cleanup', authMiddleware, (req, res) => {
  if (req.userRole !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' });
  clientController.cleanupZombies(req, res);
});
router.delete('/:id', authMiddleware, (req, res) => {
  if (req.userRole !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado' });
  clientController.remove(req, res);
});

module.exports = router;
