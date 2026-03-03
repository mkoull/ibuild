import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { createApp } from "../../app.js";
import { prisma } from "../../db/client.js";

const { default: request } = await import("supertest");

describe("V1 API — Projects", () => {
  let app;
  let token;

  beforeEach(() => {
    app = createApp();
    process.env.JWT_SECRET = "test-secret";
    token = jwt.sign({ userId: "user-1", tenantId: "tenant-1", role: "Admin" }, process.env.JWT_SECRET);
    vi.clearAllMocks();
  });

  it("creates and lists tenant-scoped projects", async () => {
    prisma.project.create.mockResolvedValue({
      id: "p1",
      name: "Proj",
      stage: "Lead",
      tenantId: "tenant-1",
    });
    prisma.project.findMany.mockResolvedValue([{ id: "p1", name: "Proj", stage: "Lead", tenantId: "tenant-1" }]);

    const createRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Proj", status: "Lead" });

    expect(createRes.status).toBe(200);

    const listRes = await request(app)
      .get("/api/v1/projects")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThan(0);
  });
});
