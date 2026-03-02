export function calc(p) {
  const margin = p.marginPct ?? p.margin ?? 0;
  const contingency = p.contingencyPct ?? p.contingency ?? 0;
  const scope = p.scope || {};

  const sub = Object.values(scope).flat().filter(i => i.on).reduce((t, i) => t + i.rate * i.qty, 0);
  const mar = sub * (margin / 100);
  const con = sub * (contingency / 100);
  const gst = (sub + mar + con) * 0.1;
  const orig = sub + mar + con + gst;
  const aV = (p.variations || []).filter(v => v.status === "approved").reduce((t, v) => t + (v.amount || 0), 0);
  const aVCount = (p.variations || []).filter(v => v.status === "approved").length;
  const curr = orig + aV;
  const inv = (p.invoices || []).filter(x => x.status !== "draft" && x.status !== "void").reduce((t, x) => t + (x.amount || 0), 0);
  const paid = (p.invoices || []).filter(x => x.status === "paid").reduce((t, x) => t + (x.amount || 0), 0);
  const outstanding = (p.invoices || []).filter(x => x.status === "sent" || x.status === "pending").reduce((t, x) => t + (x.amount || 0), 0);
  const act = Object.values(scope).flat().filter(i => i.on).reduce((t, i) => t + (i.actual || 0), 0);
  const cT = (sc, c) => (sc[c] || []).filter(i => i.on).reduce((t, i) => t + i.rate * i.qty, 0);
  const cA = (sc, c) => (sc[c] || []).filter(i => i.on).reduce((t, i) => t + (i.actual || 0), 0);
  const cats = Object.entries(scope).filter(([, i]) => i.some(x => x.on));
  const items = Object.values(scope).flat().filter(i => i.on).length;

  const budgetTotal = (p.budget || []).reduce((t, b) => t + (b.budgetAmount || 0), 0);
  const committedTotal = (p.commitments || []).filter(c => c.status === "Committed" || c.status === "approved").reduce((t, c) => t + (c.amount || 0), 0);
  const actualsTotal = (p.actuals || []).reduce((t, a) => t + (a.amount || 0), 0);

  const bills = p.supplierBills || [];
  const billsTotal = bills.filter(b => b.status !== "Void").reduce((t, b) => t + (b.total || 0), 0);
  const billsPaid = bills.filter(b => b.status === "Paid").reduce((t, b) => t + (b.total || 0), 0);

  const forecastMargin = curr > 0 ? curr - actualsTotal : 0;
  const marginPctCalc = curr > 0 ? ((curr - actualsTotal) / curr) * 100 : 0;

  return { sub, mar, con, gst, orig, aV, aVCount, curr, inv, paid, outstanding, act, cT, cA, cats, items, margin, contingency, budgetTotal, committedTotal, actualsTotal, forecastMargin, marginPctCalc, billsTotal, billsPaid };
}

export function commitmentRemaining(commitment, supplierBills) {
  const matched = (supplierBills || [])
    .filter(b => b.status !== "Void")
    .flatMap(b => b.lines || [])
    .filter(l => l.commitmentId === commitment.id)
    .reduce((t, l) => t + (l.amount || 0), 0);
  return { matched, remaining: (commitment.amount || 0) - matched };
}
