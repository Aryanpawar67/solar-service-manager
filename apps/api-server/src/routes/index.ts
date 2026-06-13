import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { contactTable, insertContactSchema, customersTable, insertCustomerSchema, subscriptionsTable, insertSubscriptionSchema, usersTable, staffTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import healthRouter from "./health";
import authRouter from "./auth";
import customersRouter from "./customers";
import staffRouter from "./staff";
import servicesRouter from "./services";
import subscriptionsRouter from "./subscriptions";
import paymentsRouter from "./payments";
import contactRouter from "./contact";
import analyticsRouter from "./analytics";
import uploadRouter from "./upload";
import notificationsRouter from "./notifications";
import meRouter from "./me";
import { customerRazorpayRouter, razorpayWebhookRouter } from "./razorpay";
import { requireAuth } from "../middleware/requireAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);

// Public: website visitors can submit the contact form without a token
router.post("/contact", async (req, res) => {
  const parsed = insertContactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [contact] = await db.insert(contactTable).values(parsed.data).returning();
  return res.status(201).json(contact);
});

// Public: customer website booking flow (no login required)
router.post("/customers", async (req, res) => {
  const parsed = insertCustomerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [customer] = await db.insert(customersTable).values(parsed.data).returning();
  return res.status(201).json(customer);
});

router.post("/subscriptions", async (req, res) => {
  const PLAN_CONFIGS: Record<string, { visitsPerMonth: number }> = {
    basic: { visitsPerMonth: 1 },
    standard: { visitsPerMonth: 2 },
    premium: { visitsPerMonth: 4 },
  };
  const body = req.body;
  const plan = (body.plan as string) || "";
  if (!plan.trim()) return res.status(400).json({ error: "plan is required" });

  const config = PLAN_CONFIGS[plan.toLowerCase()];
  if (!config) return res.status(400).json({ error: "Invalid plan. Must be basic, standard, or premium" });

  // Server-side only: never accept visitsPerMonth, amount, or status from caller
  const visitsPerMonth = config.visitsPerMonth;
  const startDate = body.startDate || new Date().toISOString().split("T")[0];
  let endDate = body.endDate;
  if (!endDate) {
    const endDateObj = new Date(startDate);
    endDateObj.setMonth(endDateObj.getMonth() + 1);
    endDate = endDateObj.toISOString().split("T")[0];
  }
  const dataToInsert = { ...body, visitsPerMonth, endDate, status: "active", amount: "0" };
  const parsed = insertSubscriptionSchema.safeParse(dataToInsert);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [subscription] = await db.insert(subscriptionsTable).values(parsed.data).returning();
  return res.status(201).json(subscription);
});

// All routes below require authentication
router.use(requireAuth);

// Admin: create a new staff member with login credentials
router.post("/admin/create-staff", async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  const { name, phone, role: staffRole, email, password, workArea } = req.body as {
    name: string; phone: string; role: string; email: string; password: string; workArea?: string;
  };
  if (!name || !phone || !staffRole || !email || !password) {
    return res.status(400).json({ error: "name, phone, role, email, password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (existing) return res.status(409).json({ error: "Email already in use" });
  const bcrypt = (await import("bcrypt")).default;
  const passwordHash = await bcrypt.hash(password, 10);
  const [staffMember] = await db.insert(staffTable).values({ name, phone, role: staffRole, workArea: workArea || null, isActive: true }).returning();
  await db.insert(usersTable).values({ name, email: email.toLowerCase().trim(), passwordHash, role: "staff", staffId: staffMember.id });
  return res.status(201).json({ ok: true, staff: staffMember });
});

router.use("/customers", customersRouter);
router.use("/staff", staffRouter);
router.use("/services", servicesRouter);
router.use("/subscriptions", subscriptionsRouter);
router.use("/payments", paymentsRouter);
router.use("/contact", contactRouter);
router.use("/analytics", analyticsRouter);
router.use("/upload", uploadRouter);
router.use("/notifications", notificationsRouter);
router.use("/me", meRouter);
router.use("/me/razorpay", customerRazorpayRouter);
// Public Razorpay webhook — no requireAuth
router.use("/razorpay", razorpayWebhookRouter);

export default router;
