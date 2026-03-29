import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { contactTable, insertContactSchema } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const [data, [{ count }]] = await Promise.all([
    db.select().from(contactTable).orderBy(contactTable.createdAt).limit(limitNum).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(contactTable),
  ]);

  res.json({ data, total: Number(count), page: pageNum, limit: limitNum });
});

router.post("/", async (req, res) => {
  const parsed = insertContactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [contact] = await db.insert(contactTable).values(parsed.data).returning();
  res.status(201).json(contact);
});

router.put("/:id/read", async (req, res) => {
  const id = parseInt(req.params.id);
  const [contact] = await db
    .update(contactTable)
    .set({ isRead: true })
    .where(eq(contactTable.id, id))
    .returning();
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json(contact);
});

export default router;
