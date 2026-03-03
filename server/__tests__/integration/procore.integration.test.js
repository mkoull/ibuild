import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { createApp } from "../../app.js";
import { prisma } from "../../db/client.js";

const { default: request } = await import("supertest");

describe("V1 API — Observations", () => {
  let app;
  let token;

  beforeEach(() => {
    app = createApp();
    process.env.JWT_SECRET = "test-secret";
    token = jwt.sign({ userId: "user-1", tenantId: "tenant-1", role: "Admin" }, process.env.JWT_SECRET);
    vi.clearAllMocks();
  });

  it("creates and lists observations for tenant", async () => {
    prisma.project.findUnique.mockResolvedValue({ id: "p1", tenantId: "tenant-1" });
    prisma.observation.create.mockResolvedValue({
      id: "obs-1",
      projectId: "p1",
      tenantId: "tenant-1",
      description: "Site check",
      status: "open",
    });
    prisma.observation.findMany.mockResolvedValue([
      { id: "obs-1", projectId: "p1", tenantId: "tenant-1", description: "Site check", status: "open" },
    ]);

    const createRes = await request(app)
      .post("/api/v1/observations")
      .set("Authorization", `Bearer ${token}`)
      .send({ projectId: "p1", description: "Site check", status: "open" });
    expect(createRes.status).toBe(200);

    const listRes = await request(app)
      .get("/api/v1/observations")
      .set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBeGreaterThan(0);
  });
});
