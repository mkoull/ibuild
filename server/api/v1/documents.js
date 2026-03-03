import { Router } from "express";
import multer from "multer";
import { prisma } from "../../db/client.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/documents", upload.single("file"), async (req, res, next) => {
  try {
    const { projectId } = req.body || {};
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.tenantId !== req.user.tenantId) {
      return res.status(404).json({ error: "Project not found for tenant" });
    }
    if (!req.file) return res.status(400).json({ error: "file is required" });

    const doc = await prisma.document.create({
      data: {
        projectId,
        tenantId: req.user.tenantId,
        name: req.file.originalname || req.file.filename,
        mimeType: req.file.mimetype || "",
        size: req.file.size || 0,
        url: req.file.path,
        data: { storagePath: req.file.path, filename: req.file.filename },
      },
    });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

export default router;
