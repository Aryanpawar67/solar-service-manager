import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  servicesTable,
  customersTable,
  staffTable,
  insertServiceSchema,
  updateServiceSchema,
} from "@workspace/db/schema";
import { eq, sql, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { status, staffId, customerId, date, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const filters = [];
  if (status) filters.push(eq(servicesTable.status, status));
  if (staffId) filters.push(eq(servicesTable.staffId, parseInt(staffId)));
  if (customerId) filters.push(eq(servicesTable.customerId, parseInt(customerId)));
  if (date) filters.push(eq(servicesTable.scheduledDate, date));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const [rawData, [{ count }]] = await Promise.all([
    db
      .select({
        service: servicesTable,
        customer: customersTable,
        staff: staffTable,
      })
      .from(servicesTable)
      .leftJoin(customersTable, eq(servicesTable.customerId, customersTable.id))
      .leftJoin(staffTable, eq(servicesTable.staffId, staffTable.id))
      .where(whereClause)
      .orderBy(servicesTable.scheduledDate)
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(servicesTable).where(whereClause),
  ]);

  const data = rawData.map(({ service, customer, staff }) => ({
    ...service,
    customer,
    staff,
  }));

  res.json({ data, total: Number(count), page: pageNum, limit: limitNum });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db
    .select({ service: servicesTable, customer: customersTable, staff: staffTable })
    .from(servicesTable)
    .leftJoin(customersTable, eq(servicesTable.customerId, customersTable.id))
    .leftJoin(staffTable, eq(servicesTable.staffId, staffTable.id))
    .where(eq(servicesTable.id, id));

  if (!row) return res.status(404).json({ error: "Service not found" });
  res.json({ ...row.service, customer: row.customer, staff: row.staff });
});

router.post("/", async (req, res) => {
  const parsed = insertServiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [service] = await db.insert(servicesTable).values(parsed.data).returning();
  res.status(201).json(service);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = updateServiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.status === "completed" && !parsed.data.completedAt) {
    updateData.completedAt = new Date();
  }

  const [service] = await db
    .update(servicesTable)
    .set(updateData)
    .where(eq(servicesTable.id, id))
    .returning();
  if (!service) return res.status(404).json({ error: "Service not found" });
  res.json(service);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(servicesTable).where(eq(servicesTable.id, id)).returning();
  if (!deleted) return res.status(404).json({ error: "Service not found" });
  res.json({ success: true, message: "Service deleted" });
});

export default router;
