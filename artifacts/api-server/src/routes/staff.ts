import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { staffTable, insertStaffSchema, updateStaffSchema } from "@workspace/db/schema";
import { eq, like, or, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { search, available } = req.query as Record<string, string>;

  let query = db.select().from(staffTable);
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(staffTable);

  const filters = [];
  if (search) {
    filters.push(or(
      like(staffTable.name, `%${search}%`),
      like(staffTable.phone, `%${search}%`),
      like(staffTable.role, `%${search}%`)
    ));
  }
  if (available === "true") {
    filters.push(eq(staffTable.isActive, true));
  }

  if (filters.length > 0) {
    const combined = filters.length === 1 ? filters[0]! : sql`${filters[0]} AND ${filters[1]}`;
    query = query.where(combined) as typeof query;
    countQuery = countQuery.where(combined) as typeof countQuery;
  }

  const [data, [{ count }]] = await Promise.all([
    query.orderBy(staffTable.name),
    countQuery,
  ]);

  res.json({ data, total: Number(count) });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [member] = await db.select().from(staffTable).where(eq(staffTable.id, id));
  if (!member) return res.status(404).json({ error: "Staff not found" });
  res.json(member);
});

router.post("/", async (req, res) => {
  const parsed = insertStaffSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [member] = await db.insert(staffTable).values(parsed.data).returning();
  res.status(201).json(member);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = updateStaffSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [member] = await db
    .update(staffTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(staffTable.id, id))
    .returning();
  if (!member) return res.status(404).json({ error: "Staff not found" });
  res.json(member);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(staffTable).where(eq(staffTable.id, id)).returning();
  if (!deleted) return res.status(404).json({ error: "Staff not found" });
  res.json({ success: true, message: "Staff deleted" });
});

export default router;
