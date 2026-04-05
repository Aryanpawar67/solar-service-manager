# Security Issues & Hardening Plan

## Current Security Posture: Critical

The application has **zero authentication or authorization**. Every API endpoint is fully public. This is acceptable for a Replit MVP demo but must be resolved before any production deployment.

---

## Issue 1 — No Authentication (Critical)

**Description:** All `/api/*` routes are accessible without any credentials.

**Evidence:**
- `artifacts/api-server/src/app.ts` — no auth middleware registered
- `artifacts/admin-dashboard/src/components/layout/DashboardLayout.tsx` — no auth guards on any route
- `lib/api-client-react/src/custom-fetch.ts` — `setAuthTokenGetter` is defined but never called

**Impact:** Anyone who knows the API URL can read, create, update, or delete all customer data, payments, and staff records.

**Fix — JWT-based auth (required, decision locked):**

The project has a staff mobile app (Sprint 8) that requires JWTs. Implementing sessions now and retrofitting JWTs later is costly. **JWT is the only approach.**

1. Add a `users` table with hashed passwords (`bcrypt`)
2. `POST /api/auth/login` — validates credentials, returns signed JWT (`jsonwebtoken`)
3. `requireAuth` middleware — validates `Authorization: Bearer <token>` on every protected route
4. Admin dashboard stores JWT in memory; calls `setAuthTokenGetter` so all API calls attach it automatically
5. Staff app stores JWT in `expo-secure-store` (native keychain); same `setAuthTokenGetter` pattern
6. Add a `/login` page to the admin dashboard

> Session-based auth (Option A) was previously listed as "recommended" — this is now superseded. Sessions do not work for mobile apps.

---

## Issue 2 — CORS Unrestricted (High)

**Description:** `app.use(cors())` with no options allows any origin to make requests.

**File:** `artifacts/api-server/src/app.ts:11`

**Fix:**
```ts
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") ?? [],
  credentials: true,
}));
```

Set `ALLOWED_ORIGINS=https://admin.yourdomain.com` in production env.

---

## Issue 3 — No Rate Limiting (High)

**Description:** No rate limiting on any endpoint. An attacker can hammer login, enumerate customers, or DoS the server.

**Fix:** Add `express-rate-limit`:
```ts
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // stricter for login endpoint
});

app.use("/api", limiter);
app.use("/api/auth/login", authLimiter);
```

---

## Issue 4 — No Input Sanitization (Medium)

**Description:** Zod validates structure but does not sanitize string content. Long strings, HTML, and special characters can be stored and reflected back.

**Fix:**
- Add `.max()` length constraints to all Zod string fields
- Strip leading/trailing whitespace with `.trim()`
- For any field rendered as HTML (e.g. notes, remarks), use a sanitization library like `DOMPurify` on the frontend

Example:
```ts
name: z.string().trim().min(1).max(200),
phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/),
notes: z.string().trim().max(2000).optional(),
```

---

## Issue 5 — Error Responses May Leak Schema Info (Medium)

**Description:** Unhandled async errors in route handlers will cause Express to send a 500 with a stack trace (in development mode) or crash the process.

**Fix:**

Add a global error handler in `app.ts`:
```ts
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});
```

Wrap all async route handlers or use `express-async-errors`.

---

## Issue 6 — No HTTPS Enforcement (Medium)

**Description:** The app serves over HTTP. In production all traffic must be HTTPS.

**Fix:** Handle at the reverse proxy level (nginx/Caddy) — redirect HTTP → HTTPS, set HSTS headers. Do not handle in Express directly.

---

## Issue 7 — Secrets in Environment Variables (Low / Process)

**Description:** Database credentials and any future API keys (WhatsApp, SMS) must never be committed to the repo.

**Current state:** `.env.example` created (Sprint 0 ✅). `.env` added to `.gitignore` (Sprint 0 ✅).

**Fix:**
1. Create `.env.example` with all required variable names (no values)
2. Confirm `.env` is in `.gitignore`
3. Use a secrets manager (Railway variables, Doppler, or AWS Secrets Manager) in production

---

## Summary

| Issue | Severity | Effort | Priority |
|---|---|---|---|
| No authentication | Critical | 1–2 weeks | Sprint 1 |
| Unrestricted CORS | High | 30 min | Sprint 1 |
| No rate limiting | High | 1 hour | Sprint 1 |
| No input sanitization | Medium | 2–3 hours | Sprint 1 |
| Error response leakage | Medium | 1 hour | Sprint 1 |
| No HTTPS enforcement | Medium | infra config | Sprint 2 |
| Secrets management | Low | 1 hour | Sprint 1 |
