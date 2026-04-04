---
title: "Missing User Management Capabilities (UI and Backend)"
labels: ["bug", "backend", "frontend", "high-priority"]
---

# Issue: Missing User Management Capabilities

## Description
During the QA pass, we discovered that the "Users" section required to manage the Internal employees and other Administrative users is absent. The sidebar UI provides a "Users" link only for Admins, but clicking this behaves improperly. Additionally, the backend completely lacks a user creation route outside of the public "self-signup" mechanism. 

## Steps to Reproduce
1. Log in to the application as an `admin`.
2. Observe the Sidebar menu containing the "Users" link. 
3. Click on the "Users" link.
4. **Result:** The application fails to display a Users list, instead navigating off-course to a catch-all URL redirect (often leading to a sudden logout or homepage loop because `App.tsx` lacks `<Route path="/users" />`). 
5. Separately, check the `backend` routes available in `server/src/routes/user.routes.js` and `auth.routes.js`. 
6. **Result:** There is no endpoint (e.g. `POST /api/users`) to facilitate user role creation whatsoever.

## Expected Behavior
- The backend should have a `POST /api/users` REST resource strictly locked down with `checkRole(['admin'])` allowing the Admin role to manually insert `internal` or `admin` designated users explicitly.
- The React application should have a `src/pages/UsersPage.tsx` interface and `<Route path="/users" ... />` integration in `App.tsx` displaying the `User` accounts available, complete with a Modal to facilitate creation. 
- The QA Test Plan explicitly expects the assertion: **Internal User cannot create Internal Users → 403**. Currently, this test is blocked due to the missing functionality entirely. 

## Technical Details
- **Affected Route (Frontend):** `App.tsx` Route mapping. 
- **Affected Route (Backend):** `server/src/routes/user.routes.js`.
- **Blocked Test:** "Role-Based Access Tests". 

## Suggested Fix
1. Create `createUser` controller function in backend and expose `POST /api/users` endpoint behind `verifyToken, checkRole('admin')`.
2. Add a `UsersPage.tsx` using similar template structures to `PlansPage.tsx` containing an Admin-privileged "New User" modal that captures `{ name, email, password, role }` parameters.
3. Apply structural routes in `App.tsx`.
