import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
  priority?: "default" | "normal" | "high";
}

/**
 * Send an Expo push notification to a single Expo push token.
 * Silently ignores errors so callers don't need to worry about notification failures.
 */
export async function sendExpoPush(message: PushMessage): Promise<void> {
  if (!message.to.startsWith("ExponentPushToken[")) {
    logger.warn({ token: message.to }, "sendExpoPush: not a valid Expo token, skipping");
    return;
  }

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({ ...message, sound: "default", priority: "high" }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error({ status: res.status, body }, "Expo push API error");
    }
  } catch (err) {
    logger.error({ err }, "sendExpoPush: network error");
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
