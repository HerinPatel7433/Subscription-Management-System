// server/src/jobs/overdueJob.js
const { prisma } = require('../utils/prisma.util');
const { sendOverdueReminderEmail } = require('../utils/email.util');

/**
 * Runs the overdue invoice alert job.
 */
async function runOverdueJob() {
  console.log('[CRON] Starting Overdue Invoice Job...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'confirmed',
        deletedAt: null,
        dueDate: { lt: today }
      },
      include: { customer: true },
    });

    console.log(`[CRON] Found ${overdueInvoices.length} overdue invoices.`);

    for (const inv of overdueInvoices) {
      try {
        await sendOverdueReminderEmail(inv.customer.email, inv);
        console.log(`[CRON-OVERDUE] Sent reminder for Inv=${inv.id} to ${inv.customer.email}`);
      } catch (err) {
        console.error(`[CRON-OVERDUE] Failed sending for Inv=${inv.id}:`, err.message);
      }
    }

    console.log(`[CRON] Overdue logic complete.`);
  } catch (error) {
    console.error('[CRON] Fatal error in Overdue logic:', error);
  }
}

module.exports = { runOverdueJob };
