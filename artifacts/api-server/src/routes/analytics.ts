import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
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
    recentServicesRaw,
    recentPaymentsRaw,
  ] = await Promise.all([
    db.select({ totalCustomers: sql<number>`count(*)` }).from(customersTable),
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
      .where(eq(paymentsTable.status, "success")),
    db
      .select({ monthlyRevenue: sql<number>`coalesce(sum(amount), 0)` })
      .from(paymentsTable)
      .where(
        sql`status = 'success' AND created_at >= date_trunc('month', now())`
      ),
    db
      .select({ newContactsUnread: sql<number>`count(*)` })
      .from(contactTable)
      .where(eq(contactTable.isRead, false)),
    db.select({ totalStaff: sql<number>`count(*)` }).from(staffTable),
    db
      .select({ activeStaff: sql<number>`count(*)` })
      .from(staffTable)
      .where(eq(staffTable.isActive, true)),
    db.select().from(servicesTable).orderBy(sql`created_at DESC`).limit(5),
    db.select().from(paymentsTable).orderBy(sql`created_at DESC`).limit(5),
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
    recentServices: recentServicesRaw,
    recentPayments: recentPaymentsRaw,
  });
});

export default router;
