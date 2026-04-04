# [BUG] Payment Amount allows overpayment beyond outstanding balance

## Labels
`bug`, `frontend`, `payments`

## Module
Payments (`/payments`) -> `PaymentsPage.tsx`

## Steps to Reproduce
1. Log in as an Admin.
2. Navigate to the Payments page (`/payments`).
3. Click "Record Payment" to open the modal.
4. Select an invoice with a known outstanding balance (e.g., $1,000).
5. Enter an amount greater than the outstanding balance (e.g., $5,000) into the Amount field.
6. Submit the form.

## Expected Behavior
The system should trigger a frontend validation error preventing the user from entering an amount greater than the outstanding balance shown in the UI.

## Actual Behavior
The form allows the user to record any amount greater than `0.01`, as the validation for the upper boundary (`max: outstanding_balance`) is missing. 

## Technical Details
In `src/pages/PaymentsPage.tsx`, the `amount` field only relies on `{ required: 'Required', min: { value: 0.01, message: 'Must be > 0' } }`. The `getInvoiceBalance` data exists (`outstanding` state) but is not used in the form validation schema.

## Assign To
@frontend-dev
