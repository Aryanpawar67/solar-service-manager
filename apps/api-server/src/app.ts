import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";
import router from "./routes";
import { uploadsDir } from "./routes/upload";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(o => o.trim()) ?? [];
const isDev = process.env.NODE_ENV === "development";
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (isDev && /^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files publicly (no auth required so images load in browser/PDF)
app.use("/uploads", express.static(uploadsDir));

// Global rate limit
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));

// Stricter limit on login
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false }));

app.use("/api", router);

// Sentry error handler (must be before other error handlers)
Sentry.setupExpressErrorHandler(app);

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
