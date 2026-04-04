// server/src/utils/subscription.util.js

/**
 * Generates a unique subscription number in the format: SUB-YYYYMMDD-XXXXXX
 * @returns {string}
 */
function generateSubscriptionNumber() {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randPart = Math.random().toString(36).toUpperCase().slice(2, 8);
  return `SUB-${datePart}-${randPart}`;
}

/**
 * Valid subscription statuses and their allowed transitions.
 *
 * State machine:
 *   draft → quotation → confirmed → active → closed
 *                                  ↕
 *                               paused (if plan.pausable)
 *   closed → (new subscription, if plan.renewable)
 */
const STATUS_TRANSITIONS = {
  draft: ['quotation'],
  quotation: ['confirmed'],
  confirmed: ['active'],
  active: ['closed', 'paused'],
  paused: ['active'],   // resume
  closed: [],           // terminal — renew creates a new subscription
};

/**
 * Checks whether a status transition is allowed.
 * @param {string} from - Current status
 * @param {string} to   - Target status
 * @returns {boolean}
 */
function canTransition(from, to) {
  return (STATUS_TRANSITIONS[from] || []).includes(to);
}

/**
 * Serialises a subscription record, converting Prisma Decimals, Dates, and
 * camelCase → snake_case for JSON responses.
 * @param {object} sub - Raw Prisma subscription object
 * @returns {object}
 */
function formatSubscription(sub) {
  return {
    id: sub.id,
    subscription_number: sub.subscriptionNumber,
    customer_id: sub.customerId,
    customer_name: sub.customer ? sub.customer.name : undefined,
    customer_email: sub.customer ? sub.customer.email : undefined,
    plan_id: sub.planId,
    plan_name: sub.plan ? sub.plan.name : undefined,
    start_date: sub.startDate ? sub.startDate.toISOString().split('T')[0] : null,
    expiration_date: sub.expirationDate ? sub.expirationDate.toISOString().split('T')[0] : null,
    next_billing_date: sub.nextBillingDate ? sub.nextBillingDate.toISOString().split('T')[0] : null,
    payment_terms: sub.paymentTerms,
    status: sub.status,
    created_at: sub.createdAt,
    plan: sub.plan ? {
      id: sub.plan.id,
      name: sub.plan.name,
      billing_period: sub.plan.billingPeriod,
      pausable: sub.plan.pausable,
      renewable: sub.plan.renewable,
      closable: sub.plan.closable,
    } : undefined,
    lines: sub.lines
      ? sub.lines.map((l) => ({
          id: l.id,
          product_id: l.productId,
          product_name: l.product ? l.product.name : undefined,
          quantity: l.quantity,
          unit_price: Number(l.unitPrice),
          amount: Number(l.amount),
          tax_id: l.taxId,
          tax: l.tax ? { id: l.tax.id, name: l.tax.name, rate: Number(l.tax.rate) } : undefined,
        }))
      : undefined,
  };
}

module.exports = { generateSubscriptionNumber, canTransition, formatSubscription, STATUS_TRANSITIONS };
