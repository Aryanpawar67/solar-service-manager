# Staff Role — Audit Report

## Summary

The staff-facing app is structurally sound and aesthetically polished. The core job-management flow (list → detail → status advance → photo capture → remarks → PDF report) works end-to-end against the API. The most critical gap is the **push-token registration bug**: the root layout calls `useRegisterMyPushToken()`, which hits `/api/me/push-token` — a route protected by `requireRole("customer")` — so staff push tokens are **never registered**, meaning all in-app job-assignment push notifications silently fail for staff users. Beyond that, several screens have "dead-toggle" state (jobAssignment and reminders in Notifications), a hardcoded phone/region on the Profile screen, a missing auth guard on the services route (a race condition that produces blank screens), and the navigate button on the Jobs screen is a duplicate of "View Details" rather than launching maps. All the API routes themselves are functionally correct; the issues are primarily on the client side.

---

## Screen-by-Screen Audit

### Tab Layout (`apps/staff-app/app/(staff)/_layout.tsx`)

**Status:** 🟢 Working

**Issues:**
- Minor: The tab bar height is fixed at 64 (line 51) with no bottom safe-area inset adjustment. On iPhone devices with a Home Indicator the tab bar text/icon may overlap the system indicator.
- Minor: `tabBarActiveTintColor` and `tabBarInactiveTintColor` (lines 45-46) are set but `tabBarShowLabel: false` is also set (line 47), so those properties have no visible effect.

**Suggested Fixes:**
- Add `paddingBottom: Platform.OS === 'ios' ? 16 : 0` or use `useSafeAreaInsets` to offset the home indicator.
- Remove `tabBarActiveTintColor`/`tabBarInactiveTintColor` as they are no-ops when labels are hidden and custom icons are used.

---

### Jobs Screen (`apps/staff-app/app/(staff)/jobs.tsx`)

**Status:** 🟡 Partial

**Issues:**
1. **Navigate button is a dead-end (line 155-161):** The `navBtn` (navigate icon) calls `router.push(\`/job/${item.id}\`)` — identical to the primary button. It does not launch Google Maps / navigation for the job address. The icon (`navigate-outline`) strongly implies map navigation.
2. **No pagination (line 38-40):** `useListServices` is called without a `limit` parameter; the API defaults to 20 rows. A staff member with many jobs will see at most 20 with no way to load more.
3. **Loading race condition (line 42):** The loading guard is `meLoading || (isLoading && meData != null)`. If `meData` is null (first load) and `isLoading` is true, neither spinner nor error is shown, potentially rendering an empty list momentarily while `meData` is still fetching.
4. **`staffId == null` guard silently appears for unlinked accounts (lines 52-59):** Functionally correct, but if the API returns `staffId: 0` instead of `null`, the guard fails because `0 != null` is `true`. The API JWT payload sets `staffId: user.staffId ?? null` (auth.ts line 36), so this is safe currently, but fragile.
5. **"Cancelled" status not in filter chips (line 23):** The `FILTERS` array excludes "Cancelled". Cancelled jobs appear in the "All" filter but cannot be isolated.

**Suggested Fixes:**
- Make `navBtn` open `Linking.openURL(\`https://maps.google.com/?q=\${encodeURIComponent(item.customer?.address ?? "")}\`)` when address is available.
- Pass `limit: 100` (or implement pagination) to `useListServices`.
- Fix loading guard to `meLoading || isLoading` unconditionally.
- Add "Cancelled" to `FILTERS`.

---

### Notifications Screen (`apps/staff-app/app/(staff)/notifications.tsx`)

**Status:** 🟡 Partial

**Issues:**
1. **"Job Assignment Alerts" and "Job Reminders" toggles are local-only state (lines 11-12):** `jobAssignment` and `reminders` state variables are never persisted — not to the API, not to AsyncStorage. Toggling them has zero durable effect; they reset to `true` on every app launch.
2. **Wrong API endpoint comment (line 21):** The fetch calls `PUT /api/auth/notifications`. This route exists (auth.ts line 106) and only accepts `{ pushEnabled: boolean }`. The `jobAssignment` and `reminders` toggles have no server counterpart — the DB schema has no per-type preference columns.
3. **Missing auth token for push notification toggle (line 21):** The `getToken()` call is used correctly, but if the token is null (edge case: session expired mid-screen), the fetch silently succeeds with a 401 and the UI shows no error (the `catch` block only fires on network failure, not non-ok responses — line 23-25).
4. **No initial state loaded from server (line 13):** `pushEnabled` defaults to `true` regardless of the stored server value, so the UI may be out of sync with the DB.

**Suggested Fixes:**
- Either add `jobAssignment` and `reminders` fields to the `usersTable` schema and expose them via `PUT /api/auth/notifications`, or persist them in `AsyncStorage` with a clear "device-only" label.
- On mount, fetch current `pushEnabled` from `GET /api/auth/me` and initialize `pushEnabled` state from it.
- After the PUT fetch, check `!res.ok` and alert/revert (same as the existing revert on `catch`).

---

### Personal Details Screen (`apps/staff-app/app/(staff)/personal-details.tsx`)

**Status:** 🟡 Partial

**Issues:**
1. **`useGetStaff(staffId ?? 0)` fetches with id=0 when staffId is null (line 13):** The API will return a 404 for `GET /api/staff/0`, but the error is silently ignored because `staffLoading` and `staffData` just remain undefined. No error state is shown to the user.
2. **No error handling for `staffData` fetch failure:** If `useGetStaff` errors (network, 404 for unlinked account), the screen still renders with empty fields and the save button is active, which will silently fail.
3. **`useUpdateStaff` hits `PUT /api/staff/:id`** — this endpoint has no authentication requirement at the route level (staff.ts has no `requireRole` guard). Any authenticated user (including customers) can update any staff record by id if they know the ID. This is a **security gap** in the API.
4. **`workArea` and `role` are read from `staffData` (line 23/83)** but the staffData type from `GET /api/staff/:id` does not join `usersTable`. So `staffData.role` (line 83) refers to the staff-table `role` field (e.g., "Technician"), not the auth role. This is acceptable but may be confusing if the staff table `role` column is not consistently set.
5. **Phone field uses `keyboardType="phone-pad"` (line 93)** but no input mask or validation, so users can enter invalid strings that pass to the API.

**Suggested Fixes:**
- Add `enabled: staffId != null && staffId !== 0` to `useGetStaff` call to prevent the 0-id fetch.
- Add `isError` handling from `useGetStaff` and show an error state or toast.
- Protect `PUT /api/staff/:id` with `requireRole("admin")` or add a self-check that only allows a staff member to update their own record.
- Add basic phone number validation before calling `handleSave`.

---

### Policies Screen (`apps/staff-app/app/(staff)/policies.tsx`)

**Status:** 🟢 Working

**Issues:**
1. **Fully hardcoded content (lines 6-27):** All policy text is static in the component. No API call is made. Changes to company policies require an app update.
2. **"Last updated: January 2025" is a static string (line 52):** It will become stale and misleading as time passes.
3. **No deep-link or scroll-to-section capability:** If a notification or support ticket references a specific policy section, there is no way to deep-link to it.

**Suggested Fixes:**
- Low priority for an MVP. If dynamic policies are needed, add a `GET /api/policies` or `GET /api/content/policies` endpoint backed by a CMS or DB table.
- Make the date string a variable or fetch it from an API.

---

### Profile Screen (`apps/staff-app/app/(staff)/profile.tsx`)

**Status:** 🟡 Partial

**Issues:**
1. **Phone and Service Region always show "—" (lines 96-105):** The Contact Info section hardcodes `"—"` for Phone and Service Region. These fields exist on the staff record (`staffTable.phone`, `staffTable.workArea`) but `useGetMe` only returns the `usersTable` row (id, email, name, role, staffId). No secondary fetch for the staff record is made on this screen, so real values are never displayed.
2. **"TECHNICIAN" role badge is hardcoded (line 59):** It always shows "TECHNICIAN" regardless of the staff member's actual role (e.g., "Supervisor", "Electrician"). The real role string is available on the staff record but not fetched here.
3. **`useListServices` with `limit: 200` (line 20):** Fetching up to 200 service records just to count completions is wasteful. This should be a dedicated `GET /api/services?staffId=X&status=completed&limit=1` with the `total` field, or the API should expose a stats endpoint.
4. **Average Rating always shows "—" (line 74):** There is no rating system in the DB schema; the placeholder will never be populated without schema additions.
5. **`onlineDot` (line 177) is always green:** There is no presence/availability mechanism. The green dot implies the user is "online" regardless of actual availability.
6. **Logout only clears token (line 32):** The logout does not invalidate the React Query cache (`queryClient.clear()`), so stale data from the previous user session may appear briefly if another user logs in on the same device.

**Suggested Fixes:**
- Add `useGetStaff(user?.staffId)` to the Profile screen to populate phone and service region.
- Use the staff record's `role` field in the role badge instead of hardcoded "TECHNICIAN".
- Replace the 200-record `useListServices` with a smaller targeted query.
- On logout, call `queryClient.clear()` before `router.replace("/(auth)/login")`.
- Remove or hide the online dot until a presence system exists.

---

### Schedule Screen (`apps/staff-app/app/(staff)/schedule.tsx`)

**Status:** 🟡 Partial

**Issues:**
1. **`limit: 200` fetches all jobs for calendar rendering (line 53):** Same concern as Profile. Loading 200 records on every mount is expensive. For staff with many jobs, this limit may still be insufficient and jobs will silently disappear from the calendar.
2. **Week strip shows "previous day + 6 ahead" not "current week" (line 88):** `d.setDate(today.getDate() - 1 + i)` starts one day back. This is mildly confusing UX — the strip starts on yesterday, not the current week's Monday or today.
3. **`selDate` constructed with `+ "T00:00:00"` (line 82):** This is correct for local time parsing, but `new Date(selectedDate + "T00:00:00")` varies by timezone. In UTC+5:30 (India) this works fine. In UTC-X this could roll to the previous day.
4. **"Complete Job" button in schedule (line 281) navigates to detail, doesn't complete in-place:** The label "Complete Job" implies an inline action, but it just pushes to `/job/${item.id}`. This is acceptable but the label is misleading — "View Job" would be clearer.
5. **No ability to navigate to past months beyond the initial state:** `calMonth` is initialized to the current month. The `prevMonth` button allows going backwards, which is correct. However, the `weekDays` strip for week view always starts from today minus one day and cannot be navigated — there is no prev/next week button.
6. **When `staffId` is null, `useListServices` is called with empty params `{}`** (same pattern as jobs.tsx line 52): the API will return ALL services (not staff-scoped) when no `staffId` is provided and the user is `staff` role. Actually the API *does* enforce staff scoping server-side (services.ts line 29-31), so this correctly returns the user's jobs. But if `staffId` is null (unlinked account), the API applies `staffId = -1` as the effective filter, returning an empty list — which is the correct behaviour and shows the empty state.

**Suggested Fixes:**
- Replace `limit: 200` with a date-range query (`startDate`, `endDate`) matching the visible calendar month, and re-fetch when the month changes.
- Rename the "Complete Job" button label to "View Job" to avoid confusion.
- Add prev/next week navigation arrows for the week strip view.

---

### Security Screen (`apps/staff-app/app/(staff)/security.tsx`)

**Status:** 🟢 Working

**Issues:**
1. **Non-ok responses are not alerted for token-null case (line 29):** If `token` is null (expired session), `Alert.alert` is called correctly and `setLoading(false)` is called in the `catch` path, but the code has a `return` before the `finally` block runs, leaving `loading` as `true` and the button permanently disabled. (Lines 29-30: `setLoading(false)` is only called in the `finally` block; the early-return at line 30 skips it.)
2. **Password strength requirements shown but not enforced (lines 78-82):** The UI lists "Use a mix of letters and numbers" as a requirement, but the validation only checks length (line 23). A password of "aaaaaaaa" passes.
3. **No password confirmation clearing on success:** After a successful password change, the three input fields retain their values until the screen unmounts. The user returning from the next screen would see old input.

**Suggested Fixes:**
- Move `if (!token) { ... return; }` block inside the try, before the fetch, but ensure `finally { setLoading(false) }` always runs. Or use a single `setLoading(false)` call in finally and remove the early-return.
- Add regex validation (`/(?=.*[a-zA-Z])(?=.*[0-9])/.test(newPwd)`) to match the displayed requirement.
- Clear input state (`setCurrent("")`, `setNewPwd("")`, `setConfirm("")`) on successful change.

---

### Support Screen (`apps/staff-app/app/(staff)/support.tsx`)

**Status:** 🟡 Partial

**Issues:**
1. **No auth token sent with the request (line 23):** `POST /api/contact` is a public endpoint (index.ts line 26-31) so this technically works, but the submission is anonymous — the server cannot link it to a staff user account. If the email or name from `meData` is unavailable (first load), it falls back to the generic string `"Staff Member"` / `"staff@greenvolt.in"` (lines 27-28), losing attribution.
2. **Fallback email `"staff@greenvolt.in"` (line 28) is hardcoded fiction:** If `meData` hasn't loaded yet when the form is submitted, the contact record will have a fake email. The server cannot reply.
3. **No submission history or ticket ID shown:** After submitting, the user has no reference number to track their request.
4. **Category selection resets if the screen is revisited (line 15):** `CATEGORIES[0]` ("Technical Issue") is always the default, even if the user previously selected a different one. This is fine for a form but slightly jarring.
5. **No loading guard for `meData` (line 14):** If the user opens this screen before `useGetMe` resolves, `meData` is undefined and the fallback strings are used. Since support is accessed from the profile tab which also loads `useGetMe`, this is unlikely in practice.

**Suggested Fixes:**
- Wait for `meData` to load (or disable the submit button while `meData` is loading) before allowing form submission.
- Remove the hardcoded fallback email; instead show a validation error if the email is unavailable.
- On successful submission, show the contact record's `id` as a reference number.

---

### Job Detail Screen (`apps/staff-app/app/job/[id].tsx`)

**Status:** 🟡 Partial

**Issues:**
1. **"Pause Job" calls `advanceStatus("pending" as any)` (line 340):** "pending" is not in the `STATUS_SEQUENCE` type (`"in_progress" | "completed"`). The `as any` cast bypasses TypeScript. The API's `updateServiceSchema` likely allows reverting to "pending", but this is untested and semantically odd. If the schema rejects "pending" on an `in_progress` job, the API call will silently fail (the `onSuccess` fires `refetch()` but there is no `onError` handler).
2. **`advanceStatus` has no `onError` callback (line 77-80):** If `update.mutate` fails (network error, 403 if a customer somehow accesses this screen), the job status UI will not update (refetch won't fire), and the user sees no error message — the buttons become re-enabled silently.
3. **`useListStaff({ available: true })` is always called (line 56)** even for non-admin users. This fires an unnecessary API request for every staff member who opens a job detail. The response is only used in the `isAdmin` conditional block (line 304).
4. **`getVisualStep` maps `in_progress` to step index 2 but "En Route" is step index 1 (line 37):** The stepper skips step 1 entirely — when a job is `in_progress`, step 0 (Scheduled) shows as done and step 2 (In Progress) shows as active, but step 1 (En Route) is shown as incomplete. This is intentional because "en_route" is a display-only step with no DB status, but it produces confusing UX: the "En Route" step never activates.
5. **Photo upload uses `launchCameraAsync` only (line 92):** Staff cannot select an existing photo from the gallery. On some devices (tablet, no camera), or when re-uploading a photo from email, this is a limitation.
6. **`embedImage` in PDF report assumes local file on server (services.ts line 155-156):** Images uploaded via `/api/upload` are stored locally in `uploadsDir`. The PDF embedding resolves the filename from the URL and looks for it on disk. If the API server is restarted or runs on a different machine, images will not embed. The function silently falls back to printing the URL as text, so the PDF won't be broken, but no image appears.
7. **No RBAC check prevents a customer from calling `PUT /api/services/:id` to change their own job status** — the services route has no `requireRole` guard (services.ts). Any authenticated user (including a customer) can PATCH any service ID. A staff user on the wrong job can also mark it complete.
8. **`uploadFile` is imported from `@workspace/api-client-react` (line 16)** but the implementation is not audited here. If the upload endpoint requires auth, the file is uploaded using the shared `customFetch` which has `setAuthTokenGetter` configured — this is fine. But if the server restarts and the upload directory changes, existing image URLs become 404s.

**Suggested Fixes:**
- Add an `onError` handler to `advanceStatus`'s `update.mutate` call showing an `Alert`.
- Move `useListStaff` inside a conditional `useMemo` or add `enabled: isAdmin` to the query.
- Add gallery picker as an alternative to camera in `pickAndUpload`.
- Rename "En Route" to a grayed-out "En Route (soon)" or replace the 4-step visual with a 3-step bar matching the actual DB statuses.
- Add `requireRole("staff", "admin")` middleware to `PUT /api/services/:id` and `GET /api/services/:id` in services.ts.

---

## API Route Issues

### `apps/api-server/src/routes/staff.ts`

- **No authentication guard on any route (all of GET, POST, PUT, DELETE):** The file is mounted under `router.use(requireAuth)` in index.ts (line 70), so all requests require a valid JWT. However, there is no `requireRole` guard — a customer or any staff member can call `PUT /api/staff/:id` to modify any other staff record. Only `DELETE` and `POST` should be admin-only; `PUT /:id` should be restricted to `admin` or the matching staff member.
- **`GET /api/staff/` returns all staff including sensitive fields** (phone, workArea, role) to any authenticated user. Staff members can enumerate all colleagues' contact details.

### `apps/api-server/src/routes/services.ts`

- **No `requireRole` guard on any route:** Any authenticated user (customer, staff) can call `POST /api/services`, `DELETE /api/services/:id`, or `PUT /api/services/:id`. Only admin should be able to create/delete services; staff should only be able to update their own assigned jobs.
- **Unreachable code after `res.status(201).json(service)` (lines 217-239):** After `return res.status(201).json(service)` on line 218, lines 221-239 (notification firing) are dead code and will never execute. The `return` on line 218 exits the route handler. The post-creation SMS/push notifications for new services created by admin are silently skipped.

### `apps/api-server/src/routes/notifications.ts`

- **No authentication on `POST /api/notifications/check-expiry` (line 30):** The route is mounted after `requireAuth` in index.ts, so auth is enforced. But there is no `requireRole("admin")` — any staff or customer can trigger a mass expiry notification sweep. This should be admin-only or cron-triggered only.
- **`GET /api/notifications/` returns all notification records** (including customer phone numbers and SMS message bodies) to any authenticated user. Should be restricted to `admin` role.

### `apps/api-server/src/routes/me.ts`

- **`router.use(requireRole("customer"))` blocks all staff access (line 21):** The `useRegisterMyPushToken` hook in `_layout.tsx` calls `PUT /api/me/push-token`, but the entire `/api/me` sub-router is restricted to `customer` role. Any staff or admin user calling this endpoint receives a `403 Forbidden`. **This means staff push tokens are never registered with Expo**, so `notifyJobAssigned()` in push.ts will always find a null `pushToken` for staff users and silently skip notifications.

### `apps/api-server/src/routes/auth.ts`

- **`PUT /api/auth/notifications` (line 106) is for all roles and works correctly for staff.** This is the route the Notifications screen actually uses (`savePushPref`). This is fine.
- **`POST /api/auth/forgot-password` returns the `resetToken` in the response body (line 172):** This is appropriate for an MVP/internal tool where admin-assisted resets are acceptable, but must not ship as-is in a production consumer app.
- **JWT expiry is 8 hours (line 40):** Acceptable for a staff app, but the client-side `isAuthenticated()` check (auth.ts line 55-59) may expire mid-shift, silently logging out the user between API calls.

---

## Push Notifications Analysis

### Architecture

The app uses a two-layer notification system:
1. **SMS via Twilio** (`notifications.ts`) — for customer-facing alerts: service scheduled, service completed, subscription expiry. Works in mock mode without Twilio credentials.
2. **Expo Push Notifications** (`push.ts`) — for in-app push notifications. Two functions exist: `notifyJobAssigned(staffId, serviceId, customerName)` for staff and `notifyCustomer(customerId, ...)` for customers.

### What's Working

- `notifyJobAssigned` correctly looks up the `pushToken` from `usersTable` by `staffId` and sends via Expo Push API.
- `sendExpoPush` handles `DeviceNotRegistered` errors by calling `invalidatePushToken` to clean up stale tokens.
- `checkPushReceipts` exists for Expo receipt polling but is never wired to a scheduled job or cron — receipt IDs from successful sends are logged but never persisted, so the receipt-check function is currently uncallable.
- The `_layout.tsx` root correctly requests permissions, obtains the Expo token, and calls `registerPushToken.mutate(token)`.

### What's Broken

1. **Staff push tokens never register (critical):** `useRegisterMyPushToken` (from `me.ts`) hits `PUT /api/me/push-token`. The entire `/api/me` router is protected by `requireRole("customer")` (me.ts line 21). Staff users receive `403 Forbidden`. As a result, `usersTable.pushToken` is always null for staff users, and `notifyJobAssigned` silently returns without sending any notification.
   - **Fix:** Either add a role-agnostic `PUT /api/auth/push-token` endpoint (auth.ts already has `POST /api/auth/push-token` at line 73) or change `_layout.tsx` to call the existing `POST /api/auth/push-token` instead of `useRegisterMyPushToken`.
   - Note: `POST /api/auth/push-token` already exists in auth.ts (line 73) and works for all roles. The staff app just needs to call it instead of the customer-scoped `PUT /api/me/push-token`.

2. **`notifyJobAssigned` is only triggered when `staffId` changes on a service update (services.ts line 265):** If a job is created with a `staffId` already set (via `POST /api/services`), the creation handler's notification code is unreachable dead code (see services.ts unreachable code issue above). No notification is sent on initial job assignment.

3. **`jobAssignment` and `reminders` toggles in the Notifications screen have no server-side effect.** The `pushEnabled` toggle on `usersTable` is a blanket on/off, but there is no per-type filtering. If `pushEnabled` is `false`, `notifyCustomer` checks this flag (push.ts line 183) and skips the send. However, `notifyJobAssigned` (push.ts line 153-167) does **not** check `pushEnabled` — it sends unconditionally if a token exists. So a staff member who toggles off push notifications still receives job assignment alerts.

4. **No Android notification channel created in the app:** `push.ts` sends with `channelId: "greenvolt-jobs"`, but the staff app's `_layout.tsx` never calls `Notifications.setNotificationChannelAsync("greenvolt-jobs", ...)`. On Android 8+, notifications sent to an unregistered channel are silently dropped.

---

## Cross-Cutting Issues

1. **Role-based access is only enforced at the `/api/me` boundary.** All other routes (`/api/staff`, `/api/services`, `/api/notifications`) lack `requireRole` guards. Any authenticated user (customer, staff, admin) can read or mutate any record. This is a systemic RBAC gap.
2. **No cache invalidation on logout.** `clearToken()` in profile.tsx does not call `queryClient.clear()`. Stale user data persists in the React Query cache.
3. **`useGetMe` is called on every staff screen independently** (jobs.tsx, schedule.tsx, profile.tsx, support.tsx, personal-details.tsx). With `refetchOnWindowFocus: false` and `retry: 1` this is acceptable in terms of network load, but it means `staffId` is computed 5+ times separately. A shared auth context/hook would be cleaner.
4. **`API_BASE_URL` defaults to `http://localhost:3000`** (constants.ts line 2). In a production EAS build without `EXPO_PUBLIC_API_URL` set, all API calls will fail silently with a network error. There is no build-time check or runtime warning.
5. **No offline queue for status updates.** If a staff member loses connectivity mid-job and taps "Complete Job", the mutation fails silently (no `onError` in `advanceStatus`). The job status is not queued for retry.

---

## Priority Fix List

| Priority | Screen / Area | Issue | Fix |
|----------|--------------|-------|-----|
| P0 | Push Notifications (all) | `useRegisterMyPushToken` hits `/api/me/push-token` which is `customer`-only — staff push tokens never register, no push notifications delivered | Change `_layout.tsx` to call existing `POST /api/auth/push-token` instead of `useRegisterMyPushToken` |
| P0 | `services.ts` API | Unreachable notification code after `return res.status(201).json(service)` — job creation never fires assignment or customer notifications | Move notification block before the `return`, or use `.then()` after the insert |
| P1 | Job Detail (`job/[id].tsx`) | `advanceStatus` has no `onError` handler — failures are silent | Add `onError: () => Alert.alert("Error", "Could not update job status")` |
| P1 | Job Detail (`job/[id].tsx`) | `useListStaff` called for every user regardless of role | Add `enabled: isAdmin` option to the query |
| P1 | Profile (`profile.tsx`) | Phone and Service Region always show "—" | Add `useGetStaff(user?.staffId)` and populate fields from staff record |
| P1 | API: `services.ts` / `staff.ts` | No `requireRole` guards — customers can mutate any service/staff record | Add `requireRole("admin")` to destructive ops; add `requireRole("staff", "admin")` to PUT services |
| P1 | Push (`push.ts`) | `notifyJobAssigned` does not check `pushEnabled` flag | Add `pushEnabled` check same as `notifyCustomer` (push.ts line 183) |
| P2 | Notifications (`notifications.tsx`) | `jobAssignment` and `reminders` toggles are ephemeral local state, never persisted | Persist to `AsyncStorage` or add DB columns + API endpoint |
| P2 | Notifications (`notifications.tsx`) | `pushEnabled` initial value always `true` regardless of server state | Fetch current value from `GET /api/auth/me` on mount |
| P2 | Jobs (`jobs.tsx`) | Navigate button duplicates View Details instead of launching maps | Open Google Maps URL with job address |
| P2 | Security (`security.tsx`) | Early `return` inside `try` block bypasses `finally { setLoading(false) }` when token is null | Move the token-null check before `setLoading(true)` or restructure so `finally` always runs |
| P2 | Profile (`profile.tsx`) | Logout doesn't clear React Query cache | Call `queryClient.clear()` before `router.replace` |
| P2 | Android Push | No `Notifications.setNotificationChannelAsync("greenvolt-jobs")` call in `_layout.tsx` | Register the channel on app start for Android 8+ |
| P3 | Personal Details (`personal-details.tsx`) | `useGetStaff(0)` fires when `staffId` is null | Add `enabled: staffId != null && staffId > 0` guard |
| P3 | Schedule (`schedule.tsx`) | `limit: 200` fetches all jobs just for calendar dots | Re-query by month date range, refresh when month changes |
| P3 | Support (`support.tsx`) | Fallback email `"staff@greenvolt.in"` is hardcoded fiction | Block submission until `meData` loads; use real email only |
| P3 | `notifications.ts` API | `POST /api/notifications/check-expiry` accessible to any authenticated role | Add `requireRole("admin")` |
| P3 | `push.ts` | `checkPushReceipts` exists but is never called | Wire to a cron job or scheduled endpoint |
