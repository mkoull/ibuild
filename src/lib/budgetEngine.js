import { uid } from "../theme/styles.js";

/**
 * Budget Engine — pure functions for quote-to-budget import,
 * variation feed-through, and per-line actuals.
 * Follows the calc.js pattern: stateless, returns new objects.
 */

/** Creates an immutable snapshot of the scope for reference */
export function snapshotFromQuote(project) {
  const scope = project.scope || {};
  return Object.entries(scope)
    .filter(([, items]) => items.some(i => i.on))
    .map(([sectionName, items]) => {
      const active = items.filter(i => i.on);
      return {
        sectionName,
        items: active.map(i => ({
          description: i.item,
          qty: i.qty,
          unit: i.unit,
          rate: i.rate,
          amount: i.rate * i.qty,
        })),
        total: active.reduce((t, i) => t + i.rate * i.qty, 0),
      };
    });
}

/** Section-level import: one budget line per scope category (summed) */
export function importSectionLevel(project) {
  const scope = project.scope || {};
  return Object.entries(scope)
    .filter(([, items]) => items.some(i => i.on))
    .map(([sectionName, items]) => {
      const total = items.filter(i => i.on).reduce((t, i) => t + i.rate * i.qty, 0);
      return {
        id: uid(),
        sectionName,
        description: sectionName,
        label: sectionName,
        budgetAmount: total,
        source: "quote_import",
        costCode: "",
        tradeId: "",
        tradeNameText: "",
        linkedVariationId: null,
        actualAmount: 0,
        actualPct: null,
      };
    })
    .filter(line => line.budgetAmount > 0);
}

/** Item-level import: one budget line per scope item */
export function importItemLevel(project) {
  const scope = project.scope || {};
  const lines = [];
  Object.entries(scope).forEach(([sectionName, items]) => {
    items.filter(i => i.on).forEach(i => {
      const amount = i.rate * i.qty;
      if (amount <= 0) return;
      lines.push({
        id: uid(),
        sectionName,
        description: i.item,
        label: i.item,
        qty: i.qty,
        unit: i.unit,
        rate: i.rate,
        budgetAmount: amount,
        source: "quote_import",
        costCode: "",
        tradeId: "",
        tradeNameText: "",
        linkedVariationId: null,
        actualAmount: 0,
        actualPct: null,
      });
    });
  });
  return lines;
}

/** Creates a budget line for an approved variation */
export function createVariationBudgetLine(variation) {
  return {
    id: uid(),
    sectionName: "Variations",
    description: variation.title || variation.description || "Variation",
    label: variation.title || variation.description || "Variation",
    budgetAmount: variation.amount || 0,
    source: "variation",
    costCode: "",
    tradeId: "",
    tradeNameText: "",
    linkedVariationId: variation.id,
    actualAmount: 0,
    actualPct: null,
  };
}

/** Creates a variation ledger entry */
export function createVariationLedgerEntry(variation, budgetLineId) {
  return {
    variationId: variation.id,
    title: variation.title || variation.description || "Variation",
    amount: variation.amount || 0,
    budgetLineId,
    approvedAt: variation.approvedAt || new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }),
  };
}

/** Converts % to $ amount */
export function actualFromPercent(budgetAmount, percent) {
  return Math.round(((budgetAmount || 0) * (percent / 100)) * 100) / 100;
}
