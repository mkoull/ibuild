import { Router } from "express";
import { prisma } from "../db/client.js";
import { logger } from "../lib/logger.js";

const router = Router();

// GET /api/trades
router.get("/", async (req, res, next) => {
  try {
    const rows = await prisma.trade.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
    });
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/trades/:id
router.get("/:id", async (req, res, next) => {
  try {
    const row = await prisma.trade.findUnique({ where: { id: req.params.id } });
    if (!row || row.deletedAt) return res.status(404).json({ error: "Trade not found" });
    res.json(row);
  } catch (err) { next(err); }
});

// POST /api/trades
router.post("/", async (req, res, next) => {
  try {
    const { id, businessName, category, status, data } = req.body;
    const row = await prisma.trade.create({
      data: {
        id: id || undefined,
        businessName: businessName || "",
        category: category || "",
        status: status || "active",
        data: data || req.body,
      },
    });
    await prisma.auditLog.create({
      data: { action: "create", entityType: "trade", entityId: row.id, after: row.data },
    });
    logger.info({ tradeId: row.id }, "Trade created");
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// PUT /api/trades/:id
router.put("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.trade.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.deletedAt) return res.status(404).json({ error: "Trade not found" });

    const { businessName, category, status, data } = req.body;
    const row = await prisma.trade.update({
      where: { id: req.params.id },
      data: {
        businessName: businessName !== undefined ? businessName : existing.businessName,
        category: category !== undefined ? category : existing.category,
        status: status !== undefined ? status : existing.status,
        data: data || req.body,
        updatedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: { action: "update", entityType: "trade", entityId: row.id, before: existing.data, after: row.data },
    });
    res.json(row);
  } catch (err) { next(err); }
});

// DELETE /api/trades/:id — soft delete
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.trade.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.deletedAt) return res.status(404).json({ error: "Trade not found" });

    await prisma.trade.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: { action: "delete", entityType: "trade", entityId: req.params.id, before: existing.data },
    });
    logger.info({ tradeId: req.params.id }, "Trade soft-deleted");
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
