# 📖 User Stories — Subscription Management System (SMS)

> **Version:** 1.0  
> **Author:** Herin Patel (Project Manager)  
> **Last Updated:** 2026-04-04  
> **Status:** Active

---

## 📌 Roles Glossary

| Role | Description |
|---|---|
| **Admin** | Super-user with full system access. Manages users, discounts, tax, and global config. |
| **Internal User** | Staff member (e.g., sales, finance). Can manage subscriptions, invoices, and reports. Created only by Admin. |
| **Portal User** | Customer-facing role. Accesses the self-service portal to view their own subscriptions, invoices, and payments. |

---

## 🔐 Module 1: Authentication

### US-AUTH-01 — Login
> **As an** Admin, Internal User, or Portal User,  
> **I want to** log in with my email and password,  
> **so that** I can securely access the system with my assigned permissions.

**Acceptance Criteria:**
- [ ] Login form accepts email (validated format) and password fields
- [ ] On valid credentials, a signed JWT access token and refresh token are issued
- [ ] On invalid credentials, display: *"Invalid email or password"* (no specifics for security)
- [ ] After 5 consecutive failed attempts, account is temporarily locked for 15 minutes
- [ ] User is redirected to their role-appropriate dashboard after login
- [ ] "Remember me" option extends session to 30 days

---

### US-AUTH-02 — Signup / Account Creation
> **As an** Admin,  
> **I want to** create Internal User accounts directly from the admin panel,  
> **so that** only authorized staff have system access.

**Acceptance Criteria:**
- [ ] Admin can create an account with: full name, email, role (Internal User), and temporary password
- [ ] System sends a welcome email with a one-time password-setup link (expires in 24h)
- [ ] Admin **cannot** self-register — account must be seeded or created by another Admin
- [ ] Portal Users (customers) can self-register via the customer portal
- [ ] Self-registered Portal Users receive an email verification link before account activation
- [ ] Duplicate email addresses are rejected with *"An account with this email already exists"*
- [ ] Password must be min. 8 characters, include uppercase, number, and special character

---

### US-AUTH-03 — Forgot / Reset Password
> **As any** system user,  
> **I want to** reset my password via email,  
> **so that** I can regain access if I forget my credentials.

**Acceptance Criteria:**
- [ ] "Forgot Password" link is visible on the login page
- [ ] User enters their registered email; system sends a reset link (expires in 1 hour)
- [ ] If email is not found, system shows a generic message (no user enumeration)
- [ ] Reset link is single-use; clicking it again shows *"Link expired or already used"*
- [ ] New password must differ from the last 3 passwords
- [ ] After successful reset, user is redirected to the login page with a success banner

---

### US-AUTH-04 — Logout
> **As any** logged-in user,  
> **I want to** log out of the system,  
> **so that** my session is terminated securely.

**Acceptance Criteria:**
- [ ] Logout button is accessible from any page via the top navigation
- [ ] On logout, JWT access token and refresh token are invalidated server-side
- [ ] User is immediately redirected to the login page
- [ ] Browser back button does not restore the authenticated session after logout

---

## 📊 Module 2: Dashboard

### US-DASH-01 — Admin Dashboard
> **As an** Admin,  
> **I want to** see a high-level KPI overview on login,  
> **so that** I can quickly assess the health of the business.

**Acceptance Criteria:**
- [ ] Dashboard displays: Total Active Subscriptions, MRR, ARR, Total Customers, Overdue Invoices count
- [ ] A revenue trend chart (line graph) shows last 12 months of revenue
- [ ] A subscription status breakdown donut chart (Active / Trialing / Canceled / Past Due) is shown
- [ ] Top 5 plans by subscriber count are listed
- [ ] Recent activity feed shows last 10 events (new subscriptions, payments, cancellations)
- [ ] All KPI cards link to their respective detail pages
- [ ] Dashboard data refreshes every 5 minutes or on manual refresh

---

### US-DASH-02 — Internal User Dashboard
> **As an** Internal User,  
> **I want to** see my assigned tasks and relevant subscription data,  
> **so that** I can prioritize my daily work efficiently.

**Acceptance Criteria:**
- [ ] Shows subscriptions assigned to or recently updated by the Internal User
- [ ] Displays count of Draft quotes awaiting action and overdue invoices
- [ ] Quick-action buttons: "New Subscription", "Create Invoice", "View Reports"
- [ ] Recent activity limited to records the user has access to

---

### US-DASH-03 — Portal User (Customer) Dashboard
> **As a** Portal User,  
> **I want to** see a summary of my active subscriptions and upcoming invoices,  
> **so that** I can stay informed about my account status and upcoming charges.

**Acceptance Criteria:**
- [ ] Shows all subscriptions with their current status (Active, Trialing, Canceled, etc.)
- [ ] Displays next billing date and amount for each active subscription
- [ ] Shows last 3 invoices with download links (PDF)
- [ ] Displays any outstanding (unpaid) invoice with a "Pay Now" button
- [ ] Shows quick link to update payment method

---

## 📦 Module 3: Products & Variants

### US-PROD-01 — Create Product
> **As an** Admin or Internal User,  
> **I want to** create a product with a name, description, and type,  
> **so that** it can be used as the base for subscription plans.

**Acceptance Criteria:**
- [ ] Product form fields: Name (required), Description, Product Type (Service / Physical / Digital), Status (Active/Inactive)
- [ ] Product code/SKU is auto-generated or manually entered (must be unique)
- [ ] Product can be saved as Draft or published as Active
- [ ] Only Active products are visible for plan creation
- [ ] Inactive products are soft-deleted (not permanently removed)

---

### US-PROD-02 — Manage Product Variants
> **As an** Admin or Internal User,  
> **I want to** add variants to a product (e.g., size, tier, region),  
> **so that** a single product can support multiple configurations.

**Acceptance Criteria:**
- [ ] Variants can be added to any product from the product detail page
- [ ] Each variant has: Variant Name, SKU, Price Override (optional), Status
- [ ] A product can have multiple active variants simultaneously
- [ ] Deleting a variant that is referenced by an active plan is blocked with an error message
- [ ] Variants are listed in a sortable table within the product detail page

---

### US-PROD-03 — Browse Products (Portal)
> **As a** Portal User,  
> **I want to** browse available products and their plans,  
> **so that** I can choose the right subscription for my needs.

**Acceptance Criteria:**
- [ ] Only products with status Active and at least one Active plan are displayed
- [ ] Products display name, description, and available plan pricing
- [ ] Clicking a product shows its detail page with all plan options
- [ ] A "Subscribe" button on each plan initiates the subscription flow

---

## 🔄 Module 4: Recurring Plans

### US-PLAN-01 — Create Recurring Plan
> **As an** Admin or Internal User,  
> **I want to** create a recurring billing plan linked to a product,  
> **so that** customers can subscribe to it on a defined billing schedule.

**Acceptance Criteria:**
- [ ] Plan form fields: Plan Name, Linked Product, Price, Currency, Billing Interval (Daily / Weekly / Monthly / Quarterly / Annually), Trial Period (days, optional), Status
- [ ] Price must be a positive number; currency must be selected from a configured list
- [ ] Trial period defaults to 0 (no trial) if not specified
- [ ] Plan cannot be linked to an Inactive product
- [ ] On save, plan status is Active by default; can be set to Draft or Archived
- [ ] Archived plans remain visible on existing subscriptions but cannot be selected for new ones

---

### US-PLAN-02 — Edit / Archive Plan
> **As an** Admin,  
> **I want to** edit plan details or archive a plan,  
> **so that** outdated plans are phased out without breaking existing subscriptions.

**Acceptance Criteria:**
- [ ] Price, interval, and trial period can be edited; changes apply only to **new** subscriptions
- [ ] Existing active subscriptions continue on the plan terms they were created with
- [ ] Archiving a plan sets status = Archived and removes it from the new subscription form
- [ ] Admin sees a warning confirmation before archiving: *"This will prevent new subscriptions on this plan."*
- [ ] An Archived plan cannot be directly deleted if active subscriptions reference it

---

## 📋 Module 5: Subscriptions

> **Status Flow:** `Draft → Quotation → Confirmed → Active → Closed`

### US-SUB-01 — Create Subscription (Draft)
> **As an** Internal User,  
> **I want to** create a subscription in Draft status,  
> **so that** I can prepare a subscription before formally presenting it to a customer.

**Acceptance Criteria:**
- [ ] Subscription form: Select Customer (Portal User), Select Plan, Start Date, Quantity, Discount (optional), Notes
- [ ] On create, subscription status is set to `Draft`
- [ ] Draft subscriptions are not visible on the customer's portal
- [ ] All fields except Notes are required
- [ ] Draft subscriptions can be edited freely before advancing to Quotation

---

### US-SUB-02 — Advance to Quotation
> **As an** Internal User,  
> **I want to** convert a Draft subscription into a Quotation,  
> **so that** I can send it to the customer for review and approval.

**Acceptance Criteria:**
- [ ] "Send Quotation" button is visible on any Draft subscription
- [ ] On action, status changes from `Draft` → `Quotation`
- [ ] Customer (Portal User) receives an email with a link to review the quotation in their portal
- [ ] Quotation shows: plan details, pricing breakdown, applied discount, applicable taxes, total amount
- [ ] Portal User can Accept or Decline the quotation from their portal

---

### US-SUB-03 — Confirm Subscription
> **As an** Internal User or Admin,  
> **I want to** confirm a quotation that the customer has accepted,  
> **so that** the subscription is locked in and ready to activate.

**Acceptance Criteria:**
- [ ] Status changes from `Quotation` → `Confirmed`
- [ ] Confirmed subscriptions can no longer have their plan or pricing edited
- [ ] An invoice in `Draft` status is **auto-generated** upon confirmation (see Invoice module)
- [ ] Customer receives a confirmation email notification
- [ ] Internal User can add a confirmation note

---

### US-SUB-04 — Activate Subscription
> **As an** Admin or Internal User,  
> **I want to** activate a confirmed subscription after payment is received,  
> **so that** the customer gains access to the subscribed service.

**Acceptance Criteria:**
- [ ] Status changes from `Confirmed` → `Active`
- [ ] Activation is only allowed when the linked invoice status is `Paid` OR if a trial period is configured
- [ ] Trial subscriptions activate immediately and auto-convert to billing at trial end
- [ ] Activation date is recorded and used as the billing cycle anchor
- [ ] Customer receives an "Your subscription is now active" email

---

### US-SUB-05 — Close Subscription
> **As an** Admin,  
> **I want to** close an active subscription,  
> **so that** the customer no longer has access and no further invoices are generated.

**Acceptance Criteria:**
- [ ] Status changes from `Active` → `Closed`
- [ ] Admin must select a close reason: Customer Request / Non-payment / Plan Discontinued / Other
- [ ] Closing is effective immediately or at end of current billing cycle (Admin selects)
- [ ] No new invoices are generated after the close date
- [ ] Customer receives a cancellation confirmation email with the effective close date
- [ ] Closed subscriptions are visible in history but are read-only

---

### US-SUB-06 — Upgrade / Downgrade Plan
> **As a** Portal User,  
> **I want to** upgrade or downgrade my subscription plan,  
> **so that** my plan matches my current usage needs.

**Acceptance Criteria:**
- [ ] Portal User can select an alternative plan on the same product from My Subscriptions
- [ ] Plan change takes effect at the start of the next billing cycle (no mid-cycle changes)
- [ ] Proration is calculated and shown before confirmation if a mid-cycle change option is enabled by Admin
- [ ] A new invoice is generated if an upgrade triggers an immediate charge
- [ ] Customer receives an email confirming the plan change and effective date

---

### US-SUB-07 — View Subscription History
> **As an** Admin or Internal User,  
> **I want to** view the full status history of a subscription,  
> **so that** I can audit all changes and transitions.

**Acceptance Criteria:**
- [ ] A timeline/log on the subscription detail page shows each status change with: timestamp, previous status, new status, and actor (who made the change)
- [ ] Status change reasons (if provided) are displayed
- [ ] Log is immutable — no edits or deletions allowed

---

## 📝 Module 6: Quotation Templates

### US-QT-01 — Create Quotation Template
> **As an** Admin or Internal User,  
> **I want to** create reusable quotation templates,  
> **so that** I can quickly generate professional quotations without building them from scratch each time.

**Acceptance Criteria:**
- [ ] Template fields: Template Name, Header Text, Footer Text, Terms & Conditions, Default Validity Period (days), Logo/Branding
- [ ] Templates support dynamic placeholders: `{{customer_name}}`, `{{plan_name}}`, `{{total_amount}}`, `{{valid_until}}`
- [ ] A preview of the rendered template is available before saving
- [ ] Templates are saved with an Active/Inactive status
- [ ] Only Active templates appear in the quotation creation flow

---

### US-QT-02 — Apply Template to Quotation
> **As an** Internal User,  
> **I want to** apply a template when converting a Draft subscription to a Quotation,  
> **so that** the customer receives a consistently branded quotation document.

**Acceptance Criteria:**
- [ ] A template selector dropdown appears when clicking "Send Quotation"
- [ ] If only one Active template exists, it is pre-selected
- [ ] Selected template pre-fills the quotation email body and PDF layout
- [ ] Internal User can override any template field before sending
- [ ] The generated quotation PDF is attached to the email and saved on the subscription record

---

### US-QT-03 — Customer Reviews Quotation
> **As a** Portal User,  
> **I want to** review my quotation online and accept or decline it,  
> **so that** I don't have to reply via email to confirm my subscription intent.

**Acceptance Criteria:**
- [ ] Quotation link in the email opens a read-only, branded quotation page in the portal
- [ ] Page shows: plan details, pricing breakdown, discounts, taxes, grand total, validity expiry date
- [ ] Two clearly labelled action buttons: **Accept Quotation** and **Decline Quotation**
- [ ] Accepting triggers Internal User notification and subscription moves to `Confirmed`
- [ ] Declining requires the Portal User to optionally provide a reason; triggers Internal User notification
- [ ] Expired quotations (past validity period) show an *"This quotation has expired"* message and both buttons are disabled

---

## 🧾 Module 7: Invoices

> **Status Flow:** `Draft → Confirmed → Paid`

### US-INV-01 — Auto-Generate Invoice from Subscription
> **As the** system,  
> **I want to** automatically generate a Draft invoice when a subscription is confirmed,  
> **so that** billing is initiated without manual effort from the finance team.

**Acceptance Criteria:**
- [ ] A `Draft` invoice is auto-created immediately when a subscription moves to `Confirmed`
- [ ] Invoice includes: invoice number (sequential, unique), customer details, subscription plan, billing period, line items, applied discounts, applicable taxes, subtotal, and grand total
- [ ] Invoice is linked to both the subscription and the customer
- [ ] Auto-generated invoices are visible to Admin and Internal Users, not yet to Portal Users

---

### US-INV-02 — Confirm Invoice
> **As an** Admin or Internal User,  
> **I want to** review and confirm a Draft invoice,  
> **so that** it becomes a finalized bill that can be sent to the customer.

**Acceptance Criteria:**
- [ ] Internal User reviews all invoice line items, taxes, and discounts before confirming
- [ ] Status changes from `Draft` → `Confirmed`
- [ ] Confirmed invoice is locked — no edits allowed (a credit note must be issued for corrections)
- [ ] Customer (Portal User) can now view the confirmed invoice in their portal
- [ ] System sends an invoice email to the customer with PDF attachment and payment link
- [ ] Invoice due date is set based on the configured payment terms (e.g., Net 30)

---

### US-INV-03 — Mark Invoice as Paid
> **As an** Admin or Internal User,  
> **I want to** mark a confirmed invoice as paid after receiving payment,  
> **so that** the financial record is accurate and the subscription can be activated.

**Acceptance Criteria:**
- [ ] "Record Payment" button appears on any `Confirmed` invoice
- [ ] Payment form: Payment Date, Amount, Payment Method (Bank Transfer / Card / Cash / Other), Reference/Transaction ID
- [ ] Amount must match the invoice total; partial payments are flagged with a warning (and tracked separately if enabled)
- [ ] On full payment, invoice status changes to `Paid`
- [ ] The linked subscription's activation becomes unblocked (if waiting for payment)
- [ ] Customer receives a payment confirmation receipt email

---

### US-INV-04 — Download Invoice PDF
> **As a** Portal User, Admin, or Internal User,  
> **I want to** download an invoice as a PDF,  
> **so that** I have an official record for accounting purposes.

**Acceptance Criteria:**
- [ ] Download button is present on any `Confirmed` or `Paid` invoice
- [ ] PDF includes: company logo, invoice number, billing address, itemized breakdown, taxes, total, and payment status
- [ ] PDF filename format: `INV-{number}-{customer_name}.pdf`
- [ ] PDF is generated on-demand (not pre-stored) to ensure it reflects current data
- [ ] Portal Users can only download their own invoices

---

### US-INV-05 — Manual Invoice Creation
> **As an** Admin or Internal User,  
> **I want to** manually create an invoice outside of the subscription flow,  
> **so that** I can bill for one-time charges or custom arrangements.

**Acceptance Criteria:**
- [ ] Manual invoices can be created from the Invoices list page (not linked to a subscription)
- [ ] Required fields: Customer, Items (description, quantity, unit price), Due Date
- [ ] Optional: apply a discount and/or tax rule
- [ ] Manual invoices follow the same `Draft → Confirmed → Paid` flow
- [ ] Manual invoices are clearly tagged as "Manual" in the invoice list

---

## 💳 Module 8: Payments

### US-PAY-01 — Process Online Payment
> **As a** Portal User,  
> **I want to** pay my invoice online using a credit/debit card,  
> **so that** I can settle my bill quickly without manual bank transfers.

**Acceptance Criteria:**
- [ ] "Pay Now" button is visible on any Confirmed invoice in the portal
- [ ] User is directed to a secure Stripe-powered payment form
- [ ] Card details are never stored on the SMS server (tokenized via Stripe)
- [ ] On successful payment, invoice status updates to `Paid` automatically via webhook
- [ ] On payment failure, user sees a clear error message and can retry
- [ ] A payment receipt is emailed immediately upon success

---

### US-PAY-02 — Save Payment Method
> **As a** Portal User,  
> **I want to** save my payment method for future billing cycles,  
> **so that** renewals are processed automatically without re-entering my card details.

**Acceptance Criteria:**
- [ ] During or after first payment, Portal User is offered "Save card for future payments"
- [ ] Saved card shows only last 4 digits, card type, and expiry in the portal (full details never shown)
- [ ] User can delete a saved payment method at any time
- [ ] If a saved card is used for auto-renewal and fails, customer receives an email to update their payment method
- [ ] Admin can see whether a customer has a saved payment method (no card details shown)

---

### US-PAY-03 — Process Refund
> **As an** Admin,  
> **I want to** issue a full or partial refund on a paid invoice,  
> **so that** a customer can be compensated for a billing error or returned service.

**Acceptance Criteria:**
- [ ] Refund option is available on any `Paid` invoice
- [ ] Admin selects: Full Refund or Partial Refund (enters amount)
- [ ] Partial refund amount cannot exceed the original paid amount
- [ ] Refund reason is required
- [ ] Refund is processed via the original payment method (Stripe refund API)
- [ ] Invoice is updated to show refund amount and status changes to `Refunded` (full) or `Partially Refunded`
- [ ] Customer receives a refund confirmation email with estimated processing time (3–5 business days)

---

### US-PAY-04 — View Payment History
> **As an** Admin or Internal User,  
> **I want to** view a full list of all payment transactions,  
> **so that** I can reconcile payments and investigate disputes.

**Acceptance Criteria:**
- [ ] Payment list shows: Transaction ID, Customer, Invoice #, Amount, Payment Method, Status, Date
- [ ] Filters available: Date Range, Status (Successful / Failed / Refunded), Payment Method
- [ ] Clicking a transaction shows the full detail and links to associated invoice
- [ ] Export to CSV is available for the filtered view
- [ ] Portal Users can view only their own payment history in their portal

---

## 🏷️ Module 9: Discounts

> **Rule:** Only Admin can create, edit, or deactivate discounts.

### US-DISC-01 — Create Discount
> **As an** Admin,  
> **I want to** create discount codes with specific rules,  
> **so that** I can run promotions or offer negotiated pricing to specific customers.

**Acceptance Criteria:**
- [ ] Discount form: Code (unique, alphanumeric), Discount Type (Percentage / Fixed Amount), Value, Applicable Plans (All or specific), Max Uses (global), Max Uses Per Customer, Expiry Date (optional), Status (Active/Inactive)
- [ ] Percentage discounts must be between 1–100%
- [ ] Fixed discounts cannot exceed the plan price
- [ ] Discount code field auto-generates a random code or allows manual entry
- [ ] Internal Users can **view** discounts but **cannot create or edit** them
- [ ] Inactive or expired discounts cannot be applied to new subscriptions

---

### US-DISC-02 — Apply Discount to Subscription
> **As an** Internal User,  
> **I want to** apply an Admin-created discount code when creating a subscription,  
> **so that** the customer's pricing reflects approved promotions.

**Acceptance Criteria:**
- [ ] A "Discount Code" field is available on the subscription creation form
- [ ] On entry, system validates: code exists, is active, not expired, usage limit not reached, and applies to the selected plan
- [ ] If valid, discount is shown as a line item deduction in the pricing preview
- [ ] If invalid, a clear error explains why (e.g., *"Code expired"*, *"Code not applicable to this plan"*)
- [ ] Discount is locked in once the subscription is Confirmed and cannot be changed

---

### US-DISC-03 — Customer Applies Discount at Self-Service
> **As a** Portal User,  
> **I want to** enter a discount/promo code when subscribing,  
> **so that** I can take advantage of promotional pricing.

**Acceptance Criteria:**
- [ ] Promo code field is present on the self-service subscription/checkout page
- [ ] Validation and error behavior mirrors US-DISC-02
- [ ] Applied discount clearly shown in the order summary before payment
- [ ] Portal User cannot view the list of all available discount codes (code must be known)

---

## 🧮 Module 10: Tax Management

### US-TAX-01 — Configure Tax Rules
> **As an** Admin,  
> **I want to** configure tax rules by region and tax type,  
> **so that** the correct tax is automatically applied to all invoices.

**Acceptance Criteria:**
- [ ] Tax rule form: Tax Name, Tax Type (GST / VAT / Sales Tax / Custom), Rate (%), Applicable Region (Country / State), Status (Active/Inactive)
- [ ] Multiple tax rules can be active simultaneously
- [ ] A region can have multiple stacked taxes (e.g., State Tax + Federal Tax)
- [ ] Tax rules cannot be deleted if referenced by historical invoices (can only be deactivated)
- [ ] Admin can mark specific customers as Tax Exempt; system skips tax calculation for them

---

### US-TAX-02 — Auto-Apply Tax to Invoice
> **As the** system,  
> **I want to** automatically calculate and apply the correct tax rules to each invoice,  
> **so that** all invoices are tax-compliant without manual calculation.

**Acceptance Criteria:**
- [ ] On invoice generation, the customer's billing region is used to determine applicable tax rules
- [ ] All applicable active tax rules are applied and listed as individual line items on the invoice
- [ ] Tax-exempt customers have $0 tax applied and an exemption note appears on the invoice
- [ ] Tax amounts are recalculated if a discount is applied (tax is calculated on the post-discount amount)
- [ ] Invoice clearly shows: Subtotal, Discount, Each Tax Amount, Grand Total

---

### US-TAX-03 — View Tax Report
> **As an** Admin,  
> **I want to** see a report of all taxes collected in a period,  
> **so that** I can file accurate tax returns with the relevant authorities.

**Acceptance Criteria:**
- [ ] Tax report shows: Tax Name, Rate, Taxable Amount, Tax Collected, for each rule in the selected period
- [ ] Filterable by: Date Range, Tax Type, Region
- [ ] Totals row at bottom of the report
- [ ] Export to CSV and PDF available
- [ ] Report only includes taxes from `Paid` invoices (not Draft or Confirmed)

---

## 👥 Module 11: Users & Contacts

### US-USER-01 — Admin Creates Internal User
> **As an** Admin,  
> **I want to** create Internal User accounts and assign them a role,  
> **so that** staff members can access the system with permissions appropriate to their job.

**Acceptance Criteria:**
- [ ] Admin can create accounts with role = Internal User
- [ ] Fields: Full Name, Email, Job Title, Department, Role Permissions (view-only / edit / full)
- [ ] New Internal User receives a welcome email with a set-password link (expires 24h)
- [ ] Admin can deactivate an Internal User; deactivated users cannot log in
- [ ] Admin cannot delete Internal Users who have historical activity (only deactivate)
- [ ] Only Admin sees the "Create User" and "Manage Users" pages

---

### US-USER-02 — Manage Customer / Contact Profile
> **As an** Admin or Internal User,  
> **I want to** create and manage customer (Portal User) profiles,  
> **so that** accurate contact and billing information is associated with subscriptions.

**Acceptance Criteria:**
- [ ] Customer profile fields: Full Name, Company Name (optional), Email, Phone, Billing Address, Tax ID/VAT Number, Currency Preference, Tax Exempt status
- [ ] Email must be unique across all user types
- [ ] Customers created by Internal Users receive an invite to set up their portal password
- [ ] Customer profile is linked to all their subscriptions, invoices, and payments
- [ ] Internal User can add internal notes to a customer profile (not visible to Portal User)

---

### US-USER-03 — Portal User Manages Own Profile
> **As a** Portal User,  
> **I want to** update my profile and contact details,  
> **so that** my billing and communication information stays current.

**Acceptance Criteria:**
- [ ] Portal User can edit: Full Name, Phone, Billing Address
- [ ] Email change requires re-verification (new email receives a verify link)
- [ ] Portal User cannot change their own role or Tax Exempt status (Admin only)
- [ ] All profile changes are logged with a timestamp in the audit trail

---

### US-USER-04 — Admin Manages User Access
> **As an** Admin,  
> **I want to** activate, deactivate, or reset passwords for any user,  
> **so that** I maintain full control over who can access the system.

**Acceptance Criteria:**
- [ ] Admin can deactivate any Internal User or Portal User
- [ ] Deactivated users see an *"Account suspended. Contact support."* message on login
- [ ] Admin can trigger a password reset email for any user
- [ ] Admin cannot deactivate their own account (at least one Admin must remain active)
- [ ] All deactivations and reactivations are logged in the audit trail

---

## 📊 Module 12: Reports & Analytics

### US-REP-01 — Revenue Reports (MRR / ARR)
> **As an** Admin or Internal User,  
> **I want to** view Monthly Recurring Revenue (MRR) and Annual Recurring Revenue (ARR) metrics,  
> **so that** I can track the financial growth of the subscription business.

**Acceptance Criteria:**
- [ ] MRR is calculated as: sum of all active subscription monthly-equivalent values
- [ ] ARR = MRR × 12
- [ ] Line chart shows MRR trend over the last 12 months (or custom date range)
- [ ] Breakdown shows: New MRR (new subscriptions), Expansion MRR (upgrades), Contraction MRR (downgrades), Churned MRR (cancellations), Net MRR
- [ ] Values exclude Draft and Quotation subscriptions
- [ ] Export results as CSV

---

### US-REP-02 — Subscription Reports
> **As an** Admin or Internal User,  
> **I want to** view a full report of all subscriptions segmented by status and plan,  
> **so that** I can understand the composition of my subscriber base.

**Acceptance Criteria:**
- [ ] Filterable by: Status, Plan, Date Range (start date), Customer
- [ ] Report shows: Subscription ID, Customer, Plan, Status, Start Date, Renewal Date, Monthly Value
- [ ] Summary row shows totals and counts by status
- [ ] Visual breakdown chart (bar or pie) of subscriptions by status
- [ ] Export to CSV and PDF

---

### US-REP-03 — Churn Analysis
> **As an** Admin,  
> **I want to** see a churn rate report for any time period,  
> **so that** I can identify trends in customer cancellations and take proactive action.

**Acceptance Criteria:**
- [ ] Churn Rate = (Subscriptions Closed in period / Active subscriptions at start of period) × 100
- [ ] Report shows: period, subscriptions active at start, churned count, churn rate %
- [ ] A list of churned subscriptions is shown with the cancellation reason (if provided)
- [ ] Month-over-month churn trend chart
- [ ] Export to CSV

---

### US-REP-04 — Invoice & Payment Reports
> **As an** Admin or Internal User,  
> **I want to** view a report of invoices and collected payments in a period,  
> **so that** I can reconcile accounts receivable.

**Acceptance Criteria:**
- [ ] Filterable by: Date Range, Status (Draft / Confirmed / Paid / Overdue), Customer
- [ ] Shows: Invoice #, Customer, Amount, Tax, Discount, Total, Status, Due Date, Paid Date
- [ ] Overdue invoices (Confirmed but past due date) are highlighted in red
- [ ] Summary cards: Total Invoiced, Total Collected, Total Outstanding, Total Overdue
- [ ] Export to CSV and PDF

---

### US-REP-05 — Discount Usage Report
> **As an** Admin,  
> **I want to** see how discount codes are being used,  
> **so that** I can measure the effectiveness of promotions.

**Acceptance Criteria:**
- [ ] Report shows per discount code: Total Uses, Total Revenue Discounted, Active Subscriptions Using It, Remaining Uses (if limit set)
- [ ] Filterable by: Date Range, Discount Code, Plan
- [ ] Highlights codes nearing their usage limit or expiry
- [ ] Export to CSV

---

## 🔒 Enforcement Rules Summary

| Rule | Enforced In |
|---|---|
| Only Admin can create Internal Users | US-AUTH-02, US-USER-01 |
| Only Admin can create/edit Discounts | US-DISC-01 |
| Subscription must follow `Draft→Quotation→Confirmed→Active→Closed` | US-SUB-01 through US-SUB-05 |
| Invoices auto-generate on subscription confirmation | US-SUB-03, US-INV-01 |
| Invoice activation requires payment (or trial) | US-SUB-04 |
| Confirmed invoices are immutable (credit notes for edits) | US-INV-02 |
| Tax-exempt customers skip tax calculation | US-TAX-01, US-TAX-02 |
| Portal Users access only their own data | US-DASH-03, US-INV-04, US-PAY-04 |
| At least one Admin must remain active | US-USER-04 |

---

*End of User Stories Document — v1.0*
