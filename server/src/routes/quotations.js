const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes (no auth required)
router.get('/public/:hash', (req, res) => quotationController.getByHash(req, res));
router.post('/public/:hash/approve', (req, res) => quotationController.approveByHash(req, res));
router.post('/public/:hash/formalize', upload.single('purchaseOrder'), (req, res) => quotationController.formalizeByHash(req, res));
router.post('/public/:hash/reject', (req, res) => quotationController.rejectByHash(req, res));

// Protected routes
router.get('/', authMiddleware, (req, res) => quotationController.getAll(req, res));
router.get('/:id', authMiddleware, (req, res) => quotationController.getById(req, res));
router.post('/', authMiddleware, (req, res) => quotationController.create(req, res));
router.put('/:id', authMiddleware, (req, res) => quotationController.update(req, res));
router.patch('/:id/archive', authMiddleware, adminMiddleware, (req, res) => quotationController.archive(req, res));
router.patch('/:id/unarchive', authMiddleware, adminMiddleware, (req, res) => quotationController.unarchive(req, res));
router.post('/:id/secure-link', authMiddleware, (req, res) => quotationController.generateSecureLink(req, res));
router.get('/:id/purchase-order-link', authMiddleware, (req, res) => quotationController.getPurchaseOrderSignedUrl(req, res));
router.put('/:id/status', authMiddleware, (req, res) => quotationController.updateStatus(req, res));
router.put('/:id/planning', authMiddleware, (req, res) => quotationController.upsertPlanning(req, res));
router.get('/:id/availability', authMiddleware, (req, res) => quotationController.checkAvailabilityEndpoint(req, res));


module.exports = router;
