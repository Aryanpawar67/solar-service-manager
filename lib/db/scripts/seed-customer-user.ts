/**
 * Creates a test customer-role user linked to an existing customer record.
 * Useful for testing the customer mobile app flow end-to-end.
 *
 * Usage:
 *   DATABASE_URL=... pnpm --filter @workspace/db exec tsx scripts/seed-customer-user.ts
 *
 * Override defaults with env vars:
 *   CUSTOMER_EMAIL, CUSTOMER_PASSWORD, CUSTOMER_NAME, CUSTOMER_ID
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { usersTable } from "../src/schema/users.js";
import { customersTable } from "../src/schema/customers.js";
import { eq, isNull } from "drizzle-orm";

const EMAIL = process.env.CUSTOMER_EMAIL ?? "customer@greenvolt.in";
const PASSWORD = process.env.CUSTOMER_PASSWORD ?? "customer123";
const NAME = process.env.CUSTOMER_NAME ?? "Rajesh Sharma";
const CUSTOMER_ID = process.env.CUSTOMER_ID ? parseInt(process.env.CUSTOMER_ID) : null;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  // Resolve customerId — use provided ID or pick the first customer
  let customerId = CUSTOMER_ID;
  if (!customerId) {
    const [first] = await db
      .select({ id: customersTable.id, name: customersTable.name })
      .from(customersTable)
      .where(isNull(customersTable.deletedAt))
      .limit(1);

    if (!first) {
      console.error("✗ No customers found in database. Run seed-dummy.ts first.");
      process.exit(1);
    }
    customerId = first.id;
    console.log(`ℹ No CUSTOMER_ID set — using first customer: ID ${first.id} (${first.name})`);
  } else {
    const [customer] = await db
      .select({ id: customersTable.id, name: customersTable.name })
      .from(customersTable)
      .where(eq(customersTable.id, customerId));

    if (!customer) {
      console.error(`✗ Customer ID ${customerId} not found.`);
      process.exit(1);
    }
    console.log(`ℹ Linking to customer: ID ${customer.id} (${customer.name})`);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: EMAIL,
      passwordHash,
      name: NAME,
      role: "customer",
      customerId,
    })
    .onConflictDoNothing()
    .returning();

  if (user) {
    console.log(`✓ Customer user created`);
    console.log(`  Email:       ${EMAIL}`);
    console.log(`  Password:    ${PASSWORD}`);
    console.log(`  Customer ID: ${customerId}`);
    console.log(`  Role:        customer`);
  } else {
    console.log(`ℹ Customer user already exists: ${EMAIL}`);
  }

  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
