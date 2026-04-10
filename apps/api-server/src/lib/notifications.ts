import { db } from "@workspace/db";
import {
  notificationsTable,
  subscriptionsTable,
  customersTable,
} from "@workspace/db/schema";
import { eq, and, gte, lte, isNull, isNotNull } from "drizzle-orm";
import { logger } from "./logger";

type NotificationType = "service_scheduled" | "service_completed" | "subscription_expiry";

interface NotifyOptions {
  type: NotificationType;
  to: string;
  recipientName?: string;
  message: string;
  serviceId?: number;
  subscriptionId?: number;
}

async function sendSms(to: string, message: string): Promise<{ sid?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (accountSid && authToken && fromNumber) {
    try {
      // Dynamic import so twilio stays external and doesn't break the build
      const twilio = (await import("twilio")).default;
      const client = twilio(accountSid, authToken);
      const msg = await client.messages.create({ body: message, from: fromNumber, to });
      logger.info({ sid: msg.sid, to }, "SMS sent via Twilio");
      return { sid: msg.sid };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, to }, "Twilio send failed");
      return { error: message };
    }
  }

  // Mock mode — log and treat as success
  logger.info({ to, message }, "[NOTIFICATION MOCK] SMS would be sent");
  return { sid: `mock-${Date.now()}` };
}

export async function notify(opts: NotifyOptions): Promise<void> {
  try {
    const result = await sendSms(opts.to, opts.message);
    const provider = process.env.TWILIO_ACCOUNT_SID ? "twilio" : "mock";

    await db.insert(notificationsTable).values({
      type: opts.type,
      recipientPhone: opts.to,
      recipientName: opts.recipientName,
      message: opts.message,
      status: result.error ? "failed" : "sent",
      provider,
      providerMessageId: result.sid,
      error: result.error,
      serviceId: opts.serviceId,
      subscriptionId: opts.subscriptionId,
    });
  } catch (err) {
    logger.error({ err }, "Failed to record notification");
  }
}

export async function checkSubscriptionExpiry(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find subscriptions expiring in 1–30 days
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() + 1);
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + 30);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const expiring = await db
    .select({ subscription: subscriptionsTable, customer: customersTable })
    .from(subscriptionsTable)
    .leftJoin(customersTable, eq(subscriptionsTable.customerId, customersTable.id))
    .where(
      and(
        eq(subscriptionsTable.status, "active"),
        gte(subscriptionsTable.endDate, fmt(windowStart)),
        lte(subscriptionsTable.endDate, fmt(windowEnd))
      )
    );

  let sent = 0;

  for (const { subscription, customer } of expiring) {
    if (!customer?.phone) continue;

    // Check if we already sent an expiry notification for this subscription recently (within 25 days)
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 25);

    const [existing] = await db
      .select({ id: notificationsTable.id })
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.type, "subscription_expiry"),
          eq(notificationsTable.subscriptionId, subscription.id),
          gte(notificationsTable.createdAt, cutoff)
        )
      )
      .limit(1);

    if (existing) continue;

    const daysLeft = Math.ceil(
      (new Date(subscription.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    await notify({
      type: "subscription_expiry",
      to: customer.phone,
      recipientName: customer.name,
      message: `Hi ${customer.name}, your GreenVolt solar maintenance plan expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"} (${subscription.endDate}). Renew now to keep your system protected. – GreenVolt Solar`,
      subscriptionId: subscription.id,
    });

    sent++;
  }

  logger.info({ sent }, "Subscription expiry check complete");
  return sent;
}
