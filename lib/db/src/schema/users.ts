import { pgTable, serial, integer, text, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { staffTable } from "./staff";
import { customersTable } from "./customers";

export const userRoleEnum = pgEnum("user_role", ["admin", "staff", "customer"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("admin"),
  // Links a staff-role user to their staff record (null for admin/customer users)
  staffId: integer("staff_id").references(() => staffTable.id),
  // Links a customer-role user to their customer record (null for admin/staff users)
  customerId: integer("customer_id").references(() => customersTable.id),
  // Expo push token for mobile notifications (null when not registered)
  pushToken: text("push_token"),
  // Whether the user has opted in to push notifications (default true)
  pushEnabled: boolean("push_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8).max(100),
});

export type User = typeof usersTable.$inferSelect;
export type PublicUser = Omit<User, "passwordHash">;
