// server/src/controllers/reports.controller.js
const { prisma } = require('../utils/prisma.util');

// ─── GET /api/reports/summary ─────────────────────────────────────────────────

/**
 * @route   GET /api/reports/summary
 * @desc    High-level KPI summary: active subscriptions, monthly revenue,
 *          pending + overdue invoice counts.
 * @access  Admin, Internal
 * @query   ?from=YYYY-MM-DD&to=YYYY-MM-DD  (optional date range for revenue)
 */
async function getReportSummary(req, res) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [activeCount, monthlyPayments, pendingCount, overdueCount] = await Promise.all([
      // Active subscriptions
      prisma.subscription.count({ where: { status: 'active', deletedAt: null } }),

      // Payments collected this calendar month
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          paymentDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // Pending = confirmed but not yet paid
      prisma.invoice.count({
        where: {
          status: 'confirmed',
          deletedAt: null,
          dueDate: { gte: now },
        },
      }),

      // Overdue = confirmed and past due date
      prisma.invoice.count({
        where: {
          status: 'confirmed',
          deletedAt: null,
          dueDate: { lt: now },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        active_subscriptions: activeCount,
        monthly_revenue: Number(monthlyPayments._sum.amount ?? 0),
        pending_invoices: pendingCount,
        overdue_invoices: overdueCount,
      },
      message: 'Report summary retrieved.',
    });
  } catch (error) {
    console.error('getReportSummary error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/reports/revenue-by-month ───────────────────────────────────────

/**
 * @route   GET /api/reports/revenue-by-month
 * @desc    Total payments collected, grouped by calendar month, for the last 12 months.
 * @access  Admin, Internal
 */
async function getRevenueByMonth(req, res) {
  try {
    const now = new Date();
    // Go back 11 full months so we always return 12 data points (including current)
    const since = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const payments = await prisma.payment.findMany({
      where: { paymentDate: { gte: since } },
      select: { amount: true, paymentDate: true },
    });

    // Build a map: "Jan 2025" → total
    const monthMap = {};
    for (const p of payments) {
      const label = p.paymentDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthMap[label] = (monthMap[label] || 0) + Number(p.amount);
    }

    // Build ordered array for the last 12 months (including months with £0)
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      result.push({ month: label, revenue: monthMap[label] || 0 });
    }

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Revenue by month retrieved.',
    });
  } catch (error) {
    console.error('getRevenueByMonth error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/reports/top-customers ──────────────────────────────────────────

/**
 * @route   GET /api/reports/top-customers
 * @desc    Top 10 customers by total payment value, with active subscription count.
 * @access  Admin, Internal
 */
async function getTopCustomers(req, res) {
  try {
    // Aggregate total payments per customer via their invoices
    const paymentAgg = await prisma.payment.groupBy({
      by: ['invoiceId'],
      _sum: { amount: true },
    });

    // Need invoiceId → customerId mapping
    const invoiceIds = paymentAgg.map((p) => p.invoiceId);
    const invoices = await prisma.invoice.findMany({
      where: { id: { in: invoiceIds }, deletedAt: null },
      select: { id: true, customerId: true },
    });

    const invoiceCustomerMap = {};
    for (const inv of invoices) {
      invoiceCustomerMap[inv.id] = inv.customerId;
    }

    // Roll up payments per customerId
    const customerTotals = {};
    for (const p of paymentAgg) {
      const customerId = invoiceCustomerMap[p.invoiceId];
      if (!customerId) continue;
      customerTotals[customerId] = (customerTotals[customerId] || 0) + Number(p._sum.amount ?? 0);
    }

    // Sort and take top 10
    const topIds = Object.entries(customerTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    if (topIds.length === 0) {
      return res.status(200).json({ success: true, data: [], message: 'No customer data yet.' });
    }

    // Fetch user records + active subscription counts in parallel
    const [users, activeSubCounts] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: topIds }, deletedAt: null },
        select: { id: true, name: true },
      }),
      prisma.subscription.groupBy({
        by: ['customerId'],
        where: { customerId: { in: topIds }, status: 'active', deletedAt: null },
        _count: { id: true },
      }),
    ]);

    const activeSubMap = {};
    for (const g of activeSubCounts) {
      activeSubMap[g.customerId] = g._count.id;
    }

    const userMap = {};
    for (const u of users) {
      userMap[u.id] = u.name;
    }

    const result = topIds.map((id) => ({
      customer_id: id,
      customer_name: userMap[id] || 'Unknown',
      total_value: customerTotals[id],
      active_subscriptions: activeSubMap[id] || 0,
    }));

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Top customers retrieved.',
    });
  } catch (error) {
    console.error('getTopCustomers error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = {
  getReportSummary,
  getRevenueByMonth,
  getTopCustomers,
};
