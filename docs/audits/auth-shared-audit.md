# Auth & Shared Infrastructure — Audit Report

_Date: 2026-06-11 | Auditor: Claude Code (claude-sonnet-4-6)_

---

## Summary

The auth and shared infrastructure is broadly functional — login, role-based routing, token storage, and the core API middleware are all working. However, there are several issues ranging from critical security problems (reset tokens exposed in plaintext API responses, no email-format validation, no rate limiting on register/forgot-password) to notable UX gaps (register always redirects to `/(customer)` regardless of role, `/(customer)` route is never guarded on the client, no debounce on login button). The shared components are clean and well-structured with no blocking bugs. The API server has solid bcrypt + JWT usage but is missing input sanitisation on several auth mutation routes and has no token invalidation/logout mechanism. Overall, the codebase is ~60% production-ready on the auth surface; the security issues and missing guards must be resolved before any public deployment.

---

## Auth Flow Audit

### Auth Layout (`app/(auth)/_layout.tsx`)

**Status:** 🟡 Partial

**Issues:**
- Line 7: `forgot-password` and `register` have `headerShown: true` but the individual screens override `Stack.Screen` options inline via `<Stack.Screen options={{...}} />` inside the component body. This causes a brief header flash at route level before the per-screen override takes effect. Not broken, but inconsistent.
- There is no redirect guard here: an already-authenticated user who deep-links to `/(auth)/login` will land on the login screen without being bounced back to their dashboard. The only place this is handled is `app/index.tsx`, not inside the auth group layout.

**Suggested Fixes:**
- Move all `Stack.Screen` `options` to this layout file so there is a single source of truth.
- Add an auth-guard useEffect in this layout (or in each screen) that calls `isAuthenticated()` and `router.replace`s away to the appropriate role route if the user already has a valid token.

---

### Login (`app/(auth)/login.tsx`)

**Status:** 🟡 Partial

**Issues:**
- **No email-format validation (line 52–78):** `handleLogin` submits any non-empty string as the email. The API also does no format check. An invalid email string triggers an unnecessary round-trip.
- **No debounce / double-submit guard on the submit button:** `isPending` is set inside the `try` block only after the async call starts. There is a tiny window (between button press and `setIsPending(true)`) where a second tap can fire a second request.
- **`onSubmitEditing` on the password field (line 125) also calls `handleLogin` directly**, so if the user hits the keyboard "done" key while `isPending` is already true from a previous tap, no guard fires. The `disabled` prop only applies to the TouchableOpacity, not to `onSubmitEditing`.
- **Role `customer` routes to `/(customer)` (line 71):** This route is accessible from the staff app. While technically valid for the multi-role design, there is no visual indicator or explanation to the user why they land in a customer-facing view inside the staff app.
- **Fallback role is `staff` (line 69):** If `decodeJwtPayload` returns null or the payload lacks a `role` field, the user is silently sent to `/(staff)/jobs`. This is a privilege-escalation risk if the JWT is somehow truncated or tampered with client-side before decode (server verification will still reject API calls, but the user sees staff UI).
- **Import `Alert` is unused (line 12):** Dead import causes a lint warning.

**Suggested Fixes:**
- Add a simple regex or `z.string().email()` check on the email field before calling the API.
- Move `setIsPending(true)` to the very first line of `handleLogin`, before the `try`.
- Add a check at the top of `handleLogin`: `if (isPending) return;`.
- Guard `onSubmitEditing`: wrap the call as `() => { if (!isPending) handleLogin(); }`.
- Remove the unused `Alert` import.
- Log a warning and route to `/(auth)/login` if `payload` is null rather than defaulting to `staff`.

---

### Register (`app/(auth)/register.tsx`)

**Status:** 🟡 Partial

**Issues:**
- **Always redirects to `/(customer)` (line 51):** After a successful registration the response contains `json.user?.role`, but it is never read. The code unconditionally does `router.replace("/(customer)")`. If the server ever returns a different role (or the API is extended), routing breaks silently.
- **No email format validation (line 22–27):** Only `!email.trim()` is checked. An invalid email address will pass client-side validation and get a 400 from the server, displaying a confusing generic error.
- **No phone format validation:** Any non-empty string is accepted. For an Indian solar service company, a regex for `+91` or 10-digit numbers would help.
- **`address` field sends `undefined` to the API body when empty (line 38).** JSON serialisation will drop the key entirely. The server's register route treats `address` as optional so this is not broken, but `address?.trim() || undefined` is unnecessarily subtle — just pass `""` or omit the field.
- **Password strength feedback is absent:** The UI only validates `length >= 8`. There is no visual meter or requirement checklist, whereas `reset-password.tsx` does show a requirements block (even if minimal).
- **`Stack` is imported but the only usage is `<Stack.Screen>` on line 62 to set header options.** This pattern works, but it means there is a dependency on being inside a Stack navigator, which is fragile if the layout ever changes.

**Suggested Fixes:**
- Read `json.user?.role` (or decode the token) after registration and route accordingly, matching the logic in `login.tsx`.
- Add `z.string().email()` or a simple regex for email validation.
- Optionally add basic phone number validation.

---

### Forgot Password (`app/(auth)/forgot-password.tsx`)

**Status:** 🔴 Broken (security-critical)

**Issues:**
- **Reset token is displayed in plaintext on-screen (lines 44–74) and returned from the API in the JSON response body (api-server `auth.ts` line 178–182).** This means any person who can see the device screen, a screenshot, a log, or intercept the API response can immediately use the reset token to take over any account. The comment in the API code acknowledges this ("In production: send via SMS/email") but the implementation is not guarded by any production check.
- **No rate limiting on `POST /api/auth/forgot-password`:** The API server applies a global 100 req/15 min limit and a strict 10 req/15 min limit on `/api/auth/login`, but `forgot-password` has no dedicated rate limiter. An attacker can enumerate valid email addresses in bulk by watching for differences in response timing or response shape (the API does return a generic message for missing emails, but the timing difference of the DB query is still exploitable).
- **Token display uses `selectable` prop (line 56):** Intentional for copy-paste but increases the exposure surface (clipboard sniffing, accidental screenshots).
- **`resetToken` state is initialised to `null` and the conditional render at line 44 shows the token card after the first request.** If the user presses back and then forward (using gesture or hardware back), the `resetToken` state is lost. They would need to re-request.
- **No email format validation** before the API call (line 16).

**Suggested Fixes:**
- For production: remove `resetToken` from the API response entirely; send via SMS (Twilio is already in the API dependencies) or email. Return only `{ ok: true }`.
- Add a rate limiter on `POST /api/auth/forgot-password` (e.g., 3 requests per email per hour, or at minimum 5 req/15 min globally).
- Add basic email format validation before submitting.
- If the in-app token display must remain for admin-assisted resets, gate it behind `NODE_ENV !== "production"` on the API side.

---

### Reset Password (`app/(auth)/reset-password.tsx`)

**Status:** 🟡 Partial

**Issues:**
- **Token arrives via `useLocalSearchParams` (line 11).** Expo Router search params are passed in the URL/deep-link, meaning the reset token is briefly visible in navigation history and potentially in OS logs on Android. This is a secondary exposure vector on top of the API issue described above.
- **`email` param is displayed on screen (line 59) but is never verified client-side.** A user who manually navigates to this screen without a token can still edit `resetToken` in the text field and attempt a brute-force reset. The server blocks this (JWT verification), so it is not a bypass, but the UX is misleading.
- **The `resetToken` `TextInput` is `multiline` (line 72).** This allows newlines to be entered in the token field, which will silently make the API call fail with a cryptic error because the trimmed token will contain newline characters.
- **No minimum password complexity beyond 8 characters (line 22).** The requirements block on line 109–111 only says "Minimum 8 characters", which is consistent but very weak.
- **After a successful reset (line 38–41), the `Alert` dismiss handler calls `router.replace("/(auth)/login")`.** If the user taps outside the Alert on Android (dismissing it without tapping the button), no navigation occurs and the user is left on the reset-password screen with empty fields — no indication of what happened.

**Suggested Fixes:**
- Strip newlines and whitespace from the reset token on input with `onChangeText={v => setResetToken(v.replace(/\s/g, ""))}`.
- Handle Alert dismissal: add an `onDismiss` prop or use `router.replace` unconditionally after `Alert.alert` returns (though native `Alert` is fire-and-forget; the safe fix is to always navigate after the success state is confirmed, regardless of button tap).
- Consider storing the token in component state only (already done) rather than passing via URL params; pass only the email in params if display is desired.

---

## Routing & RBAC Audit

### Architecture Overview

Role-based routing is done **entirely on the client side** using the decoded JWT payload. There are three role groups: `(admin)`, `(staff)`, and `(customer)`, each implemented as an Expo Router tab group with its own `_layout.tsx`.

- **`app/index.tsx`**: On mount, calls `isAuthenticated()` (checks token expiry via client-side JWT decode) and `decodeJwtPayload()` to extract the `role` claim. Routes to the correct tab group using `<Redirect>`.
- **`app/_layout.tsx` (`RootLayoutInner`)**: On mount, calls `isAuthenticated()` and redirects to login if not authenticated. This provides a session-expiry check.

### Gaps

1. **No client-side guard inside role group layouts.** The `(admin)/_layout.tsx`, `(staff)/_layout.tsx`, and `(customer)/_layout.tsx` files contain only tab configuration — there is no `useEffect` or redirect that verifies the user's token or role on mount. This means:
   - A logged-in `staff` user who manually navigates to `/(admin)/jobs` via deep link or by editing the URL in Expo Go will see the admin UI. The API will block data, but the screen scaffolding renders.
   - A logged-out user who gains access to these routes (e.g., if the redirect in `_layout.tsx` races) sees the UI shell with empty/error states rather than a login redirect.

2. **`app/_layout.tsx` auth check is fire-and-forget (line 63–65).** `isAuthenticated().then((ok) => { if (!ok) router.replace(...) })` is called once on mount and not on app foreground resume. If a token expires while the app is backgrounded, re-foregrounding the app will not trigger a redirect to login — the user stays on a screen that will get 401s from the API.

3. **`useNetworkStatus` re-runs check on foreground resume (line 46–51), but token expiry is not checked on foreground resume.** These should be unified: re-check `isAuthenticated()` when the app returns to foreground (add an `AppState` listener in `_layout.tsx`).

4. **The `customer` role is accessible via this staff app.** The UI header in `register.tsx` says "Create Customer Account. For staff and admin accounts, contact your administrator." This is intentional, but customers logging into the staff app get a customer UI inside what is marketed as a staff management tool. There should be a clear runtime check or app split.

5. **No logout function is defined anywhere in the client codebase.** `clearToken()` exists in `auth.ts` but there is no logout button in any layout or profile screen that calls it and redirects to login. (Profile screens likely contain this — not audited here — but it is a gap worth confirming.)

6. **`/(customer)` is never protected at the group layout level.** Unlike admin and staff groups (which at least benefit from the root layout redirect), the customer layout applies no check. The `book/_layout.tsx` and `services/_layout.tsx` were not audited, but if they follow the same pattern the entire customer route tree has no RBAC enforcement on the client.

---

## Shared Components Audit

### `AnimatedPressable` (`src/components/AnimatedPressable.tsx`)

**Status:** 🟢 Working

**Issues:**
- Minor: When `disabled` is `true`, the scale animation on press-in still fires because `onPressIn`/`onPressOut` are not gated on the `disabled` prop. The `TouchableOpacity` ignores the `onPress` when disabled, but the visual scale animation will still play, giving the user false tactile feedback that something happened.

**Suggested Fix:**
- Guard: `const onPressIn = () => { if (!disabled) Animated.spring(...).start(); }`.

---

### `ErrorBoundary` (`src/components/ErrorBoundary.tsx`)

**Status:** 🟡 Partial

**Issues:**
- The `retry` method (line 16) resets `hasError` to `false` but does not actually re-render children with fresh state — `React.Component` re-renders the children on `setState`, which will simply re-throw the same error if the underlying cause has not been fixed (e.g., a bad API response in render). This leads to an infinite error-reset loop.
- The component does not call `componentDidCatch` to send the error to Sentry. The app has `@sentry/react-native` configured and Sentry is initialised in `_layout.tsx`, but errors caught by this boundary are silently swallowed.
- The `message` displayed is the raw `Error.message` (line 27), which may contain internal implementation details not suitable for end users.

**Suggested Fixes:**
- Add `componentDidCatch(error, info) { Sentry.captureException(error, { extra: info }); }`.
- Consider logging the error in `getDerivedStateFromError` or displaying a friendlier generic message.
- Document that `retry` only helps for transient errors (network, etc.), not code bugs.

---

### `ErrorState` (`src/components/ErrorState.tsx`)

**Status:** 🟢 Working

No bugs. Clean, simple presentational component. The icon (`cloud-offline-outline`) might be confusing when the error is not network-related (e.g., a 404 or 500), but this is a UX nitpick.

---

### `FadeInView` (`src/components/FadeInView.tsx`)

**Status:** 🟡 Partial

**Issues:**
- The `useEffect` dependency array is empty (`[]`, implied by the ESLint disable on line 23 in other files — here there is no disable but the same pattern). `duration`, `delay`, `fromY`, and `fromX` are props that are captured in the closure at mount time. If these props change after mount (e.g., the parent re-renders with different values), the animation will not re-run with the new values. This is acceptable for a one-shot entrance animation but should be documented.
- The `style` prop type is `ViewStyle | ViewStyle[]` but `Animated.View` accepts `StyleProp<ViewStyle>`. These are compatible but the narrower type may produce TypeScript errors in some callsites if a `StyleSheet.create` style (which returns `RegisteredStyle<ViewStyle>`) is passed.

**Suggested Fix:**
- Change `style?: ViewStyle | ViewStyle[]` to `style?: StyleProp<ViewStyle>` to align with React Native conventions.

---

### `OfflineBanner` (`src/components/OfflineBanner.tsx`)

**Status:** 🟡 Partial

**Issues:**
- The banner uses `position: "absolute"` with `top: 0` and `zIndex: 1000` (line 28–31). On iOS, this will overlap the system status bar if `translucent` is set to true in `StatusBar`. In `_layout.tsx`, `StatusBar` is set to `translucent={false}`, which avoids the issue, but this is a fragile coupling — if `translucent` changes, the banner overlaps system UI.
- The banner height is hardcoded at `44px` (line 30) and the initial translate is `-52` (line 6). The 8px discrepancy is intentional to account for shadow/overflow but is undocumented.
- When the banner slides in, it pushes no layout content — it overlaps the top of whatever screen is shown. For screens whose content starts at `top: 0` (e.g., the login gradient full-screen), the banner overlays branding content without pushing it down.
- `SafeAreaProvider` is in the root layout, but the `OfflineBanner` does not use `useSafeAreaInsets` — on notch devices the banner will be hidden behind the notch at `top: 0`.

**Suggested Fixes:**
- Use `useSafeAreaInsets().top` to offset the banner's `top` position.
- Consider using a `paddingTop` approach driven by layout rather than absolute positioning, or accept the overlay pattern but document it.

---

### `useNetworkStatus` (`src/hooks/useNetworkStatus.ts`)

**Status:** 🟡 Partial

**Issues:**
- **Polling the healthz endpoint is a false proxy for connectivity.** If the API server is down (not the device network), `isOnline` will return `false` and the offline banner will show even though the device has internet. This is a design choice, but it conflates "server reachable" with "device online."
- **No `@react-native-community/netinfo` or `expo-network` usage.** Native network state events would give instant feedback without a 30-second polling lag when the device reconnects.
- **The 5-second `AbortController` timeout (line 13):** `clearTimeout` is called after `await fetch(...)` returns, which is correct. However, if the fetch rejects due to the abort, the `catch` block sets `isOnline(false)`, which is correct, but the `timeout` variable is created inside `checkConnectivity` on every call — on slower devices this creates a new timer on every 30-second tick that is correctly cleaned up, so no leak, but the pattern is slightly wasteful.
- **Web path (line 29–39):** The `globalThis` cast to a custom `EventTarget` type is a workaround for TypeScript's `EventTarget` interface differences in the browser. This is functional but fragile — it would be cleaner to use `window.addEventListener` with a proper type guard.

**Suggested Fix:**
- Complement the healthz poll with `@react-native-community/netinfo` for instant native events, and use the healthz poll only to confirm server availability separately.

---

## API Auth Route Issues

### `apps/api-server/src/routes/auth.ts`

- **`POST /forgot-password` returns the raw reset token in the JSON response (line 178–182).** See Security Concerns below. This is the most critical issue in the entire codebase.
- **No rate limiting on `POST /forgot-password`, `POST /register`, `POST /reset-password`.** The global 100 req/15 min applies, but these endpoints need their own stricter limits (e.g., 5 req/15 min for forgot-password).
- **`POST /register` (lines 236–258): two separate DB inserts are not wrapped in a transaction.** If the `usersTable` insert fails after `customersTable.insert` succeeds, the database has an orphaned customer record with no linked user account. Subsequent re-registration with the same email will fail the uniqueness check on `usersTable` (the email check) but will also fail to find the customer record, leading to a confusing state.
- **`POST /register` (line 246–247): a third SELECT query is executed immediately after the INSERT** to fetch the newly created user. The initial `db.insert(...).returning()` on `usersTable` is not used with `.returning()` — instead, a fresh SELECT is done. This is an unnecessary extra round-trip; use `.returning()` on the insert and drop the extra SELECT.
- **`GET /me` is defined in `auth.ts` at line 55 and a full `/me` router is also in `me.ts`.** The `auth.ts` `/me` endpoint returns a user object, but `/me/profile` (in `me.ts`) returns customer-specific data. Having two different `/me` concepts in different files is confusing — `auth.ts` `/me` is mounted at `/api/auth/me` while `me.ts` routes are at `/api/me`. This is technically fine but should be documented.
- **`PUT /update-profile` (line 116–153): syncs name to `staffTable` using `req.user!.staffId` from the JWT payload.** If a staff member's `staffId` changes in the DB (e.g., re-linked), the stale JWT will use the old value. This is unlikely but the JWT is 8 hours long, which widens the window.
- **`POST /login` does not check `user.deletedAt` or a `user.active` flag.** If user records are soft-deleted or deactivated, they can still log in. Depends on whether the schema supports this — worth verifying.
- **No `try/catch` around any DB calls in auth routes.** Unhandled DB errors (connection loss, constraint violation) will bubble up to the global error handler in `app.ts`, which returns a generic 500. This is acceptable but means no structured error logging per-route.

### `apps/api-server/src/routes/me.ts`

- **`PUT /api/me/profile` (lines 40–70) does not validate email format.** Any string is accepted as email and written directly to the DB.
- **`PUT /api/me/profile` does not check for duplicate email** (unlike `PUT /auth/update-profile` which does). Two `me/profile` updates with the same email from different accounts could corrupt data depending on DB uniqueness constraints.
- **`PUT /api/me/push-token` (line 347) is declared at the router level after `router.use(requireRole("customer"))` (line 21), so it inherits the customer role guard.** However, the same push-token update route exists in `auth.ts` at line 73 (`POST /api/auth/push-token`) for all roles. This duplication means the same action has two different endpoints depending on role, which is confusing and may cause the mobile client to call the wrong one.

### `apps/api-server/src/middleware/requireAuth.ts`

- **`?token=` query param support (lines 34–36):** Accepting auth tokens in query strings is a significant security risk. Query strings appear in server access logs, browser history, Referrer headers, and third-party analytics. The comment says it's for "direct-link PDF downloads from mobile", but this pattern should be replaced with short-lived signed URLs or a dedicated download token endpoint.
- **`requireRole` does not first call `requireAuth`** (line 22–28). The docstring says "Must be used after requireAuth", but there is no runtime enforcement. If a developer uses `requireRole(...)` without `requireAuth` being applied first, `req.user` will be undefined and the check `!req.user` will catch it (returning 403 instead of 401), but the semantics are wrong.
- **`requireRole` is used as `router.use(requireRole("customer"))` in `me.ts` without a preceding `requireAuth` call in that router.** The middleware is applied at the router level (line 21 of `me.ts`), but `requireAuth` is not chained. This means unauthenticated requests to `/api/me/*` get a `403 Forbidden` instead of `401 Unauthorized`, which is the wrong HTTP status and may confuse clients.

### `apps/api-server/src/app.ts`

- **`/uploads` static files are served with no auth (line 43).** Uploaded images (service job photos) are publicly accessible to anyone who knows the URL. Depending on the content sensitivity this may be acceptable, but job photos may contain personally identifiable information or property details.
- **The global rate limit (line 45) applies to all `/api` routes.** 100 requests per 15 minutes is low for legitimate users of a mobile app that polls every 30 seconds — a single active user making background data fetches can approach this limit quickly if multiple screens refresh simultaneously.

### `apps/api-server/src/index.ts`

- **`listen` callback signature mismatch (line 30).** Express 5's `app.listen` callback receives no arguments — the `(err)` parameter in the callback is a Node.js `net.Server` callback convention that Express does not use. The `if (err)` check will never be true. Use a separate `server.on('error', ...)` handler.
- **`PORT` is required (throws if missing, line 18).** This is correct behaviour for production, but makes local development fail if the env file is not set up. Consider defaulting to `3000` in development.

---

## Security Concerns

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| S1 | Critical | `api-server/src/routes/auth.ts:178` | Reset token returned in plaintext API response. Any network observer, log aggregator, or screen watcher gains full account takeover capability. |
| S2 | High | `api-server/src/middleware/requireAuth.ts:34–36` | JWT accepted via `?token=` query string. Tokens appear in access logs, browser history, and Referrer headers. |
| S3 | High | `api-server/src/routes/auth.ts` (forgot-password, register, reset-password) | No per-endpoint rate limiting. Brute-force and account enumeration are practical. |
| S4 | High | `api-server/src/app.ts:43` | Uploaded files served without authentication. Service job photos may contain PII or location data. |
| S5 | Medium | `api-server/src/routes/auth.ts:236–241` | Customer + user inserts in `POST /register` are not atomic. Partial failures create orphaned DB records and permanent lockout for that email. |
| S6 | Medium | `api-server/src/routes/me.ts:40–70` | No duplicate email check in `PUT /me/profile`. |
| S7 | Medium | `staff-app/src/lib/auth.ts:43–50` | `decodeJwtPayload` trusts the decoded payload for role-based client routing. A crafted (but unsigned) token with a different role claim will route the user to a different UI group. The API will reject calls, but the UI shell is exposed. |
| S8 | Low | `app/(auth)/forgot-password.tsx:56` | Reset token displayed as `selectable` text — clipboard exposure. |
| S9 | Low | `api-server/src/routes/auth.ts:39` | Token expiry is 8 hours. No refresh token mechanism and no server-side invalidation. A stolen token is valid for up to 8 hours with no revocation path. |

---

## Cross-Cutting Issues

- **No logout implementation is visible in the audited files.** `clearToken()` exists but no screen calls it. Users have no way to sign out, and token expiry (8 hours) is the only session termination mechanism.
- **No token refresh mechanism.** When a token expires, `isAuthenticated()` returns false and the user is redirected to login, losing any in-progress work. A refresh-token flow would improve UX.
- **`TabIcon` component is copy-pasted identically in three layout files** (`(admin)/_layout.tsx`, `(staff)/_layout.tsx`, `(customer)/_layout.tsx`). This should be extracted to `src/components/TabIcon.tsx`.
- **`@sentry/react-native` version `^7.2.0` in `staff-app/package.json` is very old** (current is ~8.x). The `ErrorBoundary` does not call `Sentry.captureException`, so errors are silently dropped even though the infrastructure exists.
- **No `.env.example` file** (it was deleted per git status). New contributors have no reference for required environment variables (`EXPO_PUBLIC_API_URL`, `JWT_SECRET`, `PORT`, `SENTRY_DSN`, etc.).
- **`newArchEnabled: false` in `app.json:91`** is explicitly set to maintain `react-native-razorpay` compatibility. This should be tracked as a known limitation and revisited when Razorpay releases New Arch support.
- **`app/_layout.tsx` registers a `notificationListener` ref (line 53) but never assigns it** (only `responseListener` is assigned on line 84). The `notificationListener` cleanup on line 91 calls `.remove()` on a `null` value — harmless but dead code.
- **`useNetworkStatus` in `app/_layout.tsx` is called at line 56 but the result is only passed to `OfflineBanner`.** It is not used to suppress API calls or show loading states in individual screens, so screens will still fire requests and show error states even when the banner is showing.

---

## Priority Fix List

| Priority | Area | Issue | Fix |
|----------|------|-------|-----|
| P0 | API Security | Reset token returned in plaintext response (`auth.ts:178`) | Remove `resetToken` from response; deliver via Twilio SMS (already available) or in-app admin flow only |
| P0 | API Security | No transaction on register's dual DB insert (`auth.ts:236–241`) | Wrap `customersTable` insert + `usersTable` insert in a `db.transaction()` |
| P0 | API Security | No rate limit on forgot-password / register / reset-password | Add `rateLimit({ windowMs: 15*60*1000, max: 5 })` to each endpoint in `app.ts` |
| P1 | Auth Routing | Role group layouts have no auth/role guard | Add `useEffect` with `isAuthenticated()` + role check in each group `_layout.tsx`; redirect if wrong role |
| P1 | Auth Routing | Token expiry not re-checked on app foreground resume | Add `AppState` listener in root `_layout.tsx` that calls `isAuthenticated()` |
| P1 | API Security | JWT accepted via query string (`requireAuth.ts:34–36`) | Remove `?token=` support; implement short-lived signed download URLs for PDFs |
| P1 | API Security | `me.ts` applies `requireRole` without `requireAuth` | Add `router.use(requireAuth, requireRole("customer"))` or chain both in `me.ts:21` |
| P1 | Auth UX | No logout function surfaced in any screen | Call `clearToken()` + `router.replace("/(auth)/login")` from a Logout button in profile screens |
| P2 | Auth UX | Authenticated user can navigate to `/(auth)/login` | Add redirect guard in `(auth)/_layout.tsx` |
| P2 | Auth UX | `register.tsx` always routes to `/(customer)` regardless of role | Read `json.user?.role` or decode token; route using same logic as `login.tsx` |
| P2 | Auth UX | Double-submit possible on login (line 52–78) | Move `setIsPending(true)` to first line; add `if (isPending) return` guard |
| P2 | API | Extra SELECT after INSERT in register (`auth.ts:246`) | Use `.returning()` on the `usersTable` insert and drop the separate SELECT |
| P2 | Shared | `OfflineBanner` ignores safe area insets | Use `useSafeAreaInsets().top` to offset banner position |
| P2 | Shared | `ErrorBoundary` does not report to Sentry | Add `componentDidCatch` with `Sentry.captureException` |
| P3 | DX | `TabIcon` copy-pasted in 3 layouts | Extract to `src/components/TabIcon.tsx` |
| P3 | DX | `.env.example` deleted | Restore with all required variable names (no values) |
| P3 | Shared | `notificationListener` ref never assigned (`_layout.tsx:53`) | Assign on line 84 (alongside `responseListener`) or remove the unused ref |
| P3 | API | `app.listen` error callback never fires (Express 5) (`index.ts:30`) | Replace with `server.on('error', ...)` pattern |
| P3 | Security | Uploaded files publicly accessible without auth (`app.ts:43`) | Add signed URL or auth check for sensitive uploads; at minimum document the policy |
