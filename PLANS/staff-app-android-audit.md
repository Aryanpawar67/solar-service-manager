# staff-app Android audit — outstanding items

Audit date: 2026-07-17. Two items from this audit were already fixed directly (not listed here):
- Reverted an uncommitted `apps/api-server/.env.example` change that had leaked a real production Supabase `DATABASE_URL` with plaintext password.
- Fixed `newArchEnabled` in `apps/staff-app/app.json` — it was nested under `experiments` where Expo's config-plugin never reads it, so `android/gradle.properties` kept generating with `newArchEnabled=true` despite commit `80de2ff` intending to disable it for `react-native-razorpay` compatibility. Moved to top-level `expo.newArchEnabled` and re-ran `expo prebuild --platform android --clean` to confirm `gradle.properties` now has `newArchEnabled=false`.

Everything below is still open.

## Config / repo hygiene

- **`apps/staff-app/android/` is untracked but not gitignored.** It's a genuine `expo prebuild` output (confirmed via timestamps and generated-file fingerprints), not hand-maintained, but nothing excludes it from git — it's untracked by accident, not by design. Decide: managed workflow (add `apps/staff-app/android/` and `apps/staff-app/ios/` to `.gitignore`, regenerate via prebuild/EAS) vs. bare workflow (commit it). Given `app.config.js` + config-plugins architecture, managed is the better fit.
- **Stray root-level `app.json` (`{"expo":{}}`) and root `.env.example`** look like accidental artifacts from running an `expo`/`eas` command from the repo root instead of `apps/staff-app/`. There's also a committed, unused root-level `eas.json` despite no Expo project living at the repo root — likely leftover from the same mistake. Worth deleting after confirming nothing depends on them.

## Missing / incomplete features

- **No admin payments management screen on mobile.** `apps/api-server/src/routes/payments.ts` has full list/export/detail endpoints, but the mobile app only exposes payments to customers (`(customer)/payments.tsx`). Presumably covered by a web admin dashboard instead — confirm that's intentional.
- **`app/(admin)/customers/[id].tsx:118`** — "Filter" button is a stub: `Alert.alert("Filter", "Filter by status coming soon")`.
- Per the app's own `apps/staff-app/TODO.md`: no real device testing done yet (Milestone 2 entirely unchecked), no Play Store listing/assets/privacy policy (Milestone 4 entirely unchecked), no production `.aab` built yet.
- **`TODO.md` is internally inconsistent** about EAS setup — the running log claims `eas login`/`eas init` are done, but the "Play Store Readiness Checklist" table at the bottom marks both ❌. Verify actual EAS account/build state live rather than trusting either claim.
- Confirm `google-services.json` currently checked into the project is a real production Firebase config and not the dev placeholder (`google-services.json.example` also exists alongside it).

## API integration notes (not bugs, but worth tracking)

- `/api/analytics/dashboard` deliberately always returns `recentPayments: []` (comment in `analytics.ts`: full `SELECT *` on payments breaks when Razorpay columns aren't yet in DB). Harmless today since the mobile analytics screen doesn't render `recentPayments`, but a footgun if that field is ever wired up to a UI expecting real data.
- The Orval-generated API client (`lib/api-client-react/src/generated/api.ts`) is stale (dated Apr 9) relative to the analytics overhaul in `7c5dec2`; the team compensated by hand-editing `api.schemas.ts` to add the 8 new `DashboardAnalytics` fields. This currently matches the backend correctly, but a future real codegen run (`orval`) will silently drop these manual edits unless the generator config/schema source is updated first.

## Verified as NOT broken (no action needed)

- Four recent fix commits are all genuinely present in code: Metro pnpm symlink resolution (`0a6a84e`), false-offline-banner on Render cold-start (`48e270a`), 30s login timeout (`3df0d8b`), missing direct deps (`0a6a84e`).
- Auth, staff/admin/customer portal screens, job scheduling, subscriptions, notifications, offline handling, and error boundaries (`ErrorBoundary` + Sentry) are all implemented and match backend routes.
- Hand-maintained `me.ts` API client and `PaymentStatus` enum fix (`'success'` → `'paid'`, added `'refunded'`) are correctly reflected on both mobile and backend.
