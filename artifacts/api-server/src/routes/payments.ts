import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { paymentsTable, customersTable, insertPaymentSchema, updatePaymentSchema } from "@workspace/db/schema";
import { eq, sql, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { customerId, status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const filters = [];
  if (status) filters.push(eq(paymentsTable.status, status));
  if (customerId) filters.push(eq(paymentsTable.customerId, parseInt(customerId)));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const [rawData, [{ count }]] = await Promise.all([
    db
      .select({ payment: paymentsTable, customer: customersTable })
      .from(paymentsTable)
      .leftJoin(customersTable, eq(paymentsTable.customerId, customersTable.id))
      .where(whereClause)
      .orderBy(paymentsTable.createdAt)
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(paymentsTable).where(whereClause),
  ]);

  const data = rawData.map(({ payment, customer }) => ({ ...payment, customer }));
  res.json({ data, total: Number(count), page: pageNum, limit: limitNum });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db
    .select({ payment: paymentsTable, customer: customersTable })
    .from(paymentsTable)
    .leftJoin(customersTable, eq(paymentsTable.customerId, customersTable.id))
    .where(eq(paymentsTable.id, id));

  if (!row) return res.status(404).json({ error: "Payment not found" });
  res.json({ ...row.payment, customer: row.customer });
});

router.post("/", async (req, res) => {
  const parsed = insertPaymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [payment] = await db.insert(paymentsTable).values(parsed.data).returning();
  res.status(201).json(payment);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = updatePaymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [payment] = await db
    .update(paymentsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(paymentsTable.id, id))
    .returning();
  if (!payment) return res.status(404).json({ error: "Payment not found" });
  res.json(payment);
});

export default router;
