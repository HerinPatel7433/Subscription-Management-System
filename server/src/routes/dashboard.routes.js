// server/src/routes/dashboard.routes.js
const { Router } = require('express');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const {
  getDashboardActivity,
  getSubscriptionStatusBreakdown,
} = require('../controllers/dashboard.controller');

const router = Router();

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get('/activity', verifyToken, checkRole('admin', 'internal'), getDashboardActivity);
router.get('/subscription-status', verifyToken, checkRole('admin', 'internal'), getSubscriptionStatusBreakdown);

module.exports = router;
