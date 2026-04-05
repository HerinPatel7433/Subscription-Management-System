// server/src/routes/payment.routes.js
const { Router } = require('express');
const { body } = require('express-validator');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const {
  recordPayment,
  listPayments,
  getOutstandingBalances,
} = require('../controllers/payment.controller');

const router = Router();

// ─── Validation ───────────────────────────────────────────────────────────────

const paymentValidation = [
  body('invoice_id').matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('invoice_id must be a valid UUID.'),
  body('payment_method').trim().notEmpty().withMessage('payment_method is required.'),
  body('amount').isFloat({ gt: 0 }).withMessage('amount must be greater than zero.'),
  body('payment_date').optional().isISO8601().withMessage('payment_date must be a valid ISO Date.'),
  body('notes').optional().isString(),
];

// ─── Routes ──────────────────────────────────────────────────────────────────

// Admin & Internal only
router.get('/', verifyToken, checkRole('admin', 'internal'), listPayments);
router.get('/outstanding', verifyToken, checkRole('admin', 'internal'), getOutstandingBalances);
router.post('/', verifyToken, checkRole('admin', 'internal'), paymentValidation, recordPayment);

module.exports = router;
