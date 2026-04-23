const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, announcementController.getAll);
router.post('/', authenticateToken, announcementController.create);

module.exports = router;
