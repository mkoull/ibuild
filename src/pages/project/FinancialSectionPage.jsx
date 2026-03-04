import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt } from "../../theme/styles.js";

const LINK_CARD = {
  border: `1px solid ${_.line}`,
  borderRadius: 10,
  background: _.surface,
  padding: 16,
  textDecoration: "none",
  display: "block",
};

export default function FinancialSectionPage() {
  const { project, T } = useProject();

  const metrics = useMemo(() => {
    const contractValue = Number(T?.curr) || 0;
    const budgetFromCalc = Number(T?.revisedBudget ?? T?.budgetTotal) || 0;
    const actualFromCalc = Number(T?.combinedActuals) || 0;

    const budgetFromJob = (project?.job?.budget?.categories || []).reduce((catTotal, cat) => {
      const itemTotal = (cat.items || []).reduce((sum, item) => {
        const raw = item?.budgetCost ?? item?.costTotal ?? item?.budgetAmount ?? 0;
        return sum + (Number(raw) || 0);
      }, 0);
      return catTotal + itemTotal;
    }, 0);

    const actualFromJob = (project?.job?.budget?.categories || []).reduce((catTotal, cat) => {
      const itemTotal = (cat.items || []).reduce((sum, item) => {
        const raw = item?.actualCost ?? item?.actualAmount ?? 0;
        return sum + (Number(raw) || 0);
      }, 0);
      return catTotal + itemTotal;
    }, 0);

    const budget = budgetFromCalc > 0 ? budgetFromCalc : budgetFromJob;
    const actual = actualFromCalc > 0 ? actualFromCalc : actualFromJob;
    const profit = contractValue - actual;
    const margin = contractValue > 0 ? (profit / contractValue) * 100 : 0;

    const remainingBudget = Math.max(0, budget - actual);
    const projectedCost = actual + remainingBudget;
    const projectedProfit = contractValue - projectedCost;
    const budgetVsActualPct = budget > 0 ? Math.min(100, (actual / budget) * 100) : 0;

    return {
      contractValue,
      budget,
      actual,
      profit,
      margin,
      remainingBudget,
      projectedCost,
      projectedProfit,
      budgetVsActualPct,
    };
  }, [project, T]);

  const cards = [
    { label: "Contract Value", value: fmt(metrics.contractValue), tone: _.blue },
    { label: "Budget", value: fmt(metrics.budget), tone: _.ac },
    { label: "Actual Cost", value: fmt(metrics.actual), tone: _.amber },
    { label: "Projected Profit", value: fmt(metrics.projectedProfit), tone: metrics.projectedProfit >= 0 ? _.green : _.red },
    { label: "Profit Margin", value: `${metrics.margin.toFixed(1)}%`, tone: metrics.margin >= 0 ? _.green : _.red },
  ];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, color: _.ink }}>Financial</h2>
        <p style={{ margin: "6px 0 0", color: _.muted, fontSize: 14 }}>
          Track budget vs actual performance and manage claims/invoices.
        </p>
      </div>

      <div style={{ border: `1px solid ${_.line}`, borderRadius: 10, background: _.surface, padding: 14, display: "grid", gap: 14 }}>
        <div style={{ fontSize: 13, color: _.muted, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
          Profit Dashboard
        </div>

        <div className="layout-grid-12">
          {cards.map((card) => (
            <div
              key={card.label}
              className="col-4"
              style={{
                border: `1px solid ${_.line}`,
                borderRadius: 10,
                background: _.bg,
                padding: 12,
                minHeight: 86,
              }}
            >
              <div style={{ fontSize: 12, color: _.muted, marginBottom: 8 }}>{card.label}</div>
              <div style={{ fontSize: 24, lineHeight: 1.2, fontWeight: 700, color: card.tone, fontVariantNumeric: "tabular-nums" }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ border: `1px solid ${_.line}`, borderRadius: 10, padding: 12, background: _.bg, display: "grid", gap: 10 }}>
          <div style={{ fontSize: 13, color: _.ink, fontWeight: 600 }}>Budget vs Actual</div>
          <div style={{ height: 14, borderRadius: 999, background: _.well, overflow: "hidden", position: "relative" }}>
            <div style={{ width: "100%", height: "100%", background: _.ac, opacity: 0.25 }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${metrics.budgetVsActualPct}%`,
                background: metrics.actual <= metrics.budget ? _.green : _.red,
                transition: "width 0.2s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontSize: 12, color: _.muted }}>
            <span>Budget: {fmt(metrics.budget)}</span>
            <span>Actual: {fmt(metrics.actual)}</span>
            <span>Projected Cost: {fmt(metrics.projectedCost)}</span>
            <span>Remaining Budget: {fmt(metrics.remainingBudget)}</span>
          </div>
        </div>
      </div>

      <div className="layout-grid-12">
        <Link className="col-6" to="../costs" style={LINK_CARD}>
          <div style={{ fontSize: 16, fontWeight: 600, color: _.ink }}>Budget vs Actual</div>
          <div style={{ fontSize: 14, color: _.muted, marginTop: 6 }}>Cost control, trade/cost code views, and variance.</div>
        </Link>
        <Link className="col-6" to="../invoices" style={LINK_CARD}>
          <div style={{ fontSize: 16, fontWeight: 600, color: _.ink }}>Invoices</div>
          <div style={{ fontSize: 14, color: _.muted, marginTop: 6 }}>Create invoices, track paid/unpaid status, and receivables.</div>
        </Link>
      </div>
    </div>
  );
}
