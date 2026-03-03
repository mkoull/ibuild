import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "./db/client.js";

const router = express.Router();
const SALT_ROUNDS = 10;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return secret;
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, tenantName } = req.body || {};
    if (!email || !password || !tenantName) {
      return res.status(400).json({ error: "email, password, and tenantName are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "email already exists" });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const tenant = await prisma.tenant.create({ data: { name: tenantName } });
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: "Admin",
        tenantId: tenant.id,
      },
    });

    res.json({ success: true, userId: user.id, tenantId: tenant.id });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "No such user" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Bad password" });

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      getJwtSecret(),
      { expiresIn: "1d" },
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

export default router;
