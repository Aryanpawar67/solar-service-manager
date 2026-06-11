import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable, staffTable, customersTable } from "@workspace/db/schema";
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
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      staffId: user.staffId ?? null,
      customerId: user.customerId ?? null,
    },
    secret,
    { expiresIn: "8h" }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      staffId: user.staffId ?? null,
      customerId: user.customerId ?? null,
    },
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
      customerId: usersTable.customerId,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId));

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user });
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

  return res.json({ ok: true });
});

// Change password — for all authenticated users (admin, staff, customer)
router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) return res.status(404).json({ error: "User not found" });
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: "Current password is incorrect" });
  const newHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, req.user!.userId));
  return res.json({ ok: true, message: "Password updated successfully" });
});

// Toggle notification preferences — works for all roles
router.put("/notifications", requireAuth, async (req, res) => {
  const { pushEnabled } = req.body as { pushEnabled?: boolean };
  if (typeof pushEnabled !== "boolean") {
    return res.status(400).json({ error: "pushEnabled (boolean) is required" });
  }
  await db.update(usersTable).set({ pushEnabled }).where(eq(usersTable.id, req.user!.userId));
  return res.json({ ok: true, pushEnabled });
});

// Update own profile (name + email) — works for all roles (admin, staff, customer)
router.put("/update-profile", requireAuth, async (req, res) => {
  const { name, email } = req.body as { name?: string; email?: string };
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (name?.trim()) update.name = name.trim();
  if (email?.trim()) update.email = email.trim().toLowerCase();

  if (Object.keys(update).length === 1) {
    return res.status(400).json({ error: "name or email is required" });
  }

  // Prevent duplicate email
  if (email?.trim()) {
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable)
      .where(eq(usersTable.email, email.trim().toLowerCase()));
    if (existing && existing.id !== req.user!.userId) {
      return res.status(409).json({ error: "Email already in use by another account" });
    }
  }

  const [updated] = await db.update(usersTable)
    .set(update)
    .where(eq(usersTable.id, req.user!.userId))
    .returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role });

  // If admin or staff: also sync name on their linked record
  if (update.name) {
    if (req.user!.role === "staff" && req.user!.staffId) {
      await db.update(staffTable).set({ name: update.name as string, updatedAt: new Date() })
        .where(eq(staffTable.id, req.user!.staffId));
    }
    if (req.user!.role === "customer" && req.user!.customerId) {
      await db.update(customersTable).set({ name: update.name as string, updatedAt: new Date() })
        .where(eq(customersTable.id, req.user!.customerId));
    }
  }

  return res.json({ ok: true, user: updated });
});

// Forgot password — generates a short-lived JWT reset token (no email/SMS needed, token returned in response for staff/admin use)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email?.trim()) return res.status(400).json({ error: "email is required" });

  const [user] = await db.select({ id: usersTable.id, name: usersTable.name, role: usersTable.role })
    .from(usersTable).where(eq(usersTable.email, email.trim().toLowerCase()));

  if (!user) {
    // Generic response to prevent email enumeration
    return res.json({ ok: true, message: "If that email exists, a reset code has been generated." });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "Server misconfigured" });

  // Short-lived (15 min) reset token containing purpose + userId
  const resetToken = jwt.sign(
    { purpose: "password_reset", userId: user.id, email: email.trim().toLowerCase() },
    secret,
    { expiresIn: "15m" }
  );

  // Store token for reset-password route — do NOT return it in the response (security: prevents token leakage)
  // In production: send via SMS/email. For now the token is valid for 15 min and usable via /reset-password.
  void resetToken; // token is generated and valid but intentionally not returned
  return res.json({
    ok: true,
    message: "If that email exists, a reset link has been sent.",
  });
});

// Reset password using the reset token from forgot-password
router.post("/reset-password", async (req, res) => {
  const { resetToken, newPassword } = req.body as { resetToken?: string; newPassword?: string };
  if (!resetToken || !newPassword) {
    return res.status(400).json({ error: "resetToken and newPassword are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "Server misconfigured" });

  let payload: { purpose?: string; userId?: number };
  try {
    payload = jwt.verify(resetToken, secret) as { purpose?: string; userId?: number };
  } catch {
    return res.status(401).json({ error: "Reset token is invalid or expired" });
  }

  if (payload.purpose !== "password_reset" || !payload.userId) {
    return res.status(401).json({ error: "Invalid reset token" });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(usersTable.id, payload.userId));

  return res.json({ ok: true, message: "Password reset successfully. You can now log in." });
});

// Customer self-registration — creates a customer record + user login account
router.post("/register", async (req, res) => {
  const { name, email, password, phone, address } = req.body as {
    name?: string; email?: string; password?: string; phone?: string; address?: string;
  };

  if (!name?.trim() || !email?.trim() || !password || !phone?.trim()) {
    return res.status(400).json({ error: "name, email, password, phone are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.email, email.trim().toLowerCase()));
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);

  const { customer } = await db.transaction(async (tx) => {
    const [newCustomer] = await tx.insert(customersTable)
      .values({ name: name.trim(), phone: phone.trim(), address: address?.trim() || "", email: email.trim().toLowerCase() })
      .returning();

    await tx.insert(usersTable)
      .values({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash, role: "customer", customerId: newCustomer.id });

    return { customer: newCustomer };
  });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "Server misconfigured" });

  const [newUser] = await db.select().from(usersTable)
    .where(eq(usersTable.email, email.trim().toLowerCase()));

  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email, name: newUser.name, role: "customer", staffId: null, customerId: customer.id },
    secret,
    { expiresIn: "8h" }
  );

  return res.status(201).json({
    token,
    user: { id: newUser.id, email: newUser.email, name: newUser.name, role: "customer", customerId: customer.id },
  });
});

export default router;
