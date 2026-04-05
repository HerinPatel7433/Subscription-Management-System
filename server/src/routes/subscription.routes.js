// server/src/routes/subscription.routes.js
const { Router } = require('express');
const { body } = require('express-validator');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const {
  listSubscriptions,
  getSubscription,
  createSubscription,
  addSubscriptionLine,
  deleteSubscriptionLine,
  confirmSubscription,
  activateSubscription,
  closeSubscription,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
  portalSubscribe,
} = require('../controllers/subscription.controller');

const router = Router();

// ─── Validation ───────────────────────────────────────────────────────────────

const createSubscriptionValidation = [
  body('customer_id')
    .notEmpty().withMessage('customer_id is required.')
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('customer_id must be a valid UUID.'),

  body('plan_id')
    .notEmpty().withMessage('plan_id is required.')
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('plan_id must be a valid UUID.'),

  body('start_date')
    .notEmpty().withMessage('start_date is required.')
    .isISO8601().withMessage('start_date must be a valid date (YYYY-MM-DD).'),

  body('expiration_date')
    .optional()
    .isISO8601().withMessage('expiration_date must be a valid date (YYYY-MM-DD).'),

  body('payment_terms')
    .optional()
    .isString()
    .isLength({ max: 255 }).withMessage('payment_terms must be 255 characters or fewer.'),

  body('template_id')
    .optional()
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('template_id must be a valid UUID.'),
];

const addLineValidation = [
  body('product_id')
    .notEmpty().withMessage('product_id is required.')
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('product_id must be a valid UUID.'),

  body('quantity')
    .notEmpty().withMessage('quantity is required.')
    .isInt({ min: 1 }).withMessage('quantity must be a positive integer.'),

  body('unit_price')
    .notEmpty().withMessage('unit_price is required.')
    .isFloat({ min: 0 }).withMessage('unit_price must be a non-negative number.'),

  body('tax_id')
    .optional()
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('tax_id must be a valid UUID.'),
];

const portalSubscribeValidation = [
  body('plan_id')
    .notEmpty().withMessage('plan_id is required.')
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('plan_id must be a valid UUID.'),

  body('services')
    .optional()
    .isArray().withMessage('services must be an array.'),

  body('services.*.product_id')
    .notEmpty().withMessage('product_id in services is required.')
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('services.*.product_id must be a valid UUID.'),

  body('services.*.quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('services.*.quantity must be a positive integer.'),
];

// ─── Subscription Routes ──────────────────────────────────────────────────────

/**
 * @route   GET /api/subscriptions
 * @access  All authenticated (portal sees own only)
 */
router.get('/', verifyToken, listSubscriptions);

/**
 * @route   GET /api/subscriptions/:id
 * @access  All authenticated (portal sees own only)
 */
router.get('/:id', verifyToken, getSubscription);

/**
 * @route   POST /api/subscriptions/subscribe
 * @access  Portal
 */
router.post(
  '/subscribe',
  verifyToken,
  checkRole('portal'),
  portalSubscribeValidation,
  portalSubscribe
);

/**
 * @route   POST /api/subscriptions
 * @access  Admin, Internal
 */
router.post(
  '/',
  verifyToken,
  checkRole('admin', 'internal'),
  createSubscriptionValidation,
  createSubscription
);

// ─── Line Sub-Routes ──────────────────────────────────────────────────────────

/**
 * @route   POST /api/subscriptions/:id/lines
 * @access  Admin, Internal
 */
router.post(
  '/:id/lines',
  verifyToken,
  checkRole('admin', 'internal'),
  addLineValidation,
  addSubscriptionLine
);

/**
 * @route   DELETE /api/subscriptions/:id/lines/:lineId
 * @access  Admin, Internal
 */
router.delete(
  '/:id/lines/:lineId',
  verifyToken,
  checkRole('admin', 'internal'),
  deleteSubscriptionLine
);

// ─── Status Transition Routes ─────────────────────────────────────────────────

/**
 * @route   POST /api/subscriptions/:id/confirm
 * @desc    draft → quotation
 * @access  Admin, Internal
 */
router.post('/:id/confirm', verifyToken, checkRole('admin', 'internal'), confirmSubscription);

/**
 * @route   POST /api/subscriptions/:id/activate
 * @desc    quotation → active (passes through confirmed atomically)
 * @access  Admin, Internal
 */
router.post('/:id/activate', verifyToken, checkRole('admin', 'internal'), activateSubscription);

/**
 * @route   POST /api/subscriptions/:id/close
 * @desc    active → closed
 * @access  Admin, Internal
 */
router.post('/:id/close', verifyToken, checkRole('admin', 'internal'), closeSubscription);

/**
 * @route   POST /api/subscriptions/:id/pause
 * @desc    active → paused (only if plan.pausable = true)
 * @access  Admin, Internal
 */
router.post('/:id/pause', verifyToken, checkRole('admin', 'internal'), pauseSubscription);

/**
 * @route   POST /api/subscriptions/:id/resume
 * @desc    paused → active
 * @access  Admin, Internal
 */
router.post('/:id/resume', verifyToken, checkRole('admin', 'internal'), resumeSubscription);

/**
 * @route   POST /api/subscriptions/:id/renew
 * @desc    closed → new draft subscription (only if plan.renewable = true)
 * @access  Admin, Internal
 */
router.post('/:id/renew', verifyToken, checkRole('admin', 'internal'), renewSubscription);

module.exports = router;
