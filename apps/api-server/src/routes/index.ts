import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { contactTable, insertContactSchema, customersTable, insertCustomerSchema, subscriptionsTable, insertSubscriptionSchema } from "@workspace/db/schema";
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
import { requireAuth } from "../middleware/requireAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);

// Public: website visitors can submit the contact form without a token
router.post("/contact", async (req, res) => {
  const parsed = insertContactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [contact] = await db.insert(contactTable).values(parsed.data).returning();
  res.status(201).json(contact);
});

// Public: customer website booking flow (no login required)
router.post("/customers", async (req, res) => {
  const parsed = insertCustomerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [customer] = await db.insert(customersTable).values(parsed.data).returning();
  res.status(201).json(customer);
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
  const visitsPerMonth = body.visitsPerMonth ?? config?.visitsPerMonth ?? 1;
  const startDate = body.startDate || new Date().toISOString().split("T")[0];
  let endDate = body.endDate;
  if (!endDate) {
    const endDateObj = new Date(startDate);
    endDateObj.setMonth(endDateObj.getMonth() + 1);
    endDate = endDateObj.toISOString().split("T")[0];
  }
  const validStatuses = ["active", "expired", "cancelled"];
  const status = validStatuses.includes(body.status) ? body.status : "active";
  const dataToInsert = { ...body, visitsPerMonth, endDate, status, amount: body.amount !== undefined ? String(body.amount) : "0" };
  const parsed = insertSubscriptionSchema.safeParse(dataToInsert);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [subscription] = await db.insert(subscriptionsTable).values(parsed.data).returning();
  res.status(201).json(subscription);
});

// All routes below require authentication
router.use(requireAuth);
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

export default router;
