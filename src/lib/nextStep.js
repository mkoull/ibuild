/**
 * getNextStepForProject — deterministic "what should I do next?" engine.
 *
 * Returns ONE primary action based on stage + data completeness.
 * Follows Buildxact flow: Lead → Quote → Proposal → Accept → Job.
 *
 * @param {object} project
 * @param {object} totals — from calc()
 * @returns {{ label, description, route, reason, actionId } | null}
 */
import { normaliseStage } from "./lifecycle.js";
import { fmt } from "../theme/styles.js";

export function getNextStepForProject(project, totals) {
  const stage = normaliseStage(project.stage || project.status);
  const T = totals;
  const hasClient = !!(project.clientId);
  const hasScope = T.items > 0;
  const proposal = project.proposal;
  const hasProposal = proposal && proposal.status === "Generated";
  const milestones = project.schedule || [];
  const hasSchedule = milestones.some(m => m.plannedStart || m.planned);

  if (stage === "Lead") {
    if (!hasClient)
      return { label: "Add client details", description: "Select or create a client", route: "quote?step=details", reason: "missing_client", actionId: null };
    if (!hasScope)
      return { label: "Build quote", description: "Add items from rate library", route: "quote?step=scope", reason: "missing_scope", actionId: null };
    if (!hasProposal)
      return { label: "Review & generate proposal", description: "Finalise scope and create proposal", route: "quote?step=review", reason: "missing_proposal", actionId: null };
    return { label: "Send quote", description: "Transition to Quoted stage", route: "quote?step=review", reason: "ready_to_send", actionId: "send_quote" };
  }

  if (stage === "Quoted") {
    if (!hasProposal)
      return { label: "Generate proposal", description: "Create a proposal before converting", route: "quote?step=review", reason: "missing_proposal", actionId: null };
    return { label: "Mark accepted / Convert to Job", description: "Accept quote and unlock job modules", route: "overview", reason: "ready_to_convert", actionId: "convert_to_job" };
  }

  if (stage === "Approved") {
    if (!hasSchedule)
      return { label: "Set schedule", description: "Plan milestone dates before starting", route: "schedule", reason: "missing_schedule", actionId: null };
    return { label: "Start job", description: "Begin active construction", route: "overview", reason: "ready_to_start", actionId: "start_job" };
  }

  if (stage === "Active") {
    const outstanding = T.outstanding || 0;
    if (outstanding > 0)
      return { label: "Chase payment / Invoices", description: `${fmt(outstanding)} outstanding`, route: "invoices", reason: "outstanding_invoices", actionId: null };
    return { label: "Track costs", description: "Log project expenditure", route: "costs", reason: "track_costs", actionId: null };
  }

  if (stage === "Invoiced") {
    return { label: "Complete Build", description: "Mark project as delivered", route: "overview", reason: "ready_to_complete", actionId: "complete_build" };
  }

  return null;
}
