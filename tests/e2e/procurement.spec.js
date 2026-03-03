import { test, expect } from "@playwright/test";

// These tests require a project to exist. They navigate to project-scoped pages.
// In a real test setup we'd seed a project first; here we verify the pages render
// even when no project context is loaded (they should show empty states or redirect).

test("purchase orders page renders", async ({ page }) => {
  // Create a project first via localStorage seeding
  await page.goto("/");
  await page.evaluate(() => {
    const id = "e2e-test-po";
    const project = {
      id, name: "E2E Test PO Project", stage: "Active", clientId: "", scope: {},
      purchaseOrders: [], workOrders: [], rfqs: [], documents: [],
      variations: [], invoices: [], schedule: [], budget: [], workingBudget: [],
      commitments: [], actuals: [], diary: [], defects: [],
      exclusions: [], allowances: [], pcItems: [], qualifications: [], terms: [],
      costAllowances: { margin: { pct: 0, amount: 0, locked: false }, contingency: { pct: 0, amount: 0, locked: false }, siteOverhead: { pct: 0, amount: 0, locked: false }, officeOverhead: { pct: 0, amount: 0, locked: false } },
      budgetBaseline: null, quoteSnapshotBudget: null, variationLedger: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const data = { byId: { [id]: project }, allIds: [id] };
    localStorage.setItem("ib_projects", JSON.stringify({ version: 11, data }));
  });

  await page.goto("/projects/e2e-test-po/purchase-orders");
  await expect(page.getByRole("heading", { name: "Purchase Orders" })).toBeVisible();
});

test("work orders page renders", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const id = "e2e-test-wo";
    const project = {
      id, name: "E2E Test WO Project", stage: "Active", clientId: "", scope: {},
      purchaseOrders: [], workOrders: [], rfqs: [], documents: [],
      variations: [], invoices: [], schedule: [], budget: [], workingBudget: [],
      commitments: [], actuals: [], diary: [], defects: [],
      exclusions: [], allowances: [], pcItems: [], qualifications: [], terms: [],
      costAllowances: { margin: { pct: 0, amount: 0, locked: false }, contingency: { pct: 0, amount: 0, locked: false }, siteOverhead: { pct: 0, amount: 0, locked: false }, officeOverhead: { pct: 0, amount: 0, locked: false } },
      budgetBaseline: null, quoteSnapshotBudget: null, variationLedger: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const data = { byId: { [id]: project }, allIds: [id] };
    localStorage.setItem("ib_projects", JSON.stringify({ version: 11, data }));
  });

  await page.goto("/projects/e2e-test-wo/work-orders");
  await expect(page.getByRole("heading", { name: "Work Orders" })).toBeVisible();
});

test("RFQ page renders", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const id = "e2e-test-rfq";
    const project = {
      id, name: "E2E Test RFQ Project", stage: "Active", clientId: "", scope: {},
      purchaseOrders: [], workOrders: [], rfqs: [], documents: [],
      variations: [], invoices: [], schedule: [], budget: [], workingBudget: [],
      commitments: [], actuals: [], diary: [], defects: [],
      exclusions: [], allowances: [], pcItems: [], qualifications: [], terms: [],
      costAllowances: { margin: { pct: 0, amount: 0, locked: false }, contingency: { pct: 0, amount: 0, locked: false }, siteOverhead: { pct: 0, amount: 0, locked: false }, officeOverhead: { pct: 0, amount: 0, locked: false } },
      budgetBaseline: null, quoteSnapshotBudget: null, variationLedger: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const data = { byId: { [id]: project }, allIds: [id] };
    localStorage.setItem("ib_projects", JSON.stringify({ version: 11, data }));
  });

  await page.goto("/projects/e2e-test-rfq/rfq");
  await expect(page.getByRole("heading", { name: "Requests for Quote" })).toBeVisible();
});
