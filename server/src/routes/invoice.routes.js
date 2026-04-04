// server/src/routes/invoice.routes.js
const { Router } = require('express');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const {
  generateInvoice,
  generateAll,
  listInvoices,
  getInvoice,
  confirmInvoice,
  cancelInvoice,
  sendInvoice,
  printInvoice,
} = require('../controllers/invoice.controller');

const router = Router();

// ─── Routes ──────────────────────────────────────────────────────────────────

// All authenticated users
router.get('/', verifyToken, listInvoices);
router.get('/:id', verifyToken, getInvoice);
router.get('/:id/print', verifyToken, printInvoice);

// Admin & Internal only
router.post('/generate-all', verifyToken, checkRole('admin', 'internal'), generateAll);
router.post('/generate/:subscriptionId', verifyToken, checkRole('admin', 'internal'), generateInvoice);
router.post('/:id/confirm', verifyToken, checkRole('admin', 'internal'), confirmInvoice);
router.post('/:id/cancel', verifyToken, checkRole('admin', 'internal'), cancelInvoice);
router.post('/:id/send', verifyToken, checkRole('admin', 'internal'), sendInvoice);

module.exports = router;
