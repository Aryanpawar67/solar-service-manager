/**
 * Seeds service/job records assigned to the staff user (staff@greenvolt.in, staffId=9).
 * Creates sample customers first if the customers table is empty.
 *
 * Usage: pnpm --filter @workspace/db run seed-staff-services
 *
 * Override staff ID with: STAFF_ID=9 (default: 9)
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { customersTable, servicesTable } from "../src/schema/index.js";

const TARGET_STAFF_ID = Number(process.env.STAFF_ID ?? "9");

/** Return YYYY-MM-DD for today + offsetDays */
function dateOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  // ── Ensure we have at least some customers ────────────────────────────────
  const existingCustomers = await db.select({ id: customersTable.id }).from(customersTable);

  let customerIds: number[];

  if (existingCustomers.length >= 3) {
    customerIds = existingCustomers.map(r => r.id);
    console.log(`✓ Using ${customerIds.length} existing customers`);
  } else {
    console.log("No customers found — seeding sample customers...");
    const inserted = await db.insert(customersTable).values([
      { name: "Rajesh Sharma",   phone: "+91-9876543210", email: "rajesh.sharma@gmail.com",  address: "12 MG Road, Koramangala, Bengaluru", pincode: "560034", city: "Bengaluru",  solarCapacity: 5.0,  installationDate: "2022-03-15", warrantyExpiry: "2027-03-15", installationDetails: "5kW rooftop, 15 panels (Tier 1)" },
      { name: "Priya Mehta",     phone: "+91-9845012345", email: "priya.mehta@outlook.com",  address: "45 Baner Road, Balewadi, Pune",       pincode: "411045", city: "Pune",       solarCapacity: 3.5,  installationDate: "2021-11-20", warrantyExpiry: "2026-11-20", installationDetails: "3.5kW system, 10 panels" },
      { name: "Arjun Nair",      phone: "+91-9812345678", email: "arjun.nair@yahoo.com",     address: "78 Anna Salai, Teynampet, Chennai",   pincode: "600018", city: "Chennai",    solarCapacity: 8.0,  installationDate: "2023-01-10", warrantyExpiry: "2028-01-10", installationDetails: "8kW commercial rooftop" },
      { name: "Sunita Patel",    phone: "+91-9900112233", email: "sunita.patel@gmail.com",   address: "23 Satellite Road, Prahlad, Ahmedabad", pincode: "380015", city: "Ahmedabad", solarCapacity: 4.0, installationDate: "2022-07-05", warrantyExpiry: "2027-07-05", installationDetails: "4kW residential, 12 panels" },
      { name: "Vikram Singh",    phone: "+91-9711223344", email: "vikram.singh@gmail.com",   address: "56 Sector 18, Noida",                 pincode: "201301", city: "Noida",      solarCapacity: 6.0,  installationDate: "2021-09-30", warrantyExpiry: "2026-09-30", installationDetails: "6kW system, 18 panels" },
    ]).onConflictDoNothing().returning({ id: customersTable.id });
    customerIds = inserted.map(r => r.id);
    console.log(`✓ Seeded ${customerIds.length} customers`);
  }

  const c = customerIds;

  // ── Seed services assigned to TARGET_STAFF_ID ─────────────────────────────
  console.log(`\nSeeding service jobs assigned to staff ID ${TARGET_STAFF_ID}...`);

  const services = [
    // Today's jobs
    {
      customerId: c[0 % c.length],
      staffId: TARGET_STAFF_ID,
      status: "in_progress" as const,
      scheduledDate: dateOffset(0),
      serviceType: "Panel Cleaning",
      notes: "Quarterly cleaning — 15 panels on rooftop",
    },
    {
      customerId: c[1 % c.length],
      staffId: TARGET_STAFF_ID,
      status: "pending" as const,
      scheduledDate: dateOffset(0),
      serviceType: "Inverter Check",
      notes: "Customer reported low output last week",
    },
    // Tomorrow
    {
      customerId: c[2 % c.length],
      staffId: TARGET_STAFF_ID,
      status: "pending" as const,
      scheduledDate: dateOffset(1),
      serviceType: "Full Inspection",
      notes: "Annual inspection visit",
    },
    // Day after tomorrow
    {
      customerId: c[3 % c.length],
      staffId: TARGET_STAFF_ID,
      status: "pending" as const,
      scheduledDate: dateOffset(2),
      serviceType: "Panel Cleaning",
      notes: "Bi-annual clean",
    },
    // Next week
    {
      customerId: c[4 % c.length],
      staffId: TARGET_STAFF_ID,
      status: "pending" as const,
      scheduledDate: dateOffset(7),
      serviceType: "Fault Diagnosis",
      notes: "Error code E02 on inverter display",
    },
    {
      customerId: c[0 % c.length],
      staffId: TARGET_STAFF_ID,
      status: "pending" as const,
      scheduledDate: dateOffset(10),
      serviceType: "Panel Cleaning + Check",
      notes: "Combined visit",
    },
    // Completed jobs (past)
    {
      customerId: c[1 % c.length],
      staffId: TARGET_STAFF_ID,
      status: "completed" as const,
      scheduledDate: dateOffset(-7),
      serviceType: "Panel Cleaning",
      notes: "Previous week visit",
      remarks: "All panels cleaned, output improved by 10%",
    },
    {
      customerId: c[2 % c.length],
      staffId: TARGET_STAFF_ID,
      status: "completed" as const,
      scheduledDate: dateOffset(-14),
      serviceType: "Inverter Recalibration",
      notes: "Settings were off",
      remarks: "Recalibrated, system running optimally",
    },
    {
      customerId: c[3 % c.length],
      staffId: TARGET_STAFF_ID,
      status: "completed" as const,
      scheduledDate: dateOffset(-3),
      serviceType: "Panel Cleaning",
      notes: "Routine quarterly",
      remarks: "Cleaned 12 panels",
    },
  ];

  const inserted = await db
    .insert(servicesTable)
    .values(services)
    .returning({ id: servicesTable.id });

  console.log(`✓ Seeded ${inserted.length} service jobs for staff ID ${TARGET_STAFF_ID}`);
  console.log("\nBreakdown:");
  console.log(`  • Today (in_progress/pending): ${services.filter(s => s.scheduledDate === dateOffset(0)).length}`);
  console.log(`  • Upcoming:                    ${services.filter(s => s.scheduledDate > dateOffset(0)).length}`);
  console.log(`  • Completed (past):            ${services.filter(s => s.status === "completed").length}`);
  console.log(`\n✅ Staff jobs seeded — log into the staff app to see them.`);

  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
