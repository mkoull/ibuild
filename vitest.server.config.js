import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["server/**/*.test.js"],
    globals: true,
    testTimeout: 15000,
    setupFiles: ["server/__tests__/setup.js"],
  },
});
