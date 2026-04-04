// server/src/controllers/invoice.controller.js
const { prisma } = require('../utils/prisma.util');
const { generateInvoicePDF } = require('../utils/pdf.util');
const { sendInvoiceEmail } = require('../utils/email.util');

// Helper
function formatInvoice(i) {
  return {
    ...i,
    totalAmount: Number(i.totalAmount),
    issuedDate: i.issuedDate.toISOString().split('T')[0],
    dueDate: i.dueDate.toISOString().split('T')[0],
    lines: i.lines
      ? i.lines.map((l) => ({
          ...l,
          unitPrice: Number(l.unitPrice),
          taxAmount: Number(l.taxAmount),
          discountAmount: Number(l.discountAmount),
          lineTotal: Number(l.lineTotal),
        }))
      : undefined,
  };
}

/**
 * Core logic for invoice generation. Returns the generated invoice object.
 * @param {string} subscriptionId 
 * @returns {Promise<Object>}
 */
async function generateInvoiceLogic(subscriptionId) {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, deletedAt: null },
    include: {
      lines: { include: { tax: true } },
    },
  });

  if (!subscription) {
    throw new Error('Subscription not found.');
  }

  if (subscription.status !== 'active') {
    throw new Error(`Invoices can only be generated for 'active' subscriptions. Current status: '${subscription.status}'.`);
  }

  // Prepare line items
  let globalTotal = 0;
  const invoiceLinesData = [];

  const discountApps = await prisma.discountApplication.findMany({
    where: {
      OR: [
        { appliesTo: 'subscription', referenceId: subscriptionId },
        { appliesTo: 'product', referenceId: { in: subscription.lines.map((l) => l.productId) } },
      ],
    },
    include: { discount: true },
  });

  const prodDiscounts = discountApps.filter((d) => d.appliesTo === 'product');
  const subDiscounts = discountApps.filter((d) => d.appliesTo === 'subscription');

  for (const line of subscription.lines) {
    const baseAmount = Number(line.unitPrice) * line.quantity;

    let taxAmount = 0;
    if (line.tax && line.tax.isActive) {
      taxAmount = baseAmount * (Number(line.tax.rate) / 100);
    }

    let discountAmount = 0;
    const relevantDiscApp = prodDiscounts.find((d) => d.referenceId === line.productId)
      || subDiscounts[0];

    if (relevantDiscApp && relevantDiscApp.discount) {
      const d = relevantDiscApp.discount;
      if (!d.deletedAt && (!d.startDate || new Date(d.startDate) <= new Date()) && (!d.endDate || new Date(d.endDate) >= new Date())) {
          if (baseAmount >= Number(d.minPurchase) && line.quantity >= d.minQty) {
            if (d.type === 'percentage') {
              discountAmount = baseAmount * (Number(d.value) / 100);
            } else if (d.type === 'fixed') {
              discountAmount = Number(d.value);
              if (discountAmount > baseAmount) discountAmount = baseAmount;
            }
          }
      }
    }

    const lineTotal = baseAmount + taxAmount - discountAmount;
    globalTotal += lineTotal;

    invoiceLinesData.push({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      taxAmount,
      discountAmount,
      lineTotal,
    });
  }

  const issuedDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15); // Default Net 15

  const invoice = await prisma.invoice.create({
    data: {
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      status: 'draft',
      issuedDate,
      dueDate,
      totalAmount: globalTotal,
      lines: { create: invoiceLinesData },
    },
    include: { lines: { include: { product: { select: { name: true } } } } },
  });

  return invoice;
}

// ─── POST /api/invoices/generate-all ───────────────────────────────────────────

/**
 * @route   POST /api/invoices/generate-all
 * @desc    Trigger invoice generation for every active subscription
 * @access  Admin, Internal
 */
async function generateAll(req, res) {
  try {
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'active', deletedAt: null },
      select: { id: true },
    });

    const results = [];
    const errors = [];

    await Promise.allSettled(
      activeSubscriptions.map(async (sub) => {
        try {
          const invoice = await generateInvoiceLogic(sub.id);
          results.push({ subscriptionId: sub.id, invoiceId: invoice.id, status: 'generated' });
        } catch (err) {
          errors.push({ subscriptionId: sub.id, error: err.message });
        }
      })
    );

    return res.status(207).json({
      success: true,
      message: `Billing job complete. Generated: ${results.length}, Failed: ${errors.length}.`,
      data: { generated: results, failed: errors },
    });
  } catch (error) {
    console.error('generateAll error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/invoices/generate/:subscriptionId ──────────────────────────────

/**
 * @route   POST /api/invoices/generate/:subscriptionId
 * @desc    Auto-create an invoice from an active subscription
 * @access  Admin, Internal
 */
async function generateInvoice(req, res) {
  const { subscriptionId } = req.params;

  try {
    const invoice = await generateInvoiceLogic(subscriptionId);

    return res.status(201).json({
      success: true,
      message: 'Invoice generated automatically.',
      data: formatInvoice(invoice),
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('Current status:')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('generateInvoice error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}


// ─── GET /api/invoices ────────────────────────────────────────────────────────

/**
 * @route   GET /api/invoices
 * @desc    List all invoices (Portal restricted to their own)
 * @access  All authenticated
 */
async function listInvoices(req, res) {
  try {
    const isPortal = req.user.role === 'portal';

    const invoices = await prisma.invoice.findMany({
      where: {
        deletedAt: null,
        ...(isPortal && { customerId: req.user.id }),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { issuedDate: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: invoices.map(formatInvoice),
      message: 'Invoices retrieved successfully.',
    });
  } catch (error) {
    console.error('listInvoices error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/invoices/:id ────────────────────────────────────────────────────

/**
 * @route   GET /api/invoices/:id
 * @desc    Get full invoice
 * @access  All authenticated (Portal sees own)
 */
async function getInvoice(req, res) {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        lines: { include: { product: { select: { name: true } } } },
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (req.user.role === 'portal' && invoice.customerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.status(200).json({
      success: true,
      data: formatInvoice(invoice),
      message: 'Invoice retrieved successfully.',
    });
  } catch (error) {
    console.error('getInvoice error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/invoices/:id/confirm ──────────────────────────────────────────

/**
 * @route   POST /api/invoices/:id/confirm
 * @desc    draft -> confirmed
 * @access  Admin, Internal
 */
async function confirmInvoice(req, res) {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findFirst({ where: { id, deletedAt: null } });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (invoice.status !== 'draft') {
      return res.status(400).json({ success: false, message: `Cannot confirm invoice with status '${invoice.status}'` });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: 'confirmed' },
    });

    return res.status(200).json({
      success: true,
      data: formatInvoice(updated),
      message: 'Invoice confirmed.',
    });
  } catch (error) {
    console.error('confirmInvoice error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/invoices/:id/cancel ───────────────────────────────────────────

/**
 * @route   POST /api/invoices/:id/cancel
 * @desc    draft/confirmed -> cancelled
 * @access  Admin, Internal
 */
async function cancelInvoice(req, res) {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findFirst({ where: { id, deletedAt: null } });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (!['draft', 'confirmed'].includes(invoice.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel invoice with status '${invoice.status}'` });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return res.status(200).json({
      success: true,
      data: formatInvoice(updated),
      message: 'Invoice cancelled.',
    });
  } catch (error) {
    console.error('cancelInvoice error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/invoices/:id/send ─────────────────────────────────────────────

/**
 * @route   POST /api/invoices/:id/send
 * @desc    Generate PDF and send via email
 * @access  Admin, Internal
 */
async function sendInvoice(req, res) {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        lines: { include: { product: { select: { name: true } } } },
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    await sendInvoiceEmail(invoice.customer.email, invoice.id, pdfBuffer);

    return res.status(200).json({
      success: true,
      message: `Invoice sent successfully to ${invoice.customer.email}`,
    });
  } catch (error) {
    console.error('sendInvoice error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error sending invoice.' });
  }
}

// ─── GET /api/invoices/:id/print ─────────────────────────────────────────────

/**
 * @route   GET /api/invoices/:id/print
 * @desc    Return raw PDF buffer
 * @access  All authenticated (Portal sees own)
 */
async function printInvoice(req, res) {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        lines: { include: { product: { select: { name: true } } } },
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (req.user.role === 'portal' && invoice.customerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Invoice_${invoice.id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('printInvoice error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error printing invoice.' });
  }
}

module.exports = {
  generateInvoice,
  generateAll,
  listInvoices,
  getInvoice,
  confirmInvoice,
  cancelInvoice,
  sendInvoice,
  printInvoice,
  generateInvoiceLogic,
};
