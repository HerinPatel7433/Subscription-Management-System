// server/src/routes/user.routes.js
const { Router } = require('express');
const { body } = require('express-validator');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { listUsers, createUser } = require('../controllers/user.controller');

const router = Router();

// ─── Validation ───────────────────────────────────────────────────────────────

const userValidation = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('role').isIn(['admin', 'internal', 'portal']).withMessage('Role must be admin, internal, or portal.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/).withMessage('Password must contain at least one special character.'),
];

// ─── GET /api/users ──────────────────────────────────────────────────────────
router.get('/', verifyToken, checkRole('admin', 'internal'), listUsers);

// ─── POST /api/users ─────────────────────────────────────────────────────────
router.post('/', verifyToken, checkRole('admin'), userValidation, createUser);

module.exports = router;
