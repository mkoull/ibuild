/**
 * Lifecycle V2 — single source of truth for project stages,
 * entity types, allowed modules, transitions, and primary CTAs.
 */

export const STAGES = ["Lead", "Quoted", "Approved", "Active", "Invoiced", "Complete"];

const QUOTE_STAGES = new Set(["Lead", "Quoted"]);
const JOB_STAGES = new Set(["Approved", "Active", "Invoiced", "Complete"]);

const STAGE_META = {
  Lead: {
    label: "Lead",
    entityType: "quote",
    allowedModules: ["overview", "quote", "scope", "plans", "proposals", "documents"],
    primaryCTA: { id: "send_quote", label: "Build Quote", route: "../quote", transition: null },
  },
  Quoted: {
    label: "Quoted",
    entityType: "quote",
    allowedModules: ["overview", "quote", "scope", "plans", "proposals", "documents"],
    primaryCTA: { id: "convert_job", label: "Convert to Job", route: null, transition: "Approved" },
  },
  Approved: {
    label: "Approved",
    entityType: "job",
    allowedModules: ["overview", "scope", "plans", "costs", "schedule", "proposals", "variations", "invoices", "documents", "site-diary", "defects", "trades"],
    primaryCTA: { id: "start_build", label: "Start Build", route: null, transition: "Active" },
  },
  Active: {
    label: "Active",
    entityType: "job",
    allowedModules: ["overview", "scope", "plans", "costs", "schedule", "proposals", "variations", "invoices", "documents", "site-diary", "defects", "trades"],
    primaryCTA: { id: "raise_claim", label: "Raise Claim", route: "../invoices", transition: null },
  },
  Invoiced: {
    label: "Invoiced",
    entityType: "job",
    allowedModules: ["overview", "scope", "plans", "costs", "schedule", "proposals", "variations", "invoices", "documents", "site-diary", "defects", "trades"],
    primaryCTA: { id: "complete", label: "Complete Build", route: null, transition: "Complete" },
  },
  Complete: {
    label: "Complete",
    entityType: "job",
    allowedModules: ["overview", "scope", "plans", "costs", "schedule", "proposals", "variations", "invoices", "documents", "site-diary", "defects", "trades"],
    primaryCTA: null,
  },
};

const VALID_TRANSITIONS = {
  Lead: "Quoted",
  Quoted: "Approved",
  Approved: "Active",
  Active: "Invoiced",
  Invoiced: "Complete",
};

// ─── Stage normalisation ───

const STAGE_ALIASES = {
  lead: "Lead",
  quoted: "Quoted",
  quote: "Quoted",
  approved: "Approved",
  active: "Active",
  invoiced: "Invoiced",
  complete: "Complete",
  completed: "Complete",
};

export function normaliseStage(raw) {
  if (!raw) return "Lead";
  if (STAGE_META[raw]) return raw;
  return STAGE_ALIASES[raw.toLowerCase()] || "Lead";
}

// ─── helpers ───

export function getStageMeta(stage) {
  return STAGE_META[normaliseStage(stage)] || STAGE_META.Lead;
}

export function getEntityType(stage) {
  return getStageMeta(stage).entityType;
}

export function isQuote(stage) {
  return QUOTE_STAGES.has(normaliseStage(stage));
}
export const isQuoteStage = isQuote;

export function isJob(stage) {
  return JOB_STAGES.has(normaliseStage(stage));
}
export const isJobStage = isJob;

export function getAllowedModules(stage) {
  return getStageMeta(stage).allowedModules;
}

export function isModuleAllowed(stage, modulePath) {
  return getAllowedModules(stage).includes(modulePath);
}

export function getPrimaryCta(stage) {
  return getStageMeta(stage).primaryCTA;
}

export function canTransition(from, to) {
  return VALID_TRANSITIONS[normaliseStage(from)] === normaliseStage(to);
}

export function getNextStage(stage) {
  return VALID_TRANSITIONS[normaliseStage(stage)] || null;
}

/**
 * Job-only module paths that should be gated when stage is a quote stage.
 */
export const JOB_ONLY_MODULES = ["schedule", "costs", "invoices", "variations", "site-diary", "defects", "trades"];

export function isJobOnlyModule(modulePath) {
  return JOB_ONLY_MODULES.includes(modulePath);
}

// ─── Quote → Job conversion (pure mutation) ───

/**
 * Apply all mutations needed to convert a quote to a job.
 * This is the SINGLE SOURCE OF TRUTH for conversion logic.
 * Call via: update(projectId, pr => applyJobConversion(pr))
 *
 * @param {object} pr - mutable project copy
 * @param {object} opts
 * @param {string} opts.targetStage - default "Approved"
 * @returns {object} the mutated project
 */
export function applyJobConversion(pr, { targetStage = "Approved" } = {}) {
  const now = new Date().toISOString();
  const ts = new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
  const ds = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

  pr.stage = targetStage;
  pr.updatedAt = now;

  pr.lockedQuote = true;
  pr.jobUnlocked = true;

  if (!Array.isArray(pr.invoices)) pr.invoices = [];
  if (!Array.isArray(pr.variations)) pr.variations = [];
  if (!Array.isArray(pr.budget)) pr.budget = [];
  if (!Array.isArray(pr.commitments)) pr.commitments = [];
  if (!Array.isArray(pr.actuals)) pr.actuals = [];
  if (!Array.isArray(pr.diary)) pr.diary = [];
  if (!Array.isArray(pr.defects)) pr.defects = [];

  if (!Array.isArray(pr.activity)) pr.activity = [];
  pr.activity.unshift({
    type: "job_converted",
    action: "Converted quote to job",
    time: ts,
    date: ds,
    at: Date.now(),
  });
  if (pr.activity.length > 30) pr.activity = pr.activity.slice(0, 30);

  return pr;
}
