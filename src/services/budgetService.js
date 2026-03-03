/**
 * Budget Service — wraps budgetEngine pure functions with project mutation.
 * Uses scoped `up(fn)` updater from ProjectContext.
 */

import {
  importSectionLevel,
  importItemLevel,
  snapshotFromQuote,
  createBudgetBaseline,
} from "../lib/budgetEngine.js";

/**
 * Initialize budget from quote scope data.
 * @param {Function} up - Scoped updater
 * @param {"section"|"item"} importMode
 * @param {"replace"|"merge"} mergeMode
 */
export function initializeBudgetFromQuote(up, importMode, mergeMode) {
  up(pr => {
    const lines = importMode === "item"
      ? importItemLevel(pr)
      : importSectionLevel(pr);

    if (mergeMode === "replace" || !Array.isArray(pr.workingBudget) || pr.workingBudget.length === 0) {
      pr.workingBudget = lines;
    } else {
      const existing = new Set(pr.workingBudget.map(b => b.sectionName));
      const newLines = lines.filter(l => !existing.has(l.sectionName));
      pr.workingBudget = [...pr.workingBudget, ...newLines];
    }

    if (!pr.quoteSnapshotBudget) {
      pr.quoteSnapshotBudget = snapshotFromQuote(pr);
    }
    return pr;
  });
}

/**
 * Create an immutable budget baseline snapshot.
 * @param {Function} up
 */
export function saveBudgetBaseline(up) {
  up(pr => {
    pr.budgetBaseline = createBudgetBaseline(pr);
    return pr;
  });
}
