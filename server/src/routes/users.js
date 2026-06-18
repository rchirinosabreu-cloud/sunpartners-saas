const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes.'));
    }
  }
});

router.get('/', authMiddleware, userController.getAll);
router.post('/', authMiddleware, adminMiddleware, userController.create);
router.put('/:id', authMiddleware, adminMiddleware, userController.update);
router.post('/profile-picture', authMiddleware, upload.single('foto'), userController.uploadProfilePicture);
router.post('/:id/profile-picture', authMiddleware, upload.single('foto'), userController.uploadProfilePicture);

module.exports = router;
