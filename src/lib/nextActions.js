import { fmt } from "../theme/styles.js";

/**
 * Generate stage-aware secondary actions for a project.
 * The primary step (from getNextStepForProject) is excluded to prevent duplicates.
 *
 * @param {object} opts
 * @param {object} opts.project
 * @param {object} opts.totals — from calc()
 * @param {string|null} opts.primaryRoute — route of the primary CTA to exclude
 * @param {string|null} opts.primaryReason — reason key to help semantic filtering
 * @returns {Array<{ label, detail, path }>}
 */
export function getNextActions({ project: p, totals: T, primaryRoute, primaryReason }) {
  const stage = p.stage || p.status;
  const milestones = p.schedule || [];
  const nextMs = milestones.find(m => !m.done);
  const pendingInvoices = (p.invoices || []).filter(i => i.status === "pending" || i.status === "sent");
  const pendingAmount = pendingInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const openDefects = (p.defects || []).filter(d => !d.done);
  const unsignedVars = (p.variations || []).filter(v => v.status === "draft" || v.status === "pending" || v.status === "sent");
  const hasScope = T.items > 0;
  const hasClient = !!(p.client || p.clientId);
  const hasProposal = p.proposal && p.proposal.status === "Generated";
  const hasSchedule = milestones.some(m => m.planned);

  const actions = [];

  if (stage === "Lead" || stage === "Quoted" || stage === "Quote") {
    if (!hasScope && primaryReason !== "missing_scope")
      actions.push({ label: "Build scope", detail: "Select items from rate library", path: "quote?step=scope" });
    else if (hasScope && primaryReason !== "missing_scope")
      actions.push({ label: "Review scope", detail: `${T.items} items · ${fmt(T.sub)}`, path: "quote?step=scope" });

    if (!hasClient && primaryReason !== "missing_client")
      actions.push({ label: "Add client details", detail: "Name, contact, address", path: "quote?step=details" });

    if (!hasProposal && hasScope && hasClient && primaryReason !== "missing_proposal")
      actions.push({ label: "Generate proposal", detail: "Create client-ready proposal", path: "quote?step=review" });
    else if (hasProposal && primaryReason !== "ready_to_send")
      actions.push({ label: "Review proposal", detail: `${p.proposals.length} saved`, path: "proposals" });

    if (!hasSchedule)
      actions.push({ label: "Set schedule dates", detail: `${milestones.length} milestones to plan`, path: "schedule" });
  }

  if (stage === "Approved") {
    if (primaryReason !== "missing_schedule")
      actions.push({ label: "Set start date", detail: "Confirm schedule and begin", path: "schedule" });
    if (!hasSchedule && primaryReason !== "missing_schedule")
      actions.push({ label: "Plan schedule", detail: `${milestones.length} milestones`, path: "schedule" });
    actions.push({ label: "Assign trades", detail: "Allocate contractors", path: "trades" });
  }

  if (stage === "Active" || stage === "Invoiced") {
    if (nextMs) actions.push({ label: `Next milestone: ${nextMs.name}`, detail: nextMs.planned ? `Planned: ${nextMs.planned}` : "No date set", path: "schedule" });
    if (pendingAmount > 0 && primaryReason !== "outstanding_invoices")
      actions.push({ label: `Outstanding: ${fmt(pendingAmount)}`, detail: `${pendingInvoices.length} pending invoice${pendingInvoices.length !== 1 ? "s" : ""}`, path: "invoices" });
    if (openDefects.length > 0)
      actions.push({ label: `${openDefects.length} open defect${openDefects.length !== 1 ? "s" : ""}`, detail: "Requires attention", path: "defects" });
    if (unsignedVars.length > 0)
      actions.push({ label: `${unsignedVars.length} unsigned variation${unsignedVars.length !== 1 ? "s" : ""}`, detail: "Awaiting approval", path: "variations" });
    if (pendingAmount === 0 && stage === "Active" && primaryReason !== "raise_claim")
      actions.push({ label: "Raise progress claim", detail: "Create next invoice", path: "invoices" });
  }

  if (stage === "Complete") {
    const msDone = milestones.filter(m => m.done).length;
    actions.push({ label: "Project delivered", detail: `${msDone}/${milestones.length} milestones complete`, path: "schedule" });
    if (T.paid > 0) actions.push({ label: `Total collected: ${fmt(T.paid)}`, detail: `of ${fmt(T.curr)} contract`, path: "invoices" });
    if (openDefects.length > 0) actions.push({ label: `${openDefects.length} outstanding defect${openDefects.length !== 1 ? "s" : ""}`, detail: "Warranty items", path: "defects" });
  }

  // Final dedup: remove any action whose path matches the primary route
  const filtered = primaryRoute
    ? actions.filter(a => a.path !== primaryRoute)
    : actions;

  return filtered.slice(0, 4);
}
