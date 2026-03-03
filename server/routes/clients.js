import { Router } from "express";
import { prisma } from "../db/client.js";
import { logger } from "../lib/logger.js";

const router = Router();

// GET /api/clients
router.get("/", async (req, res, next) => {
  try {
    const rows = await prisma.contact.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
    });
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/clients/:id
router.get("/:id", async (req, res, next) => {
  try {
    const row = await prisma.contact.findUnique({ where: { id: req.params.id } });
    if (!row || row.deletedAt) return res.status(404).json({ error: "Client not found" });
    res.json(row);
  } catch (err) { next(err); }
});

// POST /api/clients
router.post("/", async (req, res, next) => {
  try {
    const { id, displayName, companyName, email, phone, address, suburb, state, postcode, status, data } = req.body;
    const row = await prisma.contact.create({
      data: {
        id: id || undefined,
        displayName: displayName || "",
        companyName: companyName || "",
        email: email || "",
        phone: phone || "",
        address: address || "",
        suburb: suburb || "",
        state: state || "",
        postcode: postcode || "",
        status: status || "active",
        data: data || req.body,
      },
    });
    await prisma.auditLog.create({
      data: { action: "create", entityType: "contact", entityId: row.id, after: row.data },
    });
    logger.info({ clientId: row.id }, "Client created");
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// PUT /api/clients/:id
router.put("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.contact.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.deletedAt) return res.status(404).json({ error: "Client not found" });

    const { displayName, companyName, email, phone, address, suburb, state, postcode, status, data } = req.body;
    const row = await prisma.contact.update({
      where: { id: req.params.id },
      data: {
        displayName: displayName !== undefined ? displayName : existing.displayName,
        companyName: companyName !== undefined ? companyName : existing.companyName,
        email: email !== undefined ? email : existing.email,
        phone: phone !== undefined ? phone : existing.phone,
        address: address !== undefined ? address : existing.address,
        suburb: suburb !== undefined ? suburb : existing.suburb,
        state: state !== undefined ? state : existing.state,
        postcode: postcode !== undefined ? postcode : existing.postcode,
        status: status !== undefined ? status : existing.status,
        data: data || req.body,
        updatedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: { action: "update", entityType: "contact", entityId: row.id, before: existing.data, after: row.data },
    });
    res.json(row);
  } catch (err) { next(err); }
});

// DELETE /api/clients/:id — soft delete
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.contact.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.deletedAt) return res.status(404).json({ error: "Client not found" });

    await prisma.contact.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: { action: "delete", entityType: "contact", entityId: req.params.id, before: existing.data },
    });
    logger.info({ clientId: req.params.id }, "Client soft-deleted");
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
