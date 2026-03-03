import { describe, it, expect } from "vitest";

describe("env config", () => {
  it("exports a config object with expected fields", async () => {
    // env.js is already loaded at this point, so just verify shape
    const mod = await import("../../config/env.js");
    expect(mod.config).toBeDefined();
    expect(typeof mod.config.port).toBe("number");
    expect(typeof mod.config.databaseUrl).toBe("string");
    expect(typeof mod.config.isProd).toBe("boolean");
  });

  it("is not production mode in tests", async () => {
    const mod = await import("../../config/env.js");
    expect(mod.config.isProd).toBe(false);
  });

  it("defaults port to 3001 when PORT not set", async () => {
    const mod = await import("../../config/env.js");
    // If PORT env is not set, defaults to 3001
    expect(mod.config.port).toBe(3001);
  });

  it("has anthropicApiKey as string", async () => {
    const mod = await import("../../config/env.js");
    expect(typeof mod.config.anthropicApiKey).toBe("string");
  });
});
