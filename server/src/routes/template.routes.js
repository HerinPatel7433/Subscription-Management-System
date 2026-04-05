// server/src/routes/template.routes.js
const { Router } = require('express');
const { body } = require('express-validator');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  addTemplateLine,
  deleteTemplateLine,
} = require('../controllers/template.controller');

const router = Router();

// ─── Validation ───────────────────────────────────────────────────────────────

const createTemplateValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Template name is required.')
    .isLength({ max: 255 }).withMessage('Name must be 255 characters or fewer.'),

  body('validity_days')
    .notEmpty().withMessage('validity_days is required.')
    .isInt({ min: 1 }).withMessage('validity_days must be a positive integer.'),

  body('plan_id')
    .notEmpty().withMessage('plan_id is required.')
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('plan_id must be a valid UUID.'),

  body('lines').optional().isArray().withMessage('lines must be an array.'),

  body('lines.*.product_id')
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('Each line product_id must be a valid UUID.'),

  body('lines.*.quantity')
    .isInt({ min: 1 }).withMessage('Each line quantity must be a positive integer.'),

  body('lines.*.unit_price')
    .isFloat({ min: 0 }).withMessage('Each line unit_price must be a non-negative number.'),
];

const updateTemplateValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty.')
    .isLength({ max: 255 }).withMessage('Name must be 255 characters or fewer.'),

  body('validity_days')
    .optional()
    .isInt({ min: 1 }).withMessage('validity_days must be a positive integer.'),

  body('plan_id')
    .optional()
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('plan_id must be a valid UUID.'),
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
];

// ─── Template Routes ──────────────────────────────────────────────────────────

/**
 * @route   GET /api/templates
 * @access  Admin, Internal
 */
router.get('/', verifyToken, checkRole('admin', 'internal'), listTemplates);

/**
 * @route   GET /api/templates/:id
 * @access  Admin, Internal
 */
router.get('/:id', verifyToken, checkRole('admin', 'internal'), getTemplate);

/**
 * @route   POST /api/templates
 * @access  Admin, Internal
 */
router.post('/', verifyToken, checkRole('admin', 'internal'), createTemplateValidation, createTemplate);

/**
 * @route   PUT /api/templates/:id
 * @access  Admin, Internal
 */
router.put('/:id', verifyToken, checkRole('admin', 'internal'), updateTemplateValidation, updateTemplate);

/**
 * @route   DELETE /api/templates/:id
 * @access  Admin, Internal
 */
router.delete('/:id', verifyToken, checkRole('admin', 'internal'), deleteTemplate);

// ─── Template Line Sub-Routes ─────────────────────────────────────────────────

/**
 * @route   POST /api/templates/:id/lines
 * @access  Admin, Internal
 */
router.post('/:id/lines', verifyToken, checkRole('admin', 'internal'), addLineValidation, addTemplateLine);

/**
 * @route   DELETE /api/templates/:id/lines/:lineId
 * @access  Admin, Internal
 */
router.delete('/:id/lines/:lineId', verifyToken, checkRole('admin', 'internal'), deleteTemplateLine);

module.exports = router;
