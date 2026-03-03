import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import { createApp } from "../../app.js";
import { prisma } from "../../db/client.js";

const { default: request } = await import("supertest");

describe("Auth API", () => {
  let app;

  beforeEach(() => {
    app = createApp();
    process.env.JWT_SECRET = "test-secret";
    vi.clearAllMocks();
  });

  it("registers user and tenant", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.tenant.create.mockResolvedValue({ id: "tenant-1", name: "T1" });
    prisma.user.create.mockResolvedValue({ id: "user-1", email: "test@a.com", tenantId: "tenant-1" });

    const res = await request(app).post("/api/register").send({
      email: "test@a.com",
      password: "pass1234",
      tenantName: "T1",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Registered");
    expect(prisma.tenant.create).toHaveBeenCalled();
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it("logs in and returns JWT", async () => {
    const hash = await bcrypt.hash("pass1234", 10);
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@a.com",
      password: hash,
      role: "Admin",
      tenantId: "tenant-1",
    });

    const res = await request(app).post("/api/login").send({
      email: "test@a.com",
      password: "pass1234",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });
});
