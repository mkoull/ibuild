import { describe, it, expect, beforeEach, vi } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../db/client.js";

const { default: request } = await import("supertest");

describe("Clients API", () => {
  let app;

  beforeEach(() => {
    app = createApp();
    vi.clearAllMocks();
  });

  describe("GET /api/clients", () => {
    it("returns empty array when no clients", async () => {
      prisma.contact.findMany.mockResolvedValue([]);

      const res = await request(app).get("/api/clients");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns client list", async () => {
      prisma.contact.findMany.mockResolvedValue([
        { id: "c1", displayName: "John Smith", companyName: "", status: "active" },
      ]);

      const res = await request(app).get("/api/clients");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].displayName).toBe("John Smith");
    });
  });

  describe("GET /api/clients/:id", () => {
    it("returns 404 for missing client", async () => {
      prisma.contact.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/clients/nonexistent");
      expect(res.status).toBe(404);
    });

    it("returns client data", async () => {
      prisma.contact.findUnique.mockResolvedValue({
        id: "c1", displayName: "Jane", companyName: "Acme",
        email: "jane@acme.com", status: "active", data: {},
      });

      const res = await request(app).get("/api/clients/c1");
      expect(res.status).toBe(200);
      expect(res.body.displayName).toBe("Jane");
    });
  });

  describe("POST /api/clients", () => {
    it("creates a new client", async () => {
      prisma.contact.create.mockResolvedValue({
        id: "new-c1", displayName: "New Client", status: "active", data: {},
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .post("/api/clients")
        .send({ displayName: "New Client" });

      expect(res.status).toBe(201);
      expect(res.body.displayName).toBe("New Client");
    });
  });

  describe("PUT /api/clients/:id", () => {
    it("updates an existing client", async () => {
      prisma.contact.findUnique.mockResolvedValue({
        id: "c1", displayName: "Old Name", status: "active", data: {}, deletedAt: null,
      });
      prisma.contact.update.mockResolvedValue({
        id: "c1", displayName: "Updated Name", status: "active", data: {},
      });

      const res = await request(app)
        .put("/api/clients/c1")
        .send({ displayName: "Updated Name" });

      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /api/clients/:id", () => {
    it("soft-deletes a client", async () => {
      prisma.contact.findUnique.mockResolvedValue({
        id: "c1", displayName: "Test", data: {}, deletedAt: null,
      });
      prisma.contact.update.mockResolvedValue({ id: "c1", deletedAt: new Date().toISOString() });

      const res = await request(app).delete("/api/clients/c1");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });
});
