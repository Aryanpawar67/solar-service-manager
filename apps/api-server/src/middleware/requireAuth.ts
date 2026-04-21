import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
  staffId: number | null;
  customerId: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/** Middleware that restricts a route to specific roles. Must be used after requireAuth. */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  // Also accept ?token= query param to support direct-link PDF downloads from mobile
  const token =
    header?.startsWith("Bearer ") ? header.slice(7)
    : typeof req.query.token === "string" ? req.query.token
    : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not set");
    req.user = jwt.verify(token, secret) as AuthPayload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
