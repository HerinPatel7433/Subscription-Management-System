# Razorpay Payment Gateway Integration

Add Razorpay as an online payment method alongside the existing manual payment recording.

## User Review Required

> [!IMPORTANT]
> You will need to provide your Razorpay **Key ID** and **Key Secret** from the [Razorpay Dashboard](https://dashboard.razorpay.com/). These go in `server/.env`. Do you have a Razorpay account? Should we use **Test Mode** keys for now?

> [!NOTE]
> Razorpay works by: (1) backend creates an Order → (2) frontend opens Razorpay Checkout popup → (3) user pays → (4) backend verifies the signature to confirm payment is genuine. This is the standard secure flow.

## Proposed Changes

### Backend

#### [MODIFY] `server/.env`
Add two new environment variables:
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
```

#### [NEW] `server/src/controllers/razorpay.controller.js`
- `createOrder(req, res)` — takes `invoice_id`, looks up the invoice balance due, creates a Razorpay order, returns `{ order_id, amount, currency, key_id }`
- `verifyPayment(req, res)` — takes `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, verifies HMAC-SHA256 signature, then records the payment in DB and marks invoice as paid

#### [NEW] `server/src/routes/razorpay.routes.js`
```
POST /api/razorpay/create-order   → createOrder  (admin, internal)
POST /api/razorpay/verify         → verifyPayment (admin, internal)
```

#### [MODIFY] `server/src/app.js`
Register the new `/api/razorpay` route.

---

### Frontend

#### [MODIFY] `index.html`
Load the Razorpay Checkout script from CDN.

#### [NEW] `src/components/RazorpayButton.tsx`
A reusable button that:
1. Calls `POST /api/razorpay/create-order` with the invoice ID
2. Opens the Razorpay Checkout popup with the returned order details
3. On success, calls `POST /api/razorpay/verify`
4. Shows a success/error toast and refreshes the page data

#### [MODIFY] `src/pages/InvoicesPage.tsx` or invoice detail view
Add a **"Pay Online"** button next to confirmed invoices that triggers the `RazorpayButton`.

#### [MODIFY] `src/services/billingService.ts`
Add two new API functions: `createRazorpayOrder` and `verifyRazorpayPayment`.

---

## Open Questions

> [!IMPORTANT]
> 1. **Razorpay Keys**: Do you already have a Razorpay account? Please share your **Key ID** and **Key Secret** (test mode is fine to start).
> 2. **Where to show**: Should the "Pay Online" button appear on the **Invoices page** list, on an individual **Invoice detail page**, or on the **Payments page**?
> 3. **Currency**: Should we use INR (₹) as the currency? (Razorpay default for India)

## Verification Plan

### Automated Tests
- Run `node server/scripts/debug-payment.js` extended to test Razorpay order creation

### Manual Verification
- Use Razorpay test card `4111 1111 1111 1111` to complete a payment
- Verify the invoice turns to `paid` status after successful payment
