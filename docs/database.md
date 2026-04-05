# Database Documentation

## ORM & Migrations

- **ORM:** Drizzle ORM
- **Database:** PostgreSQL
- **Schema location:** `lib/db/src/schema/`
- **Migration status:** Drizzle migrations exist but are not tracked/versioned in a way that's safe for production rollouts

---

## Current Schema

### `customers`
```ts
id               serial PRIMARY KEY
name             text NOT NULL
phone            text NOT NULL
address          text NOT NULL
latitude         real
longitude        real
solar_capacity   real
installation_date date
installation_details text
city             text
notes            text
created_at       timestamp DEFAULT now()
updated_at       timestamp DEFAULT now()
```

### `staff`
```ts
id           serial PRIMARY KEY
name         text NOT NULL
phone        text NOT NULL
role         text NOT NULL
work_area    text
availability text
is_active    boolean DEFAULT true
created_at   timestamp DEFAULT now()
updated_at   timestamp DEFAULT now()
```

### `services`
```ts
id                  serial PRIMARY KEY
customer_id         integer NOT NULL          -- NO foreign key constraint
staff_id            integer                   -- NO foreign key constraint
status              text DEFAULT 'pending'    -- free-form text, not enum
scheduled_date      date NOT NULL
notes               text
service_type        text
pre_service_image   text
post_service_image  text
remarks             text
completed_at        timestamp
created_at          timestamp DEFAULT now()
updated_at          timestamp DEFAULT now()
```

### `subscriptions`
```ts
id               serial PRIMARY KEY
customer_id      integer NOT NULL             -- NO foreign key constraint
plan             text NOT NULL
visits_per_month integer NOT NULL
start_date       date NOT NULL
end_date         date NOT NULL
status           text DEFAULT 'active'        -- free-form text, not enum
amount           real NOT NULL
created_at       timestamp DEFAULT now()
updated_at       timestamp DEFAULT now()
```

### `payments`
```ts
id               serial PRIMARY KEY
customer_id      integer NOT NULL             -- NO foreign key constraint
subscription_id  integer                      -- NO foreign key constraint
amount           real NOT NULL
status           text DEFAULT 'pending'       -- free-form text, not enum
payment_method   text
transaction_id   text
description      text
created_at       timestamp DEFAULT now()
updated_at       timestamp DEFAULT now()
```

### `contact`
```ts
id         serial PRIMARY KEY
name       text NOT NULL
phone      text NOT NULL
message    text NOT NULL
is_read    boolean DEFAULT false
created_at timestamp DEFAULT now()
```

---

## Issues & Required Changes

### 1. Missing Foreign Key Constraints

**Risk:** Orphaned records — services pointing to deleted customers, payments with no valid customer.

**Files:** `lib/db/src/schema/services.ts`, `lib/db/src/schema/payments.ts`, `lib/db/src/schema/subscriptions.ts`

**Fix:**
```ts
// In services schema
customerId: integer("customer_id")
  .notNull()
  .references(() => customersTable.id, { onDelete: "restrict" }),

staffId: integer("staff_id")
  .references(() => staffTable.id, { onDelete: "set null" }),
```
Apply same pattern to `subscriptions.customer_id`, `payments.customer_id`, `payments.subscription_id`.

---

### 2. Status Fields Should Be Enums

**Risk:** Invalid status values ("complet", "Pending", etc.) can be inserted — no DB-level enforcement.

**Fix:**
```ts
import { pgEnum } from "drizzle-orm/pg-core";

export const serviceStatusEnum = pgEnum("service_status", [
  "pending", "in_progress", "completed", "cancelled"
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active", "expired", "cancelled"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending", "success", "failed", "refunded"
]);
```

---

### 3. No Soft Delete

**Risk:** Deleting a customer permanently removes all history. The current route issues a hard `DELETE`.

**File:** `artifacts/api-server/src/routes/customers.ts:64`
```ts
// Current — hard delete:
router.delete("/:id", async (req, res) => {
  const [deleted] = await db.delete(customersTable).where(eq(customersTable.id, id)).returning();
```

**Fix:**
1. Add `deleted_at timestamp` column to `customers`, `staff`
2. Change DELETE route to set `deleted_at = now()`
3. Add `.where(isNull(customersTable.deletedAt))` to all SELECT queries

---

### 4. Missing Customer Fields (documented but absent)

| Field | Type | Purpose |
|---|---|---|
| `email` | text | Contact, notifications |
| `pincode` | text | Area filtering |
| `warranty_expiry` | date | Warranty tracking |
| `deleted_at` | timestamp | Soft delete support |

---

### 5. `amount` / Financial Values Stored as `real`

**Risk:** Floating point precision errors in financial calculations.

**Fix:** Use `numeric(10, 2)` (Drizzle: `numeric`) for all monetary columns (`payments.amount`, `subscriptions.amount`).

---

### 6. No Migration Strategy

**Current state:** Drizzle schema files exist but no documented process for running migrations safely in production.

**Fix:** Add `db:migrate` npm script and document the migration workflow. Use `drizzle-kit migrate` in CI before app deployment.

---

## Summary of Required Schema Changes

| Change | Priority | Effort |
|---|---|---|
| Add foreign key constraints | Critical | 1–2h |
| Add `deleted_at` soft delete columns | High | 1–2h |
| Convert status fields to pgEnum | High | 1–2h |
| Add missing customer fields | High | 30min |
| Change `real` to `numeric` for money | Medium | 30min |
| Add migration CI step | High | 1h |
