// server/src/controllers/razorpay.controller.js
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { prisma } = require('../utils/prisma.util');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── POST /api/razorpay/create-order ─────────────────────────────────────────

/**
 * @route   POST /api/razorpay/create-order
 * @desc    Creates a Razorpay order for a given invoice
 * @access  Admin, Internal
 * @body    { invoice_id }
 */
async function createOrder(req, res) {
  const { invoice_id } = req.body;

  if (!invoice_id) {
    return res.status(400).json({ success: false, message: 'invoice_id is required.' });
  }

  try {
    // Fetch invoice and its existing payments
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoice_id, deletedAt: null },
      include: {
        payments: true,
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice is already fully paid.' });
    }

    if (invoice.status === 'draft' || invoice.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot pay a '${invoice.status}' invoice. Please confirm it first.`,
      });
    }

    // Calculate balance due in paise (Razorpay uses smallest currency unit)
    const totalAmount = Number(invoice.totalAmount);
    const paidAmount = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balanceDue = totalAmount - paidAmount;

    if (balanceDue <= 0) {
      return res.status(400).json({ success: false, message: 'No balance due on this invoice.' });
    }

    const amountInPaise = Math.round(balanceDue * 100); // Convert to paise

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `inv_${invoice_id.slice(0, 16)}`,
      notes: {
        invoice_id: invoice_id,
        customer_name: invoice.customer?.name || '',
        customer_email: invoice.customer?.email || '',
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount,        // in paise
        amount_display: balanceDue,  // in rupees for display
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        invoice_id: invoice_id,
        customer_name: invoice.customer?.name || '',
        customer_email: invoice.customer?.email || '',
        invoice_number: `INV-${invoice_id.slice(0, 8).toUpperCase()}`,
      },
      message: 'Razorpay order created.',
    });
  } catch (error) {
    console.error('createOrder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
}

// ─── POST /api/razorpay/verify ────────────────────────────────────────────────

/**
 * @route   POST /api/razorpay/verify
 * @desc    Verifies Razorpay payment signature and records the payment
 * @access  Admin, Internal
 * @body    { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoice_id }
 */
async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoice_id } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !invoice_id) {
    return res.status(400).json({ success: false, message: 'Missing required payment verification fields.' });
  }

  try {
    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed: invalid signature.' });
    }

    // Fetch invoice to get the amount paid
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoice_id, deletedAt: null },
      include: { payments: true },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const totalAmount = Number(invoice.totalAmount);
    const alreadyPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balanceDue = totalAmount - alreadyPaid;

    // Record the payment and update invoice status
    const newStatus = balanceDue <= 0 ? 'paid' : 'confirmed';
    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId: invoice_id,
          paymentMethod: 'razorpay',
          amount: balanceDue,
          paymentDate: new Date(),
          notes: `Razorpay Payment ID: ${razorpay_payment_id} | Order ID: ${razorpay_order_id}`,
        },
      }),
      prisma.invoice.update({
        where: { id: invoice_id },
        data: { status: 'paid' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        invoice_id,
        amount: balanceDue,
        status: 'paid',
      },
      message: 'Payment verified and recorded successfully.',
    });
  } catch (error) {
    console.error('verifyPayment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify payment.' });
  }
}

module.exports = { createOrder, verifyPayment };
