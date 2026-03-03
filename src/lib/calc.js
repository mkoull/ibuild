/** @typedef {import("../types/entities.js").Project} Project */

// ── Sub-functions ──────────────────────────────────────────────────────────

/**
 * Calculate scope subtotals (quote-level financials).
 * @param {Object} scope - Project scope object
 * @param {number} marginPct
 * @param {number} contingencyPct
 * @returns {{ sub: number, mar: number, con: number, gst: number, orig: number, act: number, cats: Array, items: number, cT: Function, cA: Function }}
 */
export function calcScope(scope, marginPct, contingencyPct) {
  const active = Object.values(scope).flat().filter(i => i.on);
  const sub = active.reduce((t, i) => t + i.rate * i.qty, 0);
  const mar = sub * (marginPct / 100);
  const con = sub * (contingencyPct / 100);
  const gst = (sub + mar + con) * 0.1;
  const orig = sub + mar + con + gst;
  const act = active.reduce((t, i) => t + (i.actual || 0), 0);
  const cats = Object.entries(scope).filter(([, i]) => i.some(x => x.on));
  const items = active.length;
  const cT = (sc, c) => (sc[c] || []).filter(i => i.on).reduce((t, i) => t + i.rate * i.qty, 0);
  const cA = (sc, c) => (sc[c] || []).filter(i => i.on).reduce((t, i) => t + (i.actual || 0), 0);

  if (import.meta.env.DEV) {
    if (sub < 0) console.warn("[calc] negative scope subtotal:", sub);
    if (marginPct < 0 || marginPct > 100) console.warn("[calc] unusual margin%:", marginPct);
    if (contingencyPct < 0 || contingencyPct > 100) console.warn("[calc] unusual contingency%:", contingencyPct);
  }

  return { sub, mar, con, gst, orig, act, cats, items, cT, cA };
}

/**
 * Calculate approved variation totals.
 * @param {Array} variations
 * @returns {{ aV: number, aVCount: number }}
 */
export function calcVariations(variations) {
  const approved = (variations || []).filter(v => v.status === "approved");
  return {
    aV: approved.reduce((t, v) => t + (v.amount || 0), 0),
    aVCount: approved.length,
  };
}

/**
 * Calculate invoicing totals.
 * @param {Array} invoices
 * @returns {{ inv: number, paid: number, outstanding: number }}
 */
export function calcInvoicing(invoices) {
  const list = invoices || [];
  return {
    inv: list.filter(x => x.status !== "draft" && x.status !== "void").reduce((t, x) => t + (x.amount || 0), 0),
    paid: list.filter(x => x.status === "paid").reduce((t, x) => t + (x.amount || 0), 0),
    outstanding: list.filter(x => x.status === "sent" || x.status === "pending").reduce((t, x) => t + (x.amount || 0), 0),
  };
}

/**
 * Calculate budget and cost-control fields.
 * @param {Array} budget - Budget lines
 * @param {Array} commitments
 * @param {Array} actuals
 * @param {Object} costAllowances
 * @param {Array} supplierBills
 * @param {number} curr - Current contract value
 * @returns {Object} Cost-control fields
 */
export function calcBudget(budget, commitments, actuals, costAllowances, supplierBills, procurement, curr) {
  const budgetLines = budget || [];
  const budgetTotal = budgetLines.reduce((t, b) => t + ((b.budgetCost ?? b.budgetAmount) || 0), 0);
  const committedTotal = (commitments || []).filter(c => c.status === "Committed" || c.status === "approved").reduce((t, c) => t + (c.amount || 0), 0);
  const actualsTotal = (actuals || []).reduce((t, a) => t + (a.amount || 0), 0);
  const budgetActualsTotal = budgetLines.reduce((t, b) => t + ((b.actualCost ?? b.actualAmount) || 0), 0);
  const combinedActuals = actualsTotal + budgetActualsTotal;

  const bills = supplierBills || [];
  const procurementBills = procurement?.bills || [];
  const billsTotal = bills.filter(b => b.status !== "Void").reduce((t, b) => t + (b.total || 0), 0);
  const billsPaid = bills.filter(b => b.status === "Paid").reduce((t, b) => t + (b.total || 0), 0);
  const procurementBillsTotal = procurementBills.reduce((t, b) => t + (b.amount || 0), 0);

  const forecastMargin = curr > 0 ? curr - combinedActuals : 0;
  const marginPctCalc = curr > 0 ? ((curr - combinedActuals) / curr) * 100 : 0;

  const baselineBudget = budgetLines.filter(b => b.source !== "variation").reduce((t, b) => t + ((b.budgetCost ?? b.budgetAmount) || 0), 0);
  const variationBudget = budgetLines.filter(b => b.source === "variation").reduce((t, b) => t + ((b.budgetCost ?? b.budgetAmount) || 0), 0);
  const revisedBudget = budgetTotal;

  const ca = costAllowances || {};
  const allowancesAmt = Object.values(ca).reduce((t, a) => t + (a.amount || 0), 0);
  const overheadAmt = ((ca.siteOverhead || {}).amount || 0) + ((ca.officeOverhead || {}).amount || 0);

  const sellPriceTotal = budgetLines.reduce((t, b) => t + (b.sellPrice || 0), 0);
  const costBudget = budgetLines.reduce((t, b) => t + ((b.budgetCost ?? b.costAllowance) || 0), 0);
  const costVariance = costBudget - combinedActuals;

  const forecastCost = committedTotal + Math.max(0, revisedBudget - committedTotal) + overheadAmt;
  const forecastMarginNew = curr - forecastCost;
  const marginPctNew = curr > 0 ? ((curr - forecastCost) / curr) * 100 : 0;

  if (import.meta.env.DEV) {
    if (budgetTotal < 0) console.warn("[calc] negative budget total:", budgetTotal);
    if (committedTotal < 0) console.warn("[calc] negative committed total:", committedTotal);
  }

  return {
    budgetTotal, committedTotal, actualsTotal, budgetActualsTotal, combinedActuals,
    forecastMargin, marginPctCalc, billsTotal, billsPaid,
    procurementBillsTotal,
    baselineBudget, variationBudget, revisedBudget,
    allowancesAmt, overheadAmt, sellPriceTotal, costBudget, costVariance,
    forecastCost, forecastMarginNew, marginPctNew,
  };
}

// ── Orchestrator (backward compatible) ─────────────────────────────────────

/**
 * Calculate all financial metrics for a project.
 * @param {Project} p
 * @returns {Object} Flat object with all computed financial fields
 */
export function calc(p) {
  const margin = p.marginPct ?? p.margin ?? 0;
  const contingency = p.contingencyPct ?? p.contingency ?? 0;
  const scope = p.scope || {};

  const scopeResult = calcScope(scope, margin, contingency);
  const varResult = calcVariations(p.variations);
  const curr = scopeResult.orig + varResult.aV;
  const invResult = calcInvoicing(p.invoices);
  const budgetResult = calcBudget(p.budget, p.commitments, p.actuals, p.costAllowances, p.supplierBills, p.procurement, curr);

  return {
    ...scopeResult,
    ...varResult,
    curr,
    ...invResult,
    margin,
    contingency,
    ...budgetResult,
  };
}

/**
 * Calculate remaining balance on a commitment after matched bills.
 * @param {import("../types/entities.js").Commitment} commitment
 * @param {Array} supplierBills
 * @returns {{ matched: number, remaining: number }}
 */
export function commitmentRemaining(commitment, supplierBills) {
  const matched = (supplierBills || [])
    .filter(b => b.status !== "Void")
    .flatMap(b => b.lines || [])
    .filter(l => l.commitmentId === commitment.id)
    .reduce((t, l) => t + (l.amount || 0), 0);
  return { matched, remaining: (commitment.amount || 0) - matched };
}
