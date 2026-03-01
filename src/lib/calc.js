export function calc(p) {
  // Support both old and new field names
  const margin = p.marginPct ?? p.margin ?? 0;
  const contingency = p.contingencyPct ?? p.contingency ?? 0;

  const sub = Object.values(p.scope).flat().filter(i => i.on).reduce((t, i) => t + i.rate * i.qty, 0);
  const mar = sub * (margin / 100);
  const con = sub * (contingency / 100);
  const gst = (sub + mar + con) * 0.1;
  const orig = sub + mar + con + gst;
  const aV = p.variations.filter(v => v.status === "approved").reduce((t, v) => t + v.amount, 0);
  const curr = orig + aV;
  const inv = p.invoices.reduce((t, x) => t + x.amount, 0);
  const paid = p.invoices.filter(x => x.status === "paid").reduce((t, x) => t + x.amount, 0);
  const act = Object.values(p.scope).flat().filter(i => i.on).reduce((t, i) => t + (i.actual || 0), 0);
  const cT = (sc, c) => sc[c].filter(i => i.on).reduce((t, i) => t + i.rate * i.qty, 0);
  const cA = (sc, c) => sc[c].filter(i => i.on).reduce((t, i) => t + (i.actual || 0), 0);
  const cats = Object.entries(p.scope).filter(([, i]) => i.some(x => x.on));
  const items = Object.values(p.scope).flat().filter(i => i.on).length;
  return { sub, mar, con, gst, orig, aV, curr, inv, paid, act, cT, cA, cats, items, margin, contingency };
}
