// server/src/controllers/discount.controller.js
const { validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma.util');

// Helper
function formatDiscount(discount) {
  return {
    ...discount,
    value: Number(discount.value),
    minPurchase: Number(discount.minPurchase),
    startDate: discount.startDate ? discount.startDate.toISOString().split('T')[0] : null,
    endDate: discount.endDate ? discount.endDate.toISOString().split('T')[0] : null,
  };
}

// ─── GET /api/discounts ───────────────────────────────────────────────────────

/**
 * @route   GET /api/discounts
 * @desc    List all active discounts (not deleted)
 * @access  Admin, Internal
 */
async function listDiscounts(req, res) {
  try {
    const discounts = await prisma.discount.findMany({
      where: { deletedAt: null },
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: discounts.map(formatDiscount),
      message: 'Discounts retrieved successfully.',
    });
  } catch (error) {
    console.error('listDiscounts error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/discounts ──────────────────────────────────────────────────────

/**
 * @route   POST /api/discounts
 * @desc    Create a new discount
 * @access  Admin only
 * @body    { name, type, value, min_purchase, min_qty, start_date, end_date, usage_limit }
 */
async function createDiscount(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    name, type, value, min_purchase, min_qty,
    start_date, end_date, usage_limit
  } = req.body;

  try {
    const discount = await prisma.discount.create({
      data: {
        name,
        type,
        value,
        minPurchase: min_purchase || 0,
        minQty: min_qty || 0,
        startDate: start_date ? new Date(start_date) : null,
        endDate: end_date ? new Date(end_date) : null,
        usageLimit: usage_limit || null,
        createdByAdmin: req.user.id,
      },
      include: {
        admin: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({
      success: true,
      data: formatDiscount(discount),
      message: 'Discount created successfully.',
    });
  } catch (error) {
    console.error('createDiscount error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/discounts/:id/apply ───────────────────────────────────────────

/**
 * @route   POST /api/discounts/:id/apply
 * @desc    Apply a discount to a target (product or subscription)
 * @access  Admin, Internal
 * @body    { target: "product"|"subscription", reference_id }
 */
async function applyDiscount(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { target, reference_id } = req.body;

  try {
    const discount = await prisma.discount.findFirst({
      where: { id, deletedAt: null },
    });

    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found or is deleted.' });
    }

    // Optional: check dates/usage limits here, or leave to invoicing logic.
    // For now, we just record the relationship.

    if (target === 'product') {
      const product = await prisma.product.findFirst({ where: { id: reference_id, deletedAt: null } });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
    } else if (target === 'subscription') {
      const sub = await prisma.subscription.findFirst({ where: { id: reference_id, deletedAt: null } });
      if (!sub) {
        return res.status(404).json({ success: false, message: 'Subscription not found.' });
      }
    }

    // Make sure we haven't already applied it
    const existing = await prisma.discountApplication.findFirst({
      where: { discountId: id, appliesTo: target, referenceId: reference_id },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Discount is already applied to this target.' });
    }

    const application = await prisma.discountApplication.create({
      data: {
        discountId: id,
        appliesTo: target,
        referenceId: reference_id,
      },
    });

    return res.status(201).json({
      success: true,
      data: application,
      message: `Discount successfully applied to ${target}.`,
    });
  } catch (error) {
    console.error('applyDiscount error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── DELETE /api/discounts/:id ───────────────────────────────────────────────

/**
 * @route   DELETE /api/discounts/:id
 * @desc    Soft-delete a discount
 * @access  Admin only
 */
async function deleteDiscount(req, res) {
  const { id } = req.params;

  try {
    const existing = await prisma.discount.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Discount not found.' });
    }

    await prisma.discount.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Discount deleted successfully.',
    });
  } catch (error) {
    console.error('deleteDiscount error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = {
  listDiscounts,
  createDiscount,
  applyDiscount,
  deleteDiscount,
};
