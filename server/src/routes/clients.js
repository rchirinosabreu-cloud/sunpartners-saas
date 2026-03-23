const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, (req, res) => clientController.getAll(req, res));
router.post('/', authMiddleware, (req, res) => clientController.create(req, res));

module.exports = router;
