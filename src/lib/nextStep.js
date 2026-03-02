/**
 * getNextStepForProject — deterministic "what should I do next?" for any project.
 *
 * Returns ONE primary action based on the project's stage AND its data completeness.
 * This replaces the static lifecycle CTA for data-aware stages (Lead, Quoted).
 *
 * @param {object} project
 * @param {object} totals — from calc()
 * @returns {{ label, description, route, reason, primary, action? } | null}
 */
import { normaliseStage } from "./lifecycle.js";
import { fmt } from "../theme/styles.js";

export function getNextStepForProject(project, totals) {
  const stage = normaliseStage(project.stage || project.status);
  const T = totals;
  const hasClient = !!(project.client || project.clientId);
  const hasScope = T.items > 0;
  const hasProposal = (project.proposals || []).length > 0;
  const milestones = project.schedule || [];
  const hasSchedule = milestones.some(m => m.planned);

  if (stage === "Lead") {
    if (!hasClient)
      return { label: "Add client details", description: "Set client, site address and project info", route: "scope", reason: "missing_client", primary: true };
    if (!hasScope)
      return { label: "Build scope", description: "Select items from rate library", route: "scope", reason: "missing_scope", primary: true };
    if (!hasProposal)
      return { label: "Review & generate proposal", description: "Scope complete — create client proposal", route: "scope", reason: "missing_proposal", primary: true };
    return { label: "Send quote", description: "Review proposal and send to client", route: "proposals", reason: "ready_to_send", primary: true };
  }

  if (stage === "Quoted") {
    if (!hasProposal)
      return { label: "Generate proposal", description: "Create a proposal before converting", route: "scope", reason: "missing_proposal", primary: true };
    return { label: "Convert to Job", description: "Accept quote and unlock job modules", route: null, reason: "ready_to_convert", primary: true, action: "convert_job" };
  }

  if (stage === "Approved") {
    if (!hasSchedule)
      return { label: "Set schedule", description: "Plan milestone dates before starting", route: "schedule", reason: "missing_schedule", primary: true };
    return { label: "Start Build", description: "Begin active construction", route: null, reason: "ready_to_start", primary: true, action: "start_build" };
  }

  if (stage === "Active") {
    const outstanding = T.outstanding || 0;
    if (outstanding > 0)
      return { label: "Chase payment", description: `${fmt(outstanding)} outstanding`, route: "invoices", reason: "outstanding_invoices", primary: true };
    return { label: "Raise progress claim", description: "Create next invoice", route: "invoices", reason: "raise_claim", primary: true };
  }

  if (stage === "Invoiced") {
    return { label: "Complete Build", description: "Mark project as delivered", route: null, reason: "ready_to_complete", primary: true, action: "complete_build" };
  }

  return null;
}
