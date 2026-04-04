// server/src/routes/product.routes.js
const { Router } = require('express');
const { body } = require('express-validator');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listVariants,
  addVariant,
  updateVariant,
  deleteVariant,
} = require('../controllers/product.controller');

const router = Router();

// ─── Validation Rules ─────────────────────────────────────────────────────────

const createProductValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required.')
    .isLength({ max: 255 }).withMessage('Name must be 255 characters or fewer.'),

  body('type')
    .trim()
    .notEmpty().withMessage('Product type is required.')
    .isLength({ max: 50 }).withMessage('Type must be 50 characters or fewer.'),

  body('sales_price')
    .notEmpty().withMessage('Sales price is required.')
    .isFloat({ min: 0 }).withMessage('Sales price must be a non-negative number.'),

  body('cost_price')
    .notEmpty().withMessage('Cost price is required.')
    .isFloat({ min: 0 }).withMessage('Cost price must be a non-negative number.'),
];

const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty.')
    .isLength({ max: 255 }).withMessage('Name must be 255 characters or fewer.'),

  body('type')
    .optional()
    .trim()
    .notEmpty().withMessage('Type cannot be empty.')
    .isLength({ max: 50 }).withMessage('Type must be 50 characters or fewer.'),

  body('sales_price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Sales price must be a non-negative number.'),

  body('cost_price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Cost price must be a non-negative number.'),
];

const addVariantValidation = [
  body('attribute')
    .trim()
    .notEmpty().withMessage('Attribute is required.')
    .isLength({ max: 100 }).withMessage('Attribute must be 100 characters or fewer.'),

  body('value')
    .trim()
    .notEmpty().withMessage('Value is required.')
    .isLength({ max: 100 }).withMessage('Value must be 100 characters or fewer.'),

  body('extra_price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Extra price must be a non-negative number.'),
];

const updateVariantValidation = [
  body('attribute')
    .optional()
    .trim()
    .notEmpty().withMessage('Attribute cannot be empty.')
    .isLength({ max: 100 }).withMessage('Attribute must be 100 characters or fewer.'),

  body('value')
    .optional()
    .trim()
    .notEmpty().withMessage('Value cannot be empty.')
    .isLength({ max: 100 }).withMessage('Value must be 100 characters or fewer.'),

  body('extra_price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Extra price must be a non-negative number.'),
];

// ─── Product Routes ───────────────────────────────────────────────────────────

/**
 * @route   GET /api/products
 * @access  Admin, Internal
 */
router.get('/', verifyToken, checkRole('admin', 'internal'), listProducts);

/**
 * @route   GET /api/products/:id
 * @access  Admin, Internal
 */
router.get('/:id', verifyToken, checkRole('admin', 'internal'), getProduct);

/**
 * @route   POST /api/products
 * @access  Admin only
 */
router.post('/', verifyToken, checkRole('admin'), createProductValidation, createProduct);

/**
 * @route   PUT /api/products/:id
 * @access  Admin only
 */
router.put('/:id', verifyToken, checkRole('admin'), updateProductValidation, updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @access  Admin only
 */
router.delete('/:id', verifyToken, checkRole('admin'), deleteProduct);

// ─── Variant Sub-Routes ───────────────────────────────────────────────────────

/**
 * @route   GET /api/products/:id/variants
 * @access  Admin, Internal
 */
router.get('/:id/variants', verifyToken, checkRole('admin', 'internal'), listVariants);

/**
 * @route   POST /api/products/:id/variants
 * @access  Admin only
 */
router.post('/:id/variants', verifyToken, checkRole('admin'), addVariantValidation, addVariant);

/**
 * @route   PUT /api/products/:id/variants/:variantId
 * @access  Admin only
 */
router.put(
  '/:id/variants/:variantId',
  verifyToken,
  checkRole('admin'),
  updateVariantValidation,
  updateVariant
);

/**
 * @route   DELETE /api/products/:id/variants/:variantId
 * @access  Admin only
 */
router.delete(
  '/:id/variants/:variantId',
  verifyToken,
  checkRole('admin'),
  deleteVariant
);

module.exports = router;
