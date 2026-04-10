import * as Sentry from "@sentry/node";

// Sentry must be initialised before any other imports so it can instrument them
if (process.env["SENTRY_DSN"]) {
  Sentry.init({
    dsn: process.env["SENTRY_DSN"],
    environment: process.env["NODE_ENV"] ?? "production",
    tracesSampleRate: 0.2,
  });
}

import app from "./app";
import { logger } from "./lib/logger";
import { checkSubscriptionExpiry } from "./lib/notifications";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Run subscription expiry check on startup and every 24 hours
  checkSubscriptionExpiry().catch(() => {});
  setInterval(() => checkSubscriptionExpiry().catch(() => {}), 24 * 60 * 60 * 1000);
});
