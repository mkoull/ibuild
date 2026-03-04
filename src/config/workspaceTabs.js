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

/** Job workspace tabs */
export const JOB_TABS = [
  { label: "Overview", path: "overview", isLocked: () => false },
  { label: "Scope", path: "scope", isLocked: () => false },
  { label: "Quote", path: "quote", isLocked: () => false },
  { label: "Schedule", path: "schedule", isLocked: (project) => !isActiveStage(project) },
  { label: "Costs", path: "costs", isLocked: (project) => !isActiveStage(project) },
  { label: "Variations", path: "variations", isLocked: (project) => !isActiveStage(project) },
  { label: "Procurement", path: "procurement", isLocked: (project) => !isActiveStage(project) },
  { label: "Invoices", path: "invoices", isLocked: (project) => !isActiveStage(project) },
  { label: "Documents", path: "documents", isLocked: () => false },
  { label: "Diary", path: "site-diary", isLocked: (project) => !isActiveStage(project) },
  { label: "Defects", path: "defects", isLocked: (project) => !isActiveStage(project) },
];

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
