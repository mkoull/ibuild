/**
 * Sync p.scope (canonical) → p.estimate.categories (costEngine format).
 * Called inside up() callbacks after any scope mutation so that
 * WorkspaceShell finance strip and costEngine consumers stay up-to-date.
 *
 * Pure function — mutates `pr` in place (safe inside up() callbacks).
 *
 * @param {Object} pr - mutable project draft
 * @returns {Object} pr (same reference, for chaining)
 */
export function syncScopeToEstimate(pr) {
  const scope = pr.scope && typeof pr.scope === "object" ? pr.scope : {};
  const margin = Number(pr.marginPct ?? pr.margin ?? 0);

  const categories = Object.entries(scope).map(([name, items], idx) => {
    const safeItems = Array.isArray(items) ? items : [];
    return {
      id: `scope-${idx}`,
      name,
      items: safeItems
        .filter((i) => i.on)
        .map((i) => {
          const quantity = Number(i.qty) || 0;
          const unitRate = Number(i.rate) || 0;
          const marginPercent = Number(i.marginPct ?? margin);
          return {
            description: i.item || "",
            type: i.type || "Labour",
            unit: i.unit || "ea",
            quantity,
            unitRate,
            marginPercent,
          };
        }),
    };
  });

  if (!pr.estimate || typeof pr.estimate !== "object") {
    pr.estimate = {};
  }
  pr.estimate.categories = categories;
  pr.costCategories = categories;

  return pr;
}
