/**
 * Creates the first admin user.
 * Usage: pnpm --filter @workspace/db run seed-admin
 *
 * Set DATABASE_URL in your environment first.
 * Override defaults with ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME env vars.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { usersTable } from "../src/schema/users.js";

const EMAIL = process.env.ADMIN_EMAIL ?? "admin@greenvolt.in";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "changeme123";
const NAME = process.env.ADMIN_NAME ?? "Admin";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const [user] = await db
    .insert(usersTable)
    .values({ email: EMAIL, passwordHash, name: NAME, role: "admin" })
    .onConflictDoNothing()
    .returning();

  if (user) {
    console.log(`✓ Admin user created: ${user.email}`);
    console.log(`  Email:    ${EMAIL}`);
    console.log(`  Password: ${PASSWORD}`);
  } else {
    console.log(`ℹ Admin user already exists: ${EMAIL}`);
  }

  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
