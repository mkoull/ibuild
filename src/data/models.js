import { uid, ds, ts } from "../theme/styles.js";
import { RATES, MILESTONES } from "./defaults.js";

export function mkClient(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: uid(),
    displayName: "",
    companyName: "",
    status: "active",
    contacts: [],
    notes: "",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function mkContact(overrides = {}) {
  return {
    id: uid(),
    name: "",
    email: "",
    phone: "",
    role: "",
    address: "",
    suburb: "",
    state: "",
    postcode: "",
    ...overrides,
  };
}

export function mkTrade(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: uid(),
    businessName: "",
    category: "",
    status: "active",
    contacts: [],
    licenceInfo: "",
    insuranceInfo: "",
    notes: "",
    regions: [],
    tags: [],
    defaultRateIds: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function mkRateCategory(overrides = {}) {
  return { id: uid(), name: "", ...overrides };
}

export function mkRateItem(overrides = {}) {
  return {
    id: uid(),
    categoryId: "",
    name: "",
    unit: "fixed",
    unitRate: 0,
    defaultQty: 0,
    description: "",
    margin: 0,
    supplierCode: "",
    ...overrides,
  };
}

function mkScope() {
  const s = {};
  Object.entries(RATES).forEach(([c, items]) => {
    s[c] = items.map(x => ({ ...x, on: false, actual: 0, _id: uid() }));
  });
  return s;
}

export function mkCostAllowances(overrides = {}) {
  return {
    margin: { pct: 0, amount: 0, locked: false },
    contingency: { pct: 0, amount: 0, locked: false },
    siteOverhead: { pct: 0, amount: 0, locked: false },
    officeOverhead: { pct: 0, amount: 0, locked: false },
    ...overrides,
  };
}

export function mkPurchaseOrder(overrides = {}) {
  return {
    id: uid(),
    tradeId: "",
    items: [],
    status: "draft",
    totalAmount: 0,
    issueDate: new Date().toISOString().split("T")[0],
    expectedDelivery: "",
    linkedBudgetLineId: null,
    notes: "",
    ...overrides,
  };
}

export function mkWorkOrder(overrides = {}) {
  return {
    id: uid(),
    tradeId: "",
    description: "",
    scheduledDate: "",
    completedDate: "",
    status: "draft",
    amount: 0,
    milestoneId: "",
    notes: "",
    ...overrides,
  };
}

export function mkRFQ(overrides = {}) {
  return {
    id: uid(),
    tradeIds: [],
    scopeItems: [],
    dueDate: "",
    status: "draft",
    responses: [],
    notes: "",
    createdAt: ds(),
    ...overrides,
  };
}

export function mkProject(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: "",
    clientId: "",
    clientContactId: "",
    stage: "Lead",
    // Legacy compat — keep client string for display during migration
    client: "",
    email: "",
    phone: "",
    address: "",
    suburb: "",
    buildType: "New Build",
    storeys: "Single Storey",
    floorArea: "",
    marginPct: 18,
    contingencyPct: 5,
    validDays: 30,
    assignedTo: "",
    notes: "",
    scope: mkScope(),
    variations: [],
    invoices: [],
    proposals: [],
    schedule: MILESTONES.map((m, i) => ({
      id: uid(),
      name: m.name,
      durationDays: m.durationDays,
      offsetDays: m.wk * 7,
      dependsOn: [],
      tradeId: null,
      freeTextTrade: "",
      constraintMode: "finish-to-start",
      manuallyPinned: false,
      pinnedStart: "",
      pinnedFinish: "",
      status: "not_started",
      percentComplete: 0,
      plannedStart: "",
      plannedFinish: "",
      actualStart: "",
      actualFinish: "",
      order: i,
      // Legacy compat
      wk: m.wk,
      done: false,
      date: "",
      planned: "",
    })),
    autoCascade: false,
    exclusions: [],
    allowances: [],
    pcItems: [],
    qualifications: [],
    terms: [],
    depositPct: 5,
    paymentDays: 14,
    defectsWeeks: 13,
    purchaseOrders: [],
    workOrders: [],
    rfqs: [],
    documents: [],
    assignedTradeIds: [],
    diary: [],
    defects: [],
    sigData: null,
    quoteSnapshotBudget: null,
    budgetBaseline: null,
    workingBudget: [],
    budget: [],
    variationLedger: [],
    activity: [{ action: "Project created", time: ts(), date: ds() }],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
