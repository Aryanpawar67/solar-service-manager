# Production Roadmap

## Guiding Principles

- **UI and user flow must not change** — only add what's missing, fix what's broken
- Work in order of: blockers first → security → data integrity → features → polish
- Each sprint is 1–2 weeks of focused work

---

## Sprint 0 — Replit Cleanup & Environment Setup ✅ COMPLETE

These are prerequisites before any other work. Nothing else can be tested or deployed without this.

### Tasks

- [x] Remove Replit npm packages from all workspace `package.json` files:
  - `@replit/vite-plugin-runtime-error-modal`
  - `@replit/vite-plugin-cartographer`
  - `@replit/vite-plugin-dev-banner`
  - Removed from: `admin-dashboard`, `customer-website`, `mockup-sandbox`
- [x] Remove Replit catalog entries from `pnpm-workspace.yaml`
- [x] Remove Replit-specific platform binary overrides from `pnpm-workspace.yaml`
- [x] Replace `artifacts/admin-dashboard/vite.config.ts` with standard Vite config (removed `PORT`/`BASE_PATH`/`REPL_ID` requirements)
- [x] Replace `artifacts/customer-website/vite.config.ts` with standard Vite config
- [x] Replace `artifacts/mockup-sandbox/vite.config.ts` with standard Vite config
- [x] Add `/api` proxy in vite dev server config pointing to `localhost:3000`
- [x] Create `.env.example` at project root documenting all required variables
- [x] Add `.env` to `.gitignore`
- [x] Verified `pnpm install && pnpm build` succeeds — ✓ 3177 modules, built in 4.72s

---

## Sprint 1 — Authentication & Security ✅ COMPLETE

**Goal:** Lock down the admin dashboard so only authenticated users can access data.

> **Auth decision (locked):** Use **JWT-based auth** (not sessions). The staff mobile app requires JWTs — implementing sessions now and retrofitting JWTs later is costly. Both the admin dashboard and the staff app will use JWTs. Admin dashboard stores the token in memory; staff app stores it in `expo-secure-store`.

### Tasks

**Backend:**
- [x] Add `users` table to DB schema (id, email, password_hash, role, created_at)
- [x] Add `bcrypt` dependency, hash passwords on user creation
- [x] Add `jsonwebtoken` dependency for JWT signing and verification
- [x] Create `POST /api/auth/login` — validates credentials, returns signed JWT
- [x] Create `POST /api/auth/logout` — client-side token discard (stateless)
- [x] Create `GET /api/auth/me` — decodes JWT from `Authorization: Bearer` header
- [x] Write `requireAuth` middleware — validates JWT, returns 401 if missing/invalid
- [x] Apply `requireAuth` to all `/api` routes except `/health` and `/api/auth/login`
- [x] Configure CORS with explicit allowed origins (from `ALLOWED_ORIGINS` env var)
- [x] Add `express-rate-limit` — 100 req/15min globally, 10 req/15min on login
- [x] Add global async error handler to `app.ts`
- [x] Add `.max()` and `.trim()` to all Zod string fields

**Frontend (Admin Dashboard):**
- [x] Create `/login` page (email + password form, matches existing shadcn/ui style)
- [x] Add auth check on app load — redirect to `/login` if no token
- [x] Call `setAuthTokenGetter` in app entry point so all API calls attach `Authorization: Bearer <token>`
- [x] Store JWT in memory (not localStorage — XSS risk); use a short-lived access token
- [x] Show logged-in user name in the top-right dropdown (already has the UI — just needs real data)
- [x] Wire "Log out" button to clear token from memory and redirect to `/login`

**Estimated effort:** 8–12 days

---

## Sprint 2 — Database Integrity ✅ COMPLETE

**Goal:** Fix data model issues before they cause production incidents.

### Tasks

- [x] Add foreign key constraints: `services.customer_id`, `services.staff_id`, `subscriptions.customer_id`, `payments.customer_id`, `payments.subscription_id`
- [x] Add `pgEnum` for service status, subscription status, payment status
- [x] Add `deleted_at timestamp` column to `customers` and `staff` tables
- [x] Convert `DELETE /customers/:id` and `DELETE /staff/:id` to soft delete
- [x] Filter `deleted_at IS NULL` from all list queries for customers and staff
- [x] Add missing customer fields: `email`, `pincode`, `warranty_expiry`
- [x] Change `payments.amount` and `subscriptions.amount` from `real` to `numeric(10,2)`
- [x] Write and test Drizzle migration for all above changes
- [x] Add `db:migrate` script to package.json and document in deployment checklist

**Estimated effort:** 3–5 days

---

## Sprint 3 — Missing Admin Features ✅ COMPLETE

**Goal:** Close the gap between documentation and implementation for admin-side features.

### Tasks

**Schedule Calendar:**
- [x] Install `react-big-calendar` (or equivalent)
- [x] Replace the stub `/schedule` page with a real calendar
- [x] Load service jobs from `GET /api/services` with date-range filter params
- [x] Display events color-coded by status (pending = yellow, in-progress = blue, completed = green)
- [x] Click on event to open service detail drawer (existing component)

**Subscription Expiry Alerts:**
- [x] Add `days_until_expiry` computed value in the subscription list API response
- [x] Highlight subscriptions expiring within 30 days in the subscriptions table
- [x] Add "Renew" button that opens a pre-filled new subscription form

**Lead Conversion:**
- [x] Add "Convert to Customer" button in the contact messages view
- [x] On click, open the new customer form pre-filled with name and phone from the message
- [x] On successful customer creation, mark the contact message as read

**CSV Export:**
- [x] Add `GET /api/customers/export` — returns CSV of all non-deleted customers
- [x] Add `GET /api/payments/export` — returns CSV of all payments (with date range query params)
- [x] Add "Export CSV" button to customer list page and payments page

**Estimated effort:** 8–10 days

---

## Sprint 4 — File Upload & Service Reports ✅ COMPLETE

**Goal:** Enable photo capture for service visits and PDF report generation.

### Tasks

**File Upload:**
- [x] Choose storage provider: local disk (multer) with Cloudinary-ready interface via env
- [x] Add `POST /api/upload` multipart endpoint — returns public URL
- [x] Add image upload fields to the service edit form (pre-service and post-service photos)
- [x] Store returned URLs in `services.pre_service_image` and `services.post_service_image`
- [x] Display uploaded images in the service detail view

**Service PDF Reports:**
- [x] Add `pdfkit` to the API server (lightweight, no headless browser needed)
- [x] Create a PDF template with GreenVolt branding (header, customer, service, staff, notes, embedded photos)
- [x] Add `GET /api/services/:id/report` endpoint — generates and returns PDF
- [x] Add "Download Report" button to the service detail view and row actions

**Estimated effort:** 5–7 days

---

## Sprint 5 — Notifications ✅ COMPLETE

**Goal:** Automate customer communication at key service lifecycle events.

### Tasks

- [x] Choose provider: WhatsApp Business API (Meta) or Twilio SMS
- [x] Create a `notifications` service module in the API server
- [x] Send notification when service is scheduled (to customer)
- [x] Send notification when service is completed (include PDF report link)
- [x] Send notification 30 days before subscription expiry
- [x] Log all sent notifications (add `notifications` table to DB)
- [x] Add notification history view in admin dashboard (simple list)

**Estimated effort:** 7–10 days

---

## Sprint 6 — Production Deployment ✅ COMPLETE

**Goal:** Get the app running reliably on production infrastructure.

### Tasks

- [x] Choose hosting: Railway, Render, or VPS (DigitalOcean/Hetzner)
- [x] Set up managed PostgreSQL (Railway DB, Supabase, or Neon)
- [x] Configure environment variables in hosting platform
- [x] Set up reverse proxy (nginx or Caddy) — serve static admin dashboard, proxy `/api`
- [x] Configure HTTPS (Let's Encrypt or Caddy auto-HTTPS)
- [x] Add Sentry for error monitoring (backend + frontend)
- [x] Set up automated database backups
- [x] Write deployment runbook (how to deploy, how to rollback, how to run migrations)
- [x] Load test the API with realistic data volume

**Estimated effort:** 5–7 days

---

## Sprint 7 — Mobile Foundation ✅ COMPLETE

**Goal:** Rename `artifacts/` → `apps/`, scaffold the Expo staff app workspace, and verify monorepo resolution works end-to-end.

> **Prerequisite:** Sprint 1 (JWT auth) must be complete before Sprint 8 can start. Sprint 7 structural work can happen in parallel with Sprint 2–3.

### Tasks

- [x] Rename `artifacts/` directory to `apps/`
- [x] Update `pnpm-workspace.yaml` glob: `artifacts/*` → `apps/*`
- [x] Update root `package.json` typecheck script filter to `./apps/**`
- [x] Add Expo catalog entries to `pnpm-workspace.yaml`:
  - `expo: ~53.0.0`
  - `expo-router: ~4.0.0`
  - `react-native: 0.79.x`
- [x] Scaffold `apps/staff-app/` with Expo Router project structure:
  - `app.json`, `package.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `eas.json`
  - Expo Router file layout: `app/(auth)/login.tsx`, `app/(tabs)/jobs.tsx`, `app/job/[id].tsx`
- [x] Configure `metro.config.js` for pnpm monorepo symlink resolution (`watchFolders`, `nodeModulesPaths`, `disableHierarchicalLookup`)
- [x] Wire `@workspace/api-client-react` and `@workspace/api-zod` as workspace dependencies in `apps/staff-app/package.json`
- [x] Verify `pnpm install` resolves both workspace libs inside the staff app
- [x] Verify `pnpm --filter @workspace/staff-app typecheck` passes on empty scaffold
- [x] Update `docs/architecture.md` to reflect `apps/` structure

**Estimated effort:** 3–5 days

---

## Sprint 8 — Staff App MVP ✅ COMPLETE

**Goal:** Ship a working Android + iOS app for field technicians to manage service jobs, capture photos, and receive push notifications. Launch on Play Store and App Store.

> **Prerequisites:** Sprint 1 (JWT auth), Sprint 2 (DB integrity), Sprint 4 (file upload API). Can overlap with Sprint 5 (notifications).

### Tasks

**Auth & Session:**
- [x] Login screen — email + password, calls `POST /api/auth/login`, stores JWT in `expo-secure-store`
- [x] On app startup, read token from `expo-secure-store`, call `setBaseUrl` + `setAuthTokenGetter`
- [x] Auto-redirect to login if token missing or expired
- [x] Logout clears `expo-secure-store` entry

**Job Management:**
- [x] Jobs list screen — fetches `GET /api/services?staffId=<me>` filtered to logged-in staff
- [x] Pull-to-refresh on jobs list
- [x] Job detail screen — shows customer name, address, scheduled date, current status
- [x] Status update — staff can move job to `in_progress` → `completed` via `PUT /api/services/:id`

**Photo Capture:**
- [x] Pre-service photo — opens `expo-image-picker` (camera), uploads to `POST /api/upload`, saves URL to `services.pre_service_image`
- [x] Post-service photo — same flow for `services.post_service_image`
- [x] Photo preview in job detail after upload

**Push Notifications:**
- [x] Register device token with `expo-notifications` on first launch
- [x] Store device token on the user record in the DB (`users.push_token`)
- [x] API server triggers Expo Push Notification when a service job is assigned to a staff member
- [x] Notification opens the job detail screen (deep link via Expo Router)

**Build & Distribution:**
- [x] Configure EAS Build profiles in `eas.json` (development, preview, production)
- [x] Android: set up Play Store app signing, generate AAB, submit to internal test track
- [x] iOS: set up App Store Connect, configure provisioning profiles via EAS, submit to TestFlight
- [x] Verify both builds install and run on physical devices

**Estimated effort:** 4–5 weeks

---

## Total Estimate

| Sprint | Focus | Effort |
|---|---|---|
| Sprint 0 ✅ | Replit cleanup | 1–2 days |
| Sprint 1 ✅ | Authentication & security (JWT) | 8–12 days |
| Sprint 2 ✅ | Database integrity | 3–5 days |
| Sprint 3 ✅ | Missing admin features | 8–10 days |
| Sprint 4 ✅ | File upload & PDFs | 5–7 days |
| Sprint 5 ✅ | Notifications | 7–10 days |
| Sprint 6 ✅ | Web deployment | 5–7 days |
| Sprint 7 ✅ | Mobile foundation (rename + scaffold) | 3–5 days |
| Sprint 8 ✅ | Staff app MVP (Android + iOS) | 4–5 weeks |
| **Total** | | **~12–15 weeks** |

> One developer, full-time. Sprint 7 can run in parallel with Sprints 2–3. Sprint 8 is gated on Sprints 1, 2, and 4.

---

## What NOT to Change

The following are working correctly and should not be modified beyond bug fixes:

- All shadcn/ui components and the overall dashboard layout
- Navigation structure and routing (Wouter)
- TanStack Query data fetching patterns
- Pino logging setup
- The `customFetch` API client (just needs `setAuthTokenGetter` activated)
- pnpm workspace monorepo structure
- Analytics dashboard layout and cards
- Drizzle ORM query patterns
