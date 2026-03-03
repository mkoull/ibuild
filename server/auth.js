import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "./db/client.js";

const router = Router();

function requireJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return process.env.JWT_SECRET;
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, tenantName } = req.body || {};
    if (!email || !password || !tenantName) {
      return res.status(400).json({ error: "email, password, tenantName are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const tenant = await prisma.tenant.create({ data: { name: tenantName } });
    await prisma.user.create({
      data: { email, password: hashed, role: "Admin", tenantId: tenant.id },
    });

    res.json({ message: "Registered" });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid email" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      requireJwtSecret(),
      { expiresIn: "2h" },
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

export default router;
