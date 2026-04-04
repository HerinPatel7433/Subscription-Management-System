// server/src/controllers/payment.controller.js
const { validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma.util');

// Helper
function formatPayment(p) {
  return {
    ...p,
    amount: Number(p.amount),
  };
}

// ─── POST /api/payments ───────────────────────────────────────────────────────

/**
 * @route   POST /api/payments
 * @desc    Record a payment against an invoice
 * @access  Admin, Internal
 * @body    { invoice_id, payment_method, amount, payment_date?, notes? }
 */
async function recordPayment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { invoice_id, payment_method, amount, payment_date, notes } = req.body;

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoice_id, deletedAt: null },
      include: { payments: true },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice is already fully paid.' });
    }

    if (invoice.status === 'draft' || invoice.status === 'cancelled') {
      return res.status(400).json({ success: false, message: `Cannot apply payment to a '${invoice.status}' invoice.` });
    }

    const currentPaidAmount = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const invoiceTotal = Number(invoice.totalAmount);
    const balanceDue = invoiceTotal - currentPaidAmount;

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    // Do not allow overpayment to simplify logic
    if (amount > balanceDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${amount}) exceeds balance due (${balanceDue}).`,
      });
    }

    // Wrap in transaction: create payment -> optionally update invoice status
    const newStatus = (amount === balanceDue) ? 'paid' : invoice.status;

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId: invoice_id,
          paymentMethod: payment_method,
          amount,
          paymentDate: payment_date ? new Date(payment_date) : new Date(),
          notes: notes || null,
        },
      }),
      prisma.invoice.update({
        where: { id: invoice_id },
        data: { status: newStatus },
      }),
    ]);

    return res.status(201).json({
      success: true,
      data: formatPayment(payment),
      message: `Payment recorded. Invoice status updated to '${newStatus}'.`,
    });
  } catch (error) {
    console.error('recordPayment error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/payments ────────────────────────────────────────────────────────

/**
 * @route   GET /api/payments
 * @desc    List payments (optional query ?invoice_id=...)
 * @access  Admin, Internal
 */
async function listPayments(req, res) {
  const { invoice_id } = req.query;

  try {
    const payments = await prisma.payment.findMany({
      where: {
        ...(invoice_id && { invoiceId: invoice_id }),
      },
      include: { invoice: { select: { subscriptionId: true, status: true, totalAmount: true } } },
      orderBy: { paymentDate: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: payments.map((p) => ({ ...formatPayment(p), invoice: { ...p.invoice, totalAmount: Number(p.invoice.totalAmount) } })),
      message: 'Payments retrieved successfully.',
    });
  } catch (error) {
    console.error('listPayments error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/payments/outstanding ──────────────────────────────────────────

/**
 * @route   GET /api/payments/outstanding
 * @desc    Returns all invoices where status == 'confirmed' and no payments cover the full amount
 * @access  Admin, Internal
 */
async function getOutstandingBalances(req, res) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { status: 'confirmed', deletedAt: null },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const outstanding = invoices.map(inv => {
      const totalAmount = Number(inv.totalAmount);
      const paidAmount = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      return {
        invoiceId: inv.id,
        customerId: inv.customer.id,
        customerName: inv.customer.name,
        totalAmount,
        paidAmount,
        balanceDue: totalAmount - paidAmount,
        dueDate: inv.dueDate.toISOString().split('T')[0],
      };
    });

    return res.status(200).json({
      success: true,
      data: outstanding,
      message: 'Outstanding balances retrieved.',
    });
  } catch (error) {
    console.error('getOutstandingBalances error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = {
  recordPayment,
  listPayments,
  getOutstandingBalances,
};
