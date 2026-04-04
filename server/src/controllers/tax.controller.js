// server/src/controllers/tax.controller.js
const { validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma.util');

// Helper
function formatTax(tax) {
  return {
    ...tax,
    rate: Number(tax.rate),
  };
}

// ─── GET /api/taxes ──────────────────────────────────────────────────────────

/**
 * @route   GET /api/taxes
 * @desc    Get all taxes (active and inactive)
 * @access  Admin, Internal
 */
async function listTaxes(req, res) {
  try {
    const taxes = await prisma.tax.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: taxes.map(formatTax),
      message: 'Taxes retrieved successfully.',
    });
  } catch (error) {
    console.error('listTaxes error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/taxes/active ───────────────────────────────────────────────────

/**
 * @route   GET /api/taxes/active
 * @desc    Get only active taxes (used for dropdowns)
 * @access  All authenticated
 */
async function listActiveTaxes(req, res) {
  try {
    const taxes = await prisma.tax.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: taxes.map(formatTax),
      message: 'Active taxes retrieved successfully.',
    });
  } catch (error) {
    console.error('listActiveTaxes error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/taxes/:id ──────────────────────────────────────────────────────

/**
 * @route   GET /api/taxes/:id
 * @desc    Get single tax
 * @access  Admin, Internal
 */
async function getTax(req, res) {
  const { id } = req.params;

  try {
    const tax = await prisma.tax.findUnique({ where: { id } });

    if (!tax) {
      return res.status(404).json({ success: false, message: 'Tax not found.' });
    }

    return res.status(200).json({
      success: true,
      data: formatTax(tax),
      message: 'Tax retrieved successfully.',
    });
  } catch (error) {
    console.error('getTax error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/taxes ─────────────────────────────────────────────────────────

/**
 * @route   POST /api/taxes
 * @desc    Create a new tax
 * @access  Admin only
 * @body    { name, rate, type?, is_active? }
 */
async function createTax(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, rate, type, is_active } = req.body;

  try {
    const tax = await prisma.tax.create({
      data: {
        name,
        rate,
        type: type || null,
        isActive: is_active !== undefined ? is_active : true,
      },
    });

    return res.status(201).json({
      success: true,
      data: formatTax(tax),
      message: 'Tax created successfully.',
    });
  } catch (error) {
    console.error('createTax error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── PUT /api/taxes/:id ──────────────────────────────────────────────────────

/**
 * @route   PUT /api/taxes/:id
 * @desc    Update a tax
 * @access  Admin only
 */
async function updateTax(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { name, rate, type, is_active } = req.body;

  try {
    const existing = await prisma.tax.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Tax not found.' });
    }

    const tax = await prisma.tax.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(rate !== undefined && { rate }),
        ...(type !== undefined && { type }),
        ...(is_active !== undefined && { isActive: is_active }),
      },
    });

    return res.status(200).json({
      success: true,
      data: formatTax(tax),
      message: 'Tax updated successfully.',
    });
  } catch (error) {
    console.error('updateTax error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── DELETE /api/taxes/:id ───────────────────────────────────────────────────

/**
 * @route   DELETE /api/taxes/:id
 * @desc    Hard-delete a tax
 * @access  Admin only
 */
async function deleteTax(req, res) {
  const { id } = req.params;

  try {
    const existing = await prisma.tax.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Tax not found.' });
    }

    await prisma.tax.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Tax deleted successfully.',
    });
  } catch (error) {
    console.error('deleteTax error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = {
  listTaxes,
  listActiveTaxes,
  getTax,
  createTax,
  updateTax,
  deleteTax,
};
