import { Router } from "express";
import { db } from "@workspace/db";
import {
  customersTable,
  servicesTable,
  subscriptionsTable,
  paymentsTable,
  staffTable,
  contactTable,
  usersTable,
} from "@workspace/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { requireRole } from "../middleware/requireAuth";

const router = Router();

// All /me routes are customer-only
router.use(requireRole("customer"));

/** GET /api/me/profile — own customer record + notification preferences */
router.get("/profile", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked to this account" });

  const [[customer], [userRow]] = await Promise.all([
    db.select().from(customersTable)
      .where(and(eq(customersTable.id, customerId), isNull(customersTable.deletedAt))),
    db.select({ pushEnabled: usersTable.pushEnabled })
      .from(usersTable).where(eq(usersTable.id, req.user!.userId)),
  ]);

  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json({ ...customer, pushEnabled: userRow?.pushEnabled ?? true });
});

/** PUT /api/me/profile — update phone, address, email */
router.put("/profile", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked" });

  const { phone, address, email } = req.body as { phone?: string; address?: string; email?: string };
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
    .select({ service: servicesTable, staff: staffTable })
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
    .where(and(eq(subscriptionsTable.customerId, customerId), eq(subscriptionsTable.status, "active")))
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

/** POST /api/me/renewal-request — creates a contact inquiry for subscription renewal */
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

/** PUT /api/me/notifications — toggle push notification opt-in/out */
router.put("/notifications", async (req, res) => {
  const { pushEnabled } = req.body as { pushEnabled?: boolean };
  if (typeof pushEnabled !== "boolean") {
    return res.status(400).json({ error: "pushEnabled (boolean) is required" });
  }

  await db
    .update(usersTable)
    .set({ pushEnabled })
    .where(eq(usersTable.id, req.user!.userId));

  res.json({ ok: true, pushEnabled });
});

/** PUT /api/me/push-token — register or update the customer's Expo push token */
router.put("/push-token", async (req, res) => {
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
