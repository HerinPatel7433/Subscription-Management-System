// server/src/routes/auth.routes.js
const { Router } = require('express');
const { body } = require('express-validator');
const {
  signup,
  login,
  requestPasswordReset,
  confirmPasswordReset,
} = require('../controllers/auth.controller');

const router = Router();

// ─── Validation Rules ─────────────────────────────────────────────────────────

const signupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ max: 255 })
    .withMessage('Name must be 255 characters or fewer.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter.')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/)
    .withMessage('Password must contain at least one special character.'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password').notEmpty().withMessage('Password is required.'),
];

const resetRequestValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
];

const resetConfirmValidation = [
  body('token').trim().notEmpty().withMessage('Reset token is required.'),

  body('password')
    .notEmpty()
    .withMessage('New password is required.')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter.')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/)
    .withMessage('Password must contain at least one special character.'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', signupValidation, signup);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate and return JWT
 * @access  Public
 */
router.post('/login', loginValidation, login);

/**
 * @route   POST /api/auth/reset-password/request
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/reset-password/request', resetRequestValidation, requestPasswordReset);

/**
 * @route   POST /api/auth/reset-password/confirm
 * @desc    Confirm reset token and set new password
 * @access  Public
 */
router.post('/reset-password/confirm', resetConfirmValidation, confirmPasswordReset);

module.exports = router;
