# GreenVolt Mobile App — Design Spec

**Date:** 2026-04-13
**Status:** Approved
**Approach:** Single Expo app, role-based navigation switch at login (Approach A)

---

## 1. Overview

One React Native / Expo application serves three distinct user personas. Role is encoded in
the JWT and read at app launch. The root layout redirects each role into a completely separate
navigation tree. The customer-facing code lives in an isolated folder, making it
straightforward to extract into a second app if scale demands it later.

```
┌─────────────────────────────────────────────────────────────────┐
│                     GREENVOLT MOBILE APP                        │
│              One bundle · Three roles · Expo Router             │
└─────────────────────────────────────────────────────────────────┘

  CUSTOMER (homeowner)          STAFF (technician)         ADMIN (super-staff)
  ┌──────────────────┐          ┌──────────────────┐       ┌──────────────────┐
  │ • Home dashboard │          │ • My jobs list   │       │ All staff tabs + │
  │ • Service history│          │ • Job detail     │       │ • All jobs (any  │
  │ • Subscription   │          │ • Status update  │       │   technician)    │
  │   status + renew │          │   (pending →     │       │ • Reassign jobs  │
  │ • Payment history│          │   in_progress →  │       │ • Customer list  │
  │ • Profile        │          │   completed)     │       │ • Staff list     │
  │ • Notifs: push + │          │ • Pre/post photo │       │ • Analytics      │
  │   SMS/WhatsApp   │          │ • Schedule cal   │       │   dashboard      │
  └──────────────────┘          │ • Profile        │       └──────────────────┘
                                │ • Push notifs    │
                                └──────────────────┘
```

---

## 2. Personas & Feature Scope

### 2.1 Customer (homeowner)

| Screen | Description |
|---|---|
| Home Dashboard | Next appointment card, subscription status badge, quick stats (total services, open issues) |
| Service History | Paginated list of all service visits; tap to view detail |
| Service Detail | Status, technician name, scheduled date, pre/post photos, PDF report download |
| Subscription | Active AMC plan name, expiry date, visits used/remaining; "Request Renewal" CTA sends a contact inquiry to admin (does not auto-create a subscription) |
| Payments | Payment history list with status badges (paid, pending, failed) |
| Profile | Name, phone, address, email; notification preferences (push on/off) |

Notifications: push notification to device if `push_token` registered; Twilio SMS/WhatsApp fallback otherwise.

### 2.2 Staff (field technician)

| Screen | Description |
|---|---|
| Jobs List | Jobs assigned to the logged-in technician; filtered by today + upcoming; pull-to-refresh |
| Job Detail | Customer name, address, scheduled date, current status; status update button |
| Status Flow | `pending` → `in_progress` → `completed` via `PUT /api/services/:id` |
| Photo Capture | Pre-service and post-service photos via `expo-image-picker`; uploaded to `POST /api/upload` |
| Schedule | Calendar view of own assigned jobs (react-native-calendars or similar) |
| Profile | Name, email, logout |

Notifications: push notification when a job is assigned or reassigned.

### 2.3 Admin (super-staff)

Inherits all staff screens plus:

| Screen | Description |
|---|---|
| All Jobs | Jobs across all technicians; filterable by status, date, staff member |
| Job Detail (admin) | Adds "Reassign" action — change `staffId` on the service record |
| Customer List | Read-only paginated list; tap to view customer detail + full service history |
| Staff List | All staff members; active/inactive toggle |
| Analytics | Key metrics grid: total jobs today, pending, in-progress, completed; revenue summary |

No full CRUD from mobile — data entry (creating customers, services, subscriptions) stays on the web admin dashboard.

---

## 3. Navigation Structure (Expo Router)

```
apps/staff-app/app/
├── _layout.tsx                ← root: auth guard + role-based redirect
├── (auth)/
│   └── login.tsx              ← shared login (extend existing)
│
├── (staff)/                   ← role === "staff"
│   ├── _layout.tsx            ← Tabs: Jobs | Schedule | Profile
│   ├── jobs/
│   │   ├── index.tsx          ← my assigned jobs list
│   │   └── [id].tsx           ← job detail + status + photos
│   ├── schedule.tsx           ← calendar of my jobs
│   └── profile.tsx
│
├── (admin)/                   ← role === "admin"
│   ├── _layout.tsx            ← Tabs: Jobs | Customers | Staff | Analytics | Profile
│   ├── jobs/
│   │   ├── index.tsx          ← all jobs across all staff
│   │   └── [id].tsx           ← job detail + reassign
│   ├── customers/
│   │   ├── index.tsx          ← customer list (read-only)
│   │   └── [id].tsx           ← customer detail + service history
│   ├── staff/
│   │   └── index.tsx          ← staff list + active/inactive toggle
│   ├── analytics.tsx          ← key metrics card grid
│   └── profile.tsx
│
└── (customer)/                ← role === "customer"
    ├── _layout.tsx            ← Tabs: Home | Services | Subscription | Payments | Profile
    ├── index.tsx              ← dashboard: next appt, subscription badge, stats
    ├── services/
    │   ├── index.tsx          ← service history list
    │   └── [id].tsx           ← service detail + photos + PDF download
    ├── subscription.tsx       ← current plan, expiry, request renewal CTA
    ├── payments.tsx           ← payment history
    └── profile.tsx            ← contact details, notification prefs
```

---

## 4. Auth & Role Routing

```
App launch
    │
    ▼
Read JWT from expo-secure-store
    │
    ├─── No token ──────────────────► (auth)/login
    │
    └─── Token found
             │
             ▼
         GET /api/auth/me
             │
             ├─── 401 / expired ─────► (auth)/login  (clear stored token)
             ├─── role: "staff"   ──► (staff)/jobs
             ├─── role: "admin"   ──► (admin)/jobs
             └─── role: "customer"──► (customer)/index
```

The root `_layout.tsx` handles this redirect. Individual route groups do not re-check auth — the root guard is the single source of truth.

---

## 5. Database Changes

### 5.1 `users` table (extend existing)

| Column | Change |
|---|---|
| `role` | Add `"customer"` to the existing enum (`"admin" \| "staff" \| "customer"`) |
| `customer_id` | New nullable FK → `customers.id` — links a login account to a customer record |
| `push_token` | Already exists from Sprint 8 — reused for customer devices |

### 5.2 Migration

New Drizzle migration: `add-customer-role-and-user-customer-link`
- Alter `user_role` enum to add `'customer'`
- Add `customer_id integer references customers(id)` (nullable) to `users`

---

## 6. New API Endpoints

All `/api/me/*` routes require `Authorization: Bearer <token>` and are restricted to `role === "customer"`.

| Method | Route | Description |
|---|---|---|
| GET | `/api/me/services` | Service history for the logged-in customer (via `users.customer_id`) |
| GET | `/api/me/subscription` | Active subscription for the logged-in customer |
| GET | `/api/me/payments` | Payment history for the logged-in customer |
| GET | `/api/me/profile` | Own customer record |
| PUT | `/api/me/profile` | Update phone, address, notification preferences |
| PUT | `/api/me/push-token` | Register/update device push token |

Existing endpoints extended:

| Route | Extension |
|---|---|
| `GET /api/services` | Already supports `?staffId=` filter — no change needed |
| `PUT /api/services/:id` | Add `staffId` as an updatable field for admin reassignment |
| `GET /api/analytics/dashboard` | Already exists — expose to admin role in mobile |

---

## 7. Notification Strategy

```
Event triggers (service scheduled / completed / subscription expiring 30 days)

  API Server
      │
      ├─► Does customer have push_token in users table?
      │       YES ──► Expo Push Notification ───────────────► Customer device
      │       NO  ──► fallback (or push failed)
      │
      └─► Twilio SMS / WhatsApp (already wired) ──────────► Customer phone number
```

The existing `notifications` table (Sprint 5) logs all sent notifications regardless of channel.

---

## 8. Shared Libraries

No changes to shared libs required for Phase 1.

| Library | Used by |
|---|---|
| `@workspace/api-client-react` | All three role apps — same `customFetch` + bearer token |
| `@workspace/api-zod` | Add customer-facing response schemas as needed |

---

## 9. What Already Exists vs What to Build

```
ALREADY EXISTS (reuse / extend)        BUILD NEW
──────────────────────────────         ─────────────────────────────────────
apps/staff-app/ scaffold               (admin)/ nav tree + all screens
(auth)/login.tsx                       (customer)/ nav tree + all screens
JWT auth + expo-secure-store           users.customer_id FK + Drizzle migration
POST /api/auth/login                   "customer" value in user_role enum
GET /api/auth/me                       /api/me/* customer-scoped endpoints
Staff job list + detail screens        Customer user account creation flow (admin web)
Pre/post photo capture                 Analytics screen (admin mobile)
Push notifications (staff)             Customer push token registration
Twilio SMS backend (wired)             Dual push + SMS notification logic
@workspace/api-client-react            Customer Zod schemas in @workspace/api-zod
@workspace/api-zod
```

---

## 10. Out of Scope (Phase 1)

- Real-time technician location tracking (GPS)
- In-app chat between customer and technician
- Offline mode / job queue for poor connectivity
- Full CRUD from mobile (admin creates customers/services — stays on web dashboard)
- Separate app bundle / store listing for customers (can be extracted later)
- Customer self-registration (admin creates customer accounts from web dashboard)

---

## 11. Implementation Phases

### Phase 1 — DB + API Foundation
- Drizzle migration: `customer` role + `users.customer_id`
- `/api/me/*` customer endpoints
- `PUT /api/services/:id` reassign support
- Customer Zod schemas

### Phase 2 — Staff App: Role Routing + Admin Tree
- Root `_layout.tsx` role redirect
- `(admin)/` nav tree + all admin screens
- Extend existing staff screens (schedule tab, profile)

### Phase 3 — Customer App Tree
- `(customer)/` nav tree + all customer screens
- Customer push token registration
- Dual push + SMS notification logic

### Phase 4 — Integration & Polish
- End-to-end test all three role flows
- Deep link from push notification → correct screen per role
- Sentry error tracking for mobile (already configured in vite/API — add to Expo)
