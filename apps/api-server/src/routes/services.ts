import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  servicesTable,
  customersTable,
  staffTable,
  notificationsTable,
  insertServiceSchema,
  updateServiceSchema,
} from "@workspace/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { uploadsDir } from "./upload";
import { notify } from "../lib/notifications";
import { notifyJobAssigned, notifyCustomer } from "../lib/push";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { status, staffId, customerId, date, startDate, endDate, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const filters = [];
  if (status) filters.push(eq(servicesTable.status, status as "cancelled" | "pending" | "in_progress" | "completed"));
  if (staffId) filters.push(eq(servicesTable.staffId, parseInt(staffId)));
  if (customerId) filters.push(eq(servicesTable.customerId, parseInt(customerId)));
  if (date) filters.push(eq(servicesTable.scheduledDate, date));
  if (startDate) filters.push(gte(servicesTable.scheduledDate, startDate));
  if (endDate) filters.push(lte(servicesTable.scheduledDate, endDate));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const [rawData, [{ count }]] = await Promise.all([
    db
      .select({
        service: servicesTable,
        customer: customersTable,
        staff: staffTable,
      })
      .from(servicesTable)
      .leftJoin(customersTable, eq(servicesTable.customerId, customersTable.id))
      .leftJoin(staffTable, eq(servicesTable.staffId, staffTable.id))
      .where(whereClause)
      .orderBy(servicesTable.scheduledDate)
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(servicesTable).where(whereClause),
  ]);

  const data = rawData.map(({ service, customer, staff }) => ({
    ...service,
    customer,
    staff,
  }));

  res.json({ data, total: Number(count), page: pageNum, limit: limitNum });
});

router.get("/:id/report", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db
    .select({ service: servicesTable, customer: customersTable, staff: staffTable })
    .from(servicesTable)
    .leftJoin(customersTable, eq(servicesTable.customerId, customersTable.id))
    .leftJoin(staffTable, eq(servicesTable.staffId, staffTable.id))
    .where(eq(servicesTable.id, id));

  if (!row) return res.status(404).json({ error: "Service not found" });

  const { service, customer, staff } = row;
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="service-report-${id}.pdf"`);
  doc.pipe(res);

  // ── Header ──────────────────────────────────────────────────────────────
  doc.fontSize(22).font("Helvetica-Bold").fillColor("#16a34a").text("GreenVolt Solar", { align: "center" });
  doc.fontSize(12).font("Helvetica").fillColor("#6b7280").text("Service Report", { align: "center" });
  doc.moveDown(0.5);
  doc
    .moveTo(50, doc.y).lineTo(545, doc.y)
    .strokeColor("#e5e7eb").lineWidth(1).stroke();
  doc.moveDown(1);

  // ── Meta ─────────────────────────────────────────────────────────────────
  doc.fontSize(9).fillColor("#9ca3af")
    .text(`Report generated: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}   |   Service ID: #${service.id}`, { align: "right" });
  doc.moveDown(1);

  // ── Section helper ────────────────────────────────────────────────────────
  const section = (title: string) => {
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#111827").text(title.toUpperCase());
    doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor("#d1fae5").lineWidth(1.5).stroke();
    doc.moveDown(0.6);
  };

  const field = (label: string, value: string | null | undefined) => {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#374151").text(`${label}:`, { continued: true });
    doc.font("Helvetica").fillColor("#111827").text(`  ${value || "—"}`);
  };

  // ── Customer ─────────────────────────────────────────────────────────────
  section("Customer Information");
  field("Name", customer?.name);
  field("Phone", customer?.phone);
  field("Address", customer?.address);
  if (customer?.city) field("City", customer.city);
  doc.moveDown(1);

  // ── Service ──────────────────────────────────────────────────────────────
  section("Service Details");
  field("Type", service.serviceType || "Maintenance");
  field("Scheduled Date", service.scheduledDate);
  field("Status", service.status.replace("_", " ").toUpperCase());
  if (service.completedAt) field("Completed At", new Date(service.completedAt).toLocaleDateString("en-IN"));
  doc.moveDown(1);

  // ── Staff ─────────────────────────────────────────────────────────────────
  section("Technician");
  field("Name", staff?.name || "Unassigned");
  if (staff?.phone) field("Phone", staff.phone);
  if (staff?.role) field("Role", staff.role);
  doc.moveDown(1);

  // ── Notes ────────────────────────────────────────────────────────────────
  if (service.notes || service.remarks) {
    section("Notes & Remarks");
    if (service.notes) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#374151").text("Pre-service notes:");
      doc.font("Helvetica").fillColor("#111827").text(service.notes);
      doc.moveDown(0.5);
    }
    if (service.remarks) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#374151").text("Post-service remarks:");
      doc.font("Helvetica").fillColor("#111827").text(service.remarks);
    }
    doc.moveDown(1);
  }

  // ── Photos ────────────────────────────────────────────────────────────────
  const embedImage = (label: string, imageUrl: string | null | undefined) => {
    if (!imageUrl) return;
    const filename = path.basename(new URL(imageUrl).pathname);
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#374151").text(label);
      doc.moveDown(0.3);
      try {
        doc.image(filePath, { width: 240 });
      } catch {
        doc.font("Helvetica").fillColor("#9ca3af").text(`[Image: ${filename}]`);
      }
      doc.moveDown(0.8);
    } else {
      field(label, imageUrl);
    }
  };

  if (service.preServiceImage || service.postServiceImage) {
    section("Photos");
    embedImage("Pre-Service Photo", service.preServiceImage);
    embedImage("Post-Service Photo", service.postServiceImage);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.moveDown(2);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e5e7eb").lineWidth(1).stroke();
  doc.moveDown(0.5);
  doc.fontSize(8).font("Helvetica").fillColor("#9ca3af")
    .text("GreenVolt Solar Panel Services  ·  This report was auto-generated.", { align: "center" });

  doc.end();
  return;
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db
    .select({ service: servicesTable, customer: customersTable, staff: staffTable })
    .from(servicesTable)
    .leftJoin(customersTable, eq(servicesTable.customerId, customersTable.id))
    .leftJoin(staffTable, eq(servicesTable.staffId, staffTable.id))
    .where(eq(servicesTable.id, id));

  if (!row) return res.status(404).json({ error: "Service not found" });
  return res.json({ ...row.service, customer: row.customer, staff: row.staff });
});

router.post("/", async (req, res) => {
  const parsed = insertServiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [customer] = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(eq(customersTable.id, parsed.data.customerId));
  if (!customer) return res.status(400).json({ error: "Customer not found" });

  if (parsed.data.staffId) {
    const [staff] = await db
      .select({ id: staffTable.id })
      .from(staffTable)
      .where(eq(staffTable.id, parsed.data.staffId));
    if (!staff) return res.status(400).json({ error: "Staff not found" });
  }

  const [service] = await db.insert(servicesTable).values(parsed.data).returning();
  return res.status(201).json(service);

  // Fire notification (non-blocking) — re-fetch full customer for phone/name
  const [fullCustomer] = await db
    .select().from(customersTable).where(eq(customersTable.id, service.customerId));
  if (fullCustomer?.phone) {
    const smsMsg = `Hi ${fullCustomer.name}, your GreenVolt solar service (${service.serviceType ?? "Maintenance"}) is scheduled for ${service.scheduledDate}. We'll be there! – GreenVolt Solar`;
    notify({
      type: "service_scheduled",
      to: fullCustomer.phone,
      recipientName: fullCustomer.name,
      message: smsMsg,
      serviceId: service.id,
    }).catch(() => {});
    // Also send Expo push to the linked customer user (if they have the app)
    notifyCustomer(
      service.customerId,
      "Service Scheduled",
      `Your ${service.serviceType ?? "maintenance"} service is booked for ${service.scheduledDate}.`,
      { serviceId: service.id, screen: "customer-service-detail" }
    ).catch(() => {});
  }
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = updateServiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  // Grab old state before update to detect status/staffId changes
  const [before] = await db.select({ status: servicesTable.status, customerId: servicesTable.customerId, staffId: servicesTable.staffId })
    .from(servicesTable).where(eq(servicesTable.id, id));

  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.status === "completed" && !parsed.data.completedAt) {
    updateData.completedAt = new Date();
  }

  const [service] = await db
    .update(servicesTable)
    .set(updateData)
    .where(eq(servicesTable.id, id))
    .returning();
  if (!service) return res.status(404).json({ error: "Service not found" });
  res.json(service);

  // Fire Expo push notification when a staff member is (re-)assigned (non-blocking)
  if (parsed.data!.staffId && parsed.data!.staffId !== before?.staffId) {
    const [customer] = await db.select({ name: customersTable.name })
      .from(customersTable).where(eq(customersTable.id, service.customerId));
    notifyJobAssigned(parsed.data!.staffId, service.id, customer?.name ?? "a customer").catch(() => {});
  }

  // Fire completion notification (non-blocking)
  if (parsed.data!.status === "completed" && before?.status !== "completed") {
    const [customer] = await db
      .select().from(customersTable).where(eq(customersTable.id, service.customerId));
    if (customer?.phone) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      notify({
        type: "service_completed",
        to: customer.phone,
        recipientName: customer.name,
        message: `Hi ${customer.name}, your GreenVolt solar service on ${service.scheduledDate} is complete! Download your report: ${baseUrl}/api/services/${service.id}/report – GreenVolt Solar`,
        serviceId: service.id,
      }).catch(() => {});
      // Also send Expo push to the linked customer user
      notifyCustomer(
        service.customerId,
        "Service Complete",
        `Your solar service on ${service.scheduledDate} is done! Tap to view your report.`,
        { serviceId: service.id, screen: "customer-service-detail" }
      ).catch(() => {});
    }
  }
  return;
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  // Nullify FK before delete to avoid constraint violation with notifications
  await db.update(notificationsTable).set({ serviceId: null }).where(eq(notificationsTable.serviceId, id));
  const [deleted] = await db.delete(servicesTable).where(eq(servicesTable.id, id)).returning();
  if (!deleted) return res.status(404).json({ error: "Service not found" });
  return res.json({ success: true, message: "Service deleted" });
});

export default router;
