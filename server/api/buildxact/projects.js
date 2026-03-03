import { Router } from "express";
import { prisma } from "../../db/client.js";

const router = Router();

router.get("/projects", async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { tenantId: req.user.tenantId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
    });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

router.post("/projects", async (req, res, next) => {
  try {
    const { name, status } = req.body || {};
    const project = await prisma.project.create({
      data: {
        name: name || "",
        stage: status || "Lead",
        tenantId: req.user.tenantId,
      },
    });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

export default router;
