import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { contactTable, insertContactSchema } from "@workspace/db/schema";
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

export default router;
