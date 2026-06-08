import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
  priority?: "default" | "normal" | "high";
  channelId?: string;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string; fault?: "developer" | "device" };
}

interface ExpoReceiptResponse {
  data: Record<string, { status: "ok" | "error"; message?: string; details?: { error?: string } }>;
}

/**
 * Send a push notification and handle the response ticket.
 * Cleans up invalid tokens automatically so stale records don't accumulate.
 */
export async function sendExpoPush(message: PushMessage): Promise<void> {
  if (!message.to.startsWith("ExponentPushToken[")) {
    logger.warn({ token: message.to }, "sendExpoPush: not a valid Expo token, skipping");
    return;
  }

  // Android: always target the greenvolt-jobs channel
  const payload = {
    ...message,
    sound: "default" as const,
    priority: "high" as const,
    channelId: message.channelId ?? "greenvolt-jobs",
  };

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error({ status: res.status, body }, "Expo push API HTTP error");
      return;
    }

    const json = await res.json() as { data: ExpoPushTicket[] };
    const ticket = json.data?.[0];

    if (!ticket) return;

    if (ticket.status === "error") {
      logger.warn({ ticket, token: message.to }, "Expo push ticket error");

      // DeviceNotRegistered → token is dead, remove it so we stop wasting sends
      if (ticket.details?.error === "DeviceNotRegistered") {
        await invalidatePushToken(message.to);
      }
      return;
    }

    // status === "ok" → ticket.id is the receipt ID; log it for debugging
    logger.info({ receiptId: ticket.id, to: message.to }, "Push notification sent");
  } catch (err) {
    logger.error({ err }, "sendExpoPush: network error");
  }
}

/**
 * Poll the Expo receipts API for a list of receipt IDs.
 * Returns count of tokens invalidated due to DeviceNotRegistered errors.
 *
 * Call this from a periodic job (e.g. every hour) with receipt IDs you
 * collected from sendExpoPush ticket responses.
 */
export async function checkPushReceipts(receiptIds: string[]): Promise<number> {
  if (receiptIds.length === 0) return 0;

  let invalidated = 0;
  // Expo recommends batches of ≤100
  const batches: string[][] = [];
  for (let i = 0; i < receiptIds.length; i += 100) {
    batches.push(receiptIds.slice(i, i + 100));
  }

  for (const batch of batches) {
    try {
      const res = await fetch(EXPO_RECEIPTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ids: batch }),
      });

      if (!res.ok) continue;

      const json = await res.json() as ExpoReceiptResponse;
      for (const [id, receipt] of Object.entries(json.data)) {
        if (receipt.status === "error") {
          logger.warn({ receiptId: id, error: receipt.details?.error }, "Push receipt error");
          if (receipt.details?.error === "DeviceNotRegistered") {
            // We don't have the token here, but we log for manual cleanup
            logger.warn({ receiptId: id }, "DeviceNotRegistered receipt — token should be cleaned up");
            invalidated++;
          }
        }
      }
    } catch (err) {
      logger.error({ err }, "checkPushReceipts: network error");
    }
  }

  return invalidated;
}

/** Null out a push token that is no longer valid. */
async function invalidatePushToken(token: string): Promise<void> {
  try {
    const result = await db
      .update(usersTable)
      .set({ pushToken: null })
      .where(eq(usersTable.pushToken, token))
      .returning({ id: usersTable.id });

    if (result.length > 0) {
      logger.info({ userId: result[0]!.id }, "Invalidated stale push token");
    }
  } catch (err) {
    logger.error({ err }, "invalidatePushToken: DB error");
  }
}

/**
 * Notify a staff member that a new service job has been assigned to them.
 */
export async function notifyJobAssigned(staffId: number, serviceId: number, customerName: string): Promise<void> {
  const [user] = await db
    .select({ pushToken: usersTable.pushToken })
    .from(usersTable)
    .where(eq(usersTable.staffId, staffId));

  if (!user?.pushToken) return;

  await sendExpoPush({
    to: user.pushToken,
    title: "New Job Assigned",
    body: `Service job for ${customerName} has been assigned to you.`,
    data: { jobId: serviceId, screen: "job-detail" },
  });
}

/**
 * Send a push notification to a customer by their customerId.
 */
export async function notifyCustomer(
  customerId: number,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const [user] = await db
    .select({ pushToken: usersTable.pushToken, pushEnabled: usersTable.pushEnabled })
    .from(usersTable)
    .where(eq(usersTable.customerId, customerId));

  if (!user?.pushToken || user.pushEnabled === false) return;

  await sendExpoPush({ to: user.pushToken, title, body, data });
}
