const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { authMiddleware, adminMiddleware, checkRole } = require('../middleware/auth');
const checkQuotationPermission = require('../middleware/checkQuotationPermission');
const upload = require('../middleware/upload');

// Public routes (no auth required)
router.get('/public/:hash', (req, res) => quotationController.getByHash(req, res));
router.post('/public/:hash/approve', (req, res) => quotationController.approveByHash(req, res));
router.post('/public/:hash/formalize', upload.single('purchaseOrder'), (req, res) => quotationController.formalizeByHash(req, res));
router.post('/public/:hash/reject', (req, res) => quotationController.rejectByHash(req, res));

// Protected routes
const canAccess = checkRole(['ADMIN', 'EDITOR']);

router.get('/', authMiddleware, canAccess, (req, res) => quotationController.getAll(req, res));
router.get('/:id', authMiddleware, canAccess, (req, res) => quotationController.getById(req, res));
router.post('/', authMiddleware, canAccess, (req, res) => quotationController.create(req, res));
router.put('/:id', authMiddleware, canAccess, checkQuotationPermission, (req, res) => quotationController.update(req, res));
router.patch('/:id/archive', authMiddleware, adminMiddleware, (req, res) => quotationController.archive(req, res));
router.patch('/:id/unarchive', authMiddleware, adminMiddleware, (req, res) => quotationController.unarchive(req, res));
router.post('/:id/secure-link', authMiddleware, canAccess, (req, res) => quotationController.generateSecureLink(req, res));
router.get('/:id/purchase-order-link', authMiddleware, canAccess, (req, res) => quotationController.getPurchaseOrderSignedUrl(req, res));
router.put('/:id/status', authMiddleware, canAccess, checkQuotationPermission, (req, res) => quotationController.updateStatus(req, res));
router.put('/:id/heal-from-logistics', authMiddleware, canAccess, checkQuotationPermission, (req, res) => quotationController.healFromLogistics(req, res));
router.put('/:id/planning', authMiddleware, canAccess, (req, res) => quotationController.upsertPlanning(req, res));
router.get('/:id/availability', authMiddleware, canAccess, (req, res) => quotationController.checkAvailabilityEndpoint(req, res));


module.exports = router;
