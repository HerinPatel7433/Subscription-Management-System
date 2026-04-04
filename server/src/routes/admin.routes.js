// server/src/routes/admin.routes.js
const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { runBillingJob } = require('../jobs/billingJob');
const { runExpiryJob } = require('../jobs/expiryJob');
const { runOverdueJob } = require('../jobs/overdueJob');

const router = Router();

// ─── Validation ───────────────────────────────────────────────────────────────

const triggerValidation = [
  body('jobName')
    .isIn(['billing', 'expiry', 'overdue'])
    .withMessage("jobName must be 'billing', 'expiry', or 'overdue'."),
];

// ─── POST /api/admin/trigger-jobs ─────────────────────────────────────────────

/**
 * @route   POST /api/admin/trigger-jobs
 * @desc    Manually trigger a cron job
 * @access  Admin only
 * @body    { jobName: 'billing' | 'expiry' | 'overdue' }
 */
router.post('/trigger-jobs', verifyToken, checkRole('admin'), triggerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { jobName } = req.body;

  try {
    if (jobName === 'billing') {
      await runBillingJob();
    } else if (jobName === 'expiry') {
      await runExpiryJob();
    } else if (jobName === 'overdue') {
      await runOverdueJob();
    }

    return res.status(200).json({
      success: true,
      message: `Job '${jobName}' completed execution successfully.`,
    });
  } catch (error) {
    console.error('Trigger job error:', error);
    return res.status(500).json({ success: false, message: `Failed executing job '${jobName}'.` });
  }
});

module.exports = router;
