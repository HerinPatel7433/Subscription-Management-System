// server/src/controllers/product.controller.js
const { validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma.util');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts Prisma Decimal fields to plain numbers for JSON serialisation.
 */
function formatProduct(product) {
  return {
    ...product,
    salesPrice: product.salesPrice !== undefined ? Number(product.salesPrice) : undefined,
    costPrice: product.costPrice !== undefined ? Number(product.costPrice) : undefined,
    variants: product.variants
      ? product.variants.map((v) => ({
          ...v,
          extraPrice: Number(v.extraPrice),
        }))
      : undefined,
  };
}

// ─── GET /api/products ────────────────────────────────────────────────────────

/**
 * @route   GET /api/products
 * @desc    List all active (non-deleted) products with their variants
 * @access  Admin, Internal
 */
async function listProducts(req, res) {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        variants: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully.',
      data: products.map(formatProduct),
    });
  } catch (error) {
    console.error('listProducts error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/products/:id ────────────────────────────────────────────────────

/**
 * @route   GET /api/products/:id
 * @desc    Get a single product by ID (with variants)
 * @access  Admin, Internal
 */
async function getProduct(req, res) {
  const { id } = req.params;

  try {
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        variants: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Product retrieved successfully.',
      data: formatProduct(product),
    });
  } catch (error) {
    console.error('getProduct error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/products ───────────────────────────────────────────────────────

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Admin only
 * Body: { name, type, sales_price, cost_price }
 */
async function createProduct(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, type, sales_price, cost_price } = req.body;

  try {
    const product = await prisma.product.create({
      data: {
        name,
        type,
        salesPrice: sales_price,
        costPrice: cost_price,
        createdById: req.user.id,
      },
      include: {
        variants: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: formatProduct(product),
    });
  } catch (error) {
    console.error('createProduct error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── PUT /api/products/:id ────────────────────────────────────────────────────

/**
 * @route   PUT /api/products/:id
 * @desc    Update an existing product
 * @access  Admin only
 * Body: { name?, type?, sales_price?, cost_price? }
 */
async function updateProduct(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { name, type, sales_price, cost_price } = req.body;

  try {
    const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(sales_price !== undefined && { salesPrice: sales_price }),
        ...(cost_price !== undefined && { costPrice: cost_price }),
      },
      include: {
        variants: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: formatProduct(product),
    });
  } catch (error) {
    console.error('updateProduct error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────

/**
 * @route   DELETE /api/products/:id
 * @desc    Soft-delete a product (sets deletedAt timestamp)
 * @access  Admin only
 */
async function deleteProduct(req, res) {
  const { id } = req.params;

  try {
    const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
      data: null,
    });
  } catch (error) {
    console.error('deleteProduct error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/products/:id/variants ──────────────────────────────────────────

/**
 * @route   GET /api/products/:id/variants
 * @desc    List all variants for a product
 * @access  Admin, Internal
 */
async function listVariants(req, res) {
  const { id } = req.params;

  try {
    const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Variants retrieved successfully.',
      data: variants.map((v) => ({ ...v, extraPrice: Number(v.extraPrice) })),
    });
  } catch (error) {
    console.error('listVariants error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/products/:id/variants ─────────────────────────────────────────

/**
 * @route   POST /api/products/:id/variants
 * @desc    Add a variant to a product
 * @access  Admin only
 * Body: { attribute, value, extra_price? }
 */
async function addVariant(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { attribute, value, extra_price = 0 } = req.body;

  try {
    const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        attribute,
        value,
        extraPrice: extra_price,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Variant added successfully.',
      data: { ...variant, extraPrice: Number(variant.extraPrice) },
    });
  } catch (error) {
    console.error('addVariant error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── PUT /api/products/:id/variants/:variantId ────────────────────────────────

/**
 * @route   PUT /api/products/:id/variants/:variantId
 * @desc    Update a product variant
 * @access  Admin only
 * Body: { attribute?, value?, extra_price? }
 */
async function updateVariant(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id, variantId } = req.params;
  const { attribute, value, extra_price } = req.body;

  try {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId: id },
    });

    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found.' });
    }

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(attribute !== undefined && { attribute }),
        ...(value !== undefined && { value }),
        ...(extra_price !== undefined && { extraPrice: extra_price }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Variant updated successfully.',
      data: { ...updated, extraPrice: Number(updated.extraPrice) },
    });
  } catch (error) {
    console.error('updateVariant error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── DELETE /api/products/:id/variants/:variantId ─────────────────────────────

/**
 * @route   DELETE /api/products/:id/variants/:variantId
 * @desc    Delete a product variant (hard delete — variants have no soft-delete in schema)
 * @access  Admin only
 */
async function deleteVariant(req, res) {
  const { id, variantId } = req.params;

  try {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId: id },
    });

    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found.' });
    }

    await prisma.productVariant.delete({ where: { id: variantId } });

    return res.status(200).json({
      success: true,
      message: 'Variant deleted successfully.',
      data: null,
    });
  } catch (error) {
    console.error('deleteVariant error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listVariants,
  addVariant,
  updateVariant,
  deleteVariant,
};
