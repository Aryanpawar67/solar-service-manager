import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { contactTable, customersTable, insertContactSchema } from "@workspace/db/schema";
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

// PATCH-style update: PUT /contact/:id with body { isRead: true/false }
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const updates: Record<string, unknown> = {};
  if (typeof req.body.isRead === "boolean") updates.isRead = req.body.isRead;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
  const [contact] = await db.update(contactTable).set(updates).where(eq(contactTable.id, id)).returning();
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json(contact);
});

// Convenience alias: PUT /contact/:id/read
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

router.post("/:id/convert", async (req, res) => {
  const id = parseInt(req.params.id);
  const [contact] = await db.select().from(contactTable).where(eq(contactTable.id, id));
  if (!contact) return res.status(404).json({ error: "Contact not found" });

  const [customer] = await db
    .insert(customersTable)
    .values({
      name: contact.name,
      phone: contact.phone ?? "",
      email: contact.email,
      address: req.body.address ?? "",
      city: req.body.city,
      notes: contact.message,
    })
    .returning();

  await db.update(contactTable).set({ isRead: true }).where(eq(contactTable.id, id));

  res.status(201).json(customer);
});

export default router;
