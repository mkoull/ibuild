import { calc } from "./calc.js";
import { isQuote as _isQuote, isJob as _isJob, normaliseStage } from "./lifecycle.js";

// ── Lightweight memoization ──────────────────────────────────────────────
function memo1(fn) {
  let lastArg, lastResult;
  return (arg) => {
    if (arg === lastArg) return lastResult;
    lastArg = arg;
    lastResult = fn(arg);
    return lastResult;
  };
}

function memo2(fn) {
  let lastA, lastB, lastResult;
  return (a, b) => {
    if (a === lastA && b === lastB) return lastResult;
    lastA = a; lastB = b;
    lastResult = fn(a, b);
    return lastResult;
  };
}

// ── Per-project selectors ────────────────────────────────────────────────
const calcCache = new WeakMap();
export function selectCalc(project) {
  if (calcCache.has(project)) return calcCache.get(project);
  const result = calc(project);
  calcCache.set(project, result);
  return result;
}

export function getProjectValue(pr) {
  const T = selectCalc(pr);
  return T.curr > 0 ? T.curr : null;
}

export function getBaseContractValue(pr) {
  const T = selectCalc(pr);
  return T.orig > 0 ? T.orig : null;
}

export function getApprovedVariationValue(pr) {
  return selectCalc(pr).aV;
}

export function getApprovedVariationCount(pr) {
  return selectCalc(pr).aVCount;
}

export function getContractValue(pr) {
  return selectCalc(pr).curr;
}

export function getInvoicedTotal(pr) {
  return selectCalc(pr).inv;
}

export function getOutstanding(pr) {
  const T = selectCalc(pr);
  return T.outstanding > 0 ? T.outstanding : null;
}

export function getPaidTotal(pr) {
  return selectCalc(pr).paid;
}

export function getNextMilestone(pr) {
  const ms = (pr.schedule || []).find(m => !m.done);
  return ms || null;
}

export function getAge(pr) {
  if (!pr.createdAt) return null;
  const created = new Date(pr.createdAt);
  const now = new Date();
  const diffMs = now - created;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month" : `${months} months`;
}

export function isQuoteProject(pr) {
  return _isQuote(pr.stage || pr.status);
}

export function isJobProject(pr) {
  return _isJob(pr.stage || pr.status);
}

// ── Aggregate selectors (across projects array) ──────────────────────────
export const selectProjectsByStage = memo2((projects, stage) =>
  projects.filter(pr => normaliseStage(pr.stage || pr.status) === stage)
);

export const selectQuoteProjects = memo1(projects =>
  projects.filter(pr => _isQuote(normaliseStage(pr.stage || pr.status)))
);

export const selectJobProjects = memo1(projects =>
  projects.filter(pr => _isJob(normaliseStage(pr.stage || pr.status)))
);

export const selectPipelineValue = memo1(projects =>
  selectQuoteProjects(projects).reduce((sum, pr) => sum + (selectCalc(pr).curr || 0), 0)
);

export const selectActiveJobs = memo1(projects =>
  projects.filter(pr => {
    const s = normaliseStage(pr.stage || pr.status);
    return s === "Approved" || s === "Active";
  })
);

export const selectOutstandingReceivables = memo1(projects => {
  const jobs = selectJobProjects(projects);
  const withOutstanding = jobs.filter(pr => selectCalc(pr).outstanding > 0);
  return {
    value: withOutstanding.reduce((s, pr) => s + selectCalc(pr).outstanding, 0),
    count: withOutstanding.length,
    projects: withOutstanding,
  };
});

export const selectFinancialSummary = memo1(project => {
  const T = selectCalc(project);
  return {
    contract: T.curr,
    budget: T.budgetTotal,
    committed: T.committedTotal,
    actual: T.actualsTotal,
    variance: T.budgetTotal - T.actualsTotal,
    forecastMargin: T.forecastMargin,
    marginPct: T.marginPctCalc,
    invoiced: T.inv,
    paid: T.paid,
    outstanding: T.outstanding,
  };
});
