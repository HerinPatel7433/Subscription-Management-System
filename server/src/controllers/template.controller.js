// server/src/controllers/template.controller.js
const { validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma.util');

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatTemplate(t) {
  return {
    ...t,
    lines: t.lines
      ? t.lines.map((l) => ({ ...l, unitPrice: Number(l.unitPrice) }))
      : undefined,
  };
}

// ─── GET /api/templates ───────────────────────────────────────────────────────

/**
 * @route   GET /api/templates
 * @desc    List all quotation templates
 * @access  Admin, Internal
 */
async function listTemplates(req, res) {
  try {
    const templates = await prisma.quotationTemplate.findMany({
      include: {
        plan: { select: { id: true, name: true, billingPeriod: true, price: true } },
        lines: {
          include: {
            product: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Templates retrieved successfully.',
      data: templates.map(formatTemplate),
    });
  } catch (error) {
    console.error('listTemplates error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/templates/:id ───────────────────────────────────────────────────

/**
 * @route   GET /api/templates/:id
 * @desc    Get a single template with its lines
 * @access  Admin, Internal
 */
async function getTemplate(req, res) {
  const { id } = req.params;

  try {
    const template = await prisma.quotationTemplate.findUnique({
      where: { id },
      include: {
        plan: { select: { id: true, name: true, billingPeriod: true, price: true } },
        lines: {
          include: {
            product: { select: { id: true, name: true, type: true } },
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Template retrieved successfully.',
      data: formatTemplate(template),
    });
  } catch (error) {
    console.error('getTemplate error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/templates ──────────────────────────────────────────────────────

/**
 * @route   POST /api/templates
 * @desc    Create a new quotation template (optionally with initial lines)
 * @access  Admin, Internal
 * Body: { name, validity_days, plan_id, lines?: [{ product_id, quantity, unit_price }] }
 */
async function createTemplate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, validity_days, plan_id, lines = [] } = req.body;

  try {
    // Verify the plan exists
    const plan = await prisma.recurringPlan.findFirst({
      where: { id: plan_id, deletedAt: null },
    });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Recurring plan not found.' });
    }

    // Verify all product IDs in lines exist (if provided)
    if (lines.length > 0) {
      const productIds = lines.map((l) => l.product_id);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
        select: { id: true },
      });
      if (products.length !== productIds.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more product IDs in lines are invalid or deleted.',
        });
      }
    }

    const template = await prisma.quotationTemplate.create({
      data: {
        name,
        validityDays: validity_days,
        planId: plan_id,
        lines: {
          create: lines.map((l) => ({
            productId: l.product_id,
            quantity: l.quantity,
            unitPrice: l.unit_price,
          })),
        },
      },
      include: {
        plan: { select: { id: true, name: true, billingPeriod: true, price: true } },
        lines: {
          include: { product: { select: { id: true, name: true, type: true } } },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Template created successfully.',
      data: formatTemplate(template),
    });
  } catch (error) {
    console.error('createTemplate error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── PUT /api/templates/:id ───────────────────────────────────────────────────

/**
 * @route   PUT /api/templates/:id
 * @desc    Update a quotation template header fields
 * @access  Admin, Internal
 * Body: { name?, validity_days?, plan_id? }
 */
async function updateTemplate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { name, validity_days, plan_id } = req.body;

  try {
    const existing = await prisma.quotationTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    if (plan_id) {
      const plan = await prisma.recurringPlan.findFirst({
        where: { id: plan_id, deletedAt: null },
      });
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Recurring plan not found.' });
      }
    }

    const template = await prisma.quotationTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(validity_days !== undefined && { validityDays: validity_days }),
        ...(plan_id !== undefined && { planId: plan_id }),
      },
      include: {
        plan: { select: { id: true, name: true, billingPeriod: true, price: true } },
        lines: {
          include: { product: { select: { id: true, name: true, type: true } } },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Template updated successfully.',
      data: formatTemplate(template),
    });
  } catch (error) {
    console.error('updateTemplate error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── DELETE /api/templates/:id ────────────────────────────────────────────────

/**
 * @route   DELETE /api/templates/:id
 * @desc    Delete a quotation template (hard delete — cascades to lines)
 * @access  Admin, Internal
 */
async function deleteTemplate(req, res) {
  const { id } = req.params;

  try {
    const existing = await prisma.quotationTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    await prisma.quotationTemplate.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Template deleted successfully.',
      data: null,
    });
  } catch (error) {
    console.error('deleteTemplate error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/templates/:id/lines ───────────────────────────────────────────

/**
 * @route   POST /api/templates/:id/lines
 * @desc    Add a line item to a template
 * @access  Admin, Internal
 * Body: { product_id, quantity, unit_price }
 */
async function addTemplateLine(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { product_id, quantity, unit_price } = req.body;

  try {
    const template = await prisma.quotationTemplate.findUnique({ where: { id } });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    const product = await prisma.product.findFirst({
      where: { id: product_id, deletedAt: null },
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const line = await prisma.templateLine.create({
      data: { templateId: id, productId: product_id, quantity, unitPrice: unit_price },
      include: { product: { select: { id: true, name: true, type: true } } },
    });

    return res.status(201).json({
      success: true,
      message: 'Line added to template.',
      data: { ...line, unitPrice: Number(line.unitPrice) },
    });
  } catch (error) {
    console.error('addTemplateLine error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── DELETE /api/templates/:id/lines/:lineId ──────────────────────────────────

/**
 * @route   DELETE /api/templates/:id/lines/:lineId
 * @desc    Remove a line item from a template
 * @access  Admin, Internal
 */
async function deleteTemplateLine(req, res) {
  const { id, lineId } = req.params;

  try {
    const line = await prisma.templateLine.findFirst({
      where: { id: lineId, templateId: id },
    });
    if (!line) {
      return res.status(404).json({ success: false, message: 'Line not found.' });
    }

    await prisma.templateLine.delete({ where: { id: lineId } });

    return res.status(200).json({
      success: true,
      message: 'Line removed from template.',
      data: null,
    });
  } catch (error) {
    console.error('deleteTemplateLine error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  addTemplateLine,
  deleteTemplateLine,
};
