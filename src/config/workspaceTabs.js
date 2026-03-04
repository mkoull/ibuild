import { isQuote } from "../lib/lifecycle.js";

/** Map internal stage names to user-facing display names */
export const STAGE_DISPLAY = {
  Lead: "Draft",
  Quoted: "Sent",
  Approved: "Accepted",
  Active: "Active",
  Invoiced: "Invoiced",
  Complete: "Complete",
};

export function displayStage(stage) {
  return STAGE_DISPLAY[stage] || stage || "Draft";
}

export const DEFAULT_LOCKED_MESSAGE = "Convert this quote to a job to unlock this area";
const ACTIVE_STAGE = "Active";
const LOCKED_UNTIL_ACTIVE = new Set([
  "schedule",
  "costs",
  "variations",
  "procurement",
  "invoices",
  "documents",
  "site-diary",
  "defects",
]);

function isActiveStage(project) {
  return String(project?.stage || project?.status || "").toLowerCase() === ACTIVE_STAGE.toLowerCase();
}
export function isEstimateConverted(estimate) {
  return !!estimate?.jobId || String(estimate?.status || "").toLowerCase() === "converted";
}

/**
 * Buildxact-style estimate workspace tab config.
 * Shape requirement:
 * { id, label, path, isLocked(estimate), lockedMessage, ctaLabel, ctaAction }
 */
export const ESTIMATE_TABS = [
  {
    id: "details",
    label: "Details",
    path: "overview",
    isLocked: () => false,
    lockedMessage: "",
    ctaLabel: "",
    ctaAction: "",
  },
  {
    id: "plans_takeoffs",
    label: "Plans & Takeoffs",
    path: "plans",
    isLocked: () => false,
    lockedMessage: "",
    ctaLabel: "",
    ctaAction: "",
  },
  {
    id: "costings",
    label: "Costings",
    path: "quote",
    isLocked: () => false,
    lockedMessage: "",
    ctaLabel: "",
    ctaAction: "",
  },
  {
    id: "rfqs",
    label: "RFQs",
    path: "rfq",
    isLocked: () => false,
    lockedMessage: "",
    ctaLabel: "",
    ctaAction: "",
  },
  {
    id: "specifications",
    label: "Specifications",
    path: "proposals",
    isLocked: () => false,
    lockedMessage: "",
    ctaLabel: "",
    ctaAction: "",
  },
  {
    id: "quote_letter",
    label: "Quote Letter",
    path: "quote-review",
    isLocked: () => false,
    lockedMessage: "",
    ctaLabel: "",
    ctaAction: "",
  },
  {
    id: "job_details",
    label: "Job Details",
    path: "job-overview",
    isLocked: (estimate) => !isEstimateConverted(estimate),
    lockedMessage: DEFAULT_LOCKED_MESSAGE,
    ctaLabel: "Convert to Job",
    ctaAction: "convert_to_job",
  },
  {
    id: "schedule",
    label: "Schedule",
    path: "schedule",
    isLocked: (estimate) => !isEstimateConverted(estimate),
    lockedMessage: DEFAULT_LOCKED_MESSAGE,
    ctaLabel: "Convert to Job",
    ctaAction: "convert_to_job",
  },
  {
    id: "purchase_orders",
    label: "Purchase Orders",
    path: "purchase-orders",
    isLocked: (estimate) => !isEstimateConverted(estimate),
    lockedMessage: DEFAULT_LOCKED_MESSAGE,
    ctaLabel: "Convert to Job",
    ctaAction: "convert_to_job",
  },
  {
    id: "work_orders",
    label: "Work Orders",
    path: "work-orders",
    isLocked: (estimate) => !isEstimateConverted(estimate),
    lockedMessage: DEFAULT_LOCKED_MESSAGE,
    ctaLabel: "Convert to Job",
    ctaAction: "convert_to_job",
  },
  {
    id: "actuals",
    label: "Actuals",
    path: "costs",
    isLocked: (estimate) => !isEstimateConverted(estimate),
    lockedMessage: DEFAULT_LOCKED_MESSAGE,
    ctaLabel: "Convert to Job",
    ctaAction: "convert_to_job",
  },
];

export const PROJECT_TAB_ROUTES = [
  { key: "overview", path: "overview", label: "Overview" },
  { key: "scope", path: "scope", label: "Scope" },
  { key: "quote", path: "quote", label: "Quote" },
  { key: "schedule", path: "schedule", label: "Schedule" },
  { key: "costs", path: "costs", label: "Budget" },
  { key: "variations", path: "variations", label: "Variations" },
  { key: "procurement", path: "procurement", label: "Procurement" },
  { key: "invoices", path: "invoices", label: "Invoices" },
  { key: "documents", path: "documents", label: "Documents" },
  { key: "diary", path: "site-diary", label: "Diary" },
  { key: "defects", path: "defects", label: "Defects" },
];

export const PROJECT_WORKFLOW_SECTIONS = [
  { key: "overview", label: "Overview", tabs: ["overview"] },
  { key: "preconstruction", label: "Pre-Construction", tabs: ["scope", "quote"] },
  { key: "jobsetup", label: "Job Setup", tabs: ["schedule", "costs"] },
  { key: "construction", label: "Construction", tabs: ["procurement", "variations", "diary"] },
  { key: "financial", label: "Financial", tabs: ["invoices"] },
  { key: "closeout", label: "Close Out", tabs: ["defects", "documents"] },
];

const PROJECT_TAB_PATH_BY_KEY = PROJECT_TAB_ROUTES.reduce((acc, tab) => {
  acc[tab.key] = tab.path;
  return acc;
}, {});

export function getProjectTabUrl(projectId, tabKey) {
  const id = String(projectId || "").trim();
  const path = PROJECT_TAB_PATH_BY_KEY[tabKey] || PROJECT_TAB_PATH_BY_KEY.overview;
  return `/projects/${id}/${path}`;
}

/** Job workspace tabs */
export const JOB_TABS = PROJECT_TAB_ROUTES.map((tab) => ({
  key: tab.key,
  label: tab.label,
  path: tab.path,
  isLocked: LOCKED_UNTIL_ACTIVE.has(tab.path)
    ? (project) => !isActiveStage(project)
    : () => false,
}));

export function isLifecycleTabLocked(path, project) {
  if (!LOCKED_UNTIL_ACTIVE.has(path)) return false;
  return !isActiveStage(project);
}

/** Build the workspace URL for a project */
export function getWorkspaceUrl(project) {
  const stage = project.stage || project.status || "Lead";
  return isQuote(stage) ? `/estimates/${project.id}` : `/projects/${project.id}`;
}

/** Compute next estimate number (Q-prefixed, starting at 1001) */
export function getNextEstimateNumber(projects) {
  let max = 1000;
  for (const p of projects) {
    if (p.estimateNumber) {
      const n = parseInt(String(p.estimateNumber).replace(/^Q/i, ""), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  }
  return `Q${max + 1}`;
}

/** Compute next job number (J-prefixed, starting at 1001) */
export function getNextJobNumber(projects) {
  let max = 1000;
  for (const p of projects) {
    if (p.jobNumber) {
      const n = parseInt(String(p.jobNumber).replace(/^J/i, ""), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  }
  return `J${max + 1}`;
}
