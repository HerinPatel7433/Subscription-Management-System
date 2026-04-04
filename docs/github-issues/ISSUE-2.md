# [BUG] Discount Percentage allows values over 100%

## Labels
`bug`, `frontend`, `discounts`

## Module
Discounts (`/discounts`) -> `DiscountsPage.tsx`

## Steps to Reproduce
1. Log in as an Admin.
2. Navigate to the Discounts page (`/discounts`).
3. Click "Add Discount" to open the creation modal.
4. Set the Type to "Percentage (%)".
5. Enter a value greater than `100` (e.g., `150`) into the Percentage field.
6. Submit the form.

## Expected Behavior
The form should display a validation error stating that the maximum allowed percentage is 100%.

## Actual Behavior
The form accepts any number greater than 0, allowing an Admin to inadvertently create a 150% discount rule.

## Technical Details
In `src/pages/DiscountsPage.tsx`, the setup is as follows:
```typescript
{...register('value', { required: 'Required', min: { value: 0, message: 'Must be >= 0' } })}
```
There is no conditional branch adding a `max: { value: 100, message: 'Max 100%' }` constraint when `discountType === 'percent'`.

## Assign To
@frontend-dev
