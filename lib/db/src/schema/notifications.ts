import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { servicesTable } from "./services";
import { subscriptionsTable } from "./subscriptions";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "service_scheduled" | "service_completed" | "subscription_expiry"
  recipientPhone: text("recipient_phone").notNull(),
  recipientName: text("recipient_name"),
  message: text("message").notNull(),
  status: text("status").notNull().default("sent"), // "sent" | "failed"
  provider: text("provider"), // "twilio" | "mock"
  providerMessageId: text("provider_message_id"),
  error: text("error"),
  serviceId: integer("service_id").references(() => servicesTable.id),
  subscriptionId: integer("subscription_id").references(() => subscriptionsTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notificationsTable.$inferSelect;
