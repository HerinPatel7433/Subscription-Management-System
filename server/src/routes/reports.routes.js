// server/src/routes/reports.routes.js
const { Router } = require('express');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const {
  getReportSummary,
  getRevenueByMonth,
  getTopCustomers,
} = require('../controllers/reports.controller');

const router = Router();

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get('/summary', verifyToken, checkRole('admin', 'internal'), getReportSummary);
router.get('/revenue-by-month', verifyToken, checkRole('admin', 'internal'), getRevenueByMonth);
router.get('/top-customers', verifyToken, checkRole('admin', 'internal'), getTopCustomers);

module.exports = router;
