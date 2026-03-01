/**
 * getNextStep — deterministic "Continue setup" routing.
 *
 * Returns the ordered step list and the first incomplete step.
 *
 * @param {object} opts
 * @param {object} opts.project    — current project object
 * @param {object} opts.totals     — { items, sub } from calc()
 * @param {boolean} opts.hasPlanData — whether planData is truthy
 * @returns {{ steps: Step[], next: Step|null, done: number }}
 *
 * Each Step: { key, label, done, detail, tab, optional? }
 *   - tab is the route segment to navigate to
 *   - key "proposal" has flag `needsQuote` when scope+client incomplete
 */
export function getNextStep({ project: p, totals: T, hasPlanData }) {
  const hasScope = T.items > 0;
  // Support both old (p.client string) and new (p.clientId) shapes
  const clientName = p.client || "";
  const hasClient = !!(clientName && (p.email || p.phone) && p.address);
  const hasProposal = p.proposals.length > 0;
  const milestones = p.schedule || p.milestones || [];
  const hasSchedule = milestones.some(m => m.planned);

  const steps = [
    {
      key: "plans",
      label: "Upload plans",
      done: !!hasPlanData,
      detail: hasPlanData ? "Plans analysed" : "Optional — AI scope extraction",
      tab: "plans",
      optional: true,
    },
    {
      key: "scope",
      label: "Build scope",
      done: hasScope,
      detail: hasScope ? `${T.items} items` : "Select items from rate library",
      tab: "scope",
    },
    {
      key: "client",
      label: "Add client details",
      done: hasClient,
      detail: hasClient ? clientName : "Name, contact, address",
      tab: "scope",
    },
    {
      key: "proposal",
      label: "Generate proposal",
      done: hasProposal,
      detail: hasProposal ? `${p.proposals.length} saved` : "Requires scope + client",
      tab: "proposals",
      needsQuote: !hasScope || !hasClient,
    },
    {
      key: "schedule",
      label: "Set schedule",
      done: hasSchedule,
      detail: `${milestones.filter(m => m.planned).length} of ${milestones.length} dates set`,
      tab: "schedule",
    },
  ];

  // First required incomplete step; optional steps never block flow
  const next = steps.find(s => !s.done && !s.optional) || null;
  const done = steps.filter(s => s.done).length;

  return { steps, next, done };
}
