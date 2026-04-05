/**
 * Creates the first admin user.
 * Usage: pnpm tsx scripts/seed-admin.ts
 *
 * Set DATABASE_URL in your environment first.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { usersTable } from "../lib/db/src/schema/users";

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
  } else {
    console.log(`ℹ Admin user already exists: ${EMAIL}`);
  }

  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
