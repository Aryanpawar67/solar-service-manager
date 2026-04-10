import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { customersTable, insertCustomerSchema, updateCustomerSchema } from "@workspace/db/schema";
import { eq, isNull, like, or, sql, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const notDeleted = isNull(customersTable.deletedAt);

  let baseFilter = notDeleted;
  if (search) {
    const searchFilter = or(
      like(customersTable.name, `%${search}%`),
      like(customersTable.phone, `%${search}%`),
      like(customersTable.address, `%${search}%`)
    )!;
    baseFilter = and(notDeleted, searchFilter)!;
  }

  const [data, [{ count }]] = await Promise.all([
    db.select().from(customersTable).where(baseFilter).limit(limitNum).offset(offset).orderBy(customersTable.createdAt),
    db.select({ count: sql<number>`count(*)` }).from(customersTable).where(baseFilter),
  ]);

  res.json({ data, total: Number(count), page: pageNum, limit: limitNum });
});

router.get("/export", async (req, res) => {
  const { search } = req.query as Record<string, string>;
  const notDeleted = isNull(customersTable.deletedAt);
  let filter = notDeleted;
  if (search) {
    const searchFilter = or(
      like(customersTable.name, `%${search}%`),
      like(customersTable.phone, `%${search}%`),
      like(customersTable.address, `%${search}%`)
    )!;
    filter = and(notDeleted, searchFilter)!;
  }

  const customers = await db.select().from(customersTable).where(filter).orderBy(customersTable.createdAt);

  const headers = ["id", "name", "phone", "email", "address", "city", "pincode", "solarCapacity", "installationDate", "warrantyExpiry", "notes", "createdAt"];
  const rows = customers.map(c => [
    c.id, c.name, c.phone, c.email ?? "", c.address, c.city ?? "", c.pincode ?? "",
    c.solarCapacity ?? "", c.installationDate ?? "", c.warrantyExpiry ?? "", c.notes ?? "",
    c.createdAt.toISOString(),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="customers.csv"');
  res.send(csv);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(and(eq(customersTable.id, id), isNull(customersTable.deletedAt)));
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
    .where(and(eq(customersTable.id, id), isNull(customersTable.deletedAt)))
    .returning();
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [customer] = await db
    .update(customersTable)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(customersTable.id, id), isNull(customersTable.deletedAt)))
    .returning();
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json({ success: true, message: "Customer deleted" });
});

export default router;
