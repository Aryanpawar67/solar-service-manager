import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "Server misconfigured" });

  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name, role: user.role, staffId: user.staffId ?? null },
    secret,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, staffId: user.staffId ?? null },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      staffId: usersTable.staffId,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId));

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

// Register / update Expo push token for mobile notifications
router.post("/push-token", requireAuth, async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "token is required" });
  }

  await db
    .update(usersTable)
    .set({ pushToken: token })
    .where(eq(usersTable.id, req.user!.userId));

  res.json({ ok: true });
});

export default router;
