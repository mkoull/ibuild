import { Router } from "express";
import { prisma } from "../../db/client.js";

const router = Router();

router.post("/observations", async (req, res, next) => {
  try {
    const { projectId, description, status } = req.body || {};
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.tenantId !== req.user.tenantId) {
      return res.status(404).json({ error: "Project not found for tenant" });
    }

    const obs = await prisma.observation.create({
      data: {
        projectId,
        tenantId: req.user.tenantId,
        description: description || "",
        status: status || "open",
      },
    });
    res.json(obs);
  } catch (err) {
    next(err);
  }
});

router.get("/observations", async (req, res, next) => {
  try {
    const observations = await prisma.observation.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: "desc" },
    });
    res.json(observations);
  } catch (err) {
    next(err);
  }
});

export default router;
