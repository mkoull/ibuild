import { Router } from "express";
import { prisma } from "../db/client.js";
import { logger } from "../lib/logger.js";

const router = Router({ mergeParams: true });

// GET /api/projects/:projectId/purchase-orders
router.get("/", async (req, res, next) => {
  try {
    const rows = await prisma.commitment.findMany({
      where: { projectId: req.params.projectId, type: "purchase_order", deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/projects/:projectId/purchase-orders/:id
router.get("/:id", async (req, res, next) => {
  try {
    const row = await prisma.commitment.findUnique({ where: { id: req.params.id } });
    if (!row || row.deletedAt) return res.status(404).json({ error: "PO not found" });
    res.json(row);
  } catch (err) { next(err); }
});

// POST /api/projects/:projectId/purchase-orders
router.post("/", async (req, res, next) => {
  try {
    const { id, tradeId, description, amount, status, data } = req.body;
    const row = await prisma.commitment.create({
      data: {
        id: id || undefined,
        projectId: req.params.projectId,
        tradeId: tradeId || null,
        type: "purchase_order",
        description: description || "",
        amount: amount || 0,
        status: status || "draft",
        data: data || req.body,
      },
    });
    await prisma.auditLog.create({
      data: { action: "create", entityType: "purchase_order", entityId: row.id, after: row.data },
    });
    logger.info({ poId: row.id, projectId: req.params.projectId }, "PO created");
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// PUT /api/projects/:projectId/purchase-orders/:id
router.put("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.commitment.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.deletedAt) return res.status(404).json({ error: "PO not found" });

    const { tradeId, description, amount, status, data } = req.body;
    const row = await prisma.commitment.update({
      where: { id: req.params.id },
      data: {
        tradeId: tradeId !== undefined ? tradeId : existing.tradeId,
        description: description !== undefined ? description : existing.description,
        amount: amount !== undefined ? amount : existing.amount,
        status: status !== undefined ? status : existing.status,
        data: data || req.body,
        updatedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: { action: "update", entityType: "purchase_order", entityId: row.id, before: existing.data, after: row.data },
    });
    res.json(row);
  } catch (err) { next(err); }
});

// DELETE /api/projects/:projectId/purchase-orders/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.commitment.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.deletedAt) return res.status(404).json({ error: "PO not found" });

    await prisma.commitment.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: { action: "delete", entityType: "purchase_order", entityId: req.params.id, before: existing.data },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
