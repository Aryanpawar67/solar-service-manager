import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { staffTable, insertStaffSchema, updateStaffSchema } from "@workspace/db/schema";
import { and, eq, isNull, ilike, or, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { search, available, isActive } = req.query as Record<string, string>;

  const notDeleted = isNull(staffTable.deletedAt);
  const filters: ReturnType<typeof eq>[] = [notDeleted as any];

  if (search) {
    filters.push(or(
      ilike(staffTable.name, `%${search}%`),
      ilike(staffTable.phone, `%${search}%`),
      ilike(staffTable.role, `%${search}%`)
    ) as any);
  }
  if (available === "true") {
    filters.push(eq(staffTable.isActive, true) as any);
  }
  if (isActive === "false") {
    filters.push(eq(staffTable.isActive, false) as any);
  }

  const combined = filters.length === 1 ? filters[0]! : and(...filters as any) as any;

  const [data, [{ count }]] = await Promise.all([
    db.select().from(staffTable).where(combined).orderBy(staffTable.name),
    db.select({ count: sql<number>`count(*)` }).from(staffTable).where(combined),
  ]);

  res.json({ data, total: Number(count) });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [member] = await db
    .select()
    .from(staffTable)
    .where(and(eq(staffTable.id, id), isNull(staffTable.deletedAt)));
  if (!member) return res.status(404).json({ error: "Staff not found" });
  return res.json(member);
});

router.post("/", async (req, res) => {
  const parsed = insertStaffSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [member] = await db.insert(staffTable).values(parsed.data).returning();
  return res.status(201).json(member);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = updateStaffSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [member] = await db
    .update(staffTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(staffTable.id, id), isNull(staffTable.deletedAt)))
    .returning();
  if (!member) return res.status(404).json({ error: "Staff not found" });
  return res.json(member);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [member] = await db
    .update(staffTable)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(staffTable.id, id), isNull(staffTable.deletedAt)))
    .returning();
  if (!member) return res.status(404).json({ error: "Staff not found" });
  return res.json({ success: true, message: "Staff deleted" });
});

export default router;
