# Customer Role — Audit Report

Generated: 2026-06-11

---

## Summary

The customer-facing screens are largely feature-complete and visually polished. Core flows (browse services, book a service, view payment history, manage profile, contact support) work end-to-end. The booking flow is the most critical path and has a fully-implemented Razorpay integration with correct server-side signature verification and coupon handling.

However, several real-world blockers exist:
- **Payments screen "Pay Now" is a dead-end** — tapping the button for pending dues shows an Alert instead of initiating a payment.
- **Load More on payments is a dead-end** — the "Load More" button also shows an Alert and never fetches more data.
- **Trend stat on payments is hardcoded** — "+12.5% vs last month" is a static string; no real calculation is done.
- **"Online" badge on Profile is always lit** — it is hardcoded regardless of actual system status.
- **Services list hardcodes the time** — active service cards always show "10:00 AM" instead of the real time slot.
- **Report PDF download exposes a plain-text JWT in a URL query parameter** — this is a security risk in production; the token appears in server logs and browser history.
- **The `services/:id/report` route has no customer-ownership check** — any authenticated customer can download another customer's PDF report by guessing the service ID.
- **Subscription screen billing history shows all payments, not subscription payments** — `useGetMyPayments` fetches everything; subscription-only payments are not filtered.
- **Email and SMS notification toggles are UI-only** — they update local component state but never call any API, so changes are lost on reload.
- **Support screen sends contact request unauthenticated** — there is a public `/api/contact` POST in `routes/index.ts`, but support.tsx calls `${API_BASE_URL}/api/contact` without an Authorization header, relying on it. This works but means a bad actor can spam the contact table anonymously.
- **`requireRole("customer")` does not call `requireAuth` first** — the middleware in `me.ts` only calls `requireRole`, which guards on `req.user` but `req.user` is only set if `requireAuth` ran previously. It works correctly because `router.use(requireAuth)` is called before `router.use("/me", meRouter)` in `index.ts`, but the pattern is fragile.

---

## Screen-by-Screen Audit

---

### Customer Tabs Layout (`apps/staff-app/app/(customer)/_layout.tsx`)

**Status:** 🟢 Working

**Issues:**
- Line 88 (payments tab): The tab icon label is "Usage" but the screen is named "Payments". The tab bar label and icon description are inconsistent — `flash-outline` / `flash` are "energy/usage" icons, not payment icons.
- Lines 103–107: `book/index`, `book/review`, `book/success`, `book/[id]` are each hidden with `href: null` individually AND `book` is also hidden. If a nested Stack route is accessed from outside the tab group, this is fine. However registering `book/index` separately from `book` may cause routing confusion in Expo Router (the `book` segment is a Stack, not a Screen; registering `book` as a tab with `href: null` hides the parent but still resolves correctly).

**Suggested Fixes:**
- Change the payments tab icon to `card-outline` / `card` and label to "Payments" to match the screen name.
- Remove the redundant `<Tabs.Screen name="book/index" options={{ href: null }} />` entry — it is already covered by hiding `book`.

---

### Customer Dashboard / Home (`apps/staff-app/app/(customer)/index.tsx`)

**Status:** 🟡 Partial

**Issues:**
- Line 49: `subscription?.endDate` — `useGetMySubscription` returns `null` (not an object) when the customer has no active subscription. The `?.endDate` guard handles this correctly, but if the API returns a 404 and the hook surfaces it as `undefined`, `endDate` will be `null` and `daysLeft` will be `null`. This is safe but worth a comment.
- Line 184 (`subscription?.plan ?? "No Plan"`): If the subscription object exists but `plan` is an empty string, the System Overview card shows "No Plan" which is correct. Fine.
- Line 209 (`"Premium monitoring and priority support."`) on line 209 in the subscription card: The description is hardcoded regardless of the actual plan type. A Basic plan customer would see "Premium monitoring and priority support."
- Line 33 (`useGetMyServices({ limit: 5 })`): The API caps `limit` at 50 (line 79 of `me.ts`) and defaults to 20. Passing `limit: 5` is respected; this is fine, but only 5 services are ever fetched for the dashboard, meaning if all 5 are completed, `upcoming` on line 43 will be `null` even if real pending services exist beyond the first 5.
- Lines 86–87: `profile?.name?.split(" ")[0]` — if `name` is undefined (unlikely but possible if profile loads partially), a "?" fallback is used via `?? "there"`. This is safe.

**Suggested Fixes:**
- Use the actual subscription plan name in the description or map plan → description in a lookup object.
- Fetch more services for dashboard upcoming detection (e.g., `limit: 20`) or specifically query for `status=pending&status=in_progress`.

---

### Book Service — Select Service (`apps/staff-app/app/(customer)/book/index.tsx`)

**Status:** 🟢 Working

**Issues:**
- Line 44: `calcPricing(item)` computes `{ total }` but `subtotal` and `tax` are not used here — only `total`. Minor destructuring waste.
- Lines 49 and 93: Both the card `onPress` and the "Book Now" button inside the card call the same `router.push`. The card press and the nested button press both fire, which can cause double navigation on fast taps. The inner `TouchableOpacity` inside an outer `TouchableOpacity` creates a nested touchable issue on Android.
- The "STEP 1 OF 4" badge in the header implies 4 steps, but the flow only visits 3 distinct screens: `book/index` → `book/[id]` → `book/review` → `book/success`. This is cosmetically accurate (select service, pick date/slot, review & pay, success), but the Step 1 badge is set unconditionally and doesn't update as the user progresses through the flow.

**Suggested Fixes:**
- Remove the nested `TouchableOpacity` "Book Now" button and rely solely on the card's `onPress`, or invert — make only the button navigable and make the card a `View`.
- Optionally remove the step badge from this screen since the other screens in the flow don't show matching step badges.

---

### Book Service — Detail / Date+Slot Picker (`apps/staff-app/app/(customer)/book/[id].tsx`)

**Status:** 🟢 Working

**Issues:**
- Line 30: `getCatalogItem(id ?? "")` — if `id` is an array (which Expo Router can do for catch-all routes), this will pass the stringified array to `getCatalogItem` and return `undefined`. The error screen on line 37 handles this gracefully.
- Line 19: `getNext14Days()` builds dates using `new Date()` at render time inside `useMemo`. If the user keeps the screen open past midnight, the dates will be stale. Low priority.
- Line 25: `toDateString` uses `.toISOString().split("T")[0]` which returns UTC date. In timezones east of UTC (e.g., IST UTC+5:30) a date created with `new Date()` and then converted to ISO will give yesterday's UTC date for early-morning local time. This would cause date display to be off by one day for IST users browsing early in the morning.
- Lines 33–34: Default `selectedDate` and `selectedSlot` are set once on mount; they are not cleared if the user navigates back and picks a different service. But since state is per-component instance, this is actually fine — the component remounts.
- No validation that the selected date is not in the past (though `getNext14Days` starts from tomorrow, so this should never occur under normal use).

**Suggested Fixes:**
- Fix date calculation: replace `.toISOString().split("T")[0]` with a locale-safe implementation such as `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` to get local date, not UTC date.

---

### Book Service — Review & Pay (`apps/staff-app/app/(customer)/book/review.tsx`)

**Status:** 🟡 Partial

**Issues:**
- **Line 120–125 (RazorpayCheckout guard)**: When `RazorpayCheckout` is null (Expo Go), the mutation throws a user-visible error. This is acceptable with the current message, but the "Pay with UPI/Card/etc." buttons are still visible and tappable, which will surprise the user. There is no UI indication that these methods require a dev build.
- **Line 157** (`...(paymentMethod !== "cash" && { method: { [paymentMethod]: 1 } })`): The `method` object passed to Razorpay uses the app's internal payment method IDs (`upi`, `card`, `netbanking`, `wallet`). These match Razorpay's expected method keys for filtering — this is correct. However, if `paymentMethod === "wallet"` the user has selected "Wallet" and Razorpay may require a `wallet` sub-key specifying _which_ wallet. The `method: { wallet: 1 }` form enables all wallets, which is acceptable but potentially confusing.
- **Lines 69–71 (coupon validation)**: `POST /api/me/coupons/validate` — this route exists and is correctly implemented. The hint text on line 371–374 mentions coupon codes `SOLAR10` and `FIRSTSERVICE`. These are hardcoded UI hints; whether these coupons actually exist in the database is a data concern, not a code bug, but they will fail at runtime if not seeded.
- **Line 59** (`const discountAmount = appliedCoupon?.discount ?? 0`): `discount` returned from `/api/me/coupons/validate` is an integer (rupees). Final total = `total - discountAmount`. If a percentage coupon yields a discount larger than the order amount (unlikely given `maxDiscount` cap on the server), the total could go negative. The server correctly caps via `maxDiscount`, but the client does not guard against `finalTotal < 0`.
- **Lines 94–115 (cash booking)**: The request body uses `serviceType: item!.name` (the human-readable name from the catalog, e.g. "Solar Panel Cleaning"). The server stores this directly in `servicesTable.serviceType`. This is fine but means the stored value depends on the catalog name staying stable; if the catalog name changes, historical data is inconsistent.
- **Line 129 (razorpay/create-order)**: Only `amount` is sent. The server-side response includes `paymentId` (the DB row ID) which is used in the verify step. This pattern is correct.
- **Lines 167–188 (verify)**: `finalAmount` is sent as a number. The server stores `String(amount)` in the payment table. This is consistent with the server's `amount: String(amount)` pattern.
- **No network-error retry** on coupon validation — if the server is temporarily unavailable, the user sees "Could not validate coupon. Check your connection." with no retry button. Minor UX issue.
- **After a failed online payment** (e.g., user cancels Razorpay modal), the `onlineMutation.onError` fires `Alert.alert("Payment Failed", ...)`. The pending payment record created by `create-order` is left in status `pending` in the DB indefinitely unless the webhook fires a `payment.failed` event. If the user retries, a new payment record is created, leaving orphaned pending records. This is a data integrity concern.

**Suggested Fixes:**
- Add a `Math.max(0, finalTotal)` guard before displaying and sending `finalTotal`.
- Show a badge/tooltip on UPI/Card/NetBanking/Wallet methods indicating they require a production build when `RazorpayCheckout` is null.
- Consider a cleanup job or TTL on orphaned pending Razorpay payment records.

---

### Book Service — Success (`apps/staff-app/app/(customer)/book/success.tsx`)

**Status:** 🟢 Working

**Issues:**
- Line 123: `router.replace("/(customer)" as never)` — using `as never` cast to suppress type error is a code smell. The route `/(customer)` is a valid expo-router path; the type cast should not be necessary. This suggests the TypeScript route type generation may be misconfigured.
- Lines 23–27: Five `Animated.Value` refs are created directly in the component body (not in a `useMemo` or with `useRef` pre-initialized). They are created via `useRef(new Animated.Value(...))` which is correct.
- Line 100: `Number(total).toLocaleString("en-IN")` — `total` is passed as a string param. `Number("undefined")` is `NaN` which will display as "NaN" if `total` is missing. There is no fallback for `NaN`.

**Suggested Fixes:**
- Replace `as never` with the proper typed route or add the route to the typed routes config.
- Add `isNaN(Number(total)) ? "—" : Number(total).toLocaleString("en-IN")` guard.

---

### Payments (`apps/staff-app/app/(customer)/payments.tsx`)

**Status:** 🔴 Broken (partially)

**Issues:**
- **Line 94 ("Pay Now" button)**: The `onPress` handler calls `Alert.alert("Pay Now", "To pay your pending dues...")` — this is a static alert message and does NOT initiate any payment. There is no actual payment flow for pending dues from this screen. This is a complete dead-end for users who have outstanding dues.
- **Lines 114–119 ("Load More" button)**: `onPress` shows a static `Alert.alert("Load More", "Showing all recent transactions...")` — no pagination is implemented. The screen fetches `limit: 50` on line 35 and there is no real "load more" capability.
- **Line 76–80 ("+12.5% vs last month" trend stat)**: This is a hardcoded string. No calculation is performed. The value is always "+12.5% vs last month" regardless of actual data.
- **Line 44** (`(p.status as string) === "paid"`): The `as string` cast works around a TypeScript strict type on `status`. This means if the server returns a status value not in the STATUS_CONFIG (e.g., `"processing"`), it falls back to `STATUS_CONFIG.pending` which shows as "PENDING" — acceptable but potentially misleading.
- Line 35: `useGetMyPayments({ limit: 50 })` — the API caps limit at 50, so this is the maximum. The "Load More" button appears when `payments.length >= 10` even though a second page is never fetched.

**Suggested Fixes:**
- Implement a real "Pay Now" flow: either deep-link to the subscription renewal flow or open a Razorpay checkout for the pending payment amount.
- Implement real pagination using the `page` parameter, or remove the "Load More" button and note that it shows up to 50 transactions.
- Replace the hardcoded trend with a real month-over-month calculation from the payments data, or remove it entirely.

---

### Profile (`apps/staff-app/app/(customer)/profile.tsx`)

**Status:** 🟡 Partial

**Issues:**
- **Lines 29–30, 233–250 (Email Alerts, SMS Notifications toggles)**: `emailAlerts` and `smsNotifs` are local `useState` variables. Toggling them updates only local state and calls no API. These preferences are lost on screen reload. The corresponding API endpoints to save email/SMS preferences do not exist in `me.ts` — only `PUT /api/me/notifications` exists (for push notifications only).
- **Line 77** (`(profile as typeof profile & { pushEnabled?: boolean }).pushEnabled ?? true`): The profile type from `useGetMyProfile` does not include `pushEnabled` at the TypeScript level, so a type cast is used. The server correctly returns `pushEnabled` (line 36 of `me.ts`), but the client type is incomplete.
- **Lines 36–37 (startEdit)**: `city` field is populated from `profile?.city ?? profile?.address`. This means the "Service City" field in edit mode shows the `address` value if `city` is not set. On save (line 41), `address: city` is sent — so if the user was editing the address field displayed as "city", it gets saved back to `address`. The field label says "Service City" but is saving to `address`. This is a semantic mismatch; the server profile has both `city` and `address` columns, and `saveEdit` sends `address: city` (not `city: city`).
- **Line 207** (`<View style={styles.onlineBadge}><Text ...>ONLINE</Text></View>`): System status badge is hardcoded "ONLINE" regardless of any actual system health data. There is no API endpoint or field providing live system online/offline status.
- **Line 78** (customerId formatting): `GV-${String(profile.id ?? "0000").padStart(4, "0")}-X` — the `-X` suffix at the end has no meaning and is purely decorative. Not a bug, but worth noting.
- **Lines 103–108 (email in read-only mode)**: Email field is shown from `profile?.email` with a `readonly` style. In edit mode (line 128–133), an email TextInput is rendered AND the readonly email above it remains visible. This results in two email fields visible simultaneously when `editing === true`. The readonly field should be hidden when editing.

**Suggested Fixes:**
- Add `PUT /api/me/notifications` support for `emailAlerts` and `smsAlerts` fields on the server, and wire the toggles to call it.
- Fix the city/address semantic mismatch: either always store in `city` or always in `address` — send `city: city` in the payload and ensure the server `me.ts` PUT handler maps it.
- Hide the readonly email `fieldBlock` when `editing === true` (lines 103–108 should be inside `!editing && ...` condition).
- Replace the hardcoded "ONLINE" badge with a real status field or remove it.

---

### Services — List (`apps/staff-app/app/(customer)/services/index.tsx`)

**Status:** 🟡 Partial

**Issues:**
- **Line 138** (`{isActiveService ? " · 10:00 AM" : ""}`): Time slot is hardcoded as "10:00 AM" for all active services. The actual `timeSlot` (stored inside the `notes` field as `"Time: 09:00 – 11:00 AM | ..."`) is never parsed and displayed. The real slot is buried in the `notes` concatenation that `me.ts` builds on line 299–305.
- **Line 25 (`useGetMyServices({ limit: 50 })`)**: Only 50 services fetched. No pagination. Users with long service histories will not see all records. This is acceptable for most customers but should be noted.
- The `keyExtractor` on line 76–79 uses the service ID as key for service items and `hdr-${label}` for headers. Both "Active" and "Past" section headers use the label as the key. If a customer has no active services but has past ones, the section header keys are still unique (only "Past" header exists). Safe.
- No cancellation option for upcoming/pending services. A customer cannot cancel a scheduled booking from this screen.

**Suggested Fixes:**
- Parse the time slot from the `notes` string (split on `|`, find the element starting with "Time:") or store `timeSlot` as its own DB column and expose it in the API response.
- Add a "Cancel Booking" action for `pending` status services.

---

### Services — Detail (`apps/staff-app/app/(customer)/services/[id].tsx`)

**Status:** 🟡 Partial

**Issues:**
- **Line 42–44 (PDF download)**: `downloadReport` appends `?token=<JWT>` to the URL and opens it in a browser. This exposes the JWT token in:
  1. The browser's URL bar and browser history.
  2. Server access logs.
  3. HTTP Referer headers if the browser navigates further.
  This is a **security issue**. The server in `requireAuth.ts` (line 35) explicitly supports this pattern to "support direct-link PDF downloads from mobile." The pattern is dangerous for production.
- **Lines 42–44**: The report URL uses `/api/services/${serviceId}/report` — this is the admin `services.ts` route, NOT the customer-scoped `/api/me/services` route. The `services.ts` route has no customer-ownership check (any authenticated customer can download another customer's PDF by guessing the service ID integer). This is an **access-control vulnerability**.
- **Lines 86–101 (stepper logic)**: `getVisualStep` returns 0 for "cancelled" status. The stepper then evaluates `(i + 1) * (4 / 4) <= 0` — all four dots are unfilled, which is visually appropriate. However, "Scheduled" at step 1 does not get filled even if the service was once scheduled. A cancelled service shows no progress at all, which may confuse users who already had the service confirmed.
- **Lines 86–101**: `step = 2` for `in_progress` but the math `(i + 1) * (4/4) <= 2` fills dots at index 0 (value 1 <= 2) and index 1 (value 2 <= 2), meaning "Scheduled" and "Assigned" are filled. "Assigned" (index 1) is marked as done even if the technician hasn't been assigned (`service.staff === null`).
- **Line 50** (`isLoading || (!service && !isError)`): The double condition is correct but slightly unusual. It shows a spinner if loading OR if neither data nor error has arrived yet (initializing state). Fine in practice.
- No way for the customer to rate or provide feedback after a completed service.

**Suggested Fixes:**
- Replace the PDF download link approach: use a time-limited signed URL or a short-lived one-time token endpoint (`POST /api/me/services/:id/report-token`) instead of embedding the session JWT in a URL.
- Add an ownership check to `GET /api/services/:id/report` — verify that the authenticated user's `customerId` matches the service's `customerId`.
- Fix the stepper: "Assigned" dot should only fill if `service.staff !== null`.

---

### Services — Layout (`apps/staff-app/app/(customer)/services/_layout.tsx`)

**Status:** 🟢 Working

**Issues:**
- The `Stack` `screenOptions` sets `headerStyle: { backgroundColor: "#00450d" }` (dark green). However, `services/[id].tsx` overrides this with `<Stack.Screen options={{ headerStyle: { backgroundColor: "#fff" }, ... }}>`. The layout-level styles are overridden at the screen level, which is fine and intentional, but the layout's default dark-green header will flash briefly before the screen-level override applies on slower devices.

**Suggested Fixes:**
- Set the default `headerStyle` in the layout to `backgroundColor: "#fff"` since all child screens override it to white anyway.

---

### Book — Layout (`apps/staff-app/app/(customer)/book/_layout.tsx`)

**Status:** 🟢 Working

**Issues:**
- Same as services layout: the default `headerStyle: { backgroundColor: "#00450d" }` is overridden by every child screen. Minor flash issue.

---

### Subscription (`apps/staff-app/app/(customer)/subscription.tsx`)

**Status:** 🟡 Partial

**Issues:**
- **Lines 23–24 (billing history source)**: `useGetMyPayments({ limit: 5 })` fetches ALL payment types — service bookings, subscription, anything. The "Billing History" table in this screen is meant to show subscription-related billing, but it shows all payments including service bookings (e.g., a ₹649 panel cleaning appears as a "billing" entry). No filtering by `description` or payment type is done.
- **Line 88** (`₹{Number(subscription.amount).toLocaleString("en-IN")} / month`): `subscription.amount` is stored as a `numeric` (string in JS via Drizzle). `Number(subscription.amount)` handles the conversion correctly, but if `amount` is `"0"` (the default set in `subscriptions.ts` line 91), the label shows "₹0 / month" which looks wrong. A customer with a real plan but no amount set would see this.
- **Line 179** (`p.description ?? \`${subscription.plan} - Monthly\``): Falls back to "`PlanName - Monthly`" if payment description is null. This is a UI nicety but produces misleading text for service payments that appear in this table.
- **Lines 13–19 (FEATURES list)**: The features are hardcoded for what appears to be a "Premium" tier (Real-time Telemetry, Advanced Exports, Unlimited Users). A customer on the "Basic" plan sees the same feature list. There is no plan-to-features mapping.
- The `useRequestRenewal` hook calls `POST /api/me/renewal-request` which creates a contact form entry. This is not a self-service renewal — it merely notifies the GreenVolt team. The button text "Renew Now" is misleading; it should say "Request Renewal" to match the backend behavior.

**Suggested Fixes:**
- Filter billing history to subscription-related payments only (e.g., by checking `description` contains "subscription" or "plan", or add a `type` column to payments).
- Create a `PLAN_FEATURES` map in constants and render features based on `subscription.plan`.
- Rename the "Renew Now" button text to "Request Renewal".

---

### Support (`apps/staff-app/app/(customer)/support.tsx`)

**Status:** 🟢 Working

**Issues:**
- **Lines 23–24**: Support form uses `fetch(\`${API_BASE_URL}/api/contact\`, { method: "POST" })` without an `Authorization` header. This hits the public `POST /api/contact` endpoint in `routes/index.ts` (line 26). This is intentional and works, but means:
  1. The support submission is not linked to the customer's account. There is no `customerId` in the contact table for staff to look up who submitted it.
  2. An unauthenticated attacker can spam the contact table.
- **Line 29** (`email: (profile as typeof profile & { email?: string })?.email ?? "customer@greenvolt.in"`): If profile email is null (e.g., a customer account created without email), the fallback is `"customer@greenvolt.in"` — a placeholder domain email. This would confuse staff trying to reply.
- No file/screenshot attachment capability for reporting technical issues.
- No confirmation of ticket ID or reference number shown to the user after submission — only a generic "submitted" alert.

**Suggested Fixes:**
- Send the support request to `POST /api/contact` with an `Authorization` header and include the customer's `customerId` in the body. Add a `customerId` field to the contact/support schema on the server.
- Replace the hardcoded fallback email with a validation — if no email is on file, prompt the user to enter one in the support form.

---

## API Route Issues

### `apps/api-server/src/routes/me.ts`

- **No `timeSlot` column in the database**: `timeSlot` is concatenated into the `notes` field on line 299–305. This means it is not retrievable as a structured field. The services list and detail screens cannot display the booked time slot cleanly.
- **`POST /api/me/book` accepts any `serviceType` string** (line 276) — there is no validation against the `SERVICE_CATALOG`. A customer could theoretically POST arbitrary service types (e.g., from a modified client), though this only affects their own bookings.
- **`GET /api/me/subscription`** only returns the most recent `active` subscription (line 117–127). If a customer has multiple subscriptions (e.g., an expired one and a new active one), it correctly returns the active one. If the customer has no active subscription it returns 404, and the client `useGetMySubscription` hook surfaces `undefined`. The subscription screen handles this with an empty state. Fine.
- **`POST /api/me/coupons/validate`** (line 203) — coupon validation is idempotent (does not mark usage). The usage is only recorded when the booking is confirmed. However, nothing prevents a race condition where two concurrent requests validate the same coupon just before usage limit is reached. Low risk for a small-scale system.
- **`GET /api/me/coupons`** (line 188) returns all active coupons to any authenticated customer. This may be intentional for surfacing available discounts, but it also reveals all coupon codes in the system.
- **Missing notification API endpoints**: There are no `PUT /api/me/email-alerts` or `PUT /api/me/sms-notifications` endpoints, so the Email Alerts and SMS Notifications toggles on the Profile screen have no corresponding server-side storage.

### `apps/api-server/src/routes/razorpay.ts`

- **`POST /api/me/razorpay/create-order`** (line 35–76): If Razorpay key is unconfigured, a 503 is returned. The client handles this with `err.error ?? "Could not initiate payment."` — the user sees "Payment gateway is not configured on this server." which is a sensible error.
- **Orphaned pending payment records**: If the user closes the Razorpay modal without completing payment, and the `payment.failed` webhook is not configured, the `paymentsTable` row created in `create-order` remains `status: "pending"` indefinitely. There is no cleanup mechanism.
- **Amount stored in paise for Razorpay, in rupees in DB**: `create-order` passes `Math.round(amount * 100)` to Razorpay (correct: Razorpay expects paise), but stores `String(amount)` in the DB (correct: rupees). The `verify` endpoint also stores `finalAmount` in rupees. Consistent, but a comment would help.
- **No idempotency key on order creation**: Multiple rapid taps of the "Pay" button before the mutation runs could create multiple Razorpay orders and payment records. The `useMutation` `isPending` flag in the client prevents this in normal usage, but is not server-enforced.

### `apps/api-server/src/routes/services.ts`

- **Line 218–239 (POST /)**: After `return res.status(201).json(service)` on line 218, the code on lines 220–239 (SMS notification + push notification) is unreachable dead code. This means newly created services via the admin route never trigger the SMS or push notification to the customer. Only services created via `POST /api/me/book` (in `me.ts`) and via `PUT /api/services/:id` (status change) send notifications.
- **`GET /api/services/:id/report` has no customer-ownership check**: Any authenticated user (including a customer) can fetch the PDF report for any service ID by guessing an integer. This allows data disclosure across customers.

### `apps/api-server/src/routes/payments.ts`

- Admin-only route (`/payments`) is protected by `requireAuth` but not by `requireRole("admin")`. Any authenticated user (staff, customer) who knows the endpoint could access all payment records. The `meRouter` in `me.ts` provides the customer-scoped payments endpoint correctly, but the admin `/payments` route lacks a role guard. (This is a staff-app backend issue but affects data accessible to all roles.)

### `apps/api-server/src/routes/contact.ts`

- The public `POST /api/contact` endpoint is correctly public. The duplicate handler in `routes/index.ts` line 26 shadows `contactRouter` for the POST method. Actually looking at the mount: `router.post("/contact", ...)` is registered in `index.ts` before `router.use("/contact", contactRouter)`. Express will match the first registered handler — meaning `POST /api/contact` is handled by the inline handler in `index.ts`, not by `contactRouter`. The inline handler is functionally identical (just inserts), so this works, but maintaining two near-identical handlers is error-prone.

### `apps/api-server/src/middleware/requireAuth.ts`

- `requireRole` (line 22–29) checks `req.user` but does not call `requireAuth` internally. It relies on `requireAuth` having been applied first. In `me.ts`, `router.use(requireRole("customer"))` is the first middleware (line 21). This works only because in `routes/index.ts`, `router.use(requireAuth)` is applied globally on line 70, before `router.use("/me", meRouter)` on line 104. If anyone ever adds a new sub-router or moves routes, this ordering dependency could break silently.

---

## Payment Flow Analysis

### Full Razorpay Flow

```
Customer taps "Pay ₹X"
    │
    ▼
[client] POST /api/me/razorpay/create-order { amount: finalTotal }
    │   Server creates a Razorpay order via API, records a paymentsTable
    │   row with status="pending" and razorpayOrderId, returns:
    │   { razorpayOrderId, amount (paise), currency, paymentId, keyId }
    │
    ▼
[client] RazorpayCheckout.open({ key, amount, order_id, ... })
    │   Native Razorpay SDK handles UPI/Card/NetBanking/Wallet UI
    │   Returns { razorpay_payment_id, razorpay_order_id, razorpay_signature }
    │   OR throws on cancellation/failure
    │
    ▼
[client] POST /api/me/razorpay/verify {
         razorpayPaymentId, razorpayOrderId, razorpaySignature,
         paymentId, serviceType, scheduledDate, timeSlot,
         notes, finalAmount, couponId?, discountApplied?
       }
    │   Server verifies HMAC-SHA256 signature
    │   Creates servicesTable row (status="pending")
    │   Updates paymentsTable row: status="paid", serviceId linked
    │   Records coupon usage if applicable
    │   Fires SMS confirmation (non-blocking)
    │   Returns { verified: true, bookingId, serviceId }
    │
    ▼
[client] router.replace("/(customer)/book/success", { bookingId, ... })
```

### Cash Flow

```
Customer taps "Confirm Booking"
    │
    ▼
[client] POST /api/me/book {
         serviceType, scheduledDate, timeSlot,
         notes, estimatedPrice, couponId?, discountApplied?
       }
    │   Server creates servicesTable row, records coupon usage,
    │   fires SMS (non-blocking). No payment record created.
    │   Returns { bookingId, service, message }
    │
    ▼
[client] router.replace("/(customer)/book/success", { bookingId, ... })
```

### What Is Broken / Missing

1. **RazorpayCheckout null in Expo Go**: All non-cash payment methods silently fail with an error message. The UI does not reflect this limitation upfront.
2. **Orphaned pending payment records**: If the user cancels the Razorpay modal, the `paymentsTable` row created by `create-order` stays as `pending` forever (unless `payment.failed` webhook fires). No cleanup is done.
3. **No refund flow**: There is no client screen or API endpoint for customer-initiated refund requests. The `status: "refunded"` enum exists in the payments table but is only settable by admin.
4. **Pending dues "Pay Now" is non-functional**: The Payments screen shows a "Pay Now" button for pending-status payments, but the button only shows an informational Alert.
5. **No payment receipt/invoice**: After a successful payment, the success screen shows total amount paid, but there is no email receipt, downloadable invoice, or payment reference number visible to the customer.
6. **Coupon hints are hardcoded**: `SOLAR10` and `FIRSTSERVICE` codes are mentioned in the UI. If these are not seeded in the database, the user will see an error when trying them.

---

## Cross-Cutting Issues

1. **`city` vs `address` field confusion**: The DB has both `city` and `address` columns on `customersTable`. The Profile screen reads `city ?? address` for display and saves to `address` when the user edits. The Home screen shows `profile.city`. Other screens may use `address`. There is inconsistent semantics.
2. **All notifications in `services.ts` POST route are unreachable dead code** (after `return res.status(201)`): newly admin-created service bookings never fire any customer notification.
3. **`timeSlot` is not a first-class DB field** — it is stuffed into the `notes` string. This makes it impossible to display, sort by, or filter on time slots without string parsing.
4. **Token exposure in PDF download URL** — using `?token=JWT` in a URL is insecure. This is acknowledged in a comment in `requireAuth.ts` but the risk is real in production.
5. **No global error boundary for API failures** — the root layout has an `<ErrorBoundary>` but individual screens use `if (isError) return <ErrorState>` patterns. Unhandled promise rejections (e.g., in support.tsx) could bubble up without user feedback.
6. **TypeScript type casts proliferating** — multiple screens cast profile fields with `as typeof profile & { city?: string; email?: string; pushEnabled?: boolean }`. This indicates the shared `api-client-react` types do not match the actual API response shape. The types should be updated to include these fields.
7. **No internet connectivity handling in the booking flow** — the `OfflineBanner` component handles display, but if the user loses connectivity mid-booking (after date selection, before confirming), no error is shown and the fetch will silently fail (the `useMutation` `onError` catches it eventually, but the error message is generic).
8. **`services/[id].tsx` uses `useGetMyService(serviceId)` which maps to `GET /api/me/services/:id`** — this correctly scopes to the customer's own services, and the server verifies ownership. This is the correct pattern. However, `downloadReport` (line 42) calls `GET /api/services/:id/report` (the admin route) without the `/me/` prefix and without an ownership check. Inconsistency and security gap.

---

## Priority Fix List

| Priority | Screen/Area | Issue | Fix |
|----------|-------------|-------|-----|
| P0 | `services/[id].tsx` | PDF report URL exposes JWT token in plaintext in browser | Add a `POST /api/me/services/:id/report-token` short-lived token endpoint; use that URL instead |
| P0 | `services/[id].tsx` + `services.ts` | No ownership check on `GET /api/services/:id/report` — any customer can fetch another's report | Add `customerId` filter to the report query |
| P0 | `payments.tsx` | "Pay Now" button for pending dues shows only an Alert — not functional | Implement actual payment flow (Razorpay or redirect to subscription renewal) |
| P0 | `services.ts` POST | Notification code is unreachable dead code (after `return`) | Move notification code before `return` or extract to async side-effect |
| P1 | `razorpay.ts` | Orphaned `pending` payment records when Razorpay modal is cancelled | Add a cleanup cron or update status on subsequent `create-order` for same customer/amount |
| P1 | `book/[id].tsx` | `toISOString()` gives UTC date — booking for IST users in morning shows wrong date | Use local date construction: `YYYY-MM-DD` from local getFullYear/Month/Date |
| P1 | `profile.tsx` | Email Alerts and SMS Notifications toggles are UI-only; not persisted | Add `PUT /api/me/notifications` body params for `emailAlerts` + `smsAlerts`; wire toggles |
| P1 | `profile.tsx` | City field sends to `address` column; display reads from `city` column | Standardize: send `city` key in profile update, or always use `address` |
| P1 | `profile.tsx` | Readonly email field remains visible in edit mode (duplicate field) | Hide readonly email block when `editing === true` |
| P1 | `payments.tsx` | "+12.5% vs last month" trend is hardcoded | Calculate real month-over-month or remove |
| P1 | `payments.tsx` | "Load More" shows Alert; no real pagination | Implement page-based fetching or remove the button |
| P2 | `subscription.tsx` | Billing history shows all payments, not subscription ones | Filter payments by type/description or add a `type` enum to payments |
| P2 | `subscription.tsx` | Hardcoded feature list regardless of plan | Map plan name → features in a config constant |
| P2 | `subscription.tsx` | "Renew Now" button text misleads — it only submits a contact request | Rename to "Request Renewal" |
| P2 | `services/index.tsx` | Active service cards hardcode "10:00 AM" time slot | Parse timeSlot from notes string, or add `timeSlot` as a proper DB column |
| P2 | `book/review.tsx` | No feedback that UPI/Card/Wallet require dev build when RazorpayCheckout is null | Show a lock/badge on non-cash methods in Expo Go |
| P2 | `services/[id].tsx` | "Assigned" stepper dot fills even when no technician assigned | Gate the "Assigned" dot on `service.staff !== null` |
| P2 | `book/success.tsx` | `Number(total)` can be NaN if param missing | Add `isNaN` guard with "—" fallback |
| P3 | `payments.ts` (admin) | `GET /payments` route lacks `requireRole("admin")` guard | Add `requireRole("admin", "staff")` middleware |
| P3 | `support.tsx` | Contact submission not linked to customer account | Send `Authorization` header and include `customerId` in body |
| P3 | `profile.tsx` | "ONLINE" badge is hardcoded | Remove or wire to a real system health endpoint |
| P3 | TypeScript types | Multiple `as typeof profile & { city?; email?; pushEnabled? }` casts | Update the `api-client-react` type definitions to include all returned fields |
| P3 | `book/index.tsx` | Nested `TouchableOpacity` inside card (double navigation risk on Android) | Remove inner "Book Now" button or convert outer card to a plain `View` |
| P3 | `services/_layout.tsx` / `book/_layout.tsx` | Dark-green default header flashes before per-screen white override | Set default header to white in both layouts |
