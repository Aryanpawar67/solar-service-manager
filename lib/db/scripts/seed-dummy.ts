/**
 * Seeds dummy data for dev/audit purposes.
 * Usage: DATABASE_URL=... pnpm tsx lib/db/scripts/seed-dummy.ts
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  customersTable,
  staffTable,
  servicesTable,
  subscriptionsTable,
  paymentsTable,
} from "../src/schema/index.js";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  // ── CUSTOMERS ──────────────────────────────────────────────────────────
  console.log("Seeding customers...");
  const customers = await db.insert(customersTable).values([
    { name: "Rajesh Sharma",   phone: "+91-9876543210", email: "rajesh.sharma@gmail.com",  address: "12 MG Road, Koramangala",        pincode: "560034", city: "Bengaluru",  solarCapacity: 5.0,  installationDate: "2022-03-15", warrantyExpiry: "2027-03-15", installationDetails: "5kW rooftop, 15 panels (Tier 1)", notes: "Prefers morning service visits" },
    { name: "Priya Mehta",     phone: "+91-9845012345", email: "priya.mehta@outlook.com",   address: "45 Baner Road, Balewadi",         pincode: "411045", city: "Pune",       solarCapacity: 3.5,  installationDate: "2021-11-20", warrantyExpiry: "2026-11-20", installationDetails: "3.5kW system, 10 panels",        notes: "Has dog, call before visiting" },
    { name: "Arjun Nair",      phone: "+91-9812345678", email: "arjun.nair@yahoo.com",      address: "78 Anna Salai, Teynampet",        pincode: "600018", city: "Chennai",    solarCapacity: 8.0,  installationDate: "2023-01-10", warrantyExpiry: "2028-01-10", installationDetails: "8kW commercial rooftop",          notes: "Weekend visits only" },
    { name: "Sunita Patel",    phone: "+91-9900112233", email: "sunita.patel@gmail.com",    address: "23 Satellite Road, Prahlad",      pincode: "380015", city: "Ahmedabad",  solarCapacity: 4.0,  installationDate: "2022-07-05", warrantyExpiry: "2027-07-05", installationDetails: "4kW residential, 12 panels",     notes: null },
    { name: "Vikram Singh",    phone: "+91-9711223344", email: "vikram.singh@gmail.com",    address: "56 Sector 18, Noida",             pincode: "201301", city: "Noida",      solarCapacity: 6.0,  installationDate: "2021-09-30", warrantyExpiry: "2026-09-30", installationDetails: "6kW system, 18 panels",           notes: "Gate code: 4521" },
    { name: "Deepa Krishnan",  phone: "+91-9654321098", email: "deepa.k@rediffmail.com",    address: "9 Jayanagar 4th Block",           pincode: "560041", city: "Bengaluru",  solarCapacity: 3.0,  installationDate: "2023-04-22", warrantyExpiry: "2028-04-22", installationDetails: "3kW starter system",              notes: "New customer, extra care" },
    { name: "Suresh Rajan",    phone: "+91-9543210987", email: null,                        address: "102 Velachery Main Road",         pincode: "600042", city: "Chennai",    solarCapacity: 10.0, installationDate: "2020-06-18", warrantyExpiry: "2025-06-18", installationDetails: "10kW commercial, 30 panels",      notes: "Warranty expiring soon" },
    { name: "Kavitha Reddy",   phone: "+91-9432109876", email: "kavitha.r@gmail.com",       address: "34 Jubilee Hills Road No.36",     pincode: "500033", city: "Hyderabad",  solarCapacity: 7.5,  installationDate: "2022-12-01", warrantyExpiry: "2027-12-01", installationDetails: "7.5kW premium residential",       notes: null },
    { name: "Mohan Das",       phone: "+91-9321098765", email: "mohan.das@gmail.com",       address: "15 Park Street, Bhowanipore",     pincode: "700025", city: "Kolkata",    solarCapacity: 2.0,  installationDate: "2023-06-14", warrantyExpiry: "2028-06-14", installationDetails: "2kW small rooftop",               notes: "Elderly customer, be patient" },
    { name: "Anita Joshi",     phone: "+91-9210987654", email: "anita.joshi@gmail.com",     address: "67 Deccan Gymkhana, Erandwane",   pincode: "411004", city: "Pune",       solarCapacity: 5.5,  installationDate: "2021-08-25", warrantyExpiry: "2026-08-25", installationDetails: "5.5kW system, 16 panels",         notes: "Very particular about cleaning" },
    { name: "Ravi Kumar",      phone: "+91-9109876543", email: "ravi.kumar@hotmail.com",    address: "88 Electronic City Phase 1",      pincode: "560100", city: "Bengaluru",  solarCapacity: 12.0, installationDate: "2020-02-10", warrantyExpiry: "2025-02-10", installationDetails: "12kW industrial, 36 panels",       notes: "Large system, 2 staff required" },
    { name: "Nisha Gupta",     phone: "+91-8998765432", email: "nisha.gupta@gmail.com",     address: "22 Vasundhara Enclave",           pincode: "110096", city: "Delhi",      solarCapacity: 4.5,  installationDate: "2023-02-28", warrantyExpiry: "2028-02-28", installationDetails: "4.5kW system, 14 panels",         notes: null },
  ]).returning({ id: customersTable.id });
  console.log(`  ✓ ${customers.length} customers`);

  // ── STAFF ──────────────────────────────────────────────────────────────
  console.log("Seeding staff...");
  const staff = await db.insert(staffTable).values([
    { name: "Amit Tiwari",  phone: "+91-9876501234", role: "Senior Technician", workArea: "Bengaluru South", availability: "Mon-Sat 9am-6pm", isActive: true },
    { name: "Renu Sharma",  phone: "+91-9765401234", role: "Technician",        workArea: "Pune",            availability: "Mon-Fri 8am-5pm", isActive: true },
    { name: "Kiran Patil",  phone: "+91-9654301234", role: "Technician",        workArea: "Chennai",         availability: "Mon-Sat 8am-6pm", isActive: true },
    { name: "Manoj Verma",  phone: "+91-9543201234", role: "Senior Technician", workArea: "Hyderabad",       availability: "Tue-Sun 9am-7pm", isActive: true },
    { name: "Pooja Shetty", phone: "+91-9432101234", role: "Supervisor",        workArea: "Bengaluru North", availability: "Mon-Fri 9am-5pm", isActive: true },
    { name: "Dilip Yadav",  phone: "+91-9321001234", role: "Technician",        workArea: "Delhi/NCR",       availability: "Mon-Sat 9am-6pm", isActive: true },
    { name: "Sheela Menon", phone: "+91-9210901234", role: "Technician",        workArea: "Kolkata",         availability: "Mon-Fri 9am-5pm", isActive: true },
    { name: "Rohit Nanda",  phone: "+91-9109801234", role: "Trainee",           workArea: "Bengaluru",       availability: "Mon-Fri 9am-5pm", isActive: false },
  ]).returning({ id: staffTable.id });
  console.log(`  ✓ ${staff.length} staff`);

  const c = customers.map(r => r.id);
  const s = staff.map(r => r.id);

  // ── SUBSCRIPTIONS ──────────────────────────────────────────────────────
  console.log("Seeding subscriptions...");
  const subs = await db.insert(subscriptionsTable).values([
    { customerId: c[0],  plan: "Annual Premium",  visitsPerMonth: 2, startDate: "2024-04-01", endDate: "2025-03-31", status: "active",    amount: "14999.00" },
    { customerId: c[1],  plan: "Annual Basic",    visitsPerMonth: 1, startDate: "2024-03-01", endDate: "2025-02-28", status: "active",    amount: "8999.00"  },
    { customerId: c[2],  plan: "Quarterly Pro",   visitsPerMonth: 2, startDate: "2024-01-01", endDate: "2024-03-31", status: "expired",   amount: "5499.00"  },
    { customerId: c[3],  plan: "Annual Premium",  visitsPerMonth: 2, startDate: "2024-05-01", endDate: "2025-04-30", status: "active",    amount: "14999.00" },
    { customerId: c[4],  plan: "Semi-Annual",     visitsPerMonth: 1, startDate: "2023-10-01", endDate: "2024-03-31", status: "expired",   amount: "6499.00"  },
    { customerId: c[5],  plan: "Annual Basic",    visitsPerMonth: 1, startDate: "2024-06-01", endDate: "2025-05-31", status: "active",    amount: "8999.00"  },
    { customerId: c[6],  plan: "Annual Premium",  visitsPerMonth: 2, startDate: "2024-01-01", endDate: "2024-12-31", status: "active",    amount: "14999.00" },
    { customerId: c[7],  plan: "Quarterly Pro",   visitsPerMonth: 2, startDate: "2024-04-01", endDate: "2024-06-30", status: "active",    amount: "5499.00"  },
    { customerId: c[8],  plan: "Monthly",         visitsPerMonth: 1, startDate: "2024-07-01", endDate: "2024-07-31", status: "cancelled", amount: "1299.00"  },
    { customerId: c[9],  plan: "Semi-Annual",     visitsPerMonth: 1, startDate: "2024-02-01", endDate: "2024-07-31", status: "active",    amount: "6499.00"  },
    { customerId: c[10], plan: "Annual Premium",  visitsPerMonth: 3, startDate: "2023-06-01", endDate: "2024-05-31", status: "expired",   amount: "19999.00" },
    { customerId: c[11], plan: "Annual Basic",    visitsPerMonth: 1, startDate: "2024-08-01", endDate: "2025-07-31", status: "active",    amount: "8999.00"  },
    { customerId: c[0],  plan: "Annual Premium",  visitsPerMonth: 2, startDate: "2023-04-01", endDate: "2024-03-31", status: "expired",   amount: "13999.00" },
  ]).returning({ id: subscriptionsTable.id });
  console.log(`  ✓ ${subs.length} subscriptions`);

  // ── SERVICES ───────────────────────────────────────────────────────────
  console.log("Seeding services...");
  const services = await db.insert(servicesTable).values([
    { customerId: c[0],  staffId: s[0], status: "completed",   scheduledDate: "2024-03-10", serviceType: "Panel Cleaning",         notes: "Quarterly cleaning",            remarks: "All 15 panels cleaned, output +12%" },
    { customerId: c[1],  staffId: s[1], status: "completed",   scheduledDate: "2024-03-12", serviceType: "Panel Cleaning",         notes: "Annual visit",                   remarks: "Cleaned & inspected" },
    { customerId: c[2],  staffId: s[2], status: "completed",   scheduledDate: "2024-03-05", serviceType: "Inverter Check",         notes: "Customer reported low output",   remarks: "Inverter settings recalibrated" },
    { customerId: c[3],  staffId: s[0], status: "completed",   scheduledDate: "2024-04-02", serviceType: "Panel Cleaning",         notes: "Quarterly visit",                remarks: "Cleaned 12 panels, bird droppings removed" },
    { customerId: c[4],  staffId: s[3], status: "completed",   scheduledDate: "2024-02-20", serviceType: "Full Inspection",        notes: "Annual inspection",              remarks: "System working fine" },
    { customerId: c[5],  staffId: s[4], status: "in_progress", scheduledDate: "2024-07-15", serviceType: "Panel Cleaning",         notes: "First visit for new customer",   remarks: null },
    { customerId: c[6],  staffId: s[2], status: "in_progress", scheduledDate: "2024-07-16", serviceType: "Fault Diagnosis",        notes: "Customer reported error code",   remarks: null },
    { customerId: c[7],  staffId: s[3], status: "completed",   scheduledDate: "2024-06-20", serviceType: "Panel Cleaning + Check", notes: "Quarterly premium visit",        remarks: "All systems optimal" },
    { customerId: c[8],  staffId: s[6], status: "cancelled",   scheduledDate: "2024-07-01", serviceType: "Panel Cleaning",         notes: "Customer cancelled",             remarks: "Customer unavailable" },
    { customerId: c[9],  staffId: s[1], status: "completed",   scheduledDate: "2024-05-15", serviceType: "Panel Cleaning",         notes: "Semi-annual visit",              remarks: "Cleaned 16 panels" },
    { customerId: c[10], staffId: s[0], status: "pending",     scheduledDate: "2024-07-20", serviceType: "Full System Audit",      notes: "2 staff required",               remarks: null },
    { customerId: c[11], staffId: s[5], status: "pending",     scheduledDate: "2024-07-22", serviceType: "Panel Cleaning",         notes: "First visit",                    remarks: null },
    { customerId: c[0],  staffId: s[4], status: "completed",   scheduledDate: "2023-09-10", serviceType: "Panel Cleaning",         notes: "Previous year visit",            remarks: "Good condition" },
    { customerId: c[2],  staffId: s[2], status: "completed",   scheduledDate: "2023-11-15", serviceType: "Inverter Replacement",   notes: "Inverter failed",                remarks: "Replaced under warranty" },
    { customerId: c[1],  staffId: s[1], status: "pending",     scheduledDate: "2024-07-25", serviceType: "Panel Cleaning",         notes: "Upcoming scheduled visit",       remarks: null },
  ]).returning({ id: servicesTable.id });
  console.log(`  ✓ ${services.length} services`);

  // ── PAYMENTS ───────────────────────────────────────────────────────────
  console.log("Seeding payments...");
  const payments = await db.insert(paymentsTable).values([
    { customerId: c[0],  subscriptionId: subs[0].id,  amount: "14999.00", status: "paid",    paymentMethod: "UPI",         transactionId: "UPI2024040112345", description: "Annual Premium 2024-25" },
    { customerId: c[1],  subscriptionId: subs[1].id,  amount: "8999.00",  status: "paid",    paymentMethod: "Net Banking",  transactionId: "NB2024030198765",  description: "Annual Basic 2024-25" },
    { customerId: c[2],  subscriptionId: subs[2].id,  amount: "5499.00",  status: "paid",    paymentMethod: "Credit Card",  transactionId: "CC2024010145678",  description: "Quarterly Pro Q1 2024" },
    { customerId: c[3],  subscriptionId: subs[3].id,  amount: "14999.00", status: "paid",    paymentMethod: "UPI",          transactionId: "UPI2024050167890", description: "Annual Premium 2024-25" },
    { customerId: c[4],  subscriptionId: subs[4].id,  amount: "6499.00",  status: "paid",    paymentMethod: "Cash",         transactionId: null,               description: "Semi-Annual Oct 2023 - Mar 2024" },
    { customerId: c[5],  subscriptionId: subs[5].id,  amount: "8999.00",  status: "pending", paymentMethod: null,           transactionId: null,               description: "Annual Basic 2024-25" },
    { customerId: c[6],  subscriptionId: subs[6].id,  amount: "14999.00", status: "paid",    paymentMethod: "Cheque",       transactionId: "CHQ00234512",      description: "Annual Premium 2024" },
    { customerId: c[7],  subscriptionId: subs[7].id,  amount: "5499.00",  status: "paid",    paymentMethod: "UPI",          transactionId: "UPI2024040198765", description: "Quarterly Pro Q2 2024" },
    { customerId: c[8],  subscriptionId: subs[8].id,  amount: "1299.00",  status: "refunded",paymentMethod: "UPI",          transactionId: "UPI2024070112399", description: "Monthly Jul 2024 - refunded" },
    { customerId: c[9],  subscriptionId: subs[9].id,  amount: "6499.00",  status: "paid",    paymentMethod: "Net Banking",  transactionId: "NB2024020154321",  description: "Semi-Annual Feb-Jul 2024" },
    { customerId: c[10], subscriptionId: subs[10].id, amount: "19999.00", status: "paid",    paymentMethod: "NEFT",         transactionId: "NEFT202306001122", description: "Annual Premium 2023-24" },
    { customerId: c[11], subscriptionId: subs[11].id, amount: "8999.00",  status: "paid",    paymentMethod: "UPI",          transactionId: "UPI2024080199001", description: "Annual Basic 2024-25" },
    { customerId: c[0],  subscriptionId: subs[12].id, amount: "13999.00", status: "paid",    paymentMethod: "UPI",          transactionId: "UPI2023040112233", description: "Annual Premium 2023-24" },
    { customerId: c[2],  subscriptionId: null,        amount: "2500.00",  status: "paid",    paymentMethod: "Cash",         transactionId: null,               description: "Out-of-warranty inverter replacement" },
    { customerId: c[5],  subscriptionId: null,        amount: "500.00",   status: "failed",  paymentMethod: "UPI",          transactionId: "UPI2024060188001", description: "Service charge - payment failed" },
  ]).returning({ id: paymentsTable.id });
  console.log(`  ✓ ${payments.length} payments`);

  console.log("\n✅ All dummy data seeded successfully!");
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
