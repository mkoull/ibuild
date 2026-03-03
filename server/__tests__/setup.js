import { vi } from "vitest";

// Mock Prisma client for integration tests (no real DB needed)
const mockPrisma = {
  user: {
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.id || "user-1", ...data })),
  },
  tenant: {
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "tenant-1", ...data })),
  },
  project: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.id || "test-id", ...data, createdAt: new Date(), updatedAt: new Date() })),
    update: vi.fn().mockImplementation(({ data, where }) => Promise.resolve({ id: where.id, ...data, updatedAt: new Date() })),
  },
  estimate: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.id || "est-1", ...data })),
  },
  invoice: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.id || "inv-1", ...data })),
  },
  observation: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.id || "obs-1", ...data })),
  },
  bill: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.id || "bill-1", ...data })),
  },
  document: {
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.id || "doc-1", ...data })),
  },
  contact: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.id || "test-id", ...data, createdAt: new Date(), updatedAt: new Date() })),
    update: vi.fn().mockImplementation(({ data, where }) => Promise.resolve({ id: where.id, ...data, updatedAt: new Date() })),
  },
  trade: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.id || "test-id", ...data, createdAt: new Date(), updatedAt: new Date() })),
    update: vi.fn().mockImplementation(({ data, where }) => Promise.resolve({ id: where.id, ...data, updatedAt: new Date() })),
  },
  settings: {
    findUnique: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockImplementation(({ create }) => Promise.resolve(create)),
  },
  commitment: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.id || "test-id", ...data, createdAt: new Date(), updatedAt: new Date() })),
    update: vi.fn().mockImplementation(({ data, where }) => Promise.resolve({ id: where.id, ...data, updatedAt: new Date() })),
  },
  auditLog: {
    create: vi.fn().mockResolvedValue({ id: "audit-1" }),
  },
  $disconnect: vi.fn(),
};

// Mock the Prisma client module
vi.mock("../db/client.js", () => ({
  prisma: mockPrisma,
}));

export { mockPrisma };
