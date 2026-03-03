import { describe, it, expect, beforeEach, vi } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../db/client.js";

const { default: request } = await import("supertest");

describe("Projects API", () => {
  let app;

  beforeEach(() => {
    app = createApp();
    vi.clearAllMocks();
  });

  describe("GET /api/projects", () => {
    it("returns empty array when no projects", async () => {
      prisma.project.findMany.mockResolvedValue([]);

      const res = await request(app).get("/api/projects");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns project summaries", async () => {
      prisma.project.findMany.mockResolvedValue([
        { id: "p1", name: "Test House", stage: "Lead", updatedAt: new Date().toISOString() },
      ]);

      const res = await request(app).get("/api/projects");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Test House");
    });
  });

  describe("GET /api/projects/:id", () => {
    it("returns 404 for missing project", async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/projects/nonexistent");
      expect(res.status).toBe(404);
    });

    it("returns full project data", async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: "p1", name: "Test", stage: "Lead", data: { name: "Test", scope: {} },
      });

      const res = await request(app).get("/api/projects/p1");
      expect(res.status).toBe(200);
      expect(res.body.id).toBe("p1");
      expect(res.body.data).toBeDefined();
    });
  });

  describe("POST /api/projects", () => {
    it("creates a new project", async () => {
      prisma.project.create.mockResolvedValue({
        id: "new-1", name: "New Build", stage: "Lead", data: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .post("/api/projects")
        .send({ name: "New Build", stage: "Lead", data: { name: "New Build" } });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("New Build");
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe("PUT /api/projects/:id", () => {
    it("returns 404 for missing project", async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/projects/nope")
        .send({ name: "Updated" });

      expect(res.status).toBe(404);
    });

    it("updates an existing project", async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: "p1", name: "Old", stage: "Lead", data: {}, deletedAt: null,
      });
      prisma.project.update.mockResolvedValue({
        id: "p1", name: "Updated", stage: "Lead", data: {}, updatedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .put("/api/projects/p1")
        .send({ name: "Updated", data: { name: "Updated" } });

      expect(res.status).toBe(200);
      expect(prisma.project.update).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/projects/:id", () => {
    it("soft-deletes a project", async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: "p1", name: "Test", data: {}, deletedAt: null,
      });
      prisma.project.update.mockResolvedValue({ id: "p1", deletedAt: new Date().toISOString() });

      const res = await request(app).delete("/api/projects/p1");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe("Health check", () => {
    it("returns ok", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });

  describe("Correlation ID", () => {
    it("returns x-correlation-id header", async () => {
      prisma.project.findMany.mockResolvedValue([]);
      const res = await request(app).get("/api/projects");
      expect(res.headers["x-correlation-id"]).toBeDefined();
    });

    it("passes through provided correlation ID", async () => {
      prisma.project.findMany.mockResolvedValue([]);
      const res = await request(app)
        .get("/api/projects")
        .set("x-correlation-id", "test-123");
      expect(res.headers["x-correlation-id"]).toBe("test-123");
    });
  });
});
