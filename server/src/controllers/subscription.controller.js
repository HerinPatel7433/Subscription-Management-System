// server/src/controllers/subscription.controller.js
const { validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma.util');
const {
  generateSubscriptionNumber,
  canTransition,
  formatSubscription,
} = require('../utils/subscription.util');

// ─── GET /api/subscriptions ───────────────────────────────────────────────────

/**
 * @route   GET /api/subscriptions
 * @desc    List subscriptions.
 *          - Admin / Internal: see all non-deleted subscriptions
 *          - Portal: see only their own subscriptions
 * @access  All authenticated roles
 */
async function listSubscriptions(req, res) {
  try {
    const isPortal = req.user.role === 'portal';

    const subscriptions = await prisma.subscription.findMany({
      where: {
        deletedAt: null,
        ...(isPortal && { customerId: req.user.id }),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, billingPeriod: true } },
        lines: {
          include: { product: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Subscriptions retrieved successfully.',
      data: subscriptions.map(formatSubscription),
    });
  } catch (error) {
    console.error('listSubscriptions error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── GET /api/subscriptions/:id ───────────────────────────────────────────────

/**
 * @route   GET /api/subscriptions/:id
 * @desc    Get a single subscription with all lines.
 *          Portal users can only access their own subscriptions.
 * @access  All authenticated roles
 */
async function getSubscription(req, res) {
  const { id } = req.params;

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: {
          select: {
            id: true, name: true, billingPeriod: true,
            pausable: true, renewable: true, closable: true,
          },
        },
        lines: {
          include: {
            product: { select: { id: true, name: true, type: true } },
            tax: { select: { id: true, name: true, rate: true } },
          },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    // Portal users can only see their own subscriptions
    if (req.user.role === 'portal' && subscription.customerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription retrieved successfully.',
      data: formatSubscription(subscription),
    });
  } catch (error) {
    console.error('getSubscription error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/subscriptions ──────────────────────────────────────────────────

/**
 * @route   POST /api/subscriptions
 * @desc    Create a subscription, optionally cloning lines from a template.
 * @access  Admin, Internal
 * Body: {
 *   customer_id, plan_id, start_date,
 *   expiration_date?, payment_terms?,
 *   template_id?          — if provided, lines are cloned from the template
 * }
 */
async function createSubscription(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { customer_id, plan_id, start_date, expiration_date, payment_terms, template_id } =
    req.body;

  try {
    // Validate customer
    const customer = await prisma.user.findFirst({
      where: { id: customer_id, deletedAt: null },
    });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Validate plan
    const plan = await prisma.recurringPlan.findFirst({
      where: { id: plan_id, deletedAt: null },
    });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Recurring plan not found.' });
    }

    // Validate date ordering
    if (expiration_date && new Date(expiration_date) <= new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: 'expiration_date must be after start_date.',
      });
    }

    // Resolve template lines (if cloning from template)
    let templateLines = [];
    if (template_id) {
      const template = await prisma.quotationTemplate.findUnique({
        where: { id: template_id },
        include: { lines: true },
      });
      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found.' });
      }
      templateLines = template.lines;
    }

    const subscriptionNumber = generateSubscriptionNumber();

    const subscription = await prisma.subscription.create({
      data: {
        subscriptionNumber,
        customerId: customer_id,
        planId: plan_id,
        startDate: new Date(start_date),
        expirationDate: expiration_date ? new Date(expiration_date) : null,
        paymentTerms: payment_terms || null,
        status: 'draft',
        lines: {
          create: templateLines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            amount: Number(l.unitPrice) * l.quantity,
          })),
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, billingPeriod: true } },
        lines: {
          include: { product: { select: { id: true, name: true } } },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Subscription created${template_id ? ' (cloned from template)' : ''}.`,
      data: formatSubscription(subscription),
    });
  } catch (error) {
    console.error('createSubscription error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── POST /api/subscriptions/:id/lines ───────────────────────────────────────

/**
 * @route   POST /api/subscriptions/:id/lines
 * @desc    Add an order line to a subscription (only allowed in draft/quotation states)
 * @access  Admin, Internal
 * Body: { product_id, quantity, unit_price, tax_id? }
 */
async function addSubscriptionLine(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { product_id, quantity, unit_price, tax_id } = req.body;

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { id, deletedAt: null },
    });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    // Only allow modifications in early states
    if (!['draft', 'quotation'].includes(subscription.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot add lines to a subscription in '${subscription.status}' status. Only 'draft' and 'quotation' subscriptions can be modified.`,
      });
    }

    const product = await prisma.product.findFirst({ where: { id: product_id, deletedAt: null } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (tax_id) {
      const tax = await prisma.tax.findUnique({ where: { id: tax_id } });
      if (!tax) {
        return res.status(404).json({ success: false, message: 'Tax not found.' });
      }
    }

    const line = await prisma.subscriptionLine.create({
      data: {
        subscriptionId: id,
        productId: product_id,
        quantity,
        unitPrice: unit_price,
        taxId: tax_id || null,
        amount: unit_price * quantity,
      },
      include: {
        product: { select: { id: true, name: true } },
        tax: { select: { id: true, name: true, rate: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Line added to subscription.',
      data: { ...line, unitPrice: Number(line.unitPrice), amount: Number(line.amount) },
    });
  } catch (error) {
    console.error('addSubscriptionLine error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── DELETE /api/subscriptions/:id/lines/:lineId ──────────────────────────────

/**
 * @route   DELETE /api/subscriptions/:id/lines/:lineId
 * @desc    Remove a line from a subscription (only in draft/quotation)
 * @access  Admin, Internal
 */
async function deleteSubscriptionLine(req, res) {
  const { id, lineId } = req.params;

  try {
    const subscription = await prisma.subscription.findFirst({ where: { id, deletedAt: null } });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    if (!['draft', 'quotation'].includes(subscription.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove lines from a subscription in '${subscription.status}' status.`,
      });
    }

    const line = await prisma.subscriptionLine.findFirst({
      where: { id: lineId, subscriptionId: id },
    });
    if (!line) {
      return res.status(404).json({ success: false, message: 'Line not found.' });
    }

    await prisma.subscriptionLine.delete({ where: { id: lineId } });

    return res.status(200).json({
      success: true,
      message: 'Line removed from subscription.',
      data: null,
    });
  } catch (error) {
    console.error('deleteSubscriptionLine error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── Status Transition Helper ─────────────────────────────────────────────────

/**
 * Factory that builds a status-transition handler.
 * Handles the common pattern: fetch → check transition → check plan flags → update.
 *
 * @param {string} targetStatus       - The status to move to
 * @param {string|null} planFlag      - Optional plan boolean field to check (e.g. 'pausable')
 * @param {string|null} planFlagError - Error message when planFlag is false
 */
function makeTransitionHandler(targetStatus, planFlag = null, planFlagError = null) {
  return async function transitionHandler(req, res) {
    const { id } = req.params;

    try {
      const subscription = await prisma.subscription.findFirst({
        where: { id, deletedAt: null },
        include: { plan: true },
      });

      if (!subscription) {
        return res.status(404).json({ success: false, message: 'Subscription not found.' });
      }

      if (!canTransition(subscription.status, targetStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition: '${subscription.status}' → '${targetStatus}'. Allowed from '${subscription.status}': [${(require('../utils/subscription.util').STATUS_TRANSITIONS[subscription.status] || []).join(', ') || 'none'}].`,
        });
      }

      // Check plan-level feature flag
      if (planFlag && !subscription.plan[planFlag]) {
        return res.status(400).json({
          success: false,
          message: planFlagError || `Plan does not support this action.`,
        });
      }

      const updated = await prisma.subscription.update({
        where: { id },
        data: { status: targetStatus },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          plan: { select: { id: true, name: true, billingPeriod: true } },
          lines: { include: { product: { select: { id: true, name: true } } } },
        },
      });

      return res.status(200).json({
        success: true,
        message: `Subscription moved to '${targetStatus}'.`,
        data: formatSubscription(updated),
      });
    } catch (error) {
      console.error(`transition to ${targetStatus} error:`, error);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  };
}

// ─── POST /api/subscriptions/:id/renew ───────────────────────────────────────

/**
 * @route   POST /api/subscriptions/:id/renew
 * @desc    Renew a closed subscription — creates a new 'draft' subscription
 *          cloning the plan and lines. Only allowed if plan.renewable = true.
 * @access  Admin, Internal
 */
async function renewSubscription(req, res) {
  const { id } = req.params;

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { id, deletedAt: null },
      include: {
        plan: true,
        lines: true,
      },
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    if (subscription.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: `Only 'closed' subscriptions can be renewed. Current status: '${subscription.status}'.`,
      });
    }

    if (!subscription.plan.renewable) {
      return res.status(400).json({
        success: false,
        message: 'This subscription\'s plan does not support renewal.',
      });
    }

    const subscriptionNumber = generateSubscriptionNumber();

    const renewed = await prisma.subscription.create({
      data: {
        subscriptionNumber,
        customerId: subscription.customerId,
        planId: subscription.planId,
        startDate: new Date(),
        expirationDate: null,
        paymentTerms: subscription.paymentTerms,
        status: 'draft',
        lines: {
          create: subscription.lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxId: l.taxId,
            amount: l.amount,
          })),
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, billingPeriod: true } },
        lines: { include: { product: { select: { id: true, name: true } } } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Subscription renewed. A new draft subscription has been created.',
      data: formatSubscription(renewed),
    });
  } catch (error) {
    console.error('renewSubscription error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── Named Transition Controllers ─────────────────────────────────────────────

// draft → quotation
const confirmSubscription = makeTransitionHandler('quotation');

// quotation → confirmed → (skips confirmed, goes straight to active)
// The task says: activate → quotation → confirmed → active
// We implement it as two endpoints per the state machine:
// confirmSubscription: draft → quotation
// activateSubscription: quotation → confirmed  (first call)  OR confirmed → active (second call)
// But the task says "activate → quotation → confirmed → active" meaning two hops happen on /activate
// We'll implement /activate as a two-step transition to match the task spec literally:
const activateSubscription = async (req, res) => {
  const { id } = req.params;

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { id, deletedAt: null },
      include: { plan: true },
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    // Check if we can reach 'active' (either directly or via 'confirmed')
    let allowed = false;
    if (canTransition(subscription.status, 'active')) {
      allowed = true;
    } else if (canTransition(subscription.status, 'confirmed') && canTransition('confirmed', 'active')) {
      allowed = true;
    }

    if (!allowed) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition. Cannot reach 'active' from '${subscription.status}'.`,
      });
    }

    const targetStatus = 'active';

    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: targetStatus },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, billingPeriod: true } },
        lines: { include: { product: { select: { id: true, name: true } } } },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Subscription activated (status: '${targetStatus}').`,
      data: formatSubscription(updated),
    });
  } catch (error) {
    console.error('activateSubscription error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// active → closed
const closeSubscription = makeTransitionHandler('closed');

// active → paused (only if plan.pausable)
const pauseSubscription = makeTransitionHandler(
  'paused',
  'pausable',
  "This subscription's plan does not support pausing."
);

// paused → active (resume)
const resumeSubscription = makeTransitionHandler('active');

module.exports = {
  listSubscriptions,
  getSubscription,
  createSubscription,
  addSubscriptionLine,
  deleteSubscriptionLine,
  confirmSubscription,
  activateSubscription,
  closeSubscription,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
};
