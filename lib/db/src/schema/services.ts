import { pgTable, serial, integer, text, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  staffId: integer("staff_id"),
  status: text("status").notNull().default("pending"),
  scheduledDate: date("scheduled_date").notNull(),
  notes: text("notes"),
  serviceType: text("service_type"),
  preServiceImage: text("pre_service_image"),
  postServiceImage: text("post_service_image"),
  remarks: text("remarks"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertServiceSchema = createInsertSchema(servicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateServiceSchema = insertServiceSchema.partial();

export type InsertService = z.infer<typeof insertServiceSchema>;
export type UpdateService = z.infer<typeof updateServiceSchema>;
export type Service = typeof servicesTable.$inferSelect;
