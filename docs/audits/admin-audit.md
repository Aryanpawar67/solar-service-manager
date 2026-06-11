# Admin Role — Audit Report

_Audited: 2026-06-11_
_Scope: all 13 admin screens + 8 API route files_

---

## Summary

The admin role is broadly functional — auth, CRUD for customers, staff, jobs, and basic analytics all connect end-to-end. However there are **two critical bugs** that break production correctness: (1) the "Create Staff" button in `staff.tsx` calls the wrong API endpoint (`/api/staff` via the generated `useCreateStaff` hook, which only stores a staff row with no login credentials), while the correct endpoint is `/api/admin/create-staff` — this path is already implemented manually in the same file with a raw `fetch`, but the `useCreateStaff` import is dead code and can mislead maintainers; (2) the `POST /api/services` route contains unreachable code — the SMS/push notification block after `return res.status(201).json(service)` at line 218 can never execute, so new job creation silently never notifies customers. Beyond these, there are several **medium-severity** issues: a field name mismatch in analytics (`unreadContacts` vs `newContactsUnread`), the "Pause Job" button sends `"pending"` through a typed path that suppresses TypeScript errors via `as any`, the "Cancelled" job filter is absent from the Jobs screen despite `cancelled` being a valid DB status, the export button on Analytics is a UI dead-end, customer service filtering is client-side only with no "View All" pagination, and the `customers/_layout.tsx` applies a dark-green header default that child screens partially override creating a visual flash. Overall the codebase is ~60% production-ready for the admin role.

---

## Screen-by-Screen Audit

### Admin Tabs Layout (`apps/staff-app/app/(admin)/_layout.tsx`)
**Status:** 🟢 Working

**Issues:**
- Line 101: `staff` tab is hidden via `href: null` which is correct, but it is still registered as a tab and will show in the tab bar's internal state. On some Expo Router versions this can cause header title flickers when navigating to the `staff` screen via `router.push`.
- No `customers/create` or `customers/edit` are registered with `href: null`; these sub-screens live inside the `customers` Stack so that is fine, but it can confuse future developers.

**Suggested Fixes:**
- No urgent changes needed; annotate with a comment explaining the `href: null` pattern for hidden screens.

---

### Analytics Screen (`apps/staff-app/app/(admin)/analytics.tsx`)
**Status:** 🟡 Partial

**Issues:**
- Line 23: The screen reads `d?.unreadContacts` but the API at `analytics.ts:78` returns the key `newContactsUnread`. This means the "Unread Contacts" stat card always shows `0` regardless of the real value.
- Lines 43–55: The export button (download icon in the revenue card) has zero functionality — `onPress` is not attached to anything. It renders a pressable-looking icon with no handler.
- Lines 15–17: The `monthlyPct` calculation is `(monthly / total) * 100`, not a real MoM growth rate. It shows "monthly revenue as % of all-time revenue", which is a misleading label "this month". No month-ago comparison exists in the API so this cannot be fixed without a new API field.
- The `data` cast at line 14 (`as Record<string, number> | undefined`) discards `recentServices` and `recentPayments` returned by the API — those are fetched on every load but never rendered.

**Suggested Fixes:**
- Line 23: Change `d?.unreadContacts` to `d?.newContactsUnread`.
- Export button: Implement `onPress` calling the `/api/customers/export` CSV endpoint, or remove the icon until implemented.
- Document the `monthlyPct` as "share of total" or remove the badge until the API returns a real MoM delta.

---

### Create Job Screen (`apps/staff-app/app/(admin)/create-job.tsx`)
**Status:** 🟡 Partial

**Issues:**
- Line 40–42: Date validation uses a regex `^\d{4}-\d{2}-\d{2}$` and a raw text input. There is no native date picker, so the user must type the exact ISO format. This is UX-hostile and error-prone (e.g. `2026-13-99` passes the regex but is not a real date).
- Line 34: `useListStaff({ available: true })` — the generated `ListStaffParams` type does accept `available?: boolean` and the server accepts `available=true`, but the server filters `available === "true"` (string comparison, line 21 of staff.ts), while `available: true` will be serialised as the string `"true"` by the query builder — this is actually fine. No bug here, but the type is boolean while the comparison is string; document this.
- Line 209: `customersData?.data ?? []` — if the API returns 0 customers the list is empty but no "Add Customer first" CTA is presented inside the modal.
- Line 250: The "Unassigned" entry in the staff picker uses `id: 0` with `phone: ""`. When the phone field is rendered via `item.phone` at line 267, the empty string is passed to `<Text>` which is fine, but it could render an empty sub-line visually.
- The screen is accessible from the Jobs FAB but is hidden (`href: null`) from the tab bar — this is intentional and correct.

**Suggested Fixes:**
- Replace the text date input with a `DateTimePicker` component (from `@react-native-community/datetimepicker`) to prevent invalid date strings.
- Add a deep date validation (e.g. `new Date(scheduledDate).toString() !== "Invalid Date"`) in addition to the regex.
- Add an empty-state CTA in the customer modal when no customers exist.

---

### Customer Detail Screen (`apps/staff-app/app/(admin)/customers/[id].tsx`)
**Status:** 🟡 Partial

**Issues:**
- Line 70–75: The "Contact" button uses `mail-outline` icon but calls `Linking.openURL("tel:...")`, i.e., it dials the phone rather than emailing. The icon is wrong — should be `call-outline`.
- Line 170: "VIEW ALL RECORDS" shows an `Alert` with the count and does not navigate anywhere. This is a dead-end — no pagination or separate screen for full service history.
- Line 28: `useListServices({ customerId, limit: 20 })` — only the 20 most recent services are fetched. When a customer has more than 20 jobs, the "VIEW ALL RECORDS" button only shows `"Showing 20 most recent records"` which is misleading.
- Line 118: Filter button on service history shows `Alert("Filter", "Filter by status coming soon")` — this is permanently unimplemented UI.
- Line 30: Loading guard `!customer && !isError` is redundant since `isLoading` already covers that, but harmless.

**Suggested Fixes:**
- Fix icon: change `mail-outline` to `call-outline` on the Contact button (line 73).
- Replace the "VIEW ALL RECORDS" Alert with navigation to a filtered services list or increase the `limit` to 100 and paginate properly.
- Remove or implement the filter button.

---

### Customers Stack Layout (`apps/staff-app/app/(admin)/customers/_layout.tsx`)
**Status:** 🟡 Partial

**Issues:**
- Line 7: The default `headerStyle` sets `backgroundColor: "#00450d"` (dark green). However, the `[id].tsx`, `create.tsx`, and `edit.tsx` screens each override `headerStyle` to `{ backgroundColor: "#fff" }` via `Stack.Screen options`. This means on slow devices there will be a brief green-to-white flash on each of those screens before React renders the `Stack.Screen` override.
- `headerTintColor: "#fff"` in the layout will briefly render white back-arrow text on a white background (after the child screen sets its header white) on Android where the override is not immediate.

**Suggested Fixes:**
- Set the default `screenOptions` in `_layout.tsx` to the common white header style (`backgroundColor: "#fff"`, `headerTintColor: "#00450d"`) and let the `index.tsx` screen (the list) override to a different style if needed. This eliminates the flash.

---

### Create Customer Screen (`apps/staff-app/app/(admin)/customers/create.tsx`)
**Status:** 🟢 Working

**Issues:**
- Line 78: `installationDate` is a free-text field. The DB column is a `date` type; the API will fail if the user enters an invalid string. There is no format validation or date picker.
- Line 33: `solarCapacity` is parsed with `parseFloat` — if the user enters `"abc"` it becomes `NaN`, which will be sent to the API. The API uses `updateCustomerSchema` (Zod partial), and `real` columns accept JS numbers; `NaN` may silently insert `null` or cause a DB error depending on PostgreSQL driver behaviour.
- The `keyboard?: any` type on the `Field` helper (line 104) suppresses TypeScript checks on keyboard type values.

**Suggested Fixes:**
- Add `installationDate` format validation before submitting (same regex pattern as in create-job).
- Validate `solarCapacity` input is a real finite number (`Number.isFinite(parseFloat(v))`).
- Type the keyboard prop as `KeyboardTypeOptions` from `react-native`.

---

### Edit Customer Screen (`apps/staff-app/app/(admin)/customers/edit.tsx`)
**Status:** 🟢 Working

**Issues:**
- Line 63: If `isLoading` is true the screen renders a spinner, but if the customer fetch fails (404 or network error) `isLoading` becomes `false` and `customer` is `undefined` — the form renders with empty fields silently, with no error state shown to the user.
- Line 46: Same `parseFloat` + NaN risk as in `create.tsx` for `solarCapacity`.
- The `Field` helper has no placeholder text (unlike `create.tsx`) — on Android this can make text inputs look frozen.

**Suggested Fixes:**
- Add `isError` from `useGetCustomer` and render an `ErrorState` or redirect back if customer not found.
- Add `Number.isFinite` guard on `solarCapacity`.

---

### Customers List Screen (`apps/staff-app/app/(admin)/customers/index.tsx`)
**Status:** 🟡 Partial

**Issues:**
- Line 26–27: `useListCustomers({ search, limit: 50 })` fetches at most 50 customers. If there are 51+ customers the list is silently truncated with no pagination UI. The `data.total` count returned by the API is ignored.
- Lines 35–39: The "Active Solar" / "Pending Install" filter runs entirely client-side on the already-truncated 50 results. If customer #51 onwards are "Active Solar", they are never shown.
- Line 120: `ellipsis-vertical` icon is rendered on each card but has no `onPress` — looks like a context menu affordance but does nothing (dead-end UI).
- Line 129: `serviceCount` is cast via `(item as ... & { serviceCount?: number })` — this field is never returned by the `GET /api/customers` endpoint, so it will always be `"—"`. The API join for service count does not exist.

**Suggested Fixes:**
- Implement pagination (load more / infinite scroll) using `data.total` and `page` params.
- Move the "Active Solar" / "Pending Install" filters to server-side query params, or clearly document they are client-side.
- Either wire the `ellipsis-vertical` icon to a context menu (edit/delete) or remove it.
- Add `serviceCount` to the `GET /api/customers` response via a LEFT JOIN count, or remove the metric from the card UI.

---

### Edit Profile Screen (`apps/staff-app/app/(admin)/edit-profile.tsx`)
**Status:** 🟢 Working

**Issues:**
- Lines 42–60: Raw `fetch` is used instead of the `useGetMe` / api-client pattern. This is consistent with similar patterns in the codebase but means the React Query cache is not invalidated after profile save — `profile.tsx` may still show old name/email until a manual pull-to-refresh.
- Line 53: `await refetch()` is called after the save — this does re-fetch `/auth/me`, but the JWT token cached in SecureStore still contains the old `name`. The app will show the new name in the profile UI but the decoded token role check in `index.tsx` will use the old payload until the next login.
- The password change endpoint minimum is 8 characters (line 65: `newPwd.length < 8`) and the API also enforces 8 characters — this is consistent. However, the requirements note at line 172 only says "Minimum 8 characters" with no complexity rules.
- No email format validation before submission — any string is accepted as email.

**Suggested Fixes:**
- After successful profile save, invalidate the React Query cache key for `useGetMe` via `queryClient.invalidateQueries`.
- Add basic email format validation (`/^[^@]+@[^@]+\.[^@]+$/.test(email)`).

---

### Jobs Screen (`apps/staff-app/app/(admin)/jobs.tsx`)
**Status:** 🟡 Partial

**Issues:**
- Line 39: `useListServices({ limit: 200 })` fetches up to 200 jobs at once. The API caps at 100 (line 25 of services.ts: `Math.min(100, ...)`). So this silently returns a maximum of 100 jobs, and any jobs beyond that are invisible. The response includes `data.total` which is never checked.
- Line 26: `FILTERS` does not include "Cancelled". Cancelled jobs exist in the DB but are invisible to admins in this list — there is no way to view or manage them from this screen.
- Lines 49–57: Client-side filtering on the already-truncated 100-item list. If the 101st job matches a search query, it will never appear.
- Line 165: "Assign Technician" button label on pending jobs navigates to `/job/${item.id}` (the shared detail screen). This works, but the label implies a direct assignment action — the actual assignment happens inside the detail screen, not from this button directly.

**Suggested Fixes:**
- Fix `limit: 200` to `limit: 100` or better, implement server-side pagination with a "Load More" button.
- Add "Cancelled" to the `FILTERS` array and map it to `"cancelled"`.
- Pass `status` as a query parameter to the API instead of filtering client-side.

---

### Admin Profile Screen (`apps/staff-app/app/(admin)/profile.tsx`)
**Status:** 🟡 Partial

**Issues:**
- Line 81: "System Settings" card shows an `Alert` pointing to `greenvolt.in/admin` which is a fictional URL — dead-end.
- Line 94: "Role Permissions" card shows an `Alert` with static text. This is purely informational and not interactive.
- Line 37: `initials` computation splits on spaces — if `user.name` is a single word, `initials` will be just one character, which is fine. But if `user.name` is `undefined` the `?.split` returns `undefined`, the `.map` call never runs, and `"A"` fallback is used — this is handled correctly.
- No error state if `useGetMe` fails — `isLoading` check exists but `isError` is not handled; the screen silently renders with `"—"` placeholders.

**Suggested Fixes:**
- Either remove the "System Settings" and "Role Permissions" entries or implement real navigation targets.
- Add an `isError` check from `useGetMe` and show an `ErrorState` component.

---

### Staff Screen (`apps/staff-app/app/(admin)/staff.tsx`)
**Status:** 🔴 Broken (critical)

**Issues:**
- Line 5: `useCreateStaff` is imported from `@workspace/api-client-react` but is **never called**. The import is dead code.
- Line 52: Creating a staff member uses a raw `fetch` to `/api/admin/create-staff` (the correct endpoint that creates both `staff` and `users` rows). The generated `useCreateStaff` hook posts to `/api/staff` which only inserts a `staff` row with no login credentials — no password, no `users` table entry. If a developer ever switches to `useCreateStaff` (e.g. thinking the dead import is the intended path), newly "created" staff will have no way to log in.
- Line 47: Password minimum is `6` characters in the client check but the API (`/api/admin/create-staff`, index.ts line 83) also checks `< 6`. However, the `POST /api/auth/change-password` endpoint enforces `>= 8` characters. This means staff can be created with a 6-character password but cannot change it to a 7-character one (which would be rejected). This inconsistency confuses staff on first login.
- Line 73–78: Edit staff via `useUpdateStaff` only sends `name`, `phone`, `workArea` — the `role` field cannot be changed after creation through this UI. `fRole` is collected in the form but never sent in the edit path.
- Line 83–88: `toggleActive` uses `useUpdateStaff` which hits `PUT /api/staff/:id`. The staff route has no role guard — any authenticated user (including a regular staff member if they had a direct token) could deactivate other staff. The `requireRole("admin")` middleware is never applied to this route.
- The "ON LEAVE" label for `isActive: false` is misleading — it implies temporary absence, but toggling `isActive` in the DB means the staff member cannot log in or be assigned jobs.

**Suggested Fixes:**
- Remove the `useCreateStaff` import (line 5) to eliminate confusion.
- Standardise password minimum to 8 characters in both the client (line 47: change `< 6` to `< 8`) and `/api/admin/create-staff` (index.ts line 83).
- Add `role: fRole.trim()` to the `useUpdateStaff` payload in the edit path (line 73).
- Apply `requireRole("admin")` middleware to `PUT /api/staff/:id` and `DELETE /api/staff/:id` in `staff.ts`.

---

### Job Detail Screen (`apps/staff-app/app/job/[id].tsx`)
**Status:** 🟡 Partial

**Issues:**
- Line 338–342: "Pause Job" button calls `advanceStatus("pending" as any)`. The `advanceStatus` function's parameter is typed as `"in_progress" | "completed"`, so `"pending"` is coerced with `as any`. The API's `updateServiceSchema` is fully partial and accepts any valid `service_status` enum value including `"pending"`, so the API call itself works. However, using `as any` hides the fact that `advanceStatus` does not support reversing status — and the confirmation dialog says `Mark this job as "pending"?` which is confusing.
- Line 56: `useListStaff({ available: true })` fetches only currently-active staff for the reassign panel. If the job is already assigned to an inactive staff member, that staff member will not appear in the list — the current assignment shows "Current: [name]" but the name cannot be re-selected.
- Line 95: `file` is cast `as unknown as File` to satisfy the `uploadFile` function's native `File` type. On React Native there is no DOM `File` API — this relies on the server accepting a multipart form with the RN `{uri, name, type}` object format, which works with the current `multer` setup. This is fragile and platform-specific.
- Line 121: The PDF report URL passes the token as a query param (`?token=...`). `requireAuth` in the middleware accepts this (line 35). However, this exposes the JWT in server access logs and browser history. This is a documented trade-off for mobile deep linking.
- Line 283: Remarks save is only triggered when `remarksText !== null && remarksText !== (job.remarks ?? "")`. If the user clears all remarks to an empty string, `""` equals `(job.remarks ?? "")` only if `job.remarks` is also `null/undefined` — if `job.remarks` is `""` in the DB the save button will never appear, blocking the user from seeing changes are saved.
- The 4-step progress display maps `pending` → step 0, `in_progress` → step 2. Step 1 ("En Route") is visually displayed but has no corresponding DB status and cannot be set — this gap between visual and data model is undocumented.

**Suggested Fixes:**
- Extract a proper `revertStatus` function with its own type signature instead of `advanceStatus("pending" as any)`.
- In the Reassign panel, fetch all staff (not just `available: true`) so previously-assigned inactive staff can be seen.
- Guard the remarks save button by comparing with an explicit `remarksText !== ""` when `job.remarks` could be an empty string.

---

## API Route Issues

### `apps/api-server/src/routes/services.ts`
- **Critical — Unreachable notification code (lines 220–239):** The `POST /` handler returns at line 218 (`return res.status(201).json(service)`). All code from line 220 onwards (SMS notification, push notification) is unreachable dead code and never executes. New job creation therefore silently never notifies the customer. The notification block needs to be moved before the `return`, or refactored into a non-blocking async IIFE after the `res.json()` call (without `return`).
- Line 265: `parsed.data!.staffId !== before?.staffId` — uses non-null assertion on `parsed.data` which is safe because of the Zod parse above, but the `before` record could be `undefined` if the service ID doesn't exist (handled two lines later). No bug, but could be tightened.

### `apps/api-server/src/routes/staff.ts`
- **No role-based access control:** `POST /api/staff`, `PUT /api/staff/:id`, and `DELETE /api/staff/:id` are protected only by `requireAuth` (the global middleware) — any authenticated user including staff role can call these endpoints. Admin-only operations should use `requireRole("admin")`.
- `POST /api/staff` creates a staff row but no `users` table row (no login credentials). The correct endpoint for staff creation with login is `POST /api/admin/create-staff`. The generated API client's `useCreateStaff` points to this insecure route.

### `apps/api-server/src/routes/analytics.ts`
- **No role guard:** `GET /api/analytics/dashboard` is behind `requireAuth` but not `requireRole("admin")`. Any authenticated staff or customer user can fetch the full business analytics dashboard.
- The response key is `newContactsUnread` (line 78) but the frontend reads `unreadContacts` — causing the analytics card to always display 0.
- `recentServices` and `recentPayments` are fetched and returned but never rendered in the frontend analytics screen — wasted DB queries per page load.

### `apps/api-server/src/routes/customers.ts`
- **No role guard:** `PUT /api/customers/:id`, `DELETE /api/customers/:id`, and `GET /api/customers/export` have no `requireRole` guard. A staff-role user with a valid token could soft-delete or export all customer records.
- `GET /api/customers/export` (line 34) is not protected by role and is not surfaced anywhere in the admin UI — the export button in analytics has no `onPress` handler pointing here.

### `apps/api-server/src/routes/index.ts`
- Lines 34–40: `POST /customers` (public, no auth) and `POST /api/customers` (auth-protected, goes to `customersRouter`) are separate routes. The public route does not set `deletedAt`, `city`, etc. correctly — it uses `insertCustomerSchema` which requires `address` to be present — this is fine. But having two separate creation endpoints for the same resource is confusing and can lead to drift.
- `POST /api/admin/create-staff` enforces minimum 6 characters (line 83) while `POST /auth/change-password` enforces 8. These should be unified to 8.

### `apps/api-server/src/routes/upload.ts`
- Files are stored on local disk under `/uploads/`. There is no CDN, no S3 bucket. On a PaaS (e.g. Render free tier with ephemeral filesystem), uploaded images will be lost on every deploy/restart. Uploaded images embedded in PDF reports will also vanish.
- No file size upper limit in the Multer config is visible here — wait, there is: `fileSize: 10 * 1024 * 1024` (10 MB), which is fine. However, there is no limit on the total number of files or a cleanup job, so disk can fill up.

### `apps/api-server/src/middleware/requireAuth.ts`
- The `requireRole` helper (line 22) is defined but is not applied to any of the sensitive admin routes (`analytics`, `customers`, `staff`). The middleware exists but is simply not used.

### `apps/api-server/src/routes/notifications.ts`
- `POST /api/notifications/check-expiry` has no role guard and no rate limiting — any authenticated user can trigger the subscription expiry check and SMS blasting.

---

## Cross-Cutting Issues

- **Token staleness:** The JWT is issued with an 8-hour expiry (`auth.ts` line 40). Profile name updates (`/auth/update-profile`) update the database but do not re-issue a token. So the `name` embedded in the JWT (`req.user.name`) will be stale until the next login. Code that relies on `req.user.name` directly will show old names.
- **No pagination in most admin list screens:** Jobs, Customers, and Staff screens all fetch a fixed batch (100–200 items) with no "load more". The `total` count returned by the API is never displayed or used for pagination in any admin screen.
- **Client-side filtering after server-side truncation:** Jobs and Customers screens apply client-side filters (by status, by solarCapacity) on already-truncated server responses. This produces incorrect filter counts when there are more records than the fetch limit.
- **No delete/archive UI for customers or jobs:** The API supports soft-delete (`DELETE /api/customers/:id`, `DELETE /api/services/:id`) but neither is exposed in any admin screen. There is no way to remove a customer or cancel a job from the app.
- **No "Cancelled" status handling in most UI:** While the API and DB support `cancelled` as a service status (serviceStatusEnum), the Jobs list filter chips omit it, and `create-job.tsx` hardcodes only `"pending"` as the initial status with no way to create a cancelled service.
- **Inconsistent header colour flash:** `customers/_layout.tsx` sets a dark-green default header; child screens set a white header via `Stack.Screen`. On Android, the layout default renders first causing a visual flash.

---

## Priority Fix List

| Priority | Screen/Area | Issue | Fix |
|----------|-------------|-------|-----|
| P0 | `services.ts` (API) | `return` before notification code — SMS/push never fires on job creation | Move `return res.status(201).json(service)` to after async notification calls, or drop `return` and use `res.json()` + fire-and-forget |
| P0 | `staff.tsx` + `staff.ts` (API) | `useCreateStaff` (dead import) calls `/api/staff` creating credential-less staff; raw fetch to `/api/admin/create-staff` is the real path but is confusing | Remove the `useCreateStaff` import; document that `/api/admin/create-staff` is the only valid staff creation path |
| P0 | `analytics.tsx` | `unreadContacts` key mismatch — always shows 0 | Change line 23 to `d?.newContactsUnread ?? 0` |
| P1 | `staff.ts` (API) | No `requireRole("admin")` on `PUT /api/staff/:id` and `DELETE /api/staff/:id` | Add `requireRole("admin")` middleware to those routes |
| P1 | `analytics.ts` (API) | No `requireRole("admin")` on `/api/analytics/dashboard` | Add `requireRole("admin")` middleware |
| P1 | `customers.ts` (API) | No `requireRole("admin")` on `PUT`, `DELETE`, and `GET /export` | Add `requireRole("admin")` middleware |
| P1 | `staff.tsx` | Password minimum 6 chars on creation vs 8 chars on change — inconsistent | Standardise to 8 chars: update line 47 of `staff.tsx` and line 83 of `index.ts` |
| P1 | `staff.tsx` | `role` field not sent in edit mutation (line 73) | Add `role: fRole.trim()` to `useUpdateStaff` payload |
| P2 | `customers/[id].tsx` | "Contact" button icon shows mail but dials phone (line 73) | Change icon from `mail-outline` to `call-outline` |
| P2 | `jobs.tsx` | "Cancelled" filter tab missing; cancelled jobs invisible | Add `"Cancelled"` to `FILTERS` array |
| P2 | `jobs.tsx` | `limit: 200` silently capped at 100 by API; no pagination | Implement pagination or server-side status filter |
| P2 | `customers/index.tsx` | `serviceCount` always `"—"` — not returned by API | Add service count via LEFT JOIN in `GET /api/customers` or remove from UI |
| P2 | `analytics.tsx` | Export button has no `onPress` — dead-end UI | Wire to `/api/customers/export` or hide button |
| P2 | `customers/edit.tsx` | No error state when customer fetch fails | Add `isError` check and show `ErrorState` component |
| P3 | `job/[id].tsx` | "Pause Job" uses `as any` type coercion (line 338) | Refactor `advanceStatus` to accept all `service_status` enum values |
| P3 | `customers/_layout.tsx` | Dark-green default header causes flash on child screens | Set white default in layout; only override where green is needed |
| P3 | `profile.tsx` | "System Settings" and "Role Permissions" are permanent Alerts | Implement real screens or remove the entries |
| P3 | `upload.ts` (API) | Local disk storage; images lost on ephemeral PaaS deploys | Integrate S3/Cloudflare R2 for persistent storage |
| P3 | `notifications.ts` (API) | `POST /check-expiry` has no role guard | Add `requireRole("admin")` |
