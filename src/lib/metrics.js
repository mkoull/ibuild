/**
 * Dashboard KPI metrics — pure functions operating on project arrays.
 * Uses selectCalc for WeakMap-cached results (avoids recalculating per project).
 */
import { selectCalc } from "./selectors.js";
import { normaliseStage, isQuote, isJob } from "./lifecycle.js";

export function getPipelineValue(projects) {
  return projects
    .filter(pr => isQuote(normaliseStage(pr.stage || pr.status)))
    .reduce((sum, pr) => sum + (selectCalc(pr).curr || 0), 0);
}

export function getQuoteProjects(projects) {
  return projects.filter(pr => isQuote(normaliseStage(pr.stage || pr.status)));
}

export function getJobProjects(projects) {
  return projects.filter(pr => isJob(normaliseStage(pr.stage || pr.status)));
}

export function getQuotedProjects(projects) {
  return projects.filter(pr => normaliseStage(pr.stage || pr.status) === "Quoted");
}

export function getAwaitingAcceptance(projects) {
  const quoted = getQuotedProjects(projects);
  return {
    count: quoted.length,
    value: quoted.reduce((s, pr) => s + (selectCalc(pr).curr || 0), 0),
    projects: quoted,
  };
}

export function getActiveContractValue(projects) {
  const active = projects.filter(pr => {
    const s = normaliseStage(pr.stage || pr.status);
    return s === "Approved" || s === "Active";
  });
  return {
    value: active.reduce((s, pr) => s + (selectCalc(pr).curr || 0), 0),
    count: active.length,
    projects: active,
  };
}

export function getOutstandingReceivables(projects) {
  const jobs = getJobProjects(projects);
  const withOutstanding = jobs.filter(pr => selectCalc(pr).outstanding > 0);
  return {
    value: withOutstanding.reduce((s, pr) => s + selectCalc(pr).outstanding, 0),
    count: withOutstanding.length,
    projects: withOutstanding,
  };
}

export function getJobsInProgress(projects) {
  return projects.filter(pr => normaliseStage(pr.stage || pr.status) === "Active");
}

export function getOverrunJobs(projects) {
  return getJobProjects(projects).filter(pr => {
    const t = selectCalc(pr);
    return t.budgetTotal > 0 && t.actualsTotal > t.budgetTotal;
  });
}
