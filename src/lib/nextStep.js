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
 *   - tab is the target tab id to navigate to
 *   - key "proposal" has flag `needsQuote` when scope+client incomplete
 */
export function getNextStep({ project: p, totals: T, hasPlanData }) {
  const hasScope = T.items > 0;
  const hasClient = !!p.client;
  const hasProposal = p.proposals.length > 0;
  const hasSchedule = p.milestones.some(m => m.planned);

  const steps = [
    {
      key: "plans",
      label: "Upload plans",
      done: hasPlanData || hasScope,
      detail: hasPlanData ? "Plans analysed" : "Optional — AI scope extraction",
      tab: "plans",
      optional: true,
    },
    {
      key: "scope",
      label: "Build scope",
      done: hasScope,
      detail: hasScope ? `${T.items} items` : "Select items from rate library",
      tab: "quote",
    },
    {
      key: "client",
      label: "Add client details",
      done: hasClient,
      detail: hasClient ? p.client : "Name, address, contact",
      tab: "quote",
    },
    {
      key: "proposal",
      label: "Generate proposal",
      done: hasProposal,
      detail: hasProposal ? `${p.proposals.length} saved` : "Requires scope + client",
      tab: "proposal",
      needsQuote: !hasScope || !hasClient,
    },
    {
      key: "schedule",
      label: "Set schedule",
      done: hasSchedule,
      detail: `${p.milestones.filter(m => m.planned).length} of ${p.milestones.length} dates set`,
      tab: "schedule",
    },
  ];

  // First required incomplete, then first optional incomplete
  const next = steps.find(s => !s.done && !s.optional) || steps.find(s => !s.done) || null;
  const done = steps.filter(s => s.done).length;

  return { steps, next, done };
}
