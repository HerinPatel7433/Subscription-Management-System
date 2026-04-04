// server/src/routes/tax.routes.js
const { Router } = require('express');
const { body } = require('express-validator');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const {
  listTaxes,
  listActiveTaxes,
  getTax,
  createTax,
  updateTax,
  deleteTax,
  toggleTax,
} = require('../controllers/tax.controller');

const router = Router();

// ─── Validation ───────────────────────────────────────────────────────────────

const taxValidation = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('rate').isFloat({ min: 0 }).withMessage('Rate must be a non-negative number.'),
  body('type').optional().isString(),
  body('is_active').optional().isBoolean(),
];

const taxUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('rate').optional().isFloat({ min: 0 }).withMessage('Rate must be a non-negative number.'),
  body('type').optional().isString(),
  body('is_active').optional().isBoolean(),
];

// ─── Routes ──────────────────────────────────────────────────────────────────

// Public to all authenticated users (portal needs this to see line details optionally)
router.get('/active', verifyToken, listActiveTaxes);

// Admin & Internal
router.get('/', verifyToken, checkRole('admin', 'internal'), listTaxes);
router.get('/:id', verifyToken, checkRole('admin', 'internal'), getTax);

// Admin only
router.post('/', verifyToken, checkRole('admin'), taxValidation, createTax);
router.put('/:id', verifyToken, checkRole('admin'), taxUpdateValidation, updateTax);
router.patch('/:id/toggle', verifyToken, checkRole('admin'), toggleTax);
router.delete('/:id', verifyToken, checkRole('admin'), deleteTax);

module.exports = router;
