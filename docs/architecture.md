# Architecture Overview

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend (Admin) | React 19, Vite, Tailwind CSS v4, shadcn/ui, Wouter (routing), TanStack Query |
| Mobile (Staff App) | React Native 0.79, Expo SDK 53, Expo Router, TanStack Query, expo-secure-store |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL via Drizzle ORM |
| Validation | Zod (shared between all apps via `@workspace/api-zod`) |
| API Client | Custom fetch wrapper with bearer token support (`@workspace/api-client-react`) — React Native compatible |
| Package Manager | pnpm workspaces (monorepo) |
| Mobile Build | EAS Build (Expo Application Services) — Play Store + App Store |

---

## Monorepo Layout

```
Solar-Service-Manager/
├── apps/                           # Deployable applications (Sprint 7: rename from artifacts/)
│   ├── admin-dashboard/            # React admin SPA
│   ├── api-server/                 # Express REST API
│   ├── staff-app/                  # Expo React Native app (Sprint 8)
│   ├── customer-website/           # Public-facing website (out of scope)
│   └── mockup-sandbox/             # Design playground (out of scope)
├── lib/                            # Shared libraries
│   ├── db/                         # Drizzle schema + migrations
│   ├── api-client-react/           # Typed fetch client — React Native compatible
│   ├── api-spec/                   # OpenAPI spec + orval codegen config
│   └── api-zod/                    # Shared Zod validation schemas
├── docs/                           # This folder
├── scripts/                        # Utility scripts
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

> **Current state (Sprint 0 complete):** The folder is still named `artifacts/`. The rename to `apps/` happens in Sprint 7.

---

## Admin Dashboard Pages

| Route | Page | Status |
|---|---|---|
| `/` | Dashboard (analytics) | Implemented |
| `/customers` | Customer list + CRUD | Implemented |
| `/staff` | Staff list + CRUD | Implemented |
| `/services` | Service jobs list + CRUD | Implemented |
| `/schedule` | Schedule calendar | Stub only — empty page |
| `/subscriptions` | AMC subscriptions | Implemented |
| `/payments` | Payment records | Implemented |
| `/contact` | Incoming messages | Implemented |

---

## API Routes

Base path: `/api`

| Method | Route | Description |
|---|---|---|
| GET/POST | `/customers` | List (paginated + search) / Create |
| GET/PUT/DELETE | `/customers/:id` | Get / Update / Delete |
| GET/POST | `/staff` | List / Create |
| GET/PUT/DELETE | `/staff/:id` | Get / Update / Delete |
| GET/POST | `/services` | List / Create |
| GET/PUT/DELETE | `/services/:id` | Get / Update / Delete |
| GET/POST | `/subscriptions` | List / Create |
| GET/PUT/DELETE | `/subscriptions/:id` | Get / Update / Delete |
| GET/POST | `/payments` | List / Create |
| GET/PUT/DELETE | `/payments/:id` | Get / Update / Delete |
| GET/POST | `/contact` | List messages / Submit form |
| GET | `/analytics/dashboard` | Aggregated metrics |
| GET | `/health` | Health check |

**None of these routes have authentication middleware.**

---

## Database Tables

```
customers       — solar panel owners
staff           — technicians and admin users
services        — individual service jobs
subscriptions   — AMC (Annual Maintenance Contract) plans
payments        — payment records linked to customers/subscriptions
contact         — inbound contact form submissions
```

---

## API Client Infrastructure

`lib/api-client-react/src/custom-fetch.ts` has full infrastructure for:
- Base URL configuration (`setBaseUrl`)
- Bearer token injection (`setAuthTokenGetter`)
- Typed error handling (`ApiError`, `ResponseParseError`)

**This is wired up but never activated** — no token getter is registered anywhere in the admin dashboard, meaning all requests go unauthenticated.

---

## Mobile Architecture (Sprint 8)

### Shared Libraries Used by Staff App

| Library | How used in staff app |
|---|---|
| `@workspace/api-client-react` | `customFetch`, `setBaseUrl`, `setAuthTokenGetter` — written with explicit React Native runtime compatibility |
| `@workspace/api-zod` | Zod schemas for request/response validation — zero browser dependencies |

### Auth Flow (Mobile)

1. Staff opens app → checks `expo-secure-store` for JWT
2. If token exists and valid → proceed to jobs list
3. If no token → redirect to login screen
4. On login: `POST /api/auth/login` → receive JWT → store in `expo-secure-store`
5. On each API call: `setAuthTokenGetter` returns the stored token → `Authorization: Bearer <token>` header attached automatically

### Metro Monorepo Config (`apps/staff-app/metro.config.js`)

Metro (Expo's bundler) requires explicit configuration to resolve pnpm workspace symlinks:

```js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

### EAS Build

`apps/staff-app/eas.json` defines build profiles:
- `development` — debug build with Expo Dev Client
- `preview` — internal distribution APK/IPA
- `production` — Play Store AAB + App Store IPA

---

## Replit-Specific Code — RESOLVED (Sprint 0 ✅)

All Replit packages and config requirements have been removed:
- `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` — removed from all `package.json` files
- `PORT` / `BASE_PATH` / `REPL_ID` hard requirements — removed from all `vite.config.ts` files
- Platform binary overrides in `pnpm-workspace.yaml` — removed (were blocking macOS ARM native builds)
