// server/src/jobs/expiryJob.js
const { prisma } = require('../utils/prisma.util');
const { sendRenewalReminderEmail } = require('../utils/email.util');

/**
 * Runs the daily expiration checking job to auto-close expired subs.
 */
async function runExpiryJob() {
  console.log('[CRON] Starting Expiry & Auto-Close Job...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const expiredSubs = await prisma.subscription.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        expirationDate: { lt: today }
      },
      include: { 
        plan: true,
        customer: true,
      },
    });

    console.log(`[CRON] Found ${expiredSubs.length} active subscriptions passed expiration.`);

    for (const sub of expiredSubs) {
      try {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'closed' },
        });

        if (sub.plan.renewable) {
          await sendRenewalReminderEmail(sub.customer.email, sub);
          console.log(`[CRON-EXPIRY] Closed Sub=${sub.id} & Sent Renewal Email sent to ${sub.customer.email}`);
        } else {
          console.log(`[CRON-EXPIRY] Closed Sub=${sub.id} (No renewal flag)`);
        }
      } catch (err) {
        console.error(`[CRON-EXPIRY] Failed closing Sub=${sub.id}:`, err.message);
      }
    }

    console.log(`[CRON] Expiry logic complete.`);
  } catch (error) {
    console.error('[CRON] Fatal error in Expiry logic:', error);
  }
}

module.exports = { runExpiryJob };
