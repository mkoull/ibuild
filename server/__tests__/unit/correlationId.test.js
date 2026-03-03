import { describe, it, expect, vi } from "vitest";
import { correlationId } from "../../middleware/correlationId.js";

function createMockReqRes(headers = {}) {
  const req = { headers };
  const res = {
    _headers: {},
    setHeader(key, val) { this._headers[key] = val; },
  };
  return { req, res };
}

describe("correlationId middleware", () => {
  it("generates a UUID when no header provided", () => {
    const { req, res } = createMockReqRes();
    const next = vi.fn();

    correlationId(req, res, next);

    expect(req.correlationId).toBeDefined();
    expect(typeof req.correlationId).toBe("string");
    expect(req.correlationId.length).toBeGreaterThan(10);
    expect(res._headers["x-correlation-id"]).toBe(req.correlationId);
    expect(next).toHaveBeenCalledOnce();
  });

  it("passes through existing x-correlation-id header", () => {
    const existingId = "my-custom-correlation-id";
    const { req, res } = createMockReqRes({ "x-correlation-id": existingId });
    const next = vi.fn();

    correlationId(req, res, next);

    expect(req.correlationId).toBe(existingId);
    expect(res._headers["x-correlation-id"]).toBe(existingId);
    expect(next).toHaveBeenCalledOnce();
  });

  it("sets different IDs for different requests", () => {
    const ids = [];
    for (let i = 0; i < 5; i++) {
      const { req, res } = createMockReqRes();
      const next = vi.fn();
      correlationId(req, res, next);
      ids.push(req.correlationId);
    }
    const unique = new Set(ids);
    expect(unique.size).toBe(5);
  });
});
