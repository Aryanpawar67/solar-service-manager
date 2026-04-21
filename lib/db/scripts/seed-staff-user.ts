/**
 * Creates a staff user and links it to an existing staff record (or creates one).
 * Usage: pnpm --filter @workspace/db run seed-staff-user
 *
 * Set DATABASE_URL in your environment first.
 * Override defaults with STAFF_EMAIL, STAFF_PASSWORD, STAFF_NAME env vars.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { usersTable } from "../src/schema/users.js";
import { staffTable } from "../src/schema/staff.js";

const EMAIL = process.env.STAFF_EMAIL ?? "staff@greenvolt.in";
const PASSWORD = process.env.STAFF_PASSWORD ?? "changeme123";
const NAME = process.env.STAFF_NAME ?? "Staff Member";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // Ensure a staff record exists for this person
  const [staffRecord] = await db
    .insert(staffTable)
    .values({ name: NAME, phone: "0000000000", role: "technician", isActive: true })
    .onConflictDoNothing()
    .returning();

  const staffId = staffRecord?.id ?? null;

  const [user] = await db
    .insert(usersTable)
    .values({ email: EMAIL, passwordHash, name: NAME, role: "staff", staffId })
    .onConflictDoNothing()
    .returning();

  if (user) {
    console.log(`✓ Staff user created: ${user.email}`);
    console.log(`  Email:    ${EMAIL}`);
    console.log(`  Password: ${PASSWORD}`);
    if (staffId) console.log(`  Staff ID: ${staffId}`);
  } else {
    console.log(`ℹ Staff user already exists: ${EMAIL}`);
  }

  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
