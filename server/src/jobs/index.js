// server/src/jobs/index.js
const cron = require('node-cron');
const { runBillingJob } = require('./billingJob');
const { runExpiryJob } = require('./expiryJob');
const { runOverdueJob } = require('./overdueJob');

/**
 * Initialize and start all scheduled cron jobs.
 */
function startJobs() {
  console.log('--- Initializing Cron Jobs ---');

  // Cron Job 1 — Daily Invoice Generation (every day at 00:05 AM)
  cron.schedule('5 0 * * *', async () => {
    await runBillingJob();
  });

  // Cron Job 2 — Auto-close Expired Subscriptions (every day at 01:00 AM)
  cron.schedule('0 1 * * *', async () => {
    await runExpiryJob();
  });

  // Cron Job 3 — Overdue Invoice Alerts (every Monday at 09:00 AM)
  cron.schedule('0 9 * * 1', async () => {
    await runOverdueJob();
  });

  console.log('--- Cron Jobs Scheduled ---');
}

module.exports = { startJobs };
