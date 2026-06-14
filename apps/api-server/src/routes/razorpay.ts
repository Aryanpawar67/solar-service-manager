import { Router } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { db } from "@workspace/db";
import {
  customersTable,
  servicesTable,
  paymentsTable,
  couponsTable,
  couponUsagesTable,
} from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middleware/requireAuth";
import { notify } from "../lib/notifications";
import { sendEmail } from "../lib/email";
import { paymentReceiptEmail } from "../lib/email-templates";

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId.includes("REPLACE_ME")) {
    throw new Error("Razorpay credentials are not configured.");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ── Customer-facing routes (require auth + customer role) ──────────────────────

export const customerRazorpayRouter = Router();
customerRazorpayRouter.use(requireAuth, requireRole("customer"));

/**
 * POST /api/me/razorpay/create-order
 * Creates a Razorpay order and a pending payment record.
 * The service booking is NOT created yet — only after payment verification.
 */
customerRazorpayRouter.post("/create-order", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked to this account" });

  const { amount } = req.body as { amount: number };
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "amount (in rupees) is required" });
  }

  let rzp: Razorpay;
  try {
    rzp = getRazorpay();
  } catch {
    return res.status(503).json({ error: "Payment gateway is not configured on this server." });
  }

  const razorpayOrder = await rzp.orders.create({
    amount: Math.round(amount * 100), // paise
    currency: "INR",
    receipt: `greenvolt_${customerId}_${Date.now()}`,
  });

  const [payment] = await db
    .insert(paymentsTable)
    .values({
      customerId,
      amount: String(amount),
      status: "pending",
      paymentMethod: "razorpay",
      description: "Online payment via Razorpay",
      razorpayOrderId: razorpayOrder.id,
    })
    .returning();

  return res.status(201).json({
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    paymentId: payment.id,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

/**
 * POST /api/me/razorpay/verify
 * Verifies Razorpay payment signature, creates the service booking,
 * links the payment, and fires an SMS confirmation.
 */
customerRazorpayRouter.post("/verify", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked" });

  const {
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    paymentId,
    serviceType,
    scheduledDate,
    timeSlot,
    notes,
    finalAmount,
    couponId,
    discountApplied,
  } = req.body as {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
    paymentId: number;
    serviceType: string;
    scheduledDate: string;
    timeSlot?: string;
    notes?: string;
    finalAmount: number;
    couponId?: number;
    discountApplied?: number;
  };

  if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature || !paymentId) {
    return res.status(400).json({ error: "Missing required Razorpay fields" });
  }

  // Verify signature
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const expectedSig = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSig !== razorpaySignature) {
    return res.status(400).json({ error: "Payment verification failed. Invalid signature." });
  }

  const [customer] = await db
    .select({ name: customersTable.name, phone: customersTable.phone })
    .from(customersTable)
    .where(eq(customersTable.id, customerId));

  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const bookingMeta = [
    timeSlot ? `Time: ${timeSlot}` : null,
    `Est. price: ₹${finalAmount}`,
    discountApplied ? `Discount: ₹${discountApplied}` : null,
    "Payment: Online (Razorpay)",
    notes || null,
    "Source: customer app",
  ].filter(Boolean).join(" | ");

  // Create service booking + update payment in parallel
  const [service] = await db
    .insert(servicesTable)
    .values({ customerId, serviceType, scheduledDate, notes: bookingMeta, status: "pending" })
    .returning();

  await db
    .update(paymentsTable)
    .set({
      status: "paid",
      serviceId: service.id,
      transactionId: razorpayPaymentId,
      razorpayPaymentId,
      razorpaySignature,
      updatedAt: new Date(),
    })
    .where(eq(paymentsTable.id, paymentId));

  // Record coupon usage
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

  // SMS confirmation (non-blocking)
  notify({
    type: "service_scheduled",
    to: customer.phone,
    recipientName: customer.name,
    message:
      `Hi ${customer.name}, payment of ₹${finalAmount} received. Your ${serviceType} is booked for ${scheduledDate}` +
      `${timeSlot ? ` (${timeSlot})` : ""}. Booking ID: #SVC-${service.id}. – GreenVolt / Sun House Solar`,
    serviceId: service.id,
  }).catch(() => {});

  // Payment receipt email (non-blocking)
  if (req.user!.email) {
    sendEmail({
      to: req.user!.email,
      ...paymentReceiptEmail(customer.name, String(finalAmount), serviceType, service.id, scheduledDate),
    }).catch(() => {});
  }

  return res.json({ verified: true, bookingId: service.id, serviceId: service.id });
});

/**
 * POST /api/me/razorpay/cancel-order
 * Marks a pending payment as cancelled when the user dismisses the Razorpay checkout modal.
 */
customerRazorpayRouter.post("/cancel-order", async (req, res) => {
  const customerId = req.user!.customerId;
  if (!customerId) return res.status(404).json({ error: "No customer linked" });

  const { razorpayOrderId } = req.body as { razorpayOrderId?: string };
  if (!razorpayOrderId) {
    return res.status(400).json({ error: "razorpayOrderId is required" });
  }

  await db
    .update(paymentsTable)
    .set({ status: "failed", updatedAt: new Date() })
    .where(eq(paymentsTable.razorpayOrderId, razorpayOrderId));

  return res.json({ ok: true });
});

// ── Webhook (public, no auth) ──────────────────────────────────────────────────

export const razorpayWebhookRouter = Router();

razorpayWebhookRouter.post("/webhook", async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.includes("REPLACE_ME")) {
    return res.status(200).json({ ok: true }); // silently accept if not configured
  }

  const signature = req.headers["x-razorpay-signature"] as string;
  const body = JSON.stringify(req.body);
  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (signature !== expectedSig) {
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const event = req.body as { event: string; payload?: { payment?: { entity?: { order_id?: string; id?: string; status?: string } } } };

  if (event.event === "payment.failed") {
    const orderId = event.payload?.payment?.entity?.order_id;
    if (orderId) {
      await db
        .update(paymentsTable)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(paymentsTable.razorpayOrderId, orderId));
    }
  }

  return res.status(200).json({ ok: true });
});
