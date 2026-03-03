import { Router } from "express";
import { prisma } from "../../db/client.js";

const router = Router();

router.post("/invoices", async (req, res, next) => {
  try {
    const { projectId, amount, status } = req.body || {};
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.tenantId !== req.user.tenantId) {
      return res.status(404).json({ error: "Project not found for tenant" });
    }
    const inv = await prisma.invoice.create({
      data: {
        projectId,
        tenantId: req.user.tenantId,
        amount: Number(amount) || 0,
        status: status || "draft",
      },
    });
    res.json(inv);
  } catch (err) {
    next(err);
  }
});

router.get("/invoices", async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: "desc" },
    });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

export default router;
