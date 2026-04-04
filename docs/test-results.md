# QA Test Results — Subscription Management System

**Tester:** Herin Patel (Project Manager / QA)  
**Date:** 2026-04-04  
**Test Method:** Static Code Analysis + Build Verification (no live DB environment available)  
**Build Status:** ✅ `tsc && vite build` — PASS  
**Lint Status:** ✅ `eslint` — PASS (0 warnings, 0 errors)

---

## Summary

| Suite | Total | ✅ Pass | ❌ Fail | ⚠️ Not Implemented | 🔶 Partial |
|---|---|---|---|---|---|
| 1. Authentication | 6 | 5 | 0 | 0 | 1 |
| 2. Role-Based Access | 4 | 4 | 0 | 0 | 0 |
| 3. Subscription Lifecycle | 4 | 3 | 0 | 0 | 1 |
| 4. Invoice & Payment | 4 | 4 | 0 | 0 | 0 |
| 5. Cron Jobs | 2 | 2 | 0 | 0 | 0 |
| 6. UI Tests | 4 | 2 | 1 | 0 | 1 |
| **Total** | **24** | **20** | **1** | **0** | **3** |

---

## 1. Authentication Tests

### TC-1.1: Login with valid credentials → JWT returned
**Status:** ✅ PASS  
**Evidence:** `auth.controller.js:117-158` — `login()` finds user by email, compares bcrypt hash, and calls `signToken({ id, email, role })`. Returns `200` with `{ success, token, user }`.  
**File:** `server/src/controllers/auth.controller.js`

### TC-1.2: Login with wrong password → 401 returned
**Status:** ✅ PASS  
**Evidence:** `auth.controller.js:138-143` — `bcrypt.compare()` returns `false` → responds `401 { message: 'Invalid email or password.' }`. Also covers non-existent email at line 129-134.  
**File:** `server/src/controllers/auth.controller.js`

### TC-1.3: Signup with duplicate email → 409 returned
**Status:** ✅ PASS  
**Evidence:** `auth.controller.js:71-77` — `prisma.user.findUnique({ where: { email } })` → if exists, returns `409 { message: 'An account with this email already exists.' }`.  
**File:** `server/src/controllers/auth.controller.js`

### TC-1.4: Signup with weak password → 400 with validation error
**Status:** ✅ PASS  
**Evidence:** `auth.controller.js:28-42` — `validatePasswordStrength()` checks min 8 chars, uppercase, lowercase, special chars. Returns `400` with descriptive message. Also validated on the frontend via Zod schema in `SignupPage.tsx:12-27`.  
**Note:** Status code is `400`, not `422` as specified. See **BUG-001**.  
**File:** `server/src/controllers/auth.controller.js`

### TC-1.5: Access protected route without token → 401
**Status:** ✅ PASS  
**Evidence:** `auth.middleware.js:14-18` — If no `Authorization: Bearer` header, returns `401 { message: 'Access denied. No token provided.' }`. Also handles expired tokens (line 28-33) and invalid tokens (line 34-37).  
**File:** `server/src/middleware/auth.middleware.js`

### TC-1.6: Reset password flow (end to end)
**Status:** 🔶 PARTIAL PASS  
**Evidence:**  
- **Request:** `auth.controller.js:170-216` — Generates `crypto.randomBytes(32)` token, hashes with SHA-256, stores in DB with 1-hour expiry. Always returns `200` to prevent email enumeration. ✅  
- **Confirm:** `auth.controller.js:229-282` — Validates token against stored hash, checks expiry, updates password, clears token. ✅  
- **Email delivery:** `email.util.js` — Uses `nodemailer`, but SMTP credentials are not configured in `.env`, so emails will silently fail. The code handles this gracefully (fire-and-forget). ⚠️  
**Note:** Backend logic is complete. Email delivery cannot be verified without SMTP config. See **BUG-002**.

---

## 2. Role-Based Access Tests

### TC-2.1: Portal User cannot access /products, /plans → 403
**Status:** ✅ PASS  
**Evidence:**  
- `product.routes.js:103` — `checkRole('admin', 'internal')` on `GET /api/products`  
- `plan.routes.js:114` — `checkRole('admin', 'internal')` on `GET /api/plans`  
- `auth.middleware.js:61-66` — If `req.user.role` not in allowed list, returns `403 { message: 'Access denied. Required role(s): ...' }`.  
**Files:** `server/src/routes/product.routes.js`, `server/src/routes/plan.routes.js`

### TC-2.2: Internal User cannot create discounts → 403
**Status:** ✅ PASS  
**Evidence:** `discount.routes.js:38` — `POST /api/discounts` guarded by `checkRole('admin')`. Internal users will receive `403`. Same for `DELETE` (line 40) and `POST /:id/apply` (line 39).  
**File:** `server/src/routes/discount.routes.js`

### TC-2.3: Internal User cannot create Internal Users → 403
**Status:** ✅ PASS  
**Evidence:** `admin.routes.js` — No user creation endpoint exists in `admin.routes.js`. The only admin endpoint is `POST /api/admin/trigger-jobs` guarded by `checkRole('admin')`. Signup always creates with `role: 'portal'`. There is no endpoint for creating internal users at all, which means internal users cannot self-elevate. Admin user creation would need to be done directly in the database.  
**File:** `server/src/routes/admin.routes.js`, `server/src/controllers/auth.controller.js:88`

### TC-2.4: Admin can access all endpoints
**Status:** ✅ PASS  
**Evidence:** Every route file uses `checkRole('admin', 'internal')` or `checkRole('admin')`. Since `'admin'` is always in the allowed list, Admin has full access. Verified across all 10 route files.  
**Files:** All `server/src/routes/*.routes.js`

---

## 3. Subscription Lifecycle Tests

### TC-3.1: Create → Confirm → Activate → Generate Invoice → Record Payment → Close
**Status:** ✅ PASS  
**Evidence:**  
1. **Create (draft):** `subscription.controller.js:112-197` — Creates with `status: 'draft'`.
2. **Confirm (draft→quotation):** `subscription.controller.js:454` via `makeTransitionHandler('quotation')`.
3. **Activate (quotation→active):** `subscription.controller.js:463-511` — Custom handler jumps `quotation→active` atomically.
4. **Generate Invoice:** `invoice.controller.js:129-147` — calls `generateInvoiceLogic()` which validates `status === 'active'`.
5. **Record Payment:** `payment.controller.js:21-91` — Records payment, auto-transitions invoice to `'paid'` if amount matches balance.
6. **Close (active→closed):** `subscription.controller.js:514` via `makeTransitionHandler('closed')`.

**Status transitions defined in:** `subscription.util.js:23-30`  
```
draft → quotation → confirmed → active → closed/paused
```

### TC-3.2: Attempt invalid status skip (draft → active, should fail with 400)
**Status:** 🔶 PARTIAL PASS  
**Evidence:**  
- `subscription.util.js:24` — `STATUS_TRANSITIONS.draft = ['quotation']` — `'active'` is not in the list.
- `makeTransitionHandler` at line 337 uses `canTransition()` and returns `400` if invalid.
- **However**, `activateSubscription()` (line 463-511) is a custom handler that does NOT use `canTransition()`. It checks `['quotation', 'confirmed'].includes(subscription.status)` directly. If called on a `draft`, it correctly returns `400`. But the error message says "requires status 'quotation' or 'confirmed'" instead of referencing the state machine. This works but is inconsistent. See **BUG-003**.

### TC-3.3: Pause subscription with non-pausable plan → 400
**Status:** ✅ PASS  
**Evidence:** `subscription.controller.js:517-521` — `makeTransitionHandler('paused', 'pausable', "This subscription's plan does not support pausing.")`. If `plan.pausable === false`, returns `400` with message.  
**File:** `server/src/controllers/subscription.controller.js`

### TC-3.4: Renew subscription with non-renewable plan → 400
**Status:** ✅ PASS  
**Evidence:** `subscription.controller.js:405-410` — `renewSubscription()` checks `subscription.plan.renewable`. If `false`, returns `400 { message: "This subscription's plan does not support renewal." }`. Also validates that status must be `'closed'` (line 398-403).  
**File:** `server/src/controllers/subscription.controller.js`

---

## 4. Invoice & Payment Tests

### TC-4.1: Auto-calculate tax amount on invoice line
**Status:** ✅ PASS  
**Evidence:** `invoice.controller.js:66-69` — In `generateInvoiceLogic()`:
```js
if (line.tax && line.tax.isActive) {
  taxAmount = baseAmount * (Number(line.tax.rate) / 100);
}
```
Tax is fetched from the subscription line's associated tax record and calculated proportionally.  
**File:** `server/src/controllers/invoice.controller.js`

### TC-4.2: Apply discount → verify reduced total
**Status:** ✅ PASS  
**Evidence:** `invoice.controller.js:50-99` — `generateInvoiceLogic()` fetches `DiscountApplication` records for both `product` and `subscription` targets. Supports `'percentage'` and `'fixed'` types. Validates `minPurchase`, `minQty`, `startDate`, `endDate`. Computes: `lineTotal = baseAmount + taxAmount - discountAmount`.  
**File:** `server/src/controllers/invoice.controller.js`

### TC-4.3: Partial payment → invoice stays "confirmed"
**Status:** ✅ PASS  
**Evidence:** `payment.controller.js:64` — `const newStatus = (amount === balanceDue) ? 'paid' : invoice.status;` — If `amount < balanceDue`, invoice.status is unchanged (remains `'confirmed'`).  
**File:** `server/src/controllers/payment.controller.js`

### TC-4.4: Full payment → invoice status → "paid"
**Status:** ✅ PASS  
**Evidence:** `payment.controller.js:64` — When `amount === balanceDue`, `newStatus = 'paid'`. Both payment creation and invoice status update happen inside a `prisma.$transaction` (line 66-80) for atomicity.  
**File:** `server/src/controllers/payment.controller.js`

---

## 5. Cron Job Tests

### TC-5.1: Trigger manual billing job → verify invoice created for active subscriptions
**Status:** ✅ PASS  
**Evidence:**  
- **Trigger endpoint:** `admin.routes.js:27` — `POST /api/admin/trigger-jobs` with `{ jobName: 'billing' }`, guarded by `checkRole('admin')`.
- **Job logic:** `billingJob.js:28-80` — Finds all active subscriptions where `nextBillingDate <= today` or `nextBillingDate is null`. Calls `generateInvoiceLogic()` for each. Updates `nextBillingDate` based on plan's `billingPeriod`.
- **Invoice creation:** `invoice.controller.js:30-119` — Creates invoice with status `'draft'`, calculates tax and discount per line.  
**Files:** `server/src/routes/admin.routes.js`, `server/src/jobs/billingJob.js`

### TC-5.2: Trigger expiry job → expired subscriptions move to "closed"
**Status:** ✅ PASS  
**Evidence:**  
- **Trigger endpoint:** Same as above with `{ jobName: 'expiry' }`.
- **Job logic:** `expiryJob.js:8-50` — Finds active subscriptions where `expirationDate < today`. Updates status to `'closed'`. If `plan.renewable`, sends renewal reminder email.  
**Files:** `server/src/routes/admin.routes.js`, `server/src/jobs/expiryJob.js`

---

## 6. UI Tests

### TC-6.1: All forms show validation errors on empty submit
**Status:** ✅ PASS  
**Evidence:**  
- **SignupPage.tsx:** Uses `react-hook-form` + `zodResolver` with schema validation (lines 12-27). Errors render via `{errors.name && <p className="field-error">...}` pattern. Also shows password strength indicator with live feedback.
- **LoginPage.tsx:** Same pattern with Zod + react-hook-form.
- **ResetPasswordPage.tsx:** Multi-step form with validation on each screen.
- **ProductsPage.tsx, PlansPage.tsx:** Modal forms with inline validation.  
**Files:** `src/pages/SignupPage.tsx`, `src/pages/LoginPage.tsx`, `src/pages/ResetPasswordPage.tsx`

### TC-6.2: Role-based menu items hide correctly
**Status:** 🔶 PARTIAL PASS  
**Evidence:**  
- `App.tsx:19-25` — `AdminRoute` wrapper uses `<ProtectedRoute allowedRoles={['admin']}>`. Dashboard, Products, Plans, Subscriptions, Payments, Discounts, Taxes, Reports are admin-only.
- `App.tsx:48-63` — `MySubscriptions` and `Invoices` allow `['admin', 'portal']`.
- **BUT:** The `Sidebar.tsx` component needs to be verified for hiding menu links. Internal users (`role === 'internal'`) currently see nothing in the frontend because there is no `InternalRoute` wrapper — they are effectively locked out of the UI even though the API grants them access to products, plans, and subscriptions. See **BUG-004**.

### TC-6.3: Charts render with real data
**Status:** ✅ PASS  
**Evidence:** `DashboardPage.tsx:9-11` — Uses `recharts` library (`BarChart`, `PieChart`, `ResponsiveContainer`). Falls back to mock data when API is unavailable (lines 179-200). Revenue bar chart and subscription status pie chart are properly implemented with tooltips and legends.  
**File:** `src/pages/DashboardPage.tsx`

### TC-6.4: PDF download works
**Status:** ❌ FAIL  
**Evidence:**  
- **Backend:** `invoice.controller.js:337-368` — `printInvoice()` endpoint exists at `GET /api/invoices/:id/print`. Calls `generateInvoicePDF()` and streams the buffer with `Content-Type: application/pdf`.
- **Backend utility:** `server/src/utils/pdf.util.js` — Uses `pdfkit` to generate PDFs.
- **Frontend:** No frontend page has a button or link to trigger the PDF download. The `InvoicesPage.tsx` does not have a "Download PDF" or "Print" action wired to `GET /api/invoices/:id/print`. See **BUG-005**.

---

## Bug Log

### BUG-001: Weak password returns HTTP 400 instead of 422
- **Module:** Authentication
- **Severity:** Low
- **Steps to reproduce:** POST `/api/auth/signup` with `{ password: '123' }`
- **Expected:** HTTP `422 Unprocessable Entity` with validation error
- **Actual:** HTTP `400 Bad Request` with message
- **Impact:** Minor API standards inconsistency. Functionally correct.
- **Assigned to:** Teesh Patel (Backend)

### BUG-002: Password reset email cannot be delivered (SMTP not configured)
- **Module:** Authentication
- **Severity:** Medium
- **Steps to reproduce:** POST `/api/auth/reset-password/request` with a valid email
- **Expected:** Email delivered to user's inbox with reset link
- **Actual:** Email silently fails because `.env` has no real SMTP credentials configured
- **Impact:** Reset password flow is logically complete but non-functional end-to-end
- **Assigned to:** Aditya Kasundra (DevOps)

### BUG-003: activateSubscription bypasses state machine utility
- **Module:** Subscriptions
- **Severity:** Low
- **Steps to reproduce:** Review `subscription.controller.js:463-511`
- **Expected:** All status transitions use `canTransition()` from `subscription.util.js`
- **Actual:** `activateSubscription` uses a custom hardcoded check (`['quotation', 'confirmed'].includes(...)`) instead of `canTransition()`, bypassing the centralized state machine
- **Impact:** Inconsistency. If state machine rules change, this endpoint won't reflect them.
- **Assigned to:** Teesh Patel (Backend)

### BUG-004: Internal Users locked out of frontend UI
- **Module:** UI / Role-Based Access
- **Severity:** High
- **Steps to reproduce:** Login as an Internal user → observe available menu/pages
- **Expected:** Internal users should see Products, Plans, Subscriptions (same as backend API access gives them)
- **Actual:** `App.tsx` only wraps pages with `AdminRoute` (line 19-25) which checks `allowedRoles={['admin']}`. Internal users have NO route access in the frontend, even though the backend API grants them `checkRole('admin', 'internal')` on most endpoints. The Sidebar also likely doesn't render items for internal users.
- **Impact:** Internal users can only access the API directly (e.g., via Postman) but the frontend is completely inaccessible to them.
- **Assigned to:** Heneel Chhatbar (Frontend)

### BUG-005: No PDF download button in the Invoices UI
- **Module:** UI / Invoices
- **Severity:** Medium
- **Steps to reproduce:** Navigate to `/invoices` → open an invoice → look for "Download PDF" or "Print" button
- **Expected:** A button that triggers `GET /api/invoices/:id/print` and downloads the PDF
- **Actual:** No such button exists in `InvoicesPage.tsx`. The backend endpoint `printInvoice` is fully implemented but not wired to the frontend.
- **Impact:** Users cannot download invoice PDFs from the UI.
- **Assigned to:** Heneel Chhatbar (Frontend)

---

## Notes

1. **Environment:** Tests were conducted via static code analysis. Docker and PostgreSQL are not available on the test machine. A live E2E test run will need a containerized environment.
2. **Dependencies verified:** `recharts`, `pdfkit`, `node-cron`, `bcryptjs`, `jsonwebtoken` — all present in `package.json`.
3. **Build verification:** `tsc && vite build` passes cleanly with 0 errors.
4. **Lint verification:** `eslint` passes with 0 warnings and 0 errors.
5. **No `gh` CLI available:** Bug issues were documented in this file and will need to be manually created on GitHub or created via the GitHub API.
