import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { checkSubscriptionExpiry } from "../lib/notifications";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { type, status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const filters = [];
  if (type) filters.push(eq(notificationsTable.type, type));
  if (status) filters.push(eq(notificationsTable.status, status));
  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const [data, [{ count }]] = await Promise.all([
    db.select().from(notificationsTable).where(whereClause)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(limitNum).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(notificationsTable).where(whereClause),
  ]);

  res.json({ data, total: Number(count), page: pageNum, limit: limitNum });
});

router.post("/check-expiry", async (_req, res) => {
  const sent = await checkSubscriptionExpiry();
  res.json({ sent, message: `${sent} expiry notification${sent === 1 ? "" : "s"} sent` });
});

export default router;
