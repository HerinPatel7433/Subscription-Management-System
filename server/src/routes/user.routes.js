// server/src/routes/user.routes.js
const { Router } = require('express');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { listUsers } = require('../controllers/user.controller');

const router = Router();

// ─── GET /api/users ──────────────────────────────────────────────────────────
router.get('/', verifyToken, checkRole('admin', 'internal'), listUsers);

module.exports = router;
