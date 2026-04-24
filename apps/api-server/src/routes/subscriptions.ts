import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { subscriptionsTable, customersTable, insertSubscriptionSchema, updateSubscriptionSchema } from "@workspace/db/schema";
import { eq, sql, and } from "drizzle-orm";

const router: IRouter = Router();

const PLAN_CONFIGS: Record<string, { visitsPerMonth: number }> = {
  basic: { visitsPerMonth: 1 },
  standard: { visitsPerMonth: 2 },
  premium: { visitsPerMonth: 4 },
};

router.get("/", async (req, res) => {
  const { status, customerId, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const filters = [];
  if (status) filters.push(eq(subscriptionsTable.status, status as "active" | "expired" | "cancelled"));
  if (customerId) filters.push(eq(subscriptionsTable.customerId, parseInt(customerId)));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const [rawData, [{ count }]] = await Promise.all([
    db
      .select({ subscription: subscriptionsTable, customer: customersTable })
      .from(subscriptionsTable)
      .leftJoin(customersTable, eq(subscriptionsTable.customerId, customersTable.id))
      .where(whereClause)
      .orderBy(subscriptionsTable.createdAt)
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(subscriptionsTable).where(whereClause),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const data = rawData.map(({ subscription, customer }) => {
    const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
    const daysUntilExpiry = endDate
      ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return { ...subscription, daysUntilExpiry, customer };
  });
  res.json({ data, total: Number(count), page: pageNum, limit: limitNum });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db
    .select({ subscription: subscriptionsTable, customer: customersTable })
    .from(subscriptionsTable)
    .leftJoin(customersTable, eq(subscriptionsTable.customerId, customersTable.id))
    .where(eq(subscriptionsTable.id, id));

  if (!row) return res.status(404).json({ error: "Subscription not found" });
  return res.json({ ...row.subscription, customer: row.customer });
});

router.post("/", async (req, res) => {
  const body = req.body;
  const plan = (body.plan as string) || "";
  if (!plan.trim()) return res.status(400).json({ error: "plan is required" });

  // visitsPerMonth: respect caller-provided value; fall back to plan config, then 1
  const config = PLAN_CONFIGS[plan.toLowerCase()];
  const visitsPerMonth = body.visitsPerMonth ?? config?.visitsPerMonth ?? 1;

  const startDate = body.startDate || new Date().toISOString().split("T")[0];
  // Use provided endDate if given; otherwise auto-calculate 1 month from start
  let endDate = body.endDate;
  if (!endDate) {
    const endDateObj = new Date(startDate);
    endDateObj.setMonth(endDateObj.getMonth() + 1);
    endDate = endDateObj.toISOString().split("T")[0];
  }

  // status: allow caller to set active/expired/cancelled; default to "active"
  const validStatuses = ["active", "expired", "cancelled"];
  const status = validStatuses.includes(body.status) ? body.status : "active";

  const dataToInsert = {
    ...body,
    visitsPerMonth,
    endDate,
    status,
    amount: body.amount !== undefined ? String(body.amount) : "0",
  };

  const parsed = insertSubscriptionSchema.safeParse(dataToInsert);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [subscription] = await db.insert(subscriptionsTable).values(parsed.data).returning();
  return res.status(201).json(subscription);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = updateSubscriptionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.plan) {
    const config = PLAN_CONFIGS[parsed.data.plan];
    if (config) updateData.visitsPerMonth = config.visitsPerMonth;
  }

  const [subscription] = await db
    .update(subscriptionsTable)
    .set(updateData)
    .where(eq(subscriptionsTable.id, id))
    .returning();
  if (!subscription) return res.status(404).json({ error: "Subscription not found" });
  return res.json(subscription);
});

export default router;
