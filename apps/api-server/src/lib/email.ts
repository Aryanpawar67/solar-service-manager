import { Resend } from "resend";
import { logger } from "./logger";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "noreply@sunhousesolar.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export { ADMIN_EMAIL, APP_URL };

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> {
  if (!resend) {
    logger.info({ to: opts.to, subject: opts.subject }, "[EMAIL MOCK] Email would be sent");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
    });
    logger.info({ to: opts.to, subject: opts.subject }, "Email sent via Resend");
  } catch (err) {
    logger.error({ err, to: opts.to, subject: opts.subject }, "Resend email send failed");
  }
}
