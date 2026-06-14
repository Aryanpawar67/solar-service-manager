/**
 * Email templates for Sun House Solar.
 * All templates return { subject, html } with inline-styled HTML.
 * Brand color: #00450d (dark green).
 */

const BRAND = "Sun House Solar";
const GREEN = "#00450d";
const LIGHT_GREEN = "#e8f5e9";
const FOOTER_TEXT = `${BRAND} &middot; This is an automated message.`;

function layout(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:${GREEN};padding:28px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${BRAND}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#a8d5b5;">Solar Panel Services</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">${FOOTER_TEXT}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:${GREEN};color:#ffffff;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;">${text}</a>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 12px;font-size:14px;color:#6b7280;font-weight:600;white-space:nowrap;">${label}</td>
    <td style="padding:8px 12px;font-size:14px;color:#111827;">${value}</td>
  </tr>`;
}

function infoTable(rows: string): string {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-top:16px;">
    <tbody>${rows}</tbody>
  </table>`;
}

// ── 1. Welcome ────────────────────────────────────────────────────────────────

export function welcomeEmail(name: string): { subject: string; html: string } {
  const subject = `Welcome to ${BRAND}!`;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Welcome, ${name}!</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Your account has been created successfully. We're thrilled to have you as part of the ${BRAND} family.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      You can now log in to the app to browse our services, book a solar maintenance visit, and track your service history — all in one place.
    </p>
    <div style="background:${LIGHT_GREEN};border-left:4px solid ${GREEN};padding:14px 18px;border-radius:4px;margin-top:8px;">
      <p style="margin:0;font-size:14px;color:${GREEN};font-weight:600;">Need help getting started?</p>
      <p style="margin:4px 0 0;font-size:14px;color:#374151;">Reach out to us at support@sunhousesolar.com — we're here for you.</p>
    </div>
  `);
  return { subject, html };
}

// ── 2. Forgot Password ────────────────────────────────────────────────────────

export function forgotPasswordEmail(name: string, resetLink: string): { subject: string; html: string } {
  const subject = "Reset your password";
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Password Reset Request</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi ${name},</p>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      We received a request to reset the password for your ${BRAND} account. Click the button below to choose a new password.
    </p>
    <p style="margin:0 0 4px;font-size:14px;color:#6b7280;">This link expires in <strong>15 minutes</strong>.</p>
    ${button("Reset My Password", resetLink)}
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
      If you didn't request a password reset, you can safely ignore this email — your password will not change.
    </p>
  `);
  return { subject, html };
}

// ── 3. Password Changed ───────────────────────────────────────────────────────

export function passwordChangedEmail(name: string, timestamp: string): { subject: string; html: string } {
  const subject = "Your password was changed";
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Security Alert</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi ${name},</p>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Your ${BRAND} account password was successfully changed on <strong>${timestamp}</strong>.
    </p>
    <div style="background:#fff3cd;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:4px;">
      <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">Wasn't you?</p>
      <p style="margin:4px 0 0;font-size:14px;color:#374151;">
        If you did not make this change, please contact our support team immediately at support@sunhousesolar.com.
      </p>
    </div>
  `);
  return { subject, html };
}

// ── 4. Staff Account Created ──────────────────────────────────────────────────

export function staffAccountCreatedEmail(
  name: string,
  email: string,
  tempPassword: string
): { subject: string; html: string } {
  const subject = `Your ${BRAND} staff account is ready`;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Welcome to the Team, ${name}!</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Your staff account on ${BRAND} has been created. Here are your login credentials:
    </p>
    ${infoTable(
      infoRow("Email", email) +
      infoRow("Temporary Password", `<code style="background:#f3f4f6;padding:2px 8px;border-radius:4px;font-size:14px;">${tempPassword}</code>`)
    )}
    <div style="background:${LIGHT_GREEN};border-left:4px solid ${GREEN};padding:14px 18px;border-radius:4px;margin-top:20px;">
      <p style="margin:0;font-size:14px;color:${GREEN};font-weight:600;">Important</p>
      <p style="margin:4px 0 0;font-size:14px;color:#374151;">Please change your password immediately after your first login for security.</p>
    </div>
    <p style="margin:20px 0 0;font-size:14px;color:#374151;">Log in to the GreenVolt staff app using the credentials above. If you have any issues, contact your administrator.</p>
  `);
  return { subject, html };
}

// ── 5. Payment Receipt ────────────────────────────────────────────────────────

export function paymentReceiptEmail(
  name: string,
  amount: string,
  serviceType: string,
  bookingId: number,
  scheduledDate: string
): { subject: string; html: string } {
  const subject = "Payment confirmed — Booking receipt";
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Payment Confirmed</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      Hi ${name}, thank you for your payment! Here is your booking receipt.
    </p>
    ${infoTable(
      infoRow("Booking ID", `#SVC-${bookingId}`) +
      infoRow("Service", serviceType) +
      infoRow("Scheduled Date", scheduledDate) +
      infoRow("Amount Paid", `₹${amount}`) +
      infoRow("Payment Status", '<span style="color:#00450d;font-weight:600;">Paid</span>')
    )}
    <p style="margin:20px 0 0;font-size:14px;color:#6b7280;">
      Our team will be in touch to confirm your appointment. If you have any questions, reply to this email or contact us at support@sunhousesolar.com.
    </p>
  `);
  return { subject, html };
}

// ── 6. Service Scheduled ─────────────────────────────────────────────────────

export function serviceScheduledEmail(
  name: string,
  serviceType: string,
  scheduledDate: string,
  timeSlot: string | null,
  technicianName: string | null
): { subject: string; html: string } {
  const subject = "Appointment confirmed";
  const rows =
    infoRow("Service", serviceType) +
    infoRow("Date", scheduledDate) +
    (timeSlot ? infoRow("Time Slot", timeSlot) : "") +
    (technicianName ? infoRow("Technician", technicianName) : "");

  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Appointment Confirmed</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Hi ${name}, your solar service appointment has been confirmed. Here are the details:
    </p>
    ${infoTable(rows)}
    <p style="margin:20px 0 0;font-size:14px;color:#374151;line-height:1.6;">
      Please ensure someone is available at the premises on the scheduled date. Our technician will arrive within the scheduled time slot.
    </p>
  `);
  return { subject, html };
}

// ── 7. Service Completed ─────────────────────────────────────────────────────

export function serviceCompletedEmail(
  name: string,
  serviceType: string,
  scheduledDate: string,
  reportUrl: string
): { subject: string; html: string } {
  const subject = "Your service is complete — report ready";
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Service Complete!</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Hi ${name}, your <strong>${serviceType}</strong> service scheduled for <strong>${scheduledDate}</strong> has been completed successfully.
    </p>
    <p style="margin:0 0 8px;font-size:15px;color:#374151;">Your detailed service report is ready to download:</p>
    ${button("Download Report", reportUrl)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">
      Thank you for choosing ${BRAND}. We look forward to keeping your solar system in peak condition!
    </p>
  `);
  return { subject, html };
}

// ── 8. Subscription Activated ────────────────────────────────────────────────

export function subscriptionActivatedEmail(
  name: string,
  plan: string,
  startDate: string,
  endDate: string,
  visitsPerMonth: number
): { subject: string; html: string } {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const subject = `Your ${planLabel} plan is now active`;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Your Plan Is Active</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Hi ${name}, your ${BRAND} maintenance subscription has been activated. Here's a summary:
    </p>
    ${infoTable(
      infoRow("Plan", `<strong>${planLabel}</strong>`) +
      infoRow("Start Date", startDate) +
      infoRow("End Date", endDate) +
      infoRow("Visits Per Month", String(visitsPerMonth)) +
      infoRow("Status", '<span style="color:#00450d;font-weight:600;">Active</span>')
    )}
    <p style="margin:20px 0 0;font-size:14px;color:#374151;line-height:1.6;">
      Your solar system is now covered. We'll proactively schedule your maintenance visits to keep everything running optimally.
    </p>
  `);
  return { subject, html };
}

// ── 9. Subscription Expiry Warning ───────────────────────────────────────────

export function subscriptionExpiryEmail(
  name: string,
  plan: string,
  endDate: string,
  daysLeft: number
): { subject: string; html: string } {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const isUrgent = daysLeft <= 7;
  const subject = isUrgent
    ? `Urgent: Your ${planLabel} plan expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}!`
    : `Your ${planLabel} plan expires in ${daysLeft} days`;

  const alertColor = isUrgent ? "#dc2626" : "#f59e0b";
  const alertBg = isUrgent ? "#fef2f2" : "#fffbeb";
  const alertBorder = isUrgent ? "#dc2626" : "#f59e0b";

  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Plan Expiring Soon</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi ${name},</p>
    <div style="background:${alertBg};border-left:4px solid ${alertBorder};padding:14px 18px;border-radius:4px;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:${alertColor};font-weight:600;">
        ${isUrgent ? "Action required!" : "Heads up!"} Your <strong>${planLabel}</strong> plan expires on <strong>${endDate}</strong> — that's ${daysLeft} day${daysLeft === 1 ? "" : "s"} away.
      </p>
    </div>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Renew your plan to ensure uninterrupted protection for your solar system. Contact us to discuss renewal options.
    </p>
    <p style="margin:0;font-size:14px;color:#374151;">
      Call or WhatsApp us, or email <a href="mailto:support@sunhousesolar.com" style="color:${GREEN};">support@sunhousesolar.com</a> and our team will help you renew quickly.
    </p>
  `);
  return { subject, html };
}

// ── 10. New Customer Admin Alert ──────────────────────────────────────────────

export function newCustomerAdminEmail(
  customerName: string,
  email: string,
  phone: string
): { subject: string; html: string } {
  const subject = "New customer registration";
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">New Customer Signed Up</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      A new customer has registered on the ${BRAND} platform:
    </p>
    ${infoTable(
      infoRow("Name", customerName) +
      infoRow("Email", email) +
      infoRow("Phone", phone) +
      infoRow("Registered At", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))
    )}
  `);
  return { subject, html };
}

// ── 11. New Contact Inquiry Admin Alert ───────────────────────────────────────

export function newContactInquiryEmail(
  senderName: string,
  email: string,
  phone: string | null,
  message: string
): { subject: string; html: string } {
  const subject = `New contact inquiry from ${senderName}`;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">New Contact Inquiry</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      A new inquiry was submitted via the ${BRAND} contact form:
    </p>
    ${infoTable(
      infoRow("Name", senderName) +
      infoRow("Email", `<a href="mailto:${email}" style="color:${GREEN};">${email}</a>`) +
      (phone ? infoRow("Phone", phone) : "") +
      infoRow("Received At", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))
    )}
    <div style="margin-top:20px;">
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280;font-weight:600;">Message:</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;font-size:14px;color:#111827;line-height:1.7;white-space:pre-wrap;">${message}</div>
    </div>
  `);
  return { subject, html };
}

// ── 12. Staff Deactivated ─────────────────────────────────────────────────────

export function staffDeactivatedEmail(name: string): { subject: string; html: string } {
  const subject = `Your ${BRAND} account access has been revoked`;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Account Access Revoked</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi ${name},</p>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Your access to the ${BRAND} staff platform has been revoked. You will no longer be able to log in.
    </p>
    <p style="margin:0;font-size:14px;color:#374151;">
      If you believe this is a mistake, please contact your administrator or reach out to us at support@sunhousesolar.com.
    </p>
  `);
  return { subject, html };
}
