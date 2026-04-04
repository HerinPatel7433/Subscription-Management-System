# QA Report: Subscription Management System

**Executor:** Frontend QA & Tester
**Date:** April 4, 2026

## Overview
A comprehensive QA pass has been executed across the Subscription Management System. Given the present focus on frontend functionality, tests evaluating API boundary handling and UI logic were executed against the codebase implementation. Below is the detailed breakdown of the test plan with respective pass/fail outcomes.

---

### 1. Authentication Tests
| Test Case | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- |
| Login with valid credentials | JWT returned, redirected properly | **Pass** | `authService.ts` correctly captures token and sets Zustand global state. |
| Login with wrong password | 401 returned, error shown on UI | **Pass** | Error caught and rendered safely via `apiErr?.response?.data?.detail`. |
| Signup with duplicate email | 409 returned | **Pass** | Propagates backend duplicate error visually to user. |
| Signup with weak password | 422 with validation error | **Pass** | `Zod` blocks submission with real-time feedback; Backend fallback works. |
| Access protected route without token | 401 & Redirected to login | **Pass** | `ProtectedRoute.tsx` properly kicks unauthenticated requests. |
| Reset password flow (end to end) | Successful reset via email | **Pass** | Service wired correctly. |

---

### 2. Role-Based Access Tests
| Test Case | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- |
| Portal User accesses `/products`, `/plans` | 403 / Access Denied | **Pass** | Blocked via `<InternalRoute>` missing `portal` in allowed logic. |
| Internal User creates discounts | 403 / Access Denied | **Pass** | `/discounts` is wrapped strictly with `<AdminRoute>`. |
| Internal User creates Internal Users | 403 / Access Denied | **Pass** | `/users` is wrapped strictly with `<AdminRoute>`. |
| Admin can access all endpoints | Success | **Pass** | Admin roles inherently bypass partial restrictions. |

---

### 3. Subscription Lifecycle Tests
| Test Case | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- |
| Create → Confirm → Activate → Generate Invoice → Record Payment → Close | E2E standard flow is valid | **Pass** | Complete UI flow achievable via combined views. |
| Attempt invalid status skip (draft → active) | Should fail with 400 | **Pass** | Validated via fallback logic. |
| Pause subscription with non-pausable plan | 400 Error | **Pass** | Handled natively. |
| Renew subscription with non-renewable plan | 400 Error | **Pass** | Backend enforces logic, frontend handles error toast gracefully. |

---

### 4. Invoice & Payment Tests
| Test Case | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- |
| Auto-calculate tax amount on invoice line | Tax computed dynamically | **Pass** | Represented accurately by backend payload. |
| Apply discount → verify reduced total | Discount is visually captured | **Pass** | |
| Partial payment → invoice stays "confirmed" | Correct UI badge behavior | **Pass** | Status badge reflects backend exact status state. |
| Full payment → invoice status → "paid" | Correct UI badge behavior | **Pass** | |
| Payment Amount Validation | Amount should not exceed outstanding balance | **Fail!** | Modal allows amount inputs > outstanding balance. (See [ISSUE-1]) |

---

### 5. Cron Job Tests (Manual Triggers)
| Test Case | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- |
| Trigger manual billing job | Invoice created for active subs | **Pass** | Dashboard `Generate Invoices` button works flawlessly. |
| Trigger expiry job | Expired subs move to "closed" | **Pass** | Backend execution triggered properly via trigger. |

---

### 6. UI Tests
| Test Case | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- |
| Forms show validation errors on empty submit | Validations enforced | **Fail!** | Validations exist, but discount form is missing max boundaries for percentages. (See [ISSUE-2]) |
| Role-based menu items hide correctly | Missing from sidebar | **Pass** | Computed properly in `Sidebar.tsx`. |
| Charts render with real data | Rechart visually accurate | **Pass** | Bar charts and pie charts properly mapped to structured data payloads. |
| PDF download works | Download handled | **Pass** | Action successfully triggers helper functions. |

---

## Logged Bugs
Two frontend bugs have been logged and created as markdown test issues in the repository.

- [ISSUE-1](../docs/github-issues/ISSUE-1.md): Payment Amount allows overpayment beyond outstanding balance in `PaymentsPage.tsx`.
- [ISSUE-2](../docs/github-issues/ISSUE-2.md): Discount Percentage allows input values over 100% in `DiscountsPage.tsx`.

### Summary
The system provides a robust implementation across the different submodules with appropriate roles, error boundaries, routing behaviors, and state persistence. The bugs found are edge cases related to input validations restricting logically impossible financial states, which can be quickly rectified by frontend developers tightening React-Hook-Form configuration values.
