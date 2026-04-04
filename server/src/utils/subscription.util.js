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
 * Serialises a subscription record, converting Prisma Decimals and Dates to
 * plain JS types for JSON responses.
 * @param {object} sub - Raw Prisma subscription object
 * @returns {object}
 */
function formatSubscription(sub) {
  return {
    ...sub,
    startDate: sub.startDate ? sub.startDate.toISOString().split('T')[0] : null,
    expirationDate: sub.expirationDate
      ? sub.expirationDate.toISOString().split('T')[0]
      : null,
    lines: sub.lines
      ? sub.lines.map((l) => ({
          ...l,
          unitPrice: Number(l.unitPrice),
          amount: Number(l.amount),
        }))
      : undefined,
  };
}

module.exports = { generateSubscriptionNumber, canTransition, formatSubscription, STATUS_TRANSITIONS };
