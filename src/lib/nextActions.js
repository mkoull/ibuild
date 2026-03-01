import { fmt } from "../theme/styles.js";

/**
 * Generate stage-aware next actions for a project.
 * Returns an array of { label, detail, path } objects.
 */
export function getNextActions({ project: p, totals: T, clients }) {
  const stage = p.stage || p.status;
  const milestones = p.schedule || [];
  const nextMs = milestones.find(m => !m.done);
  const pendingInvoices = p.invoices.filter(i => i.status === "pending");
  const pendingAmount = pendingInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const openDefects = p.defects.filter(d => !d.done);
  const unsignedVars = p.variations.filter(v => v.status === "draft" || v.status === "pending");
  const hasScope = T.items > 0;
  const hasClient = !!(p.client || p.clientId);
  const hasProposal = p.proposals.length > 0;
  const hasSchedule = milestones.some(m => m.planned);

  const actions = [];

  if (stage === "Lead" || stage === "Quoted" || stage === "Quote") {
    if (!hasScope) actions.push({ label: "Build scope", detail: "Select items from rate library", path: "scope" });
    else actions.push({ label: "Review scope", detail: `${T.items} items · ${fmt(T.sub)}`, path: "scope" });
    if (!hasClient) actions.push({ label: "Add client details", detail: "Name, contact, address", path: "scope" });
    if (!hasProposal && hasScope && hasClient) actions.push({ label: "Generate proposal", detail: "Create client-ready proposal", path: "proposals" });
    else if (hasProposal) actions.push({ label: "Review proposal", detail: `${p.proposals.length} saved`, path: "proposals" });
    if (!hasSchedule) actions.push({ label: "Set schedule dates", detail: `${milestones.length} milestones to plan`, path: "schedule" });
  }

  if (stage === "Approved") {
    actions.push({ label: "Set start date", detail: "Confirm schedule and begin", path: "schedule" });
    if (!hasSchedule) actions.push({ label: "Plan schedule", detail: `${milestones.length} milestones`, path: "schedule" });
    actions.push({ label: "Assign trades", detail: "Allocate contractors", path: "trades" });
  }

  if (stage === "Active" || stage === "Invoiced") {
    if (nextMs) actions.push({ label: `Next milestone: ${nextMs.name}`, detail: nextMs.planned ? `Planned: ${nextMs.planned}` : "No date set", path: "schedule" });
    if (pendingAmount > 0) actions.push({ label: `Outstanding: ${fmt(pendingAmount)}`, detail: `${pendingInvoices.length} pending invoice${pendingInvoices.length !== 1 ? "s" : ""}`, path: "invoices" });
    if (openDefects.length > 0) actions.push({ label: `${openDefects.length} open defect${openDefects.length !== 1 ? "s" : ""}`, detail: "Requires attention", path: "defects" });
    if (unsignedVars.length > 0) actions.push({ label: `${unsignedVars.length} unsigned variation${unsignedVars.length !== 1 ? "s" : ""}`, detail: "Awaiting approval", path: "variations" });
    if (pendingAmount === 0 && stage === "Active") actions.push({ label: "Raise progress claim", detail: "Create next invoice", path: "invoices" });
  }

  if (stage === "Complete") {
    const msDone = milestones.filter(m => m.done).length;
    actions.push({ label: "Project delivered", detail: `${msDone}/${milestones.length} milestones complete`, path: "schedule" });
    if (T.paid > 0) actions.push({ label: `Total collected: ${fmt(T.paid)}`, detail: `of ${fmt(T.curr)} contract`, path: "invoices" });
    if (openDefects.length > 0) actions.push({ label: `${openDefects.length} outstanding defect${openDefects.length !== 1 ? "s" : ""}`, detail: "Warranty items", path: "defects" });
  }

  return actions.slice(0, 5);
}
