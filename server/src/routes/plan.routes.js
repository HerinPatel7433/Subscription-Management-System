// server/src/routes/plan.routes.js
const { Router } = require('express');
const { body } = require('express-validator');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
} = require('../controllers/plan.controller');

const router = Router();

// ─── Validation Rules ─────────────────────────────────────────────────────────

const VALID_BILLING_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

const createPlanValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Plan name is required.')
    .isLength({ max: 255 }).withMessage('Name must be 255 characters or fewer.'),

  body('price')
    .notEmpty().withMessage('Price is required.')
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number.'),

  body('billing_period')
    .notEmpty().withMessage('Billing period is required.')
    .isIn(VALID_BILLING_PERIODS)
    .withMessage(`Billing period must be one of: ${VALID_BILLING_PERIODS.join(', ')}.`),

  body('min_qty')
    .optional()
    .isInt({ min: 1 }).withMessage('Min quantity must be a positive integer.'),

  body('start_date')
    .optional()
    .isISO8601().withMessage('start_date must be a valid date (YYYY-MM-DD).'),

  body('end_date')
    .optional()
    .isISO8601().withMessage('end_date must be a valid date (YYYY-MM-DD).'),

  body('auto_close')
    .optional()
    .isBoolean().withMessage('auto_close must be a boolean.'),

  body('closable')
    .optional()
    .isBoolean().withMessage('closable must be a boolean.'),

  body('pausable')
    .optional()
    .isBoolean().withMessage('pausable must be a boolean.'),

  body('renewable')
    .optional()
    .isBoolean().withMessage('renewable must be a boolean.'),
];

const updatePlanValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty.')
    .isLength({ max: 255 }).withMessage('Name must be 255 characters or fewer.'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number.'),

  body('billing_period')
    .optional()
    .isIn(VALID_BILLING_PERIODS)
    .withMessage(`Billing period must be one of: ${VALID_BILLING_PERIODS.join(', ')}.`),

  body('min_qty')
    .optional()
    .isInt({ min: 1 }).withMessage('Min quantity must be a positive integer.'),

  body('start_date')
    .optional()
    .isISO8601().withMessage('start_date must be a valid date (YYYY-MM-DD).'),

  body('end_date')
    .optional()
    .isISO8601().withMessage('end_date must be a valid date (YYYY-MM-DD).'),

  body('auto_close')
    .optional()
    .isBoolean().withMessage('auto_close must be a boolean.'),

  body('closable')
    .optional()
    .isBoolean().withMessage('closable must be a boolean.'),

  body('pausable')
    .optional()
    .isBoolean().withMessage('pausable must be a boolean.'),

  body('renewable')
    .optional()
    .isBoolean().withMessage('renewable must be a boolean.'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/plans
 * @access  Admin, Internal
 */
router.get('/', verifyToken, checkRole('admin', 'internal', 'portal'), listPlans);

/**
 * @route   GET /api/plans/:id
 * @access  Admin, Internal
 */
router.get('/:id', verifyToken, checkRole('admin', 'internal', 'portal'), getPlan);

/**
 * @route   POST /api/plans
 * @access  Admin only
 */
router.post('/', verifyToken, checkRole('admin'), createPlanValidation, createPlan);

/**
 * @route   PUT /api/plans/:id
 * @access  Admin only
 */
router.put('/:id', verifyToken, checkRole('admin'), updatePlanValidation, updatePlan);

/**
 * @route   DELETE /api/plans/:id
 * @access  Admin only
 */
router.delete('/:id', verifyToken, checkRole('admin'), deletePlan);

module.exports = router;
