const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, settingController.getSettings);
router.get('/:key', authMiddleware, settingController.getSettingByKey);
router.post('/', authMiddleware, settingController.updateSetting);

module.exports = router;
