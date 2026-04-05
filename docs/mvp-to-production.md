# MVP to Production — Gap Analysis

## Scope

This document covers the **admin dashboard** and **core API** (Sprints 1–6).  
The staff mobile app (Android + iOS) is covered in **Sprint 7–8** of `roadmap.md`.  
Public customer website is out of scope.

---

## What Is Working (Keep As-Is)

These parts are solid and should not be rearchitected:

- Express REST API with full CRUD for all 6 entities
- React admin dashboard with shadcn/ui components — retain all UI exactly
- TanStack Query for data fetching and cache management
- Zod validation schemas shared between frontend and backend (`@workspace/api-zod`)
- Drizzle ORM + PostgreSQL (good foundation, needs constraint fixes)
- pnpm monorepo workspace structure
- Analytics dashboard pulling real data from DB
- Paginated customer list with search
- `customFetch` client with bearer token infrastructure (just needs activation)

---

## Incompatibilities: Documented vs Implemented

### 1. Soft Delete — Hard Delete Instead

**Documented:** Customers and staff should be soft-deleted (records retained for history)  
**Actual:** `DELETE /api/customers/:id` issues a hard SQL `DELETE`  
**File:** `artifacts/api-server/src/routes/customers.ts:64`  
**Risk:** Permanent data loss; service/payment history becomes orphaned  
**Fix:** Add `deleted_at` column, convert DELETE routes to set this field, filter deleted records from all list queries

---

### 2. Schedule Calendar — Stub Only

**Documented:** Visual calendar showing scheduled services by staff member and date  
**Actual:** Route `/schedule` exists in navigation but the page renders no calendar UI  
**Risk:** Admins cannot visualize workload or spot scheduling conflicts  
**Fix:** Implement a calendar view (e.g. `react-big-calendar` or `@fullcalendar/react`) consuming the existing `GET /api/services` endpoint filtered by date range

---

### 3. Service Report PDFs — Not Started

**Documented:** Generate a PDF report after each service visit (customer copy)  
**Actual:** Zero code — no PDF generation library, no endpoint, no UI trigger  
**Risk:** Cannot provide proof-of-service to customers  
**Fix:** Add `puppeteer` or `@react-pdf/renderer` to the API server; create `GET /api/services/:id/report` endpoint

---

### 4. Lead Management / Conversion — Display Only

**Documented:** Contact form submissions can be converted into customers (lead pipeline)  
**Actual:** Contact messages are listed and can be marked read, but there is no "Convert to Customer" action  
**Risk:** Leads from the website contact form must be manually re-entered  
**Fix:** Add a "Convert to Customer" button in the contact/messages view that pre-populates the new customer form with the lead's name and phone

---

### 5. CSV / Data Export — Not Implemented

**Documented:** Admin can export customer list, payment records  
**Actual:** No export functionality anywhere  
**Fix:** Add `GET /api/customers/export` and `GET /api/payments/export` endpoints that return CSV; add export buttons to the respective list pages

---

### 6. AMC Subscription Expiry Tracking — Incomplete

**Documented:** System should flag subscriptions nearing expiry and allow renewal  
**Actual:** Basic CRUD for subscriptions exists; no expiry alerts, no renewal workflow  
**Risk:** Admins miss renewal windows; customers lose active AMC coverage without notice  
**Fix:**
- Add a computed `days_until_expiry` field to the subscription list query
- Highlight expiring-soon rows in the UI (within 30 days)
- Add a "Renew" action that creates a new subscription with updated dates

---

### 7. Service Photo Upload — Schema Exists, Endpoint Missing

**Documented:** Technicians capture before/after photos of solar panel service  
**Actual:** `pre_service_image` and `post_service_image` columns exist in the DB schema as `text` fields (meant to store URLs), but there is no upload endpoint and no cloud storage integration  
**Risk:** Photo evidence cannot be captured or stored  
**Fix:**
- Integrate cloud storage (Cloudinary recommended for simplicity, or AWS S3)
- Add `POST /api/upload` multipart endpoint that stores the file and returns the URL
- Wire the URL into the service record update

---

### 8. Notification System — Not Started

**Documented:** WhatsApp/SMS notifications for service scheduling, reminders, and reports  
**Actual:** Zero code — no messaging API integration  
**Risk:** Customers receive no automated communication  
**Fix:** Integrate WhatsApp Business API (Meta) or Twilio for SMS as a separate notification service. Trigger notifications on:
  - Service scheduled
  - Service completed (with report link)
  - Subscription expiry warning (30 days before)

---

### 9. Foreign Key Integrity — Missing

**Documented:** (implied) Data relationships must be consistent  
**Actual:** `services.customer_id`, `services.staff_id`, `subscriptions.customer_id`, `payments.customer_id`, `payments.subscription_id` have no DB-level foreign key constraints  
**Risk:** Services and payments can reference non-existent customers without error  
**Fix:** See `database.md` for full migration plan

---

### 10. Replit Build Configuration — ✅ RESOLVED (Sprint 0)

All Replit packages removed from `admin-dashboard`, `customer-website`, and `mockup-sandbox`. All three `vite.config.ts` files replaced with standard configs. `PORT`/`BASE_PATH`/`REPL_ID` hard requirements removed. Platform binary overrides cleaned from `pnpm-workspace.yaml`. Build verified: ✓ 3177 modules, 4.72s.

---

## Production Infrastructure Requirements

The following does not exist at all and must be set up:

| Requirement | Tool/Approach |
|---|---|
| Environment config | `.env` files + secrets manager |
| Process management | PM2 or systemd (VPS) / platform-native (Railway, Render) |
| Reverse proxy | nginx or Caddy — serves static dashboard, proxies `/api` to Express |
| HTTPS | Let's Encrypt via Certbot or Caddy auto-HTTPS |
| Database backups | Automated pg_dump or managed PostgreSQL (Railway, Supabase, Neon) |
| Error monitoring | Sentry (free tier sufficient to start) |
| Logging | Pino is already integrated — ship logs to a service (Logtail, Papertrail) |

---

## Feature Completion Matrix

| Feature | Admin | Documented | Status |
|---|---|---|---|
| Customer CRUD | Admin | Yes | Done |
| Staff CRUD | Admin | Yes | Done |
| Service Jobs CRUD | Admin | Yes | Done |
| Subscription CRUD | Admin | Yes | Done |
| Payment Records | Admin | Yes | Done |
| Analytics Dashboard | Admin | Yes | Done (real data) |
| Contact Messages | Admin | Yes | Done |
| Soft Delete | Admin | Yes | Missing |
| Schedule Calendar | Admin | Yes | Stub only |
| CSV Export | Admin | Yes | Missing |
| Service PDF Reports | Admin | Yes | Missing |
| Lead Conversion | Admin | Yes | Missing |
| Subscription Expiry Alerts | Admin | Yes | Missing |
| Photo Upload | Admin | Yes | Schema only |
| Notifications (WhatsApp/SMS) | Both | Yes | Missing — Sprint 5 |
| Authentication / Login | Both | Yes | Missing — Sprint 1 |
| Role-based Access | Admin | Yes | Missing — Sprint 1 |
| **Staff App — Login** | Mobile | Yes | Planned — Sprint 8 |
| **Staff App — Job List** | Mobile | Yes | Planned — Sprint 8 |
| **Staff App — Status Update** | Mobile | Yes | Planned — Sprint 8 |
| **Staff App — Photo Capture** | Mobile | Yes | Planned — Sprint 8 |
| **Staff App — Push Notifications** | Mobile | Yes | Planned — Sprint 8 |
| **Staff App — Play Store release** | Mobile | Yes | Planned — Sprint 8 |
| **Staff App — App Store release** | Mobile | Yes | Planned — Sprint 8 |
