// server/src/routes/discount.routes.js
const { Router } = require('express');
const { body } = require('express-validator');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const {
  listDiscounts,
  createDiscount,
  updateDiscount,
  applyDiscount,
  deleteDiscount,
} = require('../controllers/discount.controller');

const router = Router();

// ─── Validation ───────────────────────────────────────────────────────────────

const discountValidation = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('type').isIn(['fixed', 'percent', 'percentage']).withMessage('Type must be "fixed" or "percent".'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be a non-negative number.'),
  body('min_purchase').optional().isFloat({ min: 0 }),
  body('min_qty').optional().isInt({ min: 0 }),
  body('start_date').optional({ nullable: true }).isISO8601(),
  body('end_date').optional({ nullable: true }).isISO8601(),
  body('usage_limit').optional({ nullable: true }).isInt({ min: 1 }),
];

const applyValidation = [
  body('target').isIn(['product', 'subscription']).withMessage('Target must be "product" or "subscription".'),
  body('reference_id').isUUID().withMessage('Reference ID must be a valid UUID.'),
];

// ─── Routes ──────────────────────────────────────────────────────────────────

// Admin & Internal
router.get('/', verifyToken, checkRole('admin', 'internal'), listDiscounts);

// Admin only
router.post('/', verifyToken, checkRole('admin'), discountValidation, createDiscount);
router.post('/:id/apply', verifyToken, checkRole('admin'), applyValidation, applyDiscount);
router.put('/:id', verifyToken, checkRole('admin'), discountValidation, updateDiscount);
router.delete('/:id', verifyToken, checkRole('admin'), deleteDiscount);

module.exports = router;
