import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { requireAuth, requireRole } from "../middleware/requireAuth";
import {
  customersTable,
  staffTable,
  servicesTable,
  subscriptionsTable,
  paymentsTable,
  contactTable,
} from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", async (req, res) => {
  const [
    [{ totalCustomers }],
    [{ activeSubscriptions }],
    [{ completedServices }],
    [{ pendingServices }],
    [{ inProgressServices }],
    [{ totalRevenue }],
    [{ monthlyRevenue }],
    [{ newContactsUnread }],
    [{ totalStaff }],
    [{ activeStaff }],
    [{ totalServices }],
    [{ upcomingServices }],
    [{ expiringSubscriptions }],
    [{ newCustomers }],
    [{ availableStaff }],
    [{ assignedStaff }],
    [{ serviceRevenue }],
    [{ subscriptionRevenue }],
    recentServicesRaw,
  ] = await Promise.all([
    db
      .select({ totalCustomers: sql<number>`count(*)` })
      .from(customersTable)
      .where(sql`deleted_at IS NULL`),
    db
      .select({ activeSubscriptions: sql<number>`count(*)` })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.status, "active")),
    db
      .select({ completedServices: sql<number>`count(*)` })
      .from(servicesTable)
      .where(eq(servicesTable.status, "completed")),
    db
      .select({ pendingServices: sql<number>`count(*)` })
      .from(servicesTable)
      .where(eq(servicesTable.status, "pending")),
    db
      .select({ inProgressServices: sql<number>`count(*)` })
      .from(servicesTable)
      .where(eq(servicesTable.status, "in_progress")),
    db
      .select({ totalRevenue: sql<number>`coalesce(sum(amount), 0)` })
      .from(paymentsTable)
      .where(eq(paymentsTable.status, "paid")),
    db
      .select({ monthlyRevenue: sql<number>`coalesce(sum(amount), 0)` })
      .from(paymentsTable)
      .where(sql`status = 'paid' AND created_at >= date_trunc('month', now())`),
    db
      .select({ newContactsUnread: sql<number>`count(*)` })
      .from(contactTable)
      .where(eq(contactTable.isRead, false)),
    db
      .select({ totalStaff: sql<number>`count(*)` })
      .from(staffTable)
      .where(sql`deleted_at IS NULL`),
    db
      .select({ activeStaff: sql<number>`count(*)` })
      .from(staffTable)
      .where(sql`is_active = true AND deleted_at IS NULL`),
    db.select({ totalServices: sql<number>`count(*)` }).from(servicesTable),
    db
      .select({ upcomingServices: sql<number>`count(*)` })
      .from(servicesTable)
      .where(sql`scheduled_date >= current_date AND status IN ('pending', 'in_progress')`),
    db
      .select({ expiringSubscriptions: sql<number>`count(*)` })
      .from(subscriptionsTable)
      .where(sql`status = 'active' AND end_date <= current_date + interval '30 days'`),
    db
      .select({ newCustomers: sql<number>`count(*)` })
      .from(customersTable)
      .where(sql`deleted_at IS NULL AND created_at >= now() - interval '30 days'`),
    db
      .select({ availableStaff: sql<number>`count(*)` })
      .from(staffTable)
      .where(
        sql`is_active = true AND deleted_at IS NULL AND id NOT IN (SELECT DISTINCT staff_id FROM services WHERE status = 'in_progress' AND staff_id IS NOT NULL)`
      ),
    db
      .select({ assignedStaff: sql<number>`count(DISTINCT staff_id)` })
      .from(servicesTable)
      .where(sql`status = 'in_progress' AND staff_id IS NOT NULL`),
    db
      .select({ serviceRevenue: sql<number>`coalesce(sum(amount), 0)` })
      .from(paymentsTable)
      .where(sql`status = 'paid' AND service_id IS NOT NULL`),
    db
      .select({ subscriptionRevenue: sql<number>`coalesce(sum(amount), 0)` })
      .from(paymentsTable)
      .where(sql`status = 'paid' AND subscription_id IS NOT NULL`),
    db.select().from(servicesTable).orderBy(sql`created_at DESC`).limit(5),
  ]);

  res.json({
    totalCustomers: Number(totalCustomers),
    activeSubscriptions: Number(activeSubscriptions),
    completedServices: Number(completedServices),
    pendingServices: Number(pendingServices),
    inProgressServices: Number(inProgressServices),
    totalRevenue: Number(totalRevenue),
    monthlyRevenue: Number(monthlyRevenue),
    newContactsUnread: Number(newContactsUnread),
    totalStaff: Number(totalStaff),
    activeStaff: Number(activeStaff),
    totalServices: Number(totalServices),
    upcomingServices: Number(upcomingServices),
    expiringSubscriptions: Number(expiringSubscriptions),
    newCustomers: Number(newCustomers),
    availableStaff: Number(availableStaff),
    assignedStaff: Number(assignedStaff),
    serviceRevenue: Number(serviceRevenue),
    subscriptionRevenue: Number(subscriptionRevenue),
    recentServices: recentServicesRaw,
    recentPayments: [],
  });
});

export default router;
