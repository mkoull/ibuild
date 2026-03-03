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
  { label: "Overview", path: "overview" },
  { label: "Schedule", path: "schedule" },
  { label: "Budget/Cost Tracker", path: "costs" },
  { label: "Procurement", path: "procurement" },
  { label: "Variations", path: "variations" },
  { label: "Invoices", path: "invoices" },
  { label: "Docs", path: "documents" },
  { label: "Diary", path: "site-diary" },
  { label: "Defects", path: "defects" },
];

/** Build the workspace URL for a project */
export function getWorkspaceUrl(project) {
  const stage = project.stage || project.status || "Lead";
  return isQuote(stage) ? `/estimates/${project.id}` : `/jobs/${project.id}`;
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
