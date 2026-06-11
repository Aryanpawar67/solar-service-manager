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
  couponsTable,
  couponUsagesTable,
} from "@workspace/db/schema";
import { eq, desc, and, isNull, count, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middleware/requireAuth";
import { notify } from "../lib/notifications";

const router = Router();

/** PUT /api/me/push-token — register or update the Expo push token (all roles: customer, staff, admin) */
// Defined BEFORE router.use(requireRole) so requireAuth-only applies here
router.put("/push-token", requireAuth, async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "token is required" });
  }

  await db
    .update(usersTable)
    .set({ pushToken: token })
    .where(eq(usersTable.id, req.user!.userId));

  return res.json({ ok: true });
});

// All remaining /me routes are customer-only
router.use(requireAuth, requireRole("customer"));

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
  return res.json({ ...customer, pushEnabled: userRow?.pushEnabled ?? true });
});

/** PUT /api/me/profile — update phone, address, email, name */
router.put("/profile", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked" });

  const { phone, address, city, email, name } = req.body as { phone?: string; address?: string; city?: string; email?: string; name?: string };
  const customerUpdate: Record<string, unknown> = {};
  if (phone !== undefined) customerUpdate.phone = phone;
  if (address !== undefined) customerUpdate.address = address;
  if (city !== undefined) customerUpdate.city = city;
  if (email !== undefined) customerUpdate.email = email;
  if (name !== undefined) customerUpdate.name = name;

  if (Object.keys(customerUpdate).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const [updated] = await db
    .update(customersTable)
    .set(customerUpdate)
    .where(eq(customersTable.id, customerId))
    .returning();

  // Keep usersTable in sync for name and email
  const userUpdate: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) userUpdate.name = name;
  if (email !== undefined) userUpdate.email = email;
  if (Object.keys(userUpdate).length > 1) {
    await db.update(usersTable).set(userUpdate).where(eq(usersTable.id, req.user!.userId));
  }

  return res.json(updated);
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
  return res.json({ data, page: pageNum, limit: limitNum });
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
  return res.json({ ...row.service, staff: row.staff });
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
  return res.json(subscription);
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

  return res.json({ data: rows, page: pageNum, limit: limitNum });
});

/** POST /api/me/renewal-request — creates a contact inquiry for subscription renewal */
router.post("/renewal-request", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked" });

  const [customer] = await db
    .select({ name: customersTable.name, phone: customersTable.phone, email: customersTable.email })
    .from(customersTable)
    .where(eq(customersTable.id, customerId));

  if (!customer) return res.status(404).json({ error: "Customer not found" });

  await db.insert(contactTable).values({
    name: customer.name,
    email: customer.email ?? "",
    phone: customer.phone,
    message: `Subscription renewal request from customer ID ${customerId} (${customer.name}).`,
  });

  return res.json({ ok: true, message: "Renewal request submitted. Our team will contact you soon." });
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

  return res.json({ ok: true, pushEnabled });
});

/** GET /api/me/coupons — list active coupons for the customer */
router.get("/coupons", async (req, res) => {
  const now = new Date();
  const coupons = await db
    .select()
    .from(couponsTable)
    .where(
      and(
        eq(couponsTable.active, true),
        sql`(${couponsTable.expiresAt} IS NULL OR ${couponsTable.expiresAt} > ${now})`
      )
    );
  return res.json(coupons);
});

/** POST /api/me/coupons/validate — validate a coupon for a given order amount */
router.post("/coupons/validate", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked" });

  const { code, orderAmount } = req.body as { code: string; orderAmount: number };
  if (!code || !orderAmount) {
    return res.status(400).json({ error: "code and orderAmount are required" });
  }

  const now = new Date();
  const [coupon] = await db
    .select()
    .from(couponsTable)
    .where(
      and(
        eq(couponsTable.code, code.toUpperCase().trim()),
        eq(couponsTable.active, true),
        sql`(${couponsTable.expiresAt} IS NULL OR ${couponsTable.expiresAt} > ${now})`
      )
    );

  if (!coupon) return res.status(404).json({ error: "Invalid or expired coupon code" });

  const minOrder = coupon.minOrderAmount ? parseFloat(coupon.minOrderAmount) : 0;
  if (orderAmount < minOrder) {
    return res.status(400).json({ error: `Minimum order amount is ₹${minOrder} for this coupon` });
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ error: "This coupon has reached its usage limit" });
  }

  const [usageRow] = await db
    .select({ cnt: count() })
    .from(couponUsagesTable)
    .where(
      and(
        eq(couponUsagesTable.couponId, coupon.id),
        eq(couponUsagesTable.customerId, customerId)
      )
    );

  if ((usageRow?.cnt ?? 0) >= coupon.perCustomerLimit) {
    return res.status(400).json({ error: "You have already used this coupon" });
  }

  const value = parseFloat(String(coupon.value));
  let discount =
    coupon.type === "percent"
      ? Math.round((orderAmount * value) / 100)
      : value;

  if (coupon.maxDiscount !== null) {
    discount = Math.min(discount, parseFloat(String(coupon.maxDiscount)));
  }

  return res.json({
    valid: true,
    couponId: coupon.id,
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value,
    discount,
  });
});

/** POST /api/me/book — customer-initiated service booking */
router.post("/book", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked to this account" });

  const { serviceType, scheduledDate, timeSlot, notes, estimatedPrice, couponId, discountApplied } = req.body as {
    serviceType: string;
    scheduledDate: string;
    timeSlot?: string;
    notes?: string;
    estimatedPrice?: number;
    couponId?: number;
    discountApplied?: number;
  };

  if (!serviceType || !scheduledDate) {
    return res.status(400).json({ error: "serviceType and scheduledDate are required" });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    return res.status(400).json({ error: "scheduledDate must be YYYY-MM-DD" });
  }

  const [customer] = await db
    .select({ name: customersTable.name, phone: customersTable.phone })
    .from(customersTable)
    .where(eq(customersTable.id, customerId));

  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const bookingMeta = [
    timeSlot ? `Time: ${timeSlot}` : null,
    estimatedPrice ? `Est. price: ₹${estimatedPrice}` : null,
    discountApplied ? `Discount: ₹${discountApplied}` : null,
    notes || null,
    "Source: customer app",
  ].filter(Boolean).join(" | ");

  const [service] = await db
    .insert(servicesTable)
    .values({ customerId, serviceType, scheduledDate, notes: bookingMeta, status: "pending" })
    .returning();

  // Record coupon usage and increment counter
  if (couponId && discountApplied) {
    await Promise.all([
      db.insert(couponUsagesTable).values({
        couponId,
        customerId,
        serviceId: service.id,
        discountApplied: String(discountApplied),
      }),
      db.update(couponsTable)
        .set({ usedCount: sql`${couponsTable.usedCount} + 1` })
        .where(eq(couponsTable.id, couponId)),
    ]);
  }

  // Fire SMS confirmation (non-blocking)
  notify({
    type: "service_scheduled",
    to: customer.phone,
    recipientName: customer.name,
    message:
      `Hi ${customer.name}, your ${serviceType} service has been booked for ${scheduledDate}` +
      `${timeSlot ? ` (${timeSlot})` : ""}. Booking ID: #SVC-${service.id}. ` +
      `Our team will confirm shortly. – GreenVolt / Sun House Solar`,
    serviceId: service.id,
  }).catch(() => {});

  return res.status(201).json({
    bookingId: service.id,
    service,
    message: "Booking confirmed. You'll receive an SMS shortly.",
  });
});

export default router;
