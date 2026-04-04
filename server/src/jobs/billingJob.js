// server/src/jobs/billingJob.js
const { prisma } = require('../utils/prisma.util');
const { generateInvoiceLogic } = require('../controllers/invoice.controller');

/**
 * Helper to calculate the next billing date based on a period string.
 */
function calculateNextBillingDate(baseDate, period) {
  const d = new Date(baseDate);
  const p = period ? period.toLowerCase() : 'monthly';
  
  if (p === 'yearly' || p === 'annual') {
    d.setFullYear(d.getFullYear() + 1);
  } else if (p === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (p === 'daily') {
    d.setDate(d.getDate() + 1);
  } else {
    // default 'monthly'
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

/**
 * Runs the daily invoice generation job.
 */
async function runBillingJob() {
  console.log('[CRON] Starting Daily Invoice Generation Job...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Find active subscriptions due for billing
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        OR: [
          { nextBillingDate: { lte: today } },
          { nextBillingDate: null, startDate: { lte: today } } // Initialize if null
        ]
      },
      include: { plan: true },
    });

    console.log(`[CRON] Found ${subscriptions.length} subscriptions due for billing.`);

    let successCount = 0;
    let failCount = 0;

    for (const sub of subscriptions) {
      try {
        // Generate Invoice
        const invoice = await generateInvoiceLogic(sub.id);
        
        // Ensure invoice remains draft (which is default from generateInvoiceLogic anyway)
        // Set next billing date based on current nextBillingDate or today
        const baseDateForNext = sub.nextBillingDate ? sub.nextBillingDate : today;
        const newNextBillingDate = calculateNextBillingDate(baseDateForNext, sub.plan.billingPeriod);

        // Update subscription
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { nextBillingDate: newNextBillingDate },
        });

        console.log(`[CRON-BILLING] Success: Sub=${sub.id} generated Inv=${invoice.id}`);
        successCount++;
      } catch (err) {
        console.error(`[CRON-BILLING] Failed for Sub=${sub.id}:`, err.message);
        failCount++;
      }
    }

    console.log(`[CRON] Daily Invoice logic complete. Success: ${successCount}, Fail: ${failCount}.`);
  } catch (error) {
    console.error('[CRON] Fatal error in Daily Invoice logic:', error);
  }
}

module.exports = { runBillingJob };
