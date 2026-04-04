// server/src/controllers/plan.controller.js
const { validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma.util');

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Converts Prisma camelCase/Decimal/Date fields to snake_case plain JS types for JSON responses.
 */
function formatPlan(plan) {
  return {
    id: plan.id,
    name: plan.name,
    price: Number(plan.price),
    billing_period: plan.billingPeriod,
    min_qty: plan.minQty,
    start_date: plan.startDate ? plan.startDate.toISOString().split('T')[0] : null,
    end_date: plan.endDate ? plan.endDate.toISOString().split('T')[0] : null,
    auto_close: plan.autoClose,
    closable: plan.closable,
    pausable: plan.pausable,
    renewable: plan.renewable,
    created_at: plan.createdAt,
  };
}

// ─── GET /api/plans ───────────────────────────────────────────────────────────

/**
 * @route   GET /api/plans
 * @desc    List all active recurring plans
 * @access  Admin, Internal
 */
async function listPlans(req, res) {
  try {
    const plans = await prisma.recurringPlan.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Plans retrieved successfully.',
      data: plans.map(formatPlan),
    });
  } catch (error) {
    console.error('listPlans error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/plans/:id ───────────────────────────────────────────────────────

/**
 * @route   GET /api/plans/:id
 * @desc    Get a single recurring plan by ID
 * @access  Admin, Internal
 */
async function getPlan(req, res) {
  const { id } = req.params;

  try {
    const plan = await prisma.recurringPlan.findFirst({
      where: { id, deletedAt: null },
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Plan retrieved successfully.',
      data: formatPlan(plan),
    });
  } catch (error) {
    console.error('getPlan error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/plans ──────────────────────────────────────────────────────────

/**
 * @route   POST /api/plans
 * @desc    Create a new recurring plan
 * @access  Admin only
 * Body: { name, price, billing_period, min_qty?, start_date?, end_date?,
 *         auto_close?, closable?, pausable?, renewable? }
 */
async function createPlan(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    name,
    price,
    billing_period,
    min_qty = 1,
    start_date,
    end_date,
    auto_close = false,
    closable = false,
    pausable = false,
    renewable = false,
  } = req.body;

  // Business rule: end_date must be after start_date (if both provided)
  if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
    return res.status(400).json({
      success: false,
      message: 'end_date must be after start_date.',
    });
  }

  try {
    const plan = await prisma.recurringPlan.create({
      data: {
        name,
        price,
        billingPeriod: billing_period,
        minQty: min_qty,
        startDate: start_date ? new Date(start_date) : null,
        endDate: end_date ? new Date(end_date) : null,
        autoClose: auto_close,
        closable,
        pausable,
        renewable,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Plan created successfully.',
      data: formatPlan(plan),
    });
  } catch (error) {
    console.error('createPlan error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── PUT /api/plans/:id ───────────────────────────────────────────────────────

/**
 * @route   PUT /api/plans/:id
 * @desc    Update a recurring plan
 * @access  Admin only
 */
async function updatePlan(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const {
    name,
    price,
    billing_period,
    min_qty,
    start_date,
    end_date,
    auto_close,
    closable,
    pausable,
    renewable,
  } = req.body;

  try {
    const existing = await prisma.recurringPlan.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    // Determine effective start/end dates for cross-field validation
    const effectiveStart = start_date !== undefined ? new Date(start_date) : existing.startDate;
    const effectiveEnd = end_date !== undefined ? new Date(end_date) : existing.endDate;

    if (effectiveStart && effectiveEnd && effectiveEnd <= effectiveStart) {
      return res.status(400).json({
        success: false,
        message: 'end_date must be after start_date.',
      });
    }

    const plan = await prisma.recurringPlan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price }),
        ...(billing_period !== undefined && { billingPeriod: billing_period }),
        ...(min_qty !== undefined && { minQty: min_qty }),
        ...(start_date !== undefined && { startDate: start_date ? new Date(start_date) : null }),
        ...(end_date !== undefined && { endDate: end_date ? new Date(end_date) : null }),
        ...(auto_close !== undefined && { autoClose: auto_close }),
        ...(closable !== undefined && { closable }),
        ...(pausable !== undefined && { pausable }),
        ...(renewable !== undefined && { renewable }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Plan updated successfully.',
      data: formatPlan(plan),
    });
  } catch (error) {
    console.error('updatePlan error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── DELETE /api/plans/:id ────────────────────────────────────────────────────

/**
 * @route   DELETE /api/plans/:id
 * @desc    Soft-delete a recurring plan
 * @access  Admin only
 */
async function deletePlan(req, res) {
  const { id } = req.params;

  try {
    const existing = await prisma.recurringPlan.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    await prisma.recurringPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: 'Plan deleted successfully.',
      data: null,
    });
  } catch (error) {
    console.error('deletePlan error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
};
