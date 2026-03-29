import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { customersTable, insertCustomerSchema, updateCustomerSchema } from "@workspace/db/schema";
import { eq, like, or, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  let query = db.select().from(customersTable);
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(customersTable);

  if (search) {
    const searchFilter = or(
      like(customersTable.name, `%${search}%`),
      like(customersTable.phone, `%${search}%`),
      like(customersTable.address, `%${search}%`)
    );
    query = query.where(searchFilter) as typeof query;
    countQuery = countQuery.where(searchFilter) as typeof countQuery;
  }

  const [data, [{ count }]] = await Promise.all([
    query.limit(limitNum).offset(offset).orderBy(customersTable.createdAt),
    countQuery,
  ]);

  res.json({ data, total: Number(count), page: pageNum, limit: limitNum });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id));
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

router.post("/", async (req, res) => {
  const parsed = insertCustomerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [customer] = await db.insert(customersTable).values(parsed.data).returning();
  res.status(201).json(customer);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = updateCustomerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [customer] = await db
    .update(customersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(customersTable.id, id))
    .returning();
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(customersTable).where(eq(customersTable.id, id)).returning();
  if (!deleted) return res.status(404).json({ error: "Customer not found" });
  res.json({ success: true, message: "Customer deleted" });
});

export default router;
