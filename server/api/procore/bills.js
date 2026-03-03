import { Router } from "express";
import { prisma } from "../../db/client.js";

const router = Router();

router.post("/bills", async (req, res, next) => {
  try {
    const { projectId, amount } = req.body || {};
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.tenantId !== req.user.tenantId) {
      return res.status(404).json({ error: "Project not found for tenant" });
    }
    const bill = await prisma.bill.create({
      data: {
        projectId,
        tenantId: req.user.tenantId,
        total: Number(amount) || 0,
      },
    });
    res.json(bill);
  } catch (err) {
    next(err);
  }
});

router.get("/bills", async (req, res, next) => {
  try {
    const bills = await prisma.bill.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: "desc" },
    });
    res.json(bills);
  } catch (err) {
    next(err);
  }
});

export default router;
