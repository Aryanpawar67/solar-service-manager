# GreenVolt Mobile App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Expo staff app into a single three-role app (customer / staff / admin) with role-based navigation, customer-scoped API endpoints, and dual push+SMS notifications.

**Architecture:** Single Expo bundle; role is read from the JWT on launch and routes to one of three isolated navigation trees — `(staff)`, `(admin)`, `(customer)`. The existing `(tabs)` group is renamed to `(staff)`. Customer data access goes through new `/api/me/*` endpoints that scope queries to the logged-in user's linked customer record.

**Tech Stack:** React Native 0.79 · Expo SDK 53 · Expo Router v4 · TanStack Query · Drizzle ORM · PostgreSQL · Express 5 · drizzle-kit push (no migration files) · Twilio SMS · Expo Push Notifications

---

## File Map

### Phase 1 — DB + API

| File | Action | Purpose |
|---|---|---|
| `lib/db/src/schema/users.ts` | Modify | Add `"customer"` to `userRoleEnum`; add `customerId` FK |
| `apps/api-server/src/middleware/requireAuth.ts` | Modify | Add `customerId` to `AuthPayload`; add `requireRole` helper |
| `apps/api-server/src/routes/auth.ts` | Modify | Include `customerId` in JWT payload and `/me` response |
| `apps/api-server/src/routes/me.ts` | Create | Customer-scoped `/api/me/*` endpoints |
| `apps/api-server/src/routes/index.ts` | Modify | Register `meRouter` under `/me` |
| `apps/api-server/src/routes/services.ts` | Modify | Allow `staffId` update in `PUT /:id` for admin reassignment |

### Phase 2 — Mobile Role Routing

| File | Action | Purpose |
|---|---|---|
| `apps/staff-app/app/index.tsx` | Modify | Role-aware redirect (staff/admin/customer) |
| `apps/staff-app/app/(auth)/login.tsx` | Modify | Redirect based on JWT role after login |
| `apps/staff-app/app/_layout.tsx` | Modify | Role-aware notification deep link handler |

### Phase 3 — Staff Rename + Admin Tree

| File | Action | Purpose |
|---|---|---|
| `apps/staff-app/app/(staff)/_layout.tsx` | Create (rename) | Tabs: Jobs \| Schedule \| Profile |
| `apps/staff-app/app/(staff)/jobs.tsx` | Create (move) | Staff jobs list (was `(tabs)/jobs.tsx`) |
| `apps/staff-app/app/(staff)/schedule.tsx` | Create | Calendar view of own assigned jobs |
| `apps/staff-app/app/(staff)/profile.tsx` | Create (move) | Staff profile + logout (was `(tabs)/profile.tsx`) |
| `apps/staff-app/app/(tabs)/_layout.tsx` | Delete | Replaced by `(staff)/_layout.tsx` |
| `apps/staff-app/app/(tabs)/jobs.tsx` | Delete | Moved to `(staff)/jobs.tsx` |
| `apps/staff-app/app/(tabs)/profile.tsx` | Delete | Moved to `(staff)/profile.tsx` |
| `apps/staff-app/app/job/[id].tsx` | Modify | Add admin reassign panel (role-aware) |
| `apps/staff-app/app/(admin)/_layout.tsx` | Create | Tabs: Jobs \| Customers \| Staff \| Analytics \| Profile |
| `apps/staff-app/app/(admin)/jobs.tsx` | Create | All jobs across all staff |
| `apps/staff-app/app/(admin)/customers/index.tsx` | Create | Customer list (read-only) |
| `apps/staff-app/app/(admin)/customers/[id].tsx` | Create | Customer detail + service history |
| `apps/staff-app/app/(admin)/staff.tsx` | Create | Staff list + active/inactive toggle |
| `apps/staff-app/app/(admin)/analytics.tsx` | Create | Key metrics grid |
| `apps/staff-app/app/(admin)/profile.tsx` | Create | Admin profile + logout |

### Phase 4 — Customer Tree

| File | Action | Purpose |
|---|---|---|
| `apps/staff-app/app/(customer)/_layout.tsx` | Create | Tabs: Home \| Services \| Subscription \| Payments \| Profile |
| `apps/staff-app/app/(customer)/index.tsx` | Create | Dashboard: next appt, subscription badge, stats |
| `apps/staff-app/app/(customer)/services/index.tsx` | Create | Service history list |
| `apps/staff-app/app/(customer)/services/[id].tsx` | Create | Service detail + photos + PDF download |
| `apps/staff-app/app/(customer)/subscription.tsx` | Create | AMC plan + request renewal |
| `apps/staff-app/app/(customer)/payments.tsx` | Create | Payment history |
| `apps/staff-app/app/(customer)/profile.tsx` | Create | Contact details + notification prefs |

### Phase 5 — Integration & Polish

| File | Action | Purpose |
|---|---|---|
| `apps/api-server/src/lib/notifications.ts` | Modify | Customer dual push+SMS on service events |
| `apps/staff-app/app/_layout.tsx` | Modify | Customer deep link: notification → correct screen |

---

## Design Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                    COLOR PALETTE (keep consistent)              │
│  Primary green:  #16a34a   Bg light:  #f9fafb / #f0fdf4        │
│  Amber pending:  #f59e0b   Text:      #111827 / #374151        │
│  Blue progress:  #3b82f6   Muted:     #6b7280 / #9ca3af        │
│  Gray cancel:    #6b7280   Border:    #d1d5db / #f3f4f6        │
│  Card shadow: shadowOpacity 0.05-0.08, radius 6-12, elevation 2│
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1 — DB + API Foundation

---

### Task 1: Add `customer` role to DB schema

**Files:**
- Modify: `lib/db/src/schema/users.ts`

- [ ] **Step 1: Update the enum and add `customerId` FK**

Replace the contents of `lib/db/src/schema/users.ts`:

```ts
import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { staffTable } from "./staff";
import { customersTable } from "./customers";

export const userRoleEnum = pgEnum("user_role", ["admin", "staff", "customer"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("admin"),
  // Links a staff-role user to their staff record (null for admin/customer users)
  staffId: integer("staff_id").references(() => staffTable.id),
  // Links a customer-role user to their customer record (null for admin/staff users)
  customerId: integer("customer_id").references(() => customersTable.id),
  // Expo push token for mobile notifications (null when not registered)
  pushToken: text("push_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8).max(100),
});

export type User = typeof usersTable.$inferSelect;
export type PublicUser = Omit<User, "passwordHash">;
```

- [ ] **Step 2: Push the schema change to the database**

```bash
cd /path/to/solar-service-manager
DATABASE_URL=postgresql://solar:solar_secret@localhost:5432/solar_service_manager \
  pnpm --filter @workspace/db push
```

Expected: drizzle-kit prints `[✓] Changes applied` with two alterations — enum updated, `customer_id` column added to `users`.

- [ ] **Step 3: Verify the column exists**

```bash
docker exec solar_db psql -U solar -d solar_service_manager -c "\d users"
```

Expected: output includes `customer_id | integer` row and enum shows `admin | staff | customer`.

- [ ] **Step 4: Commit**

```bash
git add lib/db/src/schema/users.ts
git commit -m "feat(db): add customer role and customer_id FK to users table"
```

---

### Task 2: Extend `requireAuth` middleware with `customerId` + `requireRole`

**Files:**
- Modify: `apps/api-server/src/middleware/requireAuth.ts`

- [ ] **Step 1: Update `AuthPayload` and add `requireRole` helper**

Replace the contents of `apps/api-server/src/middleware/requireAuth.ts`:

```ts
import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
  staffId: number | null;
  customerId: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = header.slice(7);
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not set");
    req.user = jwt.verify(token, secret) as AuthPayload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Middleware that restricts a route to specific roles. Must be used after requireAuth. */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
```

- [ ] **Step 2: Update `auth.ts` to include `customerId` in the JWT and `/me` response**

In `apps/api-server/src/routes/auth.ts`, update the login route's `jwt.sign` call and both `select` queries:

```ts
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "Server misconfigured" });

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      staffId: user.staffId ?? null,
      customerId: user.customerId ?? null,
    },
    secret,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      staffId: user.staffId ?? null,
      customerId: user.customerId ?? null,
    },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      staffId: usersTable.staffId,
      customerId: usersTable.customerId,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId));

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

// Register / update Expo push token for mobile notifications
router.post("/push-token", requireAuth, async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "token is required" });
  }

  await db
    .update(usersTable)
    .set({ pushToken: token })
    .where(eq(usersTable.id, req.user!.userId));

  res.json({ ok: true });
});

export default router;
```

- [ ] **Step 3: Rebuild and verify typecheck passes**

```bash
cd apps/api-server && pnpm typecheck 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Verify login returns `customerId`**

```bash
curl -s -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@greenvolt.com","password":"admin123"}' | jq '.user'
```

Expected: JSON with `"customerId": null` field present alongside `staffId`.

- [ ] **Step 5: Commit**

```bash
git add apps/api-server/src/middleware/requireAuth.ts apps/api-server/src/routes/auth.ts
git commit -m "feat(api): add customerId to JWT payload and requireRole middleware"
```

---

### Task 3: Create `/api/me/*` customer-scoped endpoints

**Files:**
- Create: `apps/api-server/src/routes/me.ts`
- Modify: `apps/api-server/src/routes/index.ts`

- [ ] **Step 1: Create `apps/api-server/src/routes/me.ts`**

```ts
import { Router } from "express";
import { db } from "@workspace/db";
import {
  customersTable,
  servicesTable,
  subscriptionsTable,
  paymentsTable,
  staffTable,
  contactTable,
} from "@workspace/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { requireRole } from "../middleware/requireAuth";

const router = Router();

// All /me routes are customer-only
router.use(requireRole("customer"));

/** GET /api/me/profile — own customer record */
router.get("/profile", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked to this account" });

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.id, customerId), isNull(customersTable.deletedAt)));

  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

/** PUT /api/me/profile — update phone, address */
router.put("/profile", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked" });

  const { phone, address, email } = req.body as {
    phone?: string;
    address?: string;
    email?: string;
  };
  const update: Record<string, unknown> = {};
  if (phone !== undefined) update.phone = phone;
  if (address !== undefined) update.address = address;
  if (email !== undefined) update.email = email;

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const [updated] = await db
    .update(customersTable)
    .set(update)
    .where(eq(customersTable.id, customerId))
    .returning();

  res.json(updated);
});

/** GET /api/me/services — service history for logged-in customer */
router.get("/services", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked" });

  const { page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const rows = await db
    .select({
      service: servicesTable,
      staff: staffTable,
    })
    .from(servicesTable)
    .leftJoin(staffTable, eq(servicesTable.staffId, staffTable.id))
    .where(eq(servicesTable.customerId, customerId))
    .orderBy(desc(servicesTable.scheduledDate))
    .limit(limitNum)
    .offset(offset);

  const data = rows.map(({ service, staff }) => ({ ...service, staff }));
  res.json({ data, page: pageNum, limit: limitNum });
});

/** GET /api/me/services/:id — single service for this customer */
router.get("/services/:id", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked" });

  const serviceId = parseInt(req.params.id);
  if (isNaN(serviceId)) return res.status(400).json({ error: "Invalid id" });

  const [row] = await db
    .select({ service: servicesTable, staff: staffTable })
    .from(servicesTable)
    .leftJoin(staffTable, eq(servicesTable.staffId, staffTable.id))
    .where(and(eq(servicesTable.id, serviceId), eq(servicesTable.customerId, customerId)));

  if (!row) return res.status(404).json({ error: "Service not found" });
  res.json({ ...row.service, staff: row.staff });
});

/** GET /api/me/subscription — active subscription for logged-in customer */
router.get("/subscription", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked" });

  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.customerId, customerId),
        eq(subscriptionsTable.status, "active")
      )
    )
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);

  if (!subscription) return res.status(404).json({ error: "No active subscription" });
  res.json(subscription);
});

/** GET /api/me/payments — payment history for logged-in customer */
router.get("/payments", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked" });

  const { page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const rows = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.customerId, customerId))
    .orderBy(desc(paymentsTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  res.json({ data: rows, page: pageNum, limit: limitNum });
});

/** POST /api/me/renewal-request — sends a contact inquiry for subscription renewal */
router.post("/renewal-request", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked" });

  const [customer] = await db
    .select({ name: customersTable.name, phone: customersTable.phone })
    .from(customersTable)
    .where(eq(customersTable.id, customerId));

  if (!customer) return res.status(404).json({ error: "Customer not found" });

  await db.insert(contactTable).values({
    name: customer.name,
    phone: customer.phone,
    message: `Subscription renewal request from customer ID ${customerId} (${customer.name}).`,
  });

  res.json({ ok: true, message: "Renewal request submitted. Our team will contact you soon." });
});

export default router;
```

- [ ] **Step 2: Register the `me` router in `apps/api-server/src/routes/index.ts`**

Add the import and `router.use` line (after the `requireAuth` middleware line):

```ts
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { contactTable, insertContactSchema } from "@workspace/db/schema";
import healthRouter from "./health";
import authRouter from "./auth";
import customersRouter from "./customers";
import staffRouter from "./staff";
import servicesRouter from "./services";
import subscriptionsRouter from "./subscriptions";
import paymentsRouter from "./payments";
import contactRouter from "./contact";
import analyticsRouter from "./analytics";
import uploadRouter from "./upload";
import notificationsRouter from "./notifications";
import meRouter from "./me";
import { requireAuth } from "../middleware/requireAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);

// Public: website visitors can submit the contact form without a token
router.post("/contact", async (req, res) => {
  const parsed = insertContactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [contact] = await db.insert(contactTable).values(parsed.data).returning();
  res.status(201).json(contact);
});

// All routes below require authentication
router.use(requireAuth);
router.use("/customers", customersRouter);
router.use("/staff", staffRouter);
router.use("/services", servicesRouter);
router.use("/subscriptions", subscriptionsRouter);
router.use("/payments", paymentsRouter);
router.use("/contact", contactRouter);
router.use("/analytics", analyticsRouter);
router.use("/upload", uploadRouter);
router.use("/notifications", notificationsRouter);
router.use("/me", meRouter);

export default router;
```

- [ ] **Step 3: Build and verify typecheck**

```bash
cd apps/api-server && pnpm build 2>&1 | tail -5
```

Expected: builds without errors.

- [ ] **Step 4: Create a test customer user**

```bash
# First get an admin token
TOKEN=$(curl -s -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@greenvolt.com","password":"admin123"}' | jq -r '.token')

# Check what customer IDs exist
curl -s http://localhost:3004/api/customers \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0].id'
```

Note the customer ID (e.g. `2`). Then create a customer user via psql:

```bash
docker exec solar_db psql -U solar -d solar_service_manager -c \
  "INSERT INTO users (email, password_hash, name, role, customer_id)
   VALUES ('rajesh@test.com',
     '\$2b\$10\$abcdefghijklmnopqrstuvuXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
     'Rajesh Sharma', 'customer', 2);"
```

> Note: Use the `seed-admin` script pattern to create a proper bcrypt hash. The actual password hash should be generated like this:
>
> ```bash
> docker exec solar_db psql -U solar -d solar_service_manager
> ```
> Then in another terminal, generate hash:
> ```bash
> node -e "const bcrypt=require('bcrypt'); bcrypt.hash('customer123',10).then(h=>console.log(h))"
> ```
> Copy the hash output and use it in the INSERT.

- [ ] **Step 5: Test customer endpoints**

```bash
# Login as customer
CTOKEN=$(curl -s -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rajesh@test.com","password":"customer123"}' | jq -r '.token')

# Profile
curl -s http://localhost:3004/api/me/profile \
  -H "Authorization: Bearer $CTOKEN" | jq '.name'
# Expected: "Rajesh Sharma"

# Services
curl -s http://localhost:3004/api/me/services \
  -H "Authorization: Bearer $CTOKEN" | jq '.data | length'
# Expected: number >= 0

# Verify admin cannot access /me
curl -s http://localhost:3004/api/me/profile \
  -H "Authorization: Bearer $TOKEN" | jq '.error'
# Expected: "Forbidden"
```

- [ ] **Step 6: Commit**

```bash
git add apps/api-server/src/routes/me.ts apps/api-server/src/routes/index.ts
git commit -m "feat(api): add /api/me/* customer-scoped endpoints"
```

---

### Task 4: Allow admin to reassign jobs via `PUT /api/services/:id`

**Files:**
- Modify: `apps/api-server/src/routes/services.ts`

- [ ] **Step 1: Read the current `PUT /:id` handler to find the update schema**

The `updateServiceSchema` in `@workspace/db/schema` controls what fields are accepted. Check what it currently allows:

```bash
grep -n "updateServiceSchema" lib/db/src/schema/services.ts
```

- [ ] **Step 2: Ensure `staffId` is in `updateServiceSchema`**

Open `lib/db/src/schema/services.ts` and verify `staffId` is not excluded from `updateServiceSchema`. If it is excluded, remove it from the `.omit({})` call. The schema should allow `staffId` to be updated.

If the `updateServiceSchema` looks like:
```ts
export const updateServiceSchema = createInsertSchema(servicesTable).omit({
  id: true, createdAt: true, updatedAt: true,
}).partial();
```
Then `staffId` is already included — no change needed.

If `staffId` is omitted, remove it from the omit list.

- [ ] **Step 3: Verify the reassign works via curl**

```bash
TOKEN=$(curl -s -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@greenvolt.com","password":"admin123"}' | jq -r '.token')

# Get a service ID and a staff ID
curl -s http://localhost:3004/api/services?limit=1 \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0] | {id, staffId}'

# Reassign (use real IDs from above)
curl -s -X PUT http://localhost:3004/api/services/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"staffId": 2}' | jq '{id, staffId}'
# Expected: response shows updated staffId
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(api): verify staffId is updatable for admin reassignment"
```

---

## Phase 2 — Mobile: Role Routing

---

### Task 5: Update `app/index.tsx` for role-aware redirect

**Files:**
- Modify: `apps/staff-app/app/index.tsx`

Currently hardcodes `/(tabs)/jobs`. Must read JWT role and redirect to the correct group.

- [ ] **Step 1: Replace `apps/staff-app/app/index.tsx`**

```tsx
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { isAuthenticated, getToken, decodeJwtPayload } from "@/lib/auth";

type RouteState = "loading" | "no-auth" | "staff" | "admin" | "customer";

function roleToRoute(role: string): RouteState {
  if (role === "admin") return "admin";
  if (role === "customer") return "customer";
  return "staff";
}

export default function Index() {
  const [status, setStatus] = useState<RouteState>("loading");

  useEffect(() => {
    (async () => {
      const ok = await isAuthenticated();
      if (!ok) {
        setStatus("no-auth");
        return;
      }
      const token = await getToken();
      const payload = token ? decodeJwtPayload(token) : null;
      const role = typeof payload?.role === "string" ? payload.role : "staff";
      setStatus(roleToRoute(role));
    })();
  }, []);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0fdf4" }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (status === "no-auth") return <Redirect href="/(auth)/login" />;
  if (status === "admin") return <Redirect href="/(admin)/jobs" />;
  if (status === "customer") return <Redirect href="/(customer)/" />;
  return <Redirect href="/(staff)/jobs" />;
}
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/staff-app && pnpm typecheck 2>&1 | head -20
```

Expected: no errors (the `(staff)`, `(admin)`, `(customer)` routes don't exist yet — Expo Router doesn't validate hrefs at typecheck time by default, so this passes).

- [ ] **Step 3: Update login to redirect based on role**

Replace `apps/staff-app/app/(auth)/login.tsx` with a version that decodes the JWT role after login:

```tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { setToken, decodeJwtPayload } from "@/lib/auth";

const API_BASE_URL = process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:3000";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleLogin() {
    setError(null);
    setIsPending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { token?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Invalid email or password");
        return;
      }
      const token = data.token ?? "";
      await setToken(token);

      const payload = decodeJwtPayload(token);
      const role = typeof payload?.role === "string" ? payload.role : "staff";

      if (role === "admin") router.replace("/(admin)/jobs");
      else if (role === "customer") router.replace("/(customer)/");
      else router.replace("/(staff)/jobs");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>GreenVolt</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, isPending && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  logo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#16a34a",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 28,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 14,
    backgroundColor: "#f9fafb",
  },
  error: {
    color: "#dc2626",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#16a34a",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
```

Note: Changed `setToken` call from `SecureStore.setItemAsync` directly — now uses the `setToken` wrapper from `@/lib/auth` (which already does the same thing; just cleaner).

- [ ] **Step 4: Commit**

```bash
git add apps/staff-app/app/index.tsx apps/staff-app/app/(auth)/login.tsx
git commit -m "feat(mobile): role-based redirect at login and app launch"
```

---

## Phase 3 — Staff Rename + Admin Tree

---

### Task 6: Rename `(tabs)` → `(staff)` and add Schedule tab

**Files:**
- Create: `apps/staff-app/app/(staff)/_layout.tsx`
- Create: `apps/staff-app/app/(staff)/jobs.tsx`  
- Create: `apps/staff-app/app/(staff)/schedule.tsx`
- Create: `apps/staff-app/app/(staff)/profile.tsx`
- Delete: `apps/staff-app/app/(tabs)/_layout.tsx`, `jobs.tsx`, `profile.tsx`

- [ ] **Step 1: Create `apps/staff-app/app/(staff)/_layout.tsx`**

```tsx
import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function StaffTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "#9ca3af",
        headerStyle: { backgroundColor: "#16a34a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="jobs"
        options={{
          title: "My Jobs",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔧</Text>,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Create `apps/staff-app/app/(staff)/jobs.tsx`**

Copy the existing `(tabs)/jobs.tsx` content exactly — it already works correctly. Only the import paths may need updating (they use `@workspace/*` so no changes needed):

```tsx
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useListServices, useGetMe } from "@workspace/api-client-react";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#16a34a",
  cancelled: "#6b7280",
};

export default function JobsScreen() {
  const { data: meData, isLoading: meLoading } = useGetMe();
  const staffId = meData?.user?.staffId;

  const { data, isLoading, refetch, isRefetching } = useListServices(
    staffId != null ? { staffId } : {}
  );

  if (meLoading || (isLoading && meData != null)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (staffId == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Your account is not linked to a staff profile.</Text>
        <Text style={[styles.empty, { fontSize: 12, marginTop: 6 }]}>Ask an admin to link your account.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={data?.data ?? []}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.empty}>No jobs assigned to you.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/job/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.customerName}>{item.customer?.name ?? "—"}</Text>
            <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] ?? "#6b7280") + "22" }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] ?? "#6b7280" }]}>
                {item.status.replace("_", " ")}
              </Text>
            </View>
          </View>
          <Text style={styles.address}>{item.customer?.address ?? "No address"}</Text>
          {item.scheduledDate && (
            <Text style={styles.date}>
              {new Date(item.scheduledDate).toLocaleDateString("en-IN", {
                weekday: "short", day: "numeric", month: "short",
              })}
            </Text>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 12, flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  empty: { color: "#6b7280", fontSize: 15, textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  customerName: { fontSize: 16, fontWeight: "600", color: "#111827", flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  address: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  date: { fontSize: 12, color: "#9ca3af" },
});
```

- [ ] **Step 3: Create `apps/staff-app/app/(staff)/profile.tsx`**

Copy the existing `(tabs)/profile.tsx` content exactly (it already handles logout and `/api/auth/me`). No changes needed to the content.

- [ ] **Step 4: Create `apps/staff-app/app/(staff)/schedule.tsx`**

```tsx
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useListServices, useGetMe } from "@workspace/api-client-react";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#16a34a",
  cancelled: "#6b7280",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function groupByDate(items: Array<{ scheduledDate?: string | null; [k: string]: unknown }>) {
  const map = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.scheduledDate ?? "Unscheduled";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default function ScheduleScreen() {
  const { data: meData, isLoading: meLoading } = useGetMe();
  const staffId = meData?.user?.staffId;

  const { data, isLoading } = useListServices(
    staffId != null ? { staffId, limit: "100" } : {}
  );

  if (meLoading || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const groups = groupByDate(data?.data ?? []);

  if (groups.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No scheduled jobs.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={groups}
      keyExtractor={([date]) => date}
      renderItem={({ item: [date, jobs] }) => (
        <View style={styles.group}>
          <Text style={styles.dateHeader}>
            {date === "Unscheduled" ? "Unscheduled" : formatDate(date)}
          </Text>
          {jobs.map((job: Record<string, unknown>) => (
            <TouchableOpacity
              key={String(job.id)}
              style={styles.jobRow}
              onPress={() => router.push(`/job/${job.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[job.status as string] ?? "#6b7280" }]} />
              <View style={styles.jobInfo}>
                <Text style={styles.jobCustomer}>{(job.customer as Record<string, unknown>)?.name as string ?? "—"}</Text>
                <Text style={styles.jobStatus}>{(job.status as string).replace("_", " ")}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  empty: { color: "#6b7280", fontSize: 15 },
  group: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  dateHeader: { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 12 },
  jobRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  jobInfo: { flex: 1 },
  jobCustomer: { fontSize: 14, fontWeight: "600", color: "#111827" },
  jobStatus: { fontSize: 12, color: "#6b7280", textTransform: "capitalize", marginTop: 2 },
});
```

- [ ] **Step 5: Delete old `(tabs)` files**

```bash
rm apps/staff-app/app/\(tabs\)/_layout.tsx
rm apps/staff-app/app/\(tabs\)/jobs.tsx
rm apps/staff-app/app/\(tabs\)/profile.tsx
rmdir apps/staff-app/app/\(tabs\)
```

- [ ] **Step 6: Typecheck**

```bash
cd apps/staff-app && pnpm typecheck 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/staff-app/app/\(staff\)/ && git rm apps/staff-app/app/\(tabs\)/_layout.tsx apps/staff-app/app/\(tabs\)/jobs.tsx apps/staff-app/app/\(tabs\)/profile.tsx
git commit -m "feat(mobile): rename (tabs) to (staff) and add Schedule tab"
```

---

### Task 7: Build the Admin navigation tree

**Files:**
- Create: `apps/staff-app/app/(admin)/_layout.tsx`
- Create: `apps/staff-app/app/(admin)/jobs.tsx`
- Create: `apps/staff-app/app/(admin)/customers/index.tsx`
- Create: `apps/staff-app/app/(admin)/customers/[id].tsx`
- Create: `apps/staff-app/app/(admin)/staff.tsx`
- Create: `apps/staff-app/app/(admin)/analytics.tsx`
- Create: `apps/staff-app/app/(admin)/profile.tsx`

- [ ] **Step 1: Create `apps/staff-app/app/(admin)/_layout.tsx`**

```tsx
import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function AdminTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "#9ca3af",
        headerStyle: { backgroundColor: "#16a34a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="jobs" options={{ title: "All Jobs", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔧</Text> }} />
      <Tabs.Screen name="customers" options={{ title: "Customers", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👥</Text> }} />
      <Tabs.Screen name="staff" options={{ title: "Staff", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🧑‍💼</Text> }} />
      <Tabs.Screen name="analytics" options={{ title: "Analytics", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Create `apps/staff-app/app/(admin)/jobs.tsx`** (all jobs, all staff)

```tsx
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useListServices } from "@workspace/api-client-react";
import { useState } from "react";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#16a34a",
  cancelled: "#6b7280",
};

const STATUS_FILTERS = ["all", "pending", "in_progress", "completed", "cancelled"] as const;

export default function AdminJobsScreen() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, refetch, isRefetching } = useListServices(
    statusFilter !== "all" ? { status: statusFilter, limit: "100" } : { limit: "100" }
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      {/* Status filter pills */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.pill, statusFilter === s && styles.pillActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.pillText, statusFilter === s && styles.pillTextActive]}>
              {s.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={data?.data ?? []}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>No jobs found.</Text></View>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/job/${item.id}`)} activeOpacity={0.7}>
              <View style={styles.cardHeader}>
                <Text style={styles.customerName}>{item.customer?.name ?? "—"}</Text>
                <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] ?? "#6b7280") + "22" }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] ?? "#6b7280" }]}>
                    {item.status.replace("_", " ")}
                  </Text>
                </View>
              </View>
              <Text style={styles.staffName}>
                Staff: {item.staff?.name ?? "Unassigned"}
              </Text>
              <Text style={styles.address}>{item.customer?.address ?? "—"}</Text>
              {item.scheduledDate && (
                <Text style={styles.date}>
                  {new Date(item.scheduledDate).toLocaleDateString("en-IN", {
                    weekday: "short", day: "numeric", month: "short",
                  })}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 8, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  pill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#f3f4f6" },
  pillActive: { backgroundColor: "#16a34a" },
  pillText: { fontSize: 12, color: "#6b7280", textTransform: "capitalize" },
  pillTextActive: { color: "#fff", fontWeight: "600" },
  content: { padding: 16, gap: 12, flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  empty: { color: "#6b7280", fontSize: 15 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  customerName: { fontSize: 16, fontWeight: "600", color: "#111827", flex: 1 },
  staffName: { fontSize: 12, color: "#16a34a", fontWeight: "600", marginBottom: 4 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  address: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  date: { fontSize: 12, color: "#9ca3af" },
});
```

- [ ] **Step 3: Create `apps/staff-app/app/(admin)/customers/index.tsx`**

```tsx
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useListCustomers } from "@workspace/api-client-react";
import { useState } from "react";

export default function AdminCustomersScreen() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch, isRefetching } = useListCustomers({ search: search || undefined, limit: "50" });

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.search}
          placeholder="Search customers..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={data?.data ?? []}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>No customers found.</Text></View>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(admin)/customers/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.sub}>{item.phone}</Text>
                  <Text style={styles.sub}>{item.city ?? "—"}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: { padding: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  search: { backgroundColor: "#f3f4f6", borderRadius: 10, padding: 12, fontSize: 15 },
  content: { padding: 16, gap: 10, flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  empty: { color: "#6b7280", fontSize: 15 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#dcfce7", justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#16a34a" },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: "#111827" },
  sub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  chevron: { fontSize: 22, color: "#d1d5db" },
});
```

- [ ] **Step 4: Create `apps/staff-app/app/(admin)/customers/[id].tsx`**

```tsx
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, FlatList,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useGetCustomer, useListServices } from "@workspace/api-client-react";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b", in_progress: "#3b82f6", completed: "#16a34a", cancelled: "#6b7280",
};

export default function AdminCustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Number(id);

  const { data: customer, isLoading: custLoading } = useGetCustomer(customerId);
  const { data: services, isLoading: svcLoading } = useListServices({ customerId: customerId.toString(), limit: "50" });

  if (custLoading || svcLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }
  if (!customer) {
    return <View style={styles.center}><Text style={styles.empty}>Customer not found.</Text></View>;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: customer.name,
          headerStyle: { backgroundColor: "#16a34a" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4 }}>
              <Text style={{ color: "#fff", fontSize: 16 }}>‹ Back</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Row label="Name" value={customer.name} />
          <Row label="Phone" value={customer.phone} />
          <Row label="Email" value={customer.email ?? "—"} />
          <Row label="Address" value={customer.address} />
          <Row label="City" value={customer.city ?? "—"} />
          <Row label="Capacity" value={customer.solarCapacity ? `${customer.solarCapacity} kW` : "—"} />
          <Row label="Warranty" value={customer.warrantyExpiry ?? "—"} />
        </View>

        <Text style={styles.sectionTitle}>Service History</Text>
        {(services?.data ?? []).length === 0 ? (
          <Text style={styles.empty}>No services recorded.</Text>
        ) : (
          (services?.data ?? []).map((svc) => (
            <TouchableOpacity
              key={svc.id}
              style={styles.svcCard}
              onPress={() => router.push(`/job/${svc.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.svcHeader}>
                <Text style={styles.svcDate}>
                  {svc.scheduledDate
                    ? new Date(svc.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </Text>
                <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[svc.status] ?? "#6b7280") + "22" }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLOR[svc.status] ?? "#6b7280" }]}>
                    {svc.status.replace("_", " ")}
                  </Text>
                </View>
              </View>
              <Text style={styles.svcNotes}>{svc.notes ?? "No notes"}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  empty: { color: "#6b7280", fontSize: 15, textAlign: "center" },
  section: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  row: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowLabel: { fontSize: 13, color: "#6b7280", width: 90 },
  rowValue: { fontSize: 14, color: "#111827", flex: 1 },
  svcCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  svcHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  svcDate: { fontSize: 14, fontWeight: "600", color: "#374151" },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  svcNotes: { fontSize: 13, color: "#6b7280" },
});
```

- [ ] **Step 5: Create `apps/staff-app/app/(admin)/staff.tsx`**

```tsx
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity,
} from "react-native";
import { useListStaff, useUpdateStaff } from "@workspace/api-client-react";

export default function AdminStaffScreen() {
  const { data, isLoading, refetch, isRefetching } = useListStaff({});
  const update = useUpdateStaff();

  const toggleActive = (id: number, current: boolean) => {
    update.mutate({ id, data: { isActive: !current } }, { onSuccess: () => refetch() });
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={data?.data ?? []}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
      ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>No staff found.</Text></View>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.role}</Text>
              <Text style={styles.sub}>{item.phone}</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, item.isActive ? styles.toggleActive : styles.toggleInactive]}
              onPress={() => toggleActive(item.id, item.isActive ?? false)}
            >
              <Text style={styles.toggleText}>{item.isActive ? "Active" : "Inactive"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 10, flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  empty: { color: "#6b7280", fontSize: 15 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#dcfce7", justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#16a34a" },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: "#111827" },
  sub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  toggle: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  toggleActive: { backgroundColor: "#dcfce7" },
  toggleInactive: { backgroundColor: "#fee2e2" },
  toggleText: { fontSize: 12, fontWeight: "700" },
});
```

- [ ] **Step 6: Create `apps/staff-app/app/(admin)/analytics.tsx`**

```tsx
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useGetAnalyticsDashboard } from "@workspace/api-client-react";

export default function AdminAnalyticsScreen() {
  const { data, isLoading, refetch, isRefetching } = useGetAnalyticsDashboard();

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  const metrics = [
    { label: "Total Customers", value: data?.totalCustomers ?? 0, color: "#16a34a" },
    { label: "Active Subscriptions", value: data?.activeSubscriptions ?? 0, color: "#3b82f6" },
    { label: "Total Services", value: data?.totalServices ?? 0, color: "#f59e0b" },
    { label: "Pending Jobs", value: data?.pendingServices ?? 0, color: "#f59e0b" },
    { label: "In Progress", value: data?.inProgressServices ?? 0, color: "#3b82f6" },
    { label: "Completed", value: data?.completedServices ?? 0, color: "#16a34a" },
    { label: "Total Revenue", value: data?.totalRevenue != null ? `₹${Number(data.totalRevenue).toLocaleString("en-IN")}` : "—", color: "#16a34a" },
    { label: "Expiring (30d)", value: data?.expiringSubscriptions ?? 0, color: "#dc2626" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
    >
      <Text style={styles.heading}>Dashboard</Text>
      <View style={styles.grid}>
        {metrics.map(({ label, value, color }) => (
          <View key={label} style={styles.card}>
            <Text style={[styles.value, { color }]}>{String(value)}</Text>
            <Text style={styles.label}>{label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  heading: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  value: { fontSize: 28, fontWeight: "800", marginBottom: 6 },
  label: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
});
```

- [ ] **Step 7: Create `apps/staff-app/app/(admin)/profile.tsx`**

Same as staff profile — copy `(staff)/profile.tsx` exactly (it already shows role, handles logout, shows name/email).

- [ ] **Step 8: Add reassign panel to `apps/staff-app/app/job/[id].tsx`**

Add imports for `useGetMe`, `useListStaff`, and a reassign section that only renders for admin role. Add this inside the `ScrollView` after the action button, and add the import at the top:

At the top of the file, add:
```tsx
import { useGetMe, useListStaff } from "@workspace/api-client-react";
```

Inside `JobDetailScreen()`, add after the existing hooks:
```tsx
const { data: meData } = useGetMe();
const isAdmin = meData?.user?.role === "admin";
const { data: staffData } = useListStaff({ available: "true" });
```

And add a reassign section component inside the `ScrollView` (after the `{canAdvance && ...}` block):

```tsx
{isAdmin && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Reassign Job</Text>
    {(staffData?.data ?? []).map((s) => (
      <TouchableOpacity
        key={s.id}
        style={[
          styles.staffRow,
          job.staffId === s.id && styles.staffRowActive,
        ]}
        onPress={() =>
          update.mutate(
            { id: jobId, data: { staffId: s.id } },
            { onSuccess: () => refetch() }
          )
        }
      >
        <Text style={[styles.staffName, job.staffId === s.id && { color: "#16a34a" }]}>
          {s.name}
        </Text>
        {job.staffId === s.id && <Text style={{ color: "#16a34a" }}>✓</Text>}
      </TouchableOpacity>
    ))}
  </View>
)}
```

Add these styles to the StyleSheet at the bottom:
```tsx
staffRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#f3f4f6",
},
staffRowActive: { backgroundColor: "#f0fdf4", borderRadius: 8, paddingHorizontal: 8 },
staffName: { fontSize: 14, color: "#374151" },
```

- [ ] **Step 9: Typecheck**

```bash
cd apps/staff-app && pnpm typecheck 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add apps/staff-app/app/\(admin\)/ apps/staff-app/app/job/
git commit -m "feat(mobile): admin navigation tree and reassign panel on job detail"
```

---

## Phase 4 — Customer Mobile Tree

---

### Task 8: Build the Customer navigation tree

**Files:**
- Create: `apps/staff-app/app/(customer)/_layout.tsx`
- Create: `apps/staff-app/app/(customer)/index.tsx`
- Create: `apps/staff-app/app/(customer)/services/index.tsx`
- Create: `apps/staff-app/app/(customer)/services/[id].tsx`
- Create: `apps/staff-app/app/(customer)/subscription.tsx`
- Create: `apps/staff-app/app/(customer)/payments.tsx`
- Create: `apps/staff-app/app/(customer)/profile.tsx`

- [ ] **Step 1: Create `apps/staff-app/app/(customer)/_layout.tsx`**

```tsx
import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function CustomerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "#9ca3af",
        headerStyle: { backgroundColor: "#16a34a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }} />
      <Tabs.Screen name="services" options={{ title: "Services", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚡</Text> }} />
      <Tabs.Screen name="subscription" options={{ title: "Plan", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text> }} />
      <Tabs.Screen name="payments" options={{ title: "Payments", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💳</Text> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Create `apps/staff-app/app/(customer)/index.tsx`** (dashboard)

```tsx
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useCustomFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";

// Types for customer API responses
type CustomerProfile = {
  name: string;
  phone: string;
  city?: string | null;
  solarCapacity?: number | null;
  warrantyExpiry?: string | null;
};

type Subscription = {
  planName: string;
  status: string;
  endDate?: string | null;
  visitsPerMonth?: number | null;
  visitsUsed?: number | null;
};

type Service = {
  id: number;
  status: string;
  scheduledDate?: string | null;
  staff?: { name: string } | null;
};

function useCustomerDashboard() {
  const { customFetch } = useCustomFetch();

  const profile = useQuery<CustomerProfile>({
    queryKey: ["me", "profile"],
    queryFn: () => customFetch("/api/me/profile"),
  });

  const subscription = useQuery<Subscription>({
    queryKey: ["me", "subscription"],
    queryFn: () => customFetch("/api/me/subscription"),
    retry: false, // 404 = no active plan
  });

  const services = useQuery<{ data: Service[] }>({
    queryKey: ["me", "services"],
    queryFn: () => customFetch("/api/me/services?limit=5"),
  });

  return { profile, subscription, services };
}

export default function CustomerHomeScreen() {
  const { profile, subscription, services } = useCustomerDashboard();
  const isLoading = profile.isLoading;

  const refetch = () => { profile.refetch(); subscription.refetch(); services.refetch(); };
  const isRefreshing = profile.isRefetching || subscription.isRefetching || services.isRefetching;

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  const nextJob = (services.data?.data ?? [])
    .filter((s) => s.status === "pending" || s.status === "in_progress")
    .sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? ""))[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#16a34a" />}
    >
      {/* Greeting */}
      <Text style={styles.greeting}>Hello, {profile.data?.name?.split(" ")[0] ?? "there"} 👋</Text>
      {profile.data?.city && <Text style={styles.sub}>{profile.data.city}</Text>}

      {/* System info */}
      {profile.data?.solarCapacity && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Solar System</Text>
          <Row label="Capacity" value={`${profile.data.solarCapacity} kW`} />
          {profile.data.warrantyExpiry && <Row label="Warranty until" value={profile.data.warrantyExpiry} />}
        </View>
      )}

      {/* Subscription status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>AMC Plan</Text>
        {subscription.data ? (
          <>
            <Row label="Plan" value={subscription.data.planName} />
            <Row label="Status" value={subscription.data.status} />
            {subscription.data.endDate && <Row label="Valid until" value={subscription.data.endDate} />}
          </>
        ) : (
          <Text style={styles.muted}>No active plan.</Text>
        )}
      </View>

      {/* Next appointment */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next Appointment</Text>
        {nextJob ? (
          <>
            <Row label="Date" value={nextJob.scheduledDate
              ? new Date(nextJob.scheduledDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
              : "TBD"} />
            <Row label="Status" value={nextJob.status.replace("_", " ")} />
            {nextJob.staff && <Row label="Technician" value={nextJob.staff.name} />}
          </>
        ) : (
          <Text style={styles.muted}>No upcoming appointments.</Text>
        )}
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  greeting: { fontSize: 24, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  muted: { fontSize: 14, color: "#9ca3af" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowLabel: { fontSize: 13, color: "#6b7280", width: 120 },
  rowValue: { fontSize: 14, color: "#111827", flex: 1, textTransform: "capitalize" },
});
```

> **Note on `useCustomFetch`:** Check if `@workspace/api-client-react` exports a `useCustomFetch` hook. If not, import `customFetch` directly: `import { customFetch } from "@workspace/api-client-react"` — it's already configured with the auth token getter in `_layout.tsx`.

- [ ] **Step 3: Create `apps/staff-app/app/(customer)/services/index.tsx`**

```tsx
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useCustomFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b", in_progress: "#3b82f6", completed: "#16a34a", cancelled: "#6b7280",
};

type Service = {
  id: number;
  status: string;
  scheduledDate?: string | null;
  notes?: string | null;
  staff?: { name: string } | null;
};

export default function CustomerServicesScreen() {
  const { customFetch } = useCustomFetch();
  const { data, isLoading, refetch, isRefetching } = useQuery<{ data: Service[] }>({
    queryKey: ["me", "services", "list"],
    queryFn: () => customFetch("/api/me/services"),
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={data?.data ?? []}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
      ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>No service history yet.</Text></View>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/(customer)/services/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.header}>
            <Text style={styles.date}>
              {item.scheduledDate
                ? new Date(item.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "Not scheduled"}
            </Text>
            <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] ?? "#6b7280") + "22" }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] ?? "#6b7280" }]}>
                {item.status.replace("_", " ")}
              </Text>
            </View>
          </View>
          {item.staff && <Text style={styles.tech}>Technician: {item.staff.name}</Text>}
          {item.notes && <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 12, flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  empty: { color: "#6b7280", fontSize: 15 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  date: { fontSize: 15, fontWeight: "600", color: "#111827" },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  tech: { fontSize: 13, color: "#16a34a", fontWeight: "600", marginBottom: 4 },
  notes: { fontSize: 13, color: "#6b7280" },
});
```

- [ ] **Step 4: Create `apps/staff-app/app/(customer)/services/[id].tsx`**

```tsx
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Image, Linking,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useCustomFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";

type ServiceDetail = {
  id: number;
  status: string;
  scheduledDate?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  preServiceImage?: string | null;
  postServiceImage?: string | null;
  staff?: { name: string; phone?: string | null } | null;
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b", in_progress: "#3b82f6", completed: "#16a34a", cancelled: "#6b7280",
};

export default function CustomerServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const serviceId = Number(id);
  const { customFetch } = useCustomFetch();
  const API_BASE_URL = process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:3000";

  const { data: service, isLoading } = useQuery<ServiceDetail>({
    queryKey: ["me", "services", serviceId],
    queryFn: () => customFetch(`/api/me/services/${serviceId}`),
  });

  if (isLoading || !service) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Service Detail",
          headerStyle: { backgroundColor: "#16a34a" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4 }}>
              <Text style={{ color: "#fff", fontSize: 16 }}>‹ Back</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Status */}
        <View style={styles.section}>
          <Text style={[styles.status, { color: STATUS_COLOR[service.status] ?? "#111827" }]}>
            {service.status.replace("_", " ").toUpperCase()}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          {service.scheduledDate && (
            <Row label="Scheduled" value={new Date(service.scheduledDate).toLocaleDateString("en-IN", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })} />
          )}
          {service.completedAt && (
            <Row label="Completed" value={new Date(service.completedAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "long", year: "numeric",
            })} />
          )}
          {service.staff && <Row label="Technician" value={service.staff.name} />}
          {service.notes && <Row label="Notes" value={service.notes} />}
        </View>

        {/* Photos */}
        {(service.preServiceImage || service.postServiceImage) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Photos</Text>
            {service.preServiceImage && (
              <View style={styles.photoBlock}>
                <Text style={styles.photoLabel}>Before Service</Text>
                <Image source={{ uri: service.preServiceImage }} style={styles.photo} resizeMode="cover" />
              </View>
            )}
            {service.postServiceImage && (
              <View style={styles.photoBlock}>
                <Text style={styles.photoLabel}>After Service</Text>
                <Image source={{ uri: service.postServiceImage }} style={styles.photo} resizeMode="cover" />
              </View>
            )}
          </View>
        )}

        {/* PDF Report download */}
        {service.status === "completed" && (
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => Linking.openURL(`${API_BASE_URL}/api/services/${service.id}/report`)}
          >
            <Text style={styles.downloadText}>Download PDF Report</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  section: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  status: { fontSize: 22, fontWeight: "700", textTransform: "capitalize" },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#374151", marginBottom: 12 },
  row: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowLabel: { fontSize: 13, color: "#6b7280", width: 100 },
  rowValue: { fontSize: 14, color: "#111827", flex: 1 },
  photoBlock: { marginBottom: 12 },
  photoLabel: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  photo: { width: "100%", height: 180, borderRadius: 10 },
  downloadBtn: { backgroundColor: "#16a34a", borderRadius: 12, padding: 16, alignItems: "center" },
  downloadText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
```

- [ ] **Step 5: Create `apps/staff-app/app/(customer)/subscription.tsx`**

```tsx
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { useCustomFetch } from "@workspace/api-client-react";
import { useQuery, useMutation } from "@tanstack/react-query";

type Subscription = {
  planName: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  visitsPerMonth?: number | null;
  amount?: string | null;
};

export default function CustomerSubscriptionScreen() {
  const { customFetch } = useCustomFetch();
  const { data, isLoading, refetch, isRefetching } = useQuery<Subscription>({
    queryKey: ["me", "subscription"],
    queryFn: () => customFetch("/api/me/subscription"),
    retry: false,
  });

  const renewalMutation = useMutation({
    mutationFn: () => customFetch("/api/me/renewal-request", { method: "POST" }),
    onSuccess: () =>
      Alert.alert("Request Sent", "Our team will contact you shortly to renew your plan."),
    onError: () =>
      Alert.alert("Error", "Could not send renewal request. Please try again."),
  });

  const daysUntilExpiry = data?.endDate
    ? Math.ceil((new Date(data.endDate).getTime() - Date.now()) / 86400000)
    : null;

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
    >
      {data ? (
        <>
          <View style={styles.planCard}>
            <Text style={styles.planName}>{data.planName}</Text>
            <View style={[styles.badge, { backgroundColor: data.status === "active" ? "#dcfce7" : "#fee2e2" }]}>
              <Text style={[styles.badgeText, { color: data.status === "active" ? "#16a34a" : "#dc2626" }]}>
                {data.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            {data.startDate && <Row label="Start Date" value={new Date(data.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />}
            {data.endDate && <Row label="End Date" value={new Date(data.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />}
            {data.visitsPerMonth && <Row label="Visits / Month" value={String(data.visitsPerMonth)} />}
            {data.amount && <Row label="Amount" value={`₹${Number(data.amount).toLocaleString("en-IN")}`} />}
          </View>

          {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
            <View style={styles.expiryWarning}>
              <Text style={styles.expiryText}>
                {daysUntilExpiry <= 0
                  ? "Your plan has expired."
                  : `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}.`}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.renewBtn, renewalMutation.isPending && { opacity: 0.6 }]}
            onPress={() => renewalMutation.mutate()}
            disabled={renewalMutation.isPending}
          >
            <Text style={styles.renewText}>Request Renewal</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.noplan}>
          <Text style={styles.noplanTitle}>No Active Plan</Text>
          <Text style={styles.noplanSub}>Contact us to subscribe to an AMC plan.</Text>
          <TouchableOpacity
            style={styles.renewBtn}
            onPress={() => renewalMutation.mutate()}
            disabled={renewalMutation.isPending}
          >
            <Text style={styles.renewText}>Request a Plan</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  planCard: { backgroundColor: "#fff", borderRadius: 14, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  planName: { fontSize: 20, fontWeight: "700", color: "#111827" },
  badge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  section: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  row: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowLabel: { fontSize: 13, color: "#6b7280", width: 130 },
  rowValue: { fontSize: 14, color: "#111827", flex: 1 },
  expiryWarning: { backgroundColor: "#fef2f2", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#fecaca" },
  expiryText: { color: "#dc2626", fontWeight: "600", fontSize: 14 },
  renewBtn: { backgroundColor: "#16a34a", borderRadius: 12, padding: 16, alignItems: "center" },
  renewText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  noplan: { alignItems: "center", gap: 12, paddingVertical: 32 },
  noplanTitle: { fontSize: 20, fontWeight: "700", color: "#374151" },
  noplanSub: { fontSize: 14, color: "#6b7280", textAlign: "center" },
});
```

- [ ] **Step 6: Create `apps/staff-app/app/(customer)/payments.tsx`**

```tsx
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useCustomFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";

const STATUS_COLOR: Record<string, string> = {
  paid: "#16a34a", pending: "#f59e0b", failed: "#dc2626", refunded: "#6b7280",
};

type Payment = {
  id: number;
  amount: string;
  status: string;
  paymentMethod?: string | null;
  createdAt: string;
};

export default function CustomerPaymentsScreen() {
  const { customFetch } = useCustomFetch();
  const { data, isLoading, refetch, isRefetching } = useQuery<{ data: Payment[] }>({
    queryKey: ["me", "payments"],
    queryFn: () => customFetch("/api/me/payments"),
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={data?.data ?? []}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
      ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>No payment history.</Text></View>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.amount}>₹{Number(item.amount).toLocaleString("en-IN")}</Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </Text>
              {item.paymentMethod && (
                <Text style={styles.method}>{item.paymentMethod.replace("_", " ")}</Text>
              )}
            </View>
            <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] ?? "#6b7280") + "22" }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] ?? "#6b7280" }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 10, flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  empty: { color: "#6b7280", fontSize: 15 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  info: { flex: 1 },
  amount: { fontSize: 18, fontWeight: "700", color: "#111827" },
  date: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  method: { fontSize: 12, color: "#9ca3af", marginTop: 2, textTransform: "capitalize" },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700" },
});
```

- [ ] **Step 7: Create `apps/staff-app/app/(customer)/profile.tsx`**

```tsx
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useCustomFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { clearToken } from "@/lib/auth";

type CustomerProfile = { name: string; phone: string; email?: string | null; address: string; city?: string | null };

export default function CustomerProfileScreen() {
  const { customFetch } = useCustomFetch();
  const { data, isLoading } = useQuery<CustomerProfile>({
    queryKey: ["me", "profile"],
    queryFn: () => customFetch("/api/me/profile"),
  });

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => { await clearToken(); router.replace("/(auth)/login"); },
      },
    ]);
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{data?.name?.charAt(0).toUpperCase() ?? "?"}</Text>
      </View>
      <Text style={styles.name}>{data?.name ?? "—"}</Text>
      <Text style={styles.city}>{data?.city ?? ""}</Text>

      <View style={styles.card}>
        <Row label="Phone" value={data?.phone ?? "—"} />
        <Row label="Email" value={data?.email ?? "—"} />
        <Row label="Address" value={data?.address ?? "—"} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 24, alignItems: "center", paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center", marginTop: 24, marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: "700", color: "#fff" },
  name: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  city: { fontSize: 14, color: "#6b7280", marginBottom: 24 },
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1, marginBottom: 24 },
  row: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowLabel: { fontSize: 13, color: "#6b7280", width: 80 },
  rowValue: { fontSize: 14, color: "#111827", flex: 1 },
  logoutBtn: { width: "100%", backgroundColor: "#fee2e2", borderRadius: 12, padding: 16, alignItems: "center" },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 15 },
});
```

- [ ] **Step 8: Typecheck all**

```bash
cd apps/staff-app && pnpm typecheck 2>&1 | head -30
```

If `useCustomFetch` doesn't exist, replace it with direct `customFetch` import:
```tsx
import { customFetch } from "@workspace/api-client-react";
// remove the useCustomFetch() destructure, call customFetch directly
```

- [ ] **Step 9: Commit**

```bash
git add apps/staff-app/app/\(customer\)/
git commit -m "feat(mobile): customer navigation tree — Home, Services, Subscription, Payments, Profile"
```

---

## Phase 5 — Integration & Polish

---

### Task 9: Customer push token registration + dual push/SMS notifications

**Files:**
- Modify: `apps/api-server/src/lib/notifications.ts`
- Modify: `apps/staff-app/app/_layout.tsx`

- [ ] **Step 1: Read current `notifications.ts` to understand the notification triggers**

```bash
cat apps/api-server/src/lib/notifications.ts
```

Look for where `service scheduled`, `service completed`, and `subscription expiring` events are triggered.

- [ ] **Step 2: Update notification logic to also send push notifications to customers**

In `apps/api-server/src/lib/notifications.ts`, find the function that sends service notifications and add a customer push notification call. Add this helper alongside the existing Twilio call:

```ts
import { usersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { Expo } from "expo-server-sdk";

const expo = new Expo();

/** Send Expo push notification to a customer if they have a registered token. */
export async function sendCustomerPush(
  db: ReturnType<typeof import("@workspace/db").default>,
  customerId: number,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const [user] = await db
    .select({ pushToken: usersTable.pushToken })
    .from(usersTable)
    .where(and(eq(usersTable.customerId, customerId), eq(usersTable.role, "customer")));

  if (!user?.pushToken || !Expo.isExpoPushToken(user.pushToken)) return;

  await expo.sendPushNotificationsAsync([
    { to: user.pushToken, title, body, data: data ?? {} },
  ]);
}
```

> **Note on Expo Server SDK:** Install it if not present:
> ```bash
> pnpm --filter @workspace/api-server add expo-server-sdk
> ```

- [ ] **Step 3: Wire `sendCustomerPush` into existing service status change events**

In `apps/api-server/src/routes/services.ts`, in the `PUT /:id` handler, find where `status` transitions to `completed` and where service is first `scheduled`. After the existing Twilio/SMS notification call, add:

```ts
// After status → completed
if (updatedService.status === "completed" && updatedService.customerId) {
  await sendCustomerPush(
    db,
    updatedService.customerId,
    "Service Complete ✓",
    "Your solar panel service has been completed. Tap to view the report.",
    { serviceId: updatedService.id }
  );
}
```

- [ ] **Step 4: Update `apps/staff-app/app/_layout.tsx` to handle customer deep links**

In the `responseListener` notification tap handler, add customer service routing:

```tsx
responseListener.current = Notifications.addNotificationResponseReceivedListener(async (response) => {
  const data = response.notification.request.content.data as {
    jobId?: number;
    serviceId?: number;
  };

  // Get current role to route to correct screen
  const token = await getToken();
  const payload = token ? decodeJwtPayload(token) : null;
  const role = typeof payload?.role === "string" ? payload.role : "staff";

  if (role === "customer" && data.serviceId) {
    router.push(`/(customer)/services/${data.serviceId}`);
  } else if (data.jobId) {
    router.push(`/job/${data.jobId}`);
  } else if (data.serviceId) {
    router.push(`/job/${data.serviceId}`);
  }
});
```

Also add the missing import at top of `_layout.tsx`:
```tsx
import { getToken, isAuthenticated, decodeJwtPayload } from "@/lib/auth";
```

- [ ] **Step 5: Rebuild API server and verify**

```bash
cd apps/api-server && pnpm build 2>&1 | tail -5
```

Expected: builds without errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api-server/src/lib/notifications.ts apps/staff-app/app/_layout.tsx apps/api-server/
git commit -m "feat: customer push notifications + role-aware deep link routing"
```

---

### Task 10: Create a test customer user via seed script

**Files:**
- Modify: `lib/db/scripts/seed-admin.ts` (or create a new file alongside it)

- [ ] **Step 1: Check existing seed script to understand the pattern**

```bash
cat lib/db/scripts/seed-admin.ts
```

- [ ] **Step 2: Create `lib/db/scripts/seed-customer-user.ts`**

```ts
/**
 * Creates a customer-role user account linked to an existing customer record.
 * Usage: DATABASE_URL=... pnpm --filter @workspace/db exec tsx scripts/seed-customer-user.ts
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { usersTable, customersTable } from "../src/schema/index.js";
import { eq } from "drizzle-orm";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  // Find the first customer to link
  const [customer] = await db.select().from(customersTable).limit(1);
  if (!customer) {
    console.error("No customers found. Run seed-dummy.ts first.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash("customer123", 10);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: "customer@greenvolt.com",
      passwordHash,
      name: customer.name,
      role: "customer",
      customerId: customer.id,
    })
    .returning({ id: usersTable.id, email: usersTable.email });

  console.log(`Created customer user: ${user.email} (id: ${user.id}) linked to customer: ${customer.name} (id: ${customer.id})`);
  console.log("Password: customer123");
  await pool.end();
}

main().catch(console.error);
```

- [ ] **Step 3: Run the seed**

```bash
DATABASE_URL=postgresql://solar:solar_secret@localhost:5432/solar_service_manager \
  pnpm --filter @workspace/db exec tsx scripts/seed-customer-user.ts
```

Expected output:
```
Created customer user: customer@greenvolt.com (id: N) linked to customer: Rajesh Sharma (id: 1)
Password: customer123
```

- [ ] **Step 4: Test end-to-end customer login via API**

```bash
curl -s -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@greenvolt.com","password":"customer123"}' | jq '{role: .user.role, customerId: .user.customerId}'
```

Expected: `{ "role": "customer", "customerId": 1 }`

- [ ] **Step 5: Commit**

```bash
git add lib/db/scripts/seed-customer-user.ts
git commit -m "feat(db): add customer user seed script for dev testing"
```

---

## Verification Checklist

After all tasks complete, run through these manually in Expo Go / simulator:

```
┌─────────────────────────────────────────────────────────────────┐
│  ROLE          │ LOGIN               │ VERIFY                   │
├────────────────┼─────────────────────┼──────────────────────────┤
│  staff         │ existing staff user │ → (staff)/jobs tab       │
│                │                     │ → Schedule tab visible   │
│                │                     │ → Job detail: no reassign│
├────────────────┼─────────────────────┼──────────────────────────┤
│  admin         │ admin@greenvolt.com │ → (admin)/jobs tab       │
│                │                     │ → All jobs visible       │
│                │                     │ → Customers tab works    │
│                │                     │ → Analytics tab loads    │
│                │                     │ → Job detail: reassign   │
├────────────────┼─────────────────────┼──────────────────────────┤
│  customer      │ customer@greenvolt  │ → (customer)/ home tab   │
│                │ .com                │ → Services list loads    │
│                │                     │ → Subscription shows     │
│                │                     │ → Payments history loads │
│                │                     │ → Admin 403 on /me route │
└────────────────┴─────────────────────┴──────────────────────────┘
```

---

## Dependency Notes

- **`customFetch`** — import directly: `import { customFetch } from "@workspace/api-client-react"`. There is no `useCustomFetch` hook. Replace every `const { customFetch } = useCustomFetch()` in the customer screens with a direct import. The function is already configured with base URL and auth token from `_layout.tsx`.
- **Generated query hooks** — `useListServices`, `useGetMe`, `useListCustomers`, `useGetCustomer`, `useListStaff`, `useUpdateStaff` are generated by orval in `lib/api-client-react/src/generated/api.ts`. Verify each exists before using. If a hook is missing, use the plain function variant (`listCustomers`, `getCustomer`, etc.) wrapped in `useQuery` directly.
- **`useGetAnalyticsDashboard`** — verify this hook name in `generated/api.ts`. The API endpoint is `GET /api/analytics/dashboard`. The hook may be named `useGetAnalyticsDashboard` or `useGetDashboard`. Check and correct accordingly.
- **Customer screen `customFetch` pattern** — use `useQuery` with `customFetch` as the `queryFn`:
  ```tsx
  import { customFetch } from "@workspace/api-client-react";
  import { useQuery } from "@tanstack/react-query";

  const { data } = useQuery({
    queryKey: ["me", "profile"],
    queryFn: () => customFetch<CustomerProfile>("/api/me/profile"),
  });
  ```
- `expo-server-sdk` — install with `pnpm --filter @workspace/api-server add expo-server-sdk` if not already present.
