const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, announcementController.getAll);
router.post('/', authMiddleware, announcementController.create);

module.exports = router;
