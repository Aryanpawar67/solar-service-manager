# GreenVolt - Solar Panel Service Management System

## Overview

Full-stack SaaS platform for managing a solar panel cleaning/maintenance business. Includes an admin dashboard, customer-facing website, and a shared API backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React 18 + Vite + Tailwind CSS + Shadcn/ui

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── admin-dashboard/      # React admin panel (served at /admin/)
│   ├── customer-website/     # Customer-facing website (served at /)
│   └── api-server/           # Express API server (served at /api/)
├── lib/
│   ├── api-spec/             # OpenAPI spec + Orval codegen config
│   ├── api-client-react/     # Generated React Query hooks
│   ├── api-zod/              # Generated Zod schemas from OpenAPI
│   └── db/                   # Drizzle ORM schema + DB connection
├── scripts/                  # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

### `customers`
- id, name, phone, address, latitude, longitude, solarCapacity, installationDate, installationDetails, city, notes, createdAt, updatedAt

### `staff`
- id, name, phone, role, workArea, availability, isActive, createdAt, updatedAt

### `services`
- id, customerId, staffId, status (pending/in_progress/completed), scheduledDate, notes, serviceType, preServiceImage, postServiceImage, remarks, completedAt, createdAt, updatedAt

### `subscriptions`
- id, customerId, plan (basic/standard/premium), visitsPerMonth, startDate, endDate, status (active/paused/cancelled/expired), amount, createdAt, updatedAt

### `payments`
- id, customerId, subscriptionId, amount, status (pending/success/failed), paymentMethod, transactionId, description, createdAt, updatedAt

### `contact`
- id, name, email, phone, subject, message, isRead, createdAt

## API Endpoints

All at `/api/`:
- `GET/POST /customers` - list (searchable/paginated) and create customers
- `GET/PUT/DELETE /customers/:id`
- `GET/POST /staff` - list and create staff members
- `GET/PUT/DELETE /staff/:id`
- `GET/POST /services` - list (filter by status/staff/customer/date) and create services
- `GET/PUT/DELETE /services/:id`
- `GET/POST /subscriptions` - list and create subscriptions
- `GET/PUT /subscriptions/:id`
- `GET/POST /payments` - list and create payments
- `GET/PUT /payments/:id`
- `GET/POST /contact` - list and submit contact form submissions
- `GET /analytics/dashboard` - aggregated stats

## Subscription Plans

| Plan | Visits/Month | Price |
|------|-------------|-------|
| Basic | 1 | ₹999/mo |
| Standard | 2 | ₹1,799/mo |
| Premium | 4 | ₹2,999/mo |

## Admin Dashboard Pages

- `/admin/` — Dashboard with analytics (revenue, subscriptions, services, customers)
- `/admin/customers` — Customer management (CRUD)
- `/admin/staff` — Staff management (CRUD)
- `/admin/services` — Service jobs (CRUD, filter by status/staff/date)
- `/admin/schedule` — Calendar view of all services
- `/admin/subscriptions` — Subscription management
- `/admin/payments` — Payment history
- `/admin/contact` — Contact form submissions

## Customer Website Pages

- `/` — Landing page with hero, features, stats, CTA
- `/services` — Service details
- `/pricing` — Subscription plan comparison
- `/book` — Multi-step service booking form
- `/contact` — Contact form
- `/about` — Company info

## Development Commands

```bash
# Run API server
pnpm --filter @workspace/api-server run dev

# Run admin dashboard
pnpm --filter @workspace/admin-dashboard run dev

# Run customer website
pnpm --filter @workspace/customer-website run dev

# Run codegen after changing OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes
pnpm --filter @workspace/db run push
```
