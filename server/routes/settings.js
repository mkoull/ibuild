import { Router } from "express";
import { prisma } from "../db/client.js";

const router = Router();
const SINGLETON_ID = "app_settings";

// GET /api/settings
router.get("/", async (req, res, next) => {
  try {
    const row = await prisma.settings.findUnique({ where: { id: SINGLETON_ID } });
    res.json(row ? row.data : {});
  } catch (err) { next(err); }
});

// PUT /api/settings
router.put("/", async (req, res, next) => {
  try {
    const row = await prisma.settings.upsert({
      where: { id: SINGLETON_ID },
      update: { data: req.body, updatedAt: new Date() },
      create: { id: SINGLETON_ID, data: req.body },
    });
    res.json(row.data);
  } catch (err) { next(err); }
});

export default router;
