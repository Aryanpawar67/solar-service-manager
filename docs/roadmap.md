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

## Sprint 1 — Authentication & Security (1–2 weeks)

**Goal:** Lock down the admin dashboard so only authenticated users can access data.

> **Auth decision (locked):** Use **JWT-based auth** (not sessions). The staff mobile app requires JWTs — implementing sessions now and retrofitting JWTs later is costly. Both the admin dashboard and the staff app will use JWTs. Admin dashboard stores the token in memory; staff app stores it in `expo-secure-store`.

### Tasks

**Backend:**
- [ ] Add `users` table to DB schema (id, email, password_hash, role, created_at)
- [ ] Add `bcrypt` dependency, hash passwords on user creation
- [ ] Add `jsonwebtoken` dependency for JWT signing and verification
- [ ] Create `POST /api/auth/login` — validates credentials, returns signed JWT
- [ ] Create `POST /api/auth/logout` — client-side token discard (stateless)
- [ ] Create `GET /api/auth/me` — decodes JWT from `Authorization: Bearer` header
- [ ] Write `requireAuth` middleware — validates JWT, returns 401 if missing/invalid
- [ ] Apply `requireAuth` to all `/api` routes except `/health` and `/api/auth/login`
- [ ] Configure CORS with explicit allowed origins (from `ALLOWED_ORIGINS` env var)
- [ ] Add `express-rate-limit` — 100 req/15min globally, 10 req/15min on login
- [ ] Add global async error handler to `app.ts`
- [ ] Add `.max()` and `.trim()` to all Zod string fields

**Frontend (Admin Dashboard):**
- [ ] Create `/login` page (email + password form, matches existing shadcn/ui style)
- [ ] Add auth check on app load — redirect to `/login` if no token
- [ ] Call `setAuthTokenGetter` in app entry point so all API calls attach `Authorization: Bearer <token>`
- [ ] Store JWT in memory (not localStorage — XSS risk); use a short-lived access token
- [ ] Show logged-in user name in the top-right dropdown (already has the UI — just needs real data)
- [ ] Wire "Log out" button to clear token from memory and redirect to `/login`

**Estimated effort:** 8–12 days

---

## Sprint 2 — Database Integrity (3–5 days)

**Goal:** Fix data model issues before they cause production incidents.

### Tasks

- [ ] Add foreign key constraints: `services.customer_id`, `services.staff_id`, `subscriptions.customer_id`, `payments.customer_id`, `payments.subscription_id`
- [ ] Add `pgEnum` for service status, subscription status, payment status
- [ ] Add `deleted_at timestamp` column to `customers` and `staff` tables
- [ ] Convert `DELETE /customers/:id` and `DELETE /staff/:id` to soft delete
- [ ] Filter `deleted_at IS NULL` from all list queries for customers and staff
- [ ] Add missing customer fields: `email`, `pincode`, `warranty_expiry`
- [ ] Change `payments.amount` and `subscriptions.amount` from `real` to `numeric(10,2)`
- [ ] Write and test Drizzle migration for all above changes
- [ ] Add `db:migrate` script to package.json and document in deployment checklist

**Estimated effort:** 3–5 days

---

## Sprint 3 — Missing Admin Features (1–2 weeks)

**Goal:** Close the gap between documentation and implementation for admin-side features.

### Tasks

**Schedule Calendar:**
- [ ] Install `react-big-calendar` (or equivalent)
- [ ] Replace the stub `/schedule` page with a real calendar
- [ ] Load service jobs from `GET /api/services` with date-range filter params
- [ ] Display events color-coded by status (pending = yellow, in-progress = blue, completed = green)
- [ ] Click on event to open service detail drawer (existing component)

**Subscription Expiry Alerts:**
- [ ] Add `days_until_expiry` computed value in the subscription list API response
- [ ] Highlight subscriptions expiring within 30 days in the subscriptions table
- [ ] Add "Renew" button that opens a pre-filled new subscription form

**Lead Conversion:**
- [ ] Add "Convert to Customer" button in the contact messages view
- [ ] On click, open the new customer form pre-filled with name and phone from the message
- [ ] On successful customer creation, mark the contact message as read

**CSV Export:**
- [ ] Add `GET /api/customers/export` — returns CSV of all non-deleted customers
- [ ] Add `GET /api/payments/export` — returns CSV of all payments (with date range query params)
- [ ] Add "Export CSV" button to customer list page and payments page

**Estimated effort:** 8–10 days

---

## Sprint 4 — File Upload & Service Reports (1 week)

**Goal:** Enable photo capture for service visits and PDF report generation.

### Tasks

**File Upload:**
- [ ] Choose storage provider: Cloudinary (simplest) or AWS S3
- [ ] Add `POST /api/upload` multipart endpoint — returns public URL
- [ ] Add image upload fields to the service edit form (pre-service and post-service photos)
- [ ] Store returned URLs in `services.pre_service_image` and `services.post_service_image`
- [ ] Display uploaded images in the service detail view

**Service PDF Reports:**
- [ ] Add `@react-pdf/renderer` or `puppeteer` to the API server
- [ ] Create a PDF template matching the GreenVolt brand (logo, service details, photos, technician signature section)
- [ ] Add `GET /api/services/:id/report` endpoint — generates and returns PDF
- [ ] Add "Download Report" button to the service detail view

**Estimated effort:** 5–7 days

---

## Sprint 5 — Notifications (1–2 weeks)

**Goal:** Automate customer communication at key service lifecycle events.

### Tasks

- [ ] Choose provider: WhatsApp Business API (Meta) or Twilio SMS
- [ ] Create a `notifications` service module in the API server
- [ ] Send notification when service is scheduled (to customer)
- [ ] Send notification when service is completed (include PDF report link)
- [ ] Send notification 30 days before subscription expiry
- [ ] Log all sent notifications (add `notifications` table to DB)
- [ ] Add notification history view in admin dashboard (simple list)

**Estimated effort:** 7–10 days

---

## Sprint 6 — Production Deployment (1 week)

**Goal:** Get the app running reliably on production infrastructure.

### Tasks

- [ ] Choose hosting: Railway, Render, or VPS (DigitalOcean/Hetzner)
- [ ] Set up managed PostgreSQL (Railway DB, Supabase, or Neon)
- [ ] Configure environment variables in hosting platform
- [ ] Set up reverse proxy (nginx or Caddy) — serve static admin dashboard, proxy `/api`
- [ ] Configure HTTPS (Let's Encrypt or Caddy auto-HTTPS)
- [ ] Add Sentry for error monitoring (backend + frontend)
- [ ] Set up automated database backups
- [ ] Write deployment runbook (how to deploy, how to rollback, how to run migrations)
- [ ] Load test the API with realistic data volume

**Estimated effort:** 5–7 days

---

## Sprint 7 — Mobile Foundation (3–5 days)

**Goal:** Rename `artifacts/` → `apps/`, scaffold the Expo staff app workspace, and verify monorepo resolution works end-to-end.

> **Prerequisite:** Sprint 1 (JWT auth) must be complete before Sprint 8 can start. Sprint 7 structural work can happen in parallel with Sprint 2–3.

### Tasks

- [ ] Rename `artifacts/` directory to `apps/`
- [ ] Update `pnpm-workspace.yaml` glob: `artifacts/*` → `apps/*`
- [ ] Update root `package.json` typecheck script filter to `./apps/**`
- [ ] Add Expo catalog entries to `pnpm-workspace.yaml`:
  - `expo: ~53.0.0`
  - `expo-router: ~4.0.0`
  - `react-native: 0.79.x`
- [ ] Scaffold `apps/staff-app/` with Expo Router project structure:
  - `app.json`, `package.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `eas.json`
  - Expo Router file layout: `app/(auth)/login.tsx`, `app/(tabs)/jobs.tsx`, `app/(tabs)/job/[id].tsx`
- [ ] Configure `metro.config.js` for pnpm monorepo symlink resolution (`watchFolders`, `nodeModulesPaths`, `disableHierarchicalLookup`)
- [ ] Wire `@workspace/api-client-react` and `@workspace/api-zod` as workspace dependencies in `apps/staff-app/package.json`
- [ ] Verify `pnpm install` resolves both workspace libs inside the staff app
- [ ] Verify `pnpm --filter @workspace/staff-app typecheck` passes on empty scaffold
- [ ] Update `docs/architecture.md` to reflect `apps/` structure

**Estimated effort:** 3–5 days

---

## Sprint 8 — Staff App MVP (4–5 weeks)

**Goal:** Ship a working Android + iOS app for field technicians to manage service jobs, capture photos, and receive push notifications. Launch on Play Store and App Store.

> **Prerequisites:** Sprint 1 (JWT auth), Sprint 2 (DB integrity), Sprint 4 (file upload API). Can overlap with Sprint 5 (notifications).

### Tasks

**Auth & Session:**
- [ ] Login screen — email + password, calls `POST /api/auth/login`, stores JWT in `expo-secure-store`
- [ ] On app startup, read token from `expo-secure-store`, call `setBaseUrl` + `setAuthTokenGetter`
- [ ] Auto-redirect to login if token missing or expired
- [ ] Logout clears `expo-secure-store` entry

**Job Management:**
- [ ] Jobs list screen — fetches `GET /api/services?staffId=<me>` filtered to logged-in staff
- [ ] Pull-to-refresh on jobs list
- [ ] Job detail screen — shows customer name, address, scheduled date, current status
- [ ] Status update — staff can move job to `in_progress` → `completed` via `PUT /api/services/:id`

**Photo Capture:**
- [ ] Pre-service photo — opens `expo-camera`, uploads to `POST /api/upload`, saves URL to `services.pre_service_image`
- [ ] Post-service photo — same flow for `services.post_service_image`
- [ ] Photo preview in job detail after upload

**Push Notifications:**
- [ ] Register device token with `expo-notifications` on first launch
- [ ] Store device token on the user record in the DB
- [ ] API server triggers Expo Push Notification when a service job is assigned to a staff member
- [ ] Notification opens the job detail screen (deep link via Expo Router)

**Build & Distribution:**
- [ ] Configure EAS Build profiles in `eas.json` (development, preview, production)
- [ ] Android: set up Play Store app signing, generate AAB, submit to internal test track
- [ ] iOS: set up App Store Connect, configure provisioning profiles via EAS, submit to TestFlight
- [ ] Verify both builds install and run on physical devices

**Estimated effort:** 4–5 weeks

---

## Total Estimate

| Sprint | Focus | Effort |
|---|---|---|
| Sprint 0 ✅ | Replit cleanup | 1–2 days |
| Sprint 1 | Authentication & security (JWT) | 8–12 days |
| Sprint 2 | Database integrity | 3–5 days |
| Sprint 3 | Missing admin features | 8–10 days |
| Sprint 4 | File upload & PDFs | 5–7 days |
| Sprint 5 | Notifications | 7–10 days |
| Sprint 6 | Web deployment | 5–7 days |
| Sprint 7 | Mobile foundation (rename + scaffold) | 3–5 days |
| Sprint 8 | Staff app MVP (Android + iOS) | 4–5 weeks |
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
