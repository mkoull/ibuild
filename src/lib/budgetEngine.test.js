import { describe, it, expect } from "vitest";
import {
  importSectionLevel,
  recalcAllowances,
  validateAllocations,
  autoSplitAllocations,
  actualFromPercent,
} from "./budgetEngine.js";

describe("budgetEngine", () => {
  it("imports section-level budget using margin as cost allowance", () => {
    const project = {
      marginPct: 20,
      scope: {
        Demo: [
          { on: true, rate: 100, qty: 2, item: "A", unit: "ea" },
          { on: false, rate: 200, qty: 1, item: "B", unit: "ea" },
        ],
      },
    };
    const lines = importSectionLevel(project);
    expect(lines).toHaveLength(1);
    expect(lines[0].sellPrice).toBe(200);
    expect(lines[0].budgetAmount).toBe(160);
  });

  it("recalculates unlocked allowances only", () => {
    const out = recalcAllowances({
      margin: { pct: 10, amount: 0, locked: false },
      siteOverhead: { pct: 5, amount: 99, locked: true },
    }, 1000);
    expect(out.margin.amount).toBe(100);
    expect(out.siteOverhead.amount).toBe(99);
  });

  it("validates and auto-splits allocations", () => {
    const line = {
      budgetAmount: 300,
      allocations: [
        { tradeId: "t1", amount: 100, locked: true },
        { tradeId: "t2", amount: 0, locked: false },
        { tradeId: "t3", amount: 0, locked: false },
      ],
    };
    const split = autoSplitAllocations(line);
    const result = validateAllocations({ ...line, allocations: split });
    expect(split[1].amount).toBe(100);
    expect(split[2].amount).toBe(100);
    expect(result.valid).toBe(true);
  });

  it("converts percent to amount", () => {
    expect(actualFromPercent(1250, 12.5)).toBe(156.25);
  });
});

