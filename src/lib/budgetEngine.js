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
  const marginPct = project.marginPct ?? 0;
  return Object.entries(scope)
    .filter(([, items]) => items.some(i => i.on))
    .map(([sectionName, items]) => {
      const total = items.filter(i => i.on).reduce((t, i) => t + i.rate * i.qty, 0);
      const costAllowance = marginPct > 0 ? Math.round(total * (1 - marginPct / 100) * 100) / 100 : total;
      return {
        id: uid(),
        sectionName,
        description: sectionName,
        label: sectionName,
        sellPrice: total,
        costAllowance,
        budgetAmount: costAllowance,
        source: "quote_import",
        costCode: "",
        tradeId: "",
        tradeNameText: "",
        linkedVariationId: null,
        actualAmount: 0,
        actualPct: null,
        allocations: [],
      };
    })
    .filter(line => line.sellPrice > 0);
}

/** Item-level import: one budget line per scope item */
export function importItemLevel(project) {
  const scope = project.scope || {};
  const marginPct = project.marginPct ?? 0;
  const lines = [];
  Object.entries(scope).forEach(([sectionName, items]) => {
    items.filter(i => i.on).forEach(i => {
      const amount = i.rate * i.qty;
      if (amount <= 0) return;
      const costAllowance = marginPct > 0 ? Math.round(amount * (1 - marginPct / 100) * 100) / 100 : amount;
      lines.push({
        id: uid(),
        sectionName,
        description: i.item,
        label: i.item,
        qty: i.qty,
        unit: i.unit,
        rate: i.rate,
        sellPrice: amount,
        costAllowance,
        budgetAmount: costAllowance,
        source: "quote_import",
        costCode: "",
        tradeId: "",
        tradeNameText: "",
        linkedVariationId: null,
        actualAmount: 0,
        actualPct: null,
        allocations: [],
      });
    });
  });
  return lines;
}

/** Creates a budget line for an approved variation */
export function createVariationBudgetLine(variation, marginPct = 0) {
  const amt = variation.amount || 0;
  const costAllowance = marginPct > 0 ? Math.round(amt * (1 - marginPct / 100) * 100) / 100 : amt;
  return {
    id: uid(),
    sectionName: "Variations",
    description: variation.title || variation.description || "Variation",
    label: variation.title || variation.description || "Variation",
    sellPrice: amt,
    costAllowance,
    budgetAmount: costAllowance,
    source: "variation",
    costCode: "",
    tradeId: "",
    tradeNameText: "",
    linkedVariationId: variation.id,
    actualAmount: 0,
    actualPct: null,
    allocations: [],
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

/** Import only lines for scope categories not already in the budget */
export function importMissingLines(project, existingBudget) {
  const full = importSectionLevel(project);
  const existingNames = new Set((existingBudget || []).map(b => b.sectionName));
  return full.filter(line => !existingNames.has(line.sectionName));
}

/** Converts % to $ amount */
export function actualFromPercent(budgetAmount, percent) {
  return Math.round(((budgetAmount || 0) * (percent / 100)) * 100) / 100;
}

/** Recalculate unlocked cost-allowance amounts from their percentages */
export function recalcAllowances(costAllowances, budgetSubtotal) {
  if (!costAllowances) return costAllowances;
  const out = {};
  for (const [key, a] of Object.entries(costAllowances)) {
    out[key] = a.locked
      ? { ...a }
      : { ...a, amount: Math.round(budgetSubtotal * (a.pct / 100) * 100) / 100 };
  }
  return out;
}

/** Sum of budget lines where source !== "variation" */
export function baselineBudgetTotal(budgetLines) {
  return (budgetLines || [])
    .filter(b => b.source !== "variation")
    .reduce((t, b) => t + (b.budgetAmount || 0), 0);
}

/** Sum of all cost-allowance amounts */
export function allowancesTotal(costAllowances) {
  if (!costAllowances) return 0;
  return Object.values(costAllowances).reduce((t, a) => t + (a.amount || 0), 0);
}

/** Ensure a budget line has an allocations array */
export function ensureAllocations(line) {
  if (!Array.isArray(line.allocations)) line.allocations = [];
  return line;
}

/** Create an allocation sub-row */
export function mkAllocation(tradeId, tradeLabel, amount) {
  return { tradeId: tradeId || "", tradeLabel: tradeLabel || "", amount: amount || 0, locked: false };
}

/** Validate that allocations balance against the parent line amount */
export function validateAllocations(line) {
  const allocs = line.allocations || [];
  if (allocs.length === 0) return { valid: true, total: 0, difference: 0 };
  const total = allocs.reduce((t, a) => t + (a.amount || 0), 0);
  const difference = (line.budgetAmount || 0) - total;
  return { valid: Math.abs(difference) < 0.01, total, difference };
}

/** Auto-split: unlocked allocations share the remainder equally */
export function autoSplitAllocations(line) {
  const allocs = line.allocations || [];
  if (allocs.length === 0) return allocs;
  const budget = line.budgetAmount || 0;
  const lockedSum = allocs.filter(a => a.locked).reduce((t, a) => t + (a.amount || 0), 0);
  const unlocked = allocs.filter(a => !a.locked);
  if (unlocked.length === 0) return allocs;
  const share = Math.round(((budget - lockedSum) / unlocked.length) * 100) / 100;
  return allocs.map(a => a.locked ? a : { ...a, amount: share });
}

/** Creates an immutable budget baseline snapshot from the current budget lines */
export function createBudgetBaseline(project) {
  return {
    versionId: uid(),
    createdAt: new Date().toISOString(),
    sourceQuoteId: project.id,
    marginPctAtSnapshot: project.marginPct ?? 0,
    lines: JSON.parse(JSON.stringify(project.budget || [])),
  };
}
