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
    schedule: MILESTONES.map(m => ({ name: m.name, wk: m.wk, done: false, date: "", planned: "" })),
    assignedTradeIds: [],
    diary: [],
    defects: [],
    sigData: null,
    activity: [{ action: "Project created", time: ts(), date: ds() }],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
