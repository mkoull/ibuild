import { test, expect } from "@playwright/test";

const TAB_ASSERTIONS = [
  { key: "overview", label: "Overview", path: "overview" },
  { key: "scope", label: "Scope", path: "scope" },
  { key: "quote", label: "Quote", path: "quote" },
  { key: "schedule", label: "Schedule", path: "schedule" },
  { key: "costs", label: "Costs", path: "costs" },
  { key: "variations", label: "Variations", path: "variations" },
  { key: "procurement", label: "Procurement", path: "procurement" },
  { key: "invoices", label: "Invoices", path: "invoices" },
  { key: "documents", label: "Documents", path: "documents" },
  { key: "diary", label: "Diary", path: "site-diary" },
  { key: "defects", label: "Defects", path: "defects" },
];

test("project tab navigation stays canonical and non-appending", async ({ page }) => {
  const seedId = "e2e-tab-nav";
  const consoleErrors = [];

  page.on("pageerror", (err) => consoleErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.addInitScript((id) => {
    const now = new Date().toISOString();
    const project = {
      id,
      name: "E2E Tab Routing Project",
      stage: "Active",
      status: "Active",
      type: "Project",
      buildType: "New Build",
      scope: {},
      costCategories: [],
      estimate: {
        categories: [],
        totals: { totalCost: 0, totalSell: 0, marginValue: 0, marginPercent: 0 },
      },
      job: {
        baseline: {
          createdAt: now,
          categories: [],
          totals: { totalCost: 0, totalSell: 0, marginValue: 0, marginPercent: 0 },
        },
        budget: {
          categories: [],
          totals: { totalCost: 0, totalSell: 0, marginValue: 0, marginPercent: 0 },
        },
        contract: {
          baseContractValue: 0,
          approvedVariationsValue: 0,
          currentContractValue: 0,
        },
      },
      procurement: { purchaseOrders: [], bills: [] },
      claims: [],
      variations: [],
      invoices: [],
      documents: [],
      diary: [],
      defects: [],
      budgetBaseline: null,
      workingBudget: [],
      budget: [],
      purchaseOrders: [],
      workOrders: [],
      rfqs: [],
      createdAt: now,
      updatedAt: now,
      activity: [],
    };
    localStorage.setItem(
      "ib_projects",
      JSON.stringify({ __v: 19, data: { byId: { [id]: project }, allIds: [id] } }),
    );
    localStorage.setItem("ib_meta", JSON.stringify({ v: 2 }));
  }, seedId);

  await page.goto(`/projects/${seedId}/overview`);
  await expect(page).toHaveURL(new RegExp(`/projects/${seedId}/overview$`));

  for (const tab of TAB_ASSERTIONS) {
    await page.getByRole("link", { name: tab.label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${seedId}/${tab.path}$`));
  }

  await page.goto(`/projects/${seedId}/overview/scope/quote`);
  await expect(page).toHaveURL(new RegExp(`/projects/${seedId}/overview$`));

  await page.goto(`/jobs/${seedId}/scope`);
  await expect(page).toHaveURL(new RegExp(`/projects/${seedId}/overview$`));

  await page.getByRole("link", { name: "Scope", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/${seedId}/scope$`));
  await page.getByRole("link", { name: "Quote", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/${seedId}/quote$`));
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/projects/${seedId}/scope$`));
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`/projects/${seedId}/quote$`));

  expect(consoleErrors).toEqual([]);
});
