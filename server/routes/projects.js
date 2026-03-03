import { Router } from "express";
import { prisma } from "../db/client.js";
import { logger } from "../lib/logger.js";

const router = Router();

// GET /api/projects — list all projects (summary)
router.get("/", async (req, res, next) => {
  try {
    const rows = await prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, stage: true, clientId: true, updatedAt: true, createdAt: true },
      orderBy: { updatedAt: "desc" },
    });
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/projects/:id — full project with data blob
router.get("/:id", async (req, res, next) => {
  try {
    const row = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!row || row.deletedAt) return res.status(404).json({ error: "Project not found" });
    res.json(row);
  } catch (err) { next(err); }
});

// POST /api/projects — create
router.post("/", async (req, res, next) => {
  try {
    const { id, name, stage, clientId, data } = req.body;
    const row = await prisma.project.create({
      data: {
        id: id || undefined,
        name: name || data?.name || "",
        stage: stage || data?.stage || "Lead",
        clientId: clientId || data?.clientId || null,
        data: data || req.body,
      },
    });
    await prisma.auditLog.create({
      data: { action: "create", entityType: "project", entityId: row.id, after: row.data },
    });
    logger.info({ projectId: row.id }, "Project created");
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// PUT /api/projects/:id — full update (shadow write target)
router.put("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.deletedAt) return res.status(404).json({ error: "Project not found" });

    const { name, stage, clientId, data } = req.body;
    const row = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name: name || data?.name || existing.name,
        stage: stage || data?.stage || existing.stage,
        clientId: clientId !== undefined ? clientId : (data?.clientId !== undefined ? data.clientId : existing.clientId),
        data: data || req.body,
        updatedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "update",
        entityType: "project",
        entityId: row.id,
        before: existing.data,
        after: row.data,
      },
    });
    res.json(row);
  } catch (err) { next(err); }
});

// DELETE /api/projects/:id — soft delete
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.deletedAt) return res.status(404).json({ error: "Project not found" });

    await prisma.project.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: { action: "delete", entityType: "project", entityId: req.params.id, before: existing.data },
    });
    logger.info({ projectId: req.params.id }, "Project soft-deleted");
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
