// server/src/controllers/dashboard.controller.js
const { prisma } = require('../utils/prisma.util');

// ─── GET /api/dashboard/activity ─────────────────────────────────────────────

/**
 * @route   GET /api/dashboard/activity
 * @desc    Recent activity feed: last 10 subscriptions + last 10 invoices, merged & sorted
 * @access  Admin, Internal
 */
async function getDashboardActivity(req, res) {
  try {
    const [subscriptions, invoices] = await Promise.all([
      prisma.subscription.findMany({
        where: { deletedAt: null },
        include: { customer: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.invoice.findMany({
        where: { deletedAt: null },
        include: { customer: { select: { id: true, name: true } } },
        orderBy: { issuedDate: 'desc' },
        take: 10,
      }),
    ]);

    const subItems = subscriptions.map((s) => ({
      id: s.id,
      type: 'subscription',
      title: `Subscription #${s.subscriptionNumber}`,
      subtitle: s.customer?.name || 'Unknown customer',
      status: s.status,
      amount: null,
      date: s.createdAt.toISOString(),
      link: `/subscriptions/${s.id}`,
    }));

    const invItems = invoices.map((i) => ({
      id: i.id,
      type: 'invoice',
      title: `Invoice #${i.id.slice(0, 8).toUpperCase()}`,
      subtitle: i.customer?.name || 'Unknown customer',
      status: i.status,
      amount: Number(i.totalAmount),
      date: i.issuedDate.toISOString(),
      link: `/invoices/${i.id}`,
    }));

    const activity = [...subItems, ...invItems]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);

    return res.status(200).json({
      success: true,
      data: activity,
      message: 'Dashboard activity retrieved.',
    });
  } catch (error) {
    console.error('getDashboardActivity error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/dashboard/subscription-status ──────────────────────────────────

/**
 * @route   GET /api/dashboard/subscription-status
 * @desc    Count of subscriptions grouped by status
 * @access  Admin, Internal
 */
async function getSubscriptionStatusBreakdown(req, res) {
  try {
    const groups = await prisma.subscription.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
    });

    const breakdown = {
      active: 0,
      draft: 0,
      closed: 0,
      confirmed: 0,
      quotation: 0,
      paused: 0,
    };

    for (const g of groups) {
      if (Object.prototype.hasOwnProperty.call(breakdown, g.status)) {
        breakdown[g.status] = g._count.id;
      }
    }

    return res.status(200).json({
      success: true,
      data: breakdown,
      message: 'Subscription status breakdown retrieved.',
    });
  } catch (error) {
    console.error('getSubscriptionStatusBreakdown error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = {
  getDashboardActivity,
  getSubscriptionStatusBreakdown,
};
