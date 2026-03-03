import { Router } from "express";
import { prisma } from "../../db/client.js";

const router = Router();

router.post("/estimates", async (req, res, next) => {
  try {
    const { projectId, totalAmount, status } = req.body || {};
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.tenantId !== req.user.tenantId) {
      return res.status(404).json({ error: "Project not found for tenant" });
    }
    const est = await prisma.estimate.create({
      data: {
        projectId,
        tenantId: req.user.tenantId,
        data: { totalAmount: Number(totalAmount) || 0, status: status || "draft" },
      },
    });
    res.json(est);
  } catch (err) {
    next(err);
  }
});

router.get("/estimates", async (req, res, next) => {
  try {
    const ests = await prisma.estimate.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: "desc" },
    });
    res.json(ests);
  } catch (err) {
    next(err);
  }
});

export default router;
