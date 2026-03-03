import { describe, it, expect } from "vitest";
import { calc, calcScope, calcVariations, calcInvoicing, calcBudget, commitmentRemaining } from "./calc.js";

describe("calcScope", () => {
  it("computes subtotal, margin, contingency, GST", () => {
    const scope = {
      Demo: [
        { on: true, rate: 100, qty: 2, actual: 50 },
        { on: false, rate: 999, qty: 1, actual: 0 },
      ],
    };
    const r = calcScope(scope, 20, 5);
    expect(r.sub).toBe(200);
    expect(r.mar).toBe(40);
    expect(r.con).toBe(10);
    expect(r.gst).toBeCloseTo(25);
    expect(r.orig).toBeCloseTo(275);
    expect(r.act).toBe(50);
    expect(r.items).toBe(1);
    expect(r.cats.length).toBe(1);
  });

  it("handles empty scope", () => {
    const r = calcScope({}, 18, 5);
    expect(r.sub).toBe(0);
    expect(r.orig).toBe(0);
  });

  it("cT and cA helper functions work", () => {
    const scope = {
      Plumbing: [{ on: true, rate: 50, qty: 3, actual: 100 }],
    };
    const r = calcScope(scope, 0, 0);
    expect(r.cT(scope, "Plumbing")).toBe(150);
    expect(r.cA(scope, "Plumbing")).toBe(100);
    expect(r.cT(scope, "NonExistent")).toBe(0);
  });
});

describe("calcVariations", () => {
  it("sums approved variations", () => {
    const variations = [
      { status: "approved", amount: 1000 },
      { status: "draft", amount: 500 },
      { status: "approved", amount: 2000 },
    ];
    const r = calcVariations(variations);
    expect(r.aV).toBe(3000);
    expect(r.aVCount).toBe(2);
  });

  it("handles null/empty", () => {
    expect(calcVariations(null).aV).toBe(0);
    expect(calcVariations([]).aVCount).toBe(0);
  });
});

describe("calcInvoicing", () => {
  it("categorises invoices by status", () => {
    const invoices = [
      { status: "paid", amount: 5000 },
      { status: "sent", amount: 3000 },
      { status: "draft", amount: 1000 },
      { status: "void", amount: 2000 },
    ];
    const r = calcInvoicing(invoices);
    expect(r.inv).toBe(8000); // paid + sent
    expect(r.paid).toBe(5000);
    expect(r.outstanding).toBe(3000);
  });
});

describe("calcBudget", () => {
  it("computes budget totals", () => {
    const budget = [
      { budgetAmount: 10000, actualAmount: 2000, sellPrice: 12000, costAllowance: 10000, source: "quote_import" },
      { budgetAmount: 5000, actualAmount: 0, sellPrice: 6000, costAllowance: 5000, source: "variation" },
    ];
    const commitments = [{ status: "Committed", amount: 8000 }];
    const actuals = [{ amount: 3000 }];
    const r = calcBudget(budget, commitments, actuals, {}, [], 30000);
    expect(r.budgetTotal).toBe(15000);
    expect(r.committedTotal).toBe(8000);
    expect(r.actualsTotal).toBe(3000);
    expect(r.combinedActuals).toBe(5000); // 3000 + 2000
    expect(r.baselineBudget).toBe(10000);
    expect(r.variationBudget).toBe(5000);
  });
});

describe("calc (orchestrator)", () => {
  it("produces backward-compatible output shape", () => {
    const project = {
      marginPct: 10,
      contingencyPct: 5,
      scope: {
        Demo: [{ on: true, rate: 1000, qty: 1, actual: 0 }],
      },
      variations: [{ status: "approved", amount: 100 }],
      invoices: [{ status: "paid", amount: 500 }],
      budget: [{ budgetAmount: 800, actualAmount: 0, sellPrice: 1000, costAllowance: 800, source: "quote_import" }],
      commitments: [],
      actuals: [],
      costAllowances: {},
      supplierBills: [],
    };
    const r = calc(project);
    // Scope
    expect(r.sub).toBe(1000);
    expect(r.margin).toBe(10);
    expect(r.contingency).toBe(5);
    // Variations
    expect(r.aV).toBe(100);
    expect(r.aVCount).toBe(1);
    // Contract
    expect(r.curr).toBe(r.orig + 100);
    // Invoicing
    expect(r.paid).toBe(500);
    // Budget
    expect(r.budgetTotal).toBe(800);
    // Functions exist
    expect(typeof r.cT).toBe("function");
    expect(typeof r.cA).toBe("function");
  });
});

describe("commitmentRemaining", () => {
  it("calculates remaining from matched bill lines", () => {
    const commitment = { id: "c1", amount: 10000 };
    const bills = [
      { status: "Approved", lines: [{ commitmentId: "c1", amount: 3000 }, { commitmentId: "c2", amount: 500 }] },
      { status: "Void", lines: [{ commitmentId: "c1", amount: 9999 }] },
    ];
    const r = commitmentRemaining(commitment, bills);
    expect(r.matched).toBe(3000);
    expect(r.remaining).toBe(7000);
  });
});
