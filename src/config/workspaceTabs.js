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

/**
 * Estimate workspace tabs.
 * Locked tabs are visible but greyed — clicking shows LockedTabGate.
 */
export const ESTIMATE_TABS = [
  { label: "Estimate Details",   path: "overview" },
  { label: "Plans & Take-Offs",  path: "plans" },
  { label: "Estimate Costings",  path: "quote",           defaultStep: "scope" },
  { label: "Request for Quotes", path: "rfq" },
  { label: "Specifications",     path: "proposals" },
  { label: "Quote Letter",       path: "quote-review",    defaultStep: "review" },
  // Job tabs — visible but locked on estimates
  { label: "Job Details",        path: "job-overview",     locked: true },
  { label: "Schedule",           path: "schedule",         locked: true },
  { label: "Purchase Orders",    path: "purchase-orders",  locked: true },
  { label: "Work Orders",        path: "work-orders",      locked: true },
  { label: "Actuals Costings",   path: "costs",            locked: true },
];

/** Job workspace tabs */
export const JOB_TABS = [
  { label: "Job Details",        path: "overview" },
  { label: "Schedule",           path: "schedule" },
  { label: "Purchase Orders",    path: "purchase-orders" },
  { label: "Work Orders",        path: "work-orders" },
  { label: "Actuals Costings",   path: "costs" },
  { label: "Documents",          path: "documents" },
  { label: "Diary",              path: "site-diary" },
  { label: "Defects",            path: "defects" },
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
