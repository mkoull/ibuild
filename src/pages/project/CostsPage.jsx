import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { commitmentRemaining } from "../../lib/calc.js";
import _ from "../../theme/tokens.js";
import { fmt, input, label, badge, uid, ds } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { BarChart3, Plus, X, ChevronRight, Download } from "lucide-react";

function TradeSelect({ value, onChange, trades }) {
  return (
    <div>
      <label style={label}>Trade</label>
      <select style={{ ...input, cursor: "pointer" }} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— No trade —</option>
        {(trades || []).map(t => <option key={t.id} value={t.id}>{t.businessName || t.name || t.id}</option>)}
      </select>
    </div>
  );
}

const TABS = ["Trade Breakdown", "Cost Code", "Budget", "Commitments", "Actuals", "Report", "Scope Costs"];
const COMMIT_STATUSES = ["Draft", "Committed", "Cancelled"];
const COMMIT_COLOR = { Draft: _.amber, Committed: _.green, Cancelled: _.faint };

export default function CostsPage() {
  const { project: p, update: up, T, log } = useProject();
  const { trades, mobile, notify } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState("Trade Breakdown");
  const [budgetForm, setBudgetForm] = useState({ costCode: "", labelText: "", budgetAmount: "", tradeId: "" });
  const [commitForm, setCommitForm] = useState({ vendor: "", description: "", amount: "", tradeId: "", status: "Draft" });
  const [actualForm, setActualForm] = useState({ costCode: "", description: "", amount: "", tradeId: "", date: "" });
  const [deleteModal, setDeleteModal] = useState(null);
  const [expandedTrade, setExpandedTrade] = useState(null);
  const [expandedCode, setExpandedCode] = useState(null);

  const budgetLines = p.budget || [];
  const commitments = p.commitments || [];
  const actuals = p.actuals || [];
  const bills = p.supplierBills || [];

  const variance = T.budgetTotal - T.actualsTotal;
  const committedVar = T.budgetTotal - T.committedTotal;

  const tradeName = (tradeId) => {
    if (!tradeId) return "Unassigned";
    const t = (trades || []).find(x => x.id === tradeId);
    return t ? (t.businessName || t.name || "Trade") : "Unknown";
  };

  // ─── Trade breakdown ───
  const tradeBreakdown = useMemo(() => {
    const map = {};
    const ensure = (tid) => {
      if (!map[tid]) map[tid] = { tradeId: tid, budget: 0, committed: 0, actual: 0, budgetItems: [], commitItems: [], actualItems: [] };
    };
    budgetLines.forEach(b => { const tid = b.tradeId || "_none"; ensure(tid); map[tid].budget += b.budgetAmount || 0; map[tid].budgetItems.push(b); });
    commitments.filter(c => c.status === "Committed" || c.status === "approved").forEach(c => { const tid = c.tradeId || "_none"; ensure(tid); map[tid].committed += c.amount || 0; map[tid].commitItems.push(c); });
    actuals.forEach(a => { const tid = a.tradeId || "_none"; ensure(tid); map[tid].actual += a.amount || 0; map[tid].actualItems.push(a); });
    return Object.values(map).sort((a, b) => b.budget - a.budget);
  }, [budgetLines, commitments, actuals]);

  // ─── Cost code breakdown ───
  const costCodeBreakdown = useMemo(() => {
    const map = {};
    const ensure = (code) => {
      const k = code || "_none";
      if (!map[k]) map[k] = { costCode: k, budget: 0, committed: 0, actual: 0, budgetItems: [], commitItems: [], actualItems: [], billItems: [] };
    };
    budgetLines.forEach(b => { const k = b.costCode || "_none"; ensure(k); map[k].budget += b.budgetAmount || 0; map[k].budgetItems.push(b); });
    commitments.filter(c => c.status === "Committed" || c.status === "approved").forEach(c => { const k = c.costCode || "_none"; ensure(k); map[k].committed += c.amount || 0; map[k].commitItems.push(c); });
    actuals.forEach(a => { const k = a.costCode || "_none"; ensure(k); map[k].actual += a.amount || 0; map[k].actualItems.push(a); });
    bills.filter(b => b.status !== "Void").forEach(b => {
      (b.lines || []).forEach(l => { const k = l.costCode || "_none"; ensure(k); if (b.status === "Paid") { map[k].billItems.push({ ...l, billVendor: b.vendorName, billNum: b.billNumber }); } });
    });
    return Object.values(map).sort((a, b) => b.budget - a.budget);
  }, [budgetLines, commitments, actuals, bills]);

  const uI = (cat, idx, k, v) => up(pr => { pr.scope[cat][idx][k] = v; return pr; });

  const addBudgetLine = () => {
    const amt = parseFloat(budgetForm.budgetAmount);
    if (!budgetForm.labelText || !amt) { notify("Label and amount required", "error"); return; }
    up(pr => {
      if (!pr.budget) pr.budget = [];
      pr.budget.push({ id: uid(), costCode: budgetForm.costCode, label: budgetForm.labelText, budgetAmount: amt, tradeId: budgetForm.tradeId });
      return pr;
    });
    log(`Budget line: ${budgetForm.labelText} (${fmt(amt)})`);
    notify("Budget line added");
    setBudgetForm({ costCode: "", labelText: "", budgetAmount: "", tradeId: "" });
  };

  const addCommitment = () => {
    const amt = parseFloat(commitForm.amount);
    if (!commitForm.description || !amt) { notify("Description and amount required", "error"); return; }
    up(pr => {
      if (!pr.commitments) pr.commitments = [];
      pr.commitments.push({ id: uid(), vendorName: commitForm.vendor, vendor: commitForm.vendor, description: commitForm.description, amount: amt, tradeId: commitForm.tradeId, status: commitForm.status, createdAt: new Date().toISOString() });
      return pr;
    });
    log(`Commitment: ${commitForm.description} (${fmt(amt)})`);
    notify("Commitment added");
    setCommitForm({ vendor: "", description: "", amount: "", tradeId: "", status: "Draft" });
  };

  const addActual = () => {
    const amt = parseFloat(actualForm.amount);
    if (!actualForm.description || !amt) { notify("Description and amount required", "error"); return; }
    up(pr => {
      if (!pr.actuals) pr.actuals = [];
      pr.actuals.push({ id: uid(), costCode: actualForm.costCode, description: actualForm.description, amount: amt, tradeId: actualForm.tradeId, date: actualForm.date || ds(), source: "Manual" });
      return pr;
    });
    log(`Actual cost: ${actualForm.description} (${fmt(amt)})`);
    notify("Actual recorded");
    setActualForm({ costCode: "", description: "", amount: "", tradeId: "", date: "" });
  };

  const setCommitStatus = (i, newStatus) => {
    up(pr => { pr.commitments[i].status = newStatus; return pr; });
    notify(`${commitments[i].description} → ${newStatus}`);
  };

  const removeItem = () => {
    if (!deleteModal) return;
    const { type, idx } = deleteModal;
    up(pr => {
      if (type === "budget") pr.budget.splice(idx, 1);
      if (type === "commitment") pr.commitments.splice(idx, 1);
      if (type === "actual") pr.actuals.splice(idx, 1);
      return pr;
    });
    notify("Removed");
    setDeleteModal(null);
  };

  // TradeSelect is defined outside this component to avoid focus loss from re-creation

  // ─── CSV export ───
  const downloadCSV = useCallback(() => {
    const rows = [["Type", "Trade", "Cost Code", "Description", "Budget", "Committed", "Actual", "Source"]];
    budgetLines.forEach(b => rows.push(["Budget", tradeName(b.tradeId), b.costCode || "", b.label, b.budgetAmount, "", "", ""]));
    commitments.filter(c => c.status === "Committed" || c.status === "approved").forEach(c => rows.push(["Commitment", tradeName(c.tradeId), "", c.description, "", c.amount, "", c.vendorName || c.vendor || ""]));
    actuals.forEach(a => rows.push(["Actual", tradeName(a.tradeId), a.costCode || "", a.description, "", "", a.amount, a.source || "Manual"]));
    const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cost-report-${ds().replace(/\s/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify("CSV downloaded");
  }, [budgetLines, commitments, actuals, notify]);

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: _.s2 }}>Costs</h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s6 }}>Budget, commitments, and actual costs</div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: mobile ? _.s2 : _.s3, marginBottom: _.s7 }}>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Budget</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.budgetTotal > 0 ? _.ink : _.faint }}>{T.budgetTotal > 0 ? fmt(T.budgetTotal) : "—"}</div>
        </Card>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Committed</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.committedTotal > 0 ? _.amber : _.faint }}>{T.committedTotal > 0 ? fmt(T.committedTotal) : "—"}</div>
          {T.budgetTotal > 0 && T.committedTotal > 0 && (
            <div style={{ fontSize: _.fontSize.xs, color: committedVar >= 0 ? _.green : _.red, marginTop: 2 }}>{committedVar >= 0 ? "+" : ""}{fmt(committedVar)} vs budget</div>
          )}
        </Card>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Actual</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.actualsTotal > 0 ? _.ac : _.faint }}>{T.actualsTotal > 0 ? fmt(T.actualsTotal) : "—"}</div>
        </Card>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Variance</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.budgetTotal > 0 ? (variance >= 0 ? _.green : _.red) : _.faint }}>
            {T.budgetTotal > 0 ? `${variance >= 0 ? "+" : ""}${fmt(variance)}` : "—"}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${_.line}`, marginBottom: _.s6, overflowX: "auto" }}>
        {TABS.map(t => (
          <div key={t} onClick={() => setTab(t)} style={{
            padding: `${_.s3}px ${_.s4}px`, cursor: "pointer", whiteSpace: "nowrap",
            fontSize: _.fontSize.base, fontWeight: tab === t ? _.fontWeight.semi : _.fontWeight.normal,
            color: tab === t ? _.ink : _.muted,
            borderBottom: tab === t ? `2px solid ${_.ink}` : "2px solid transparent",
            marginBottom: -2, transition: `all ${_.tr}`,
          }}>{t}</div>
        ))}
      </div>

      {/* ═══ TRADE BREAKDOWN ═══ */}
      {tab === "Trade Breakdown" && (
        <div>
          {tradeBreakdown.length === 0 ? (
            <Empty icon={BarChart3} text="Add budget lines to see trade breakdown" />
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 100px 100px 100px 100px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
                <span>Trade</span>
                {!mobile && <><span style={{ textAlign: "right" }}>Budget</span><span style={{ textAlign: "right" }}>Committed</span><span style={{ textAlign: "right" }}>Actual</span></>}
                <span style={{ textAlign: "right" }}>Variance</span>
              </div>
              {tradeBreakdown.map(row => {
                const v = row.budget - row.actual;
                const isExpanded = expandedTrade === row.tradeId;
                return (
                  <div key={row.tradeId}>
                    <div onClick={() => setExpandedTrade(isExpanded ? null : row.tradeId)} style={{
                      display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 100px 100px 100px 100px", gap: _.s2,
                      padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center",
                      fontSize: _.fontSize.base, cursor: "pointer", transition: `background ${_.tr}`,
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = _.well}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                        <span style={{ transform: isExpanded ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={12} color={_.muted} /></span>
                        <span style={{ fontWeight: _.fontWeight.semi, color: _.ink }}>{tradeName(row.tradeId === "_none" ? null : row.tradeId)}</span>
                      </div>
                      {!mobile && (
                        <>
                          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.budget > 0 ? fmt(row.budget) : "—"}</span>
                          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: _.amber }}>{row.committed > 0 ? fmt(row.committed) : "—"}</span>
                          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.actual > 0 ? fmt(row.actual) : "—"}</span>
                        </>
                      )}
                      <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: row.budget > 0 ? (v >= 0 ? _.green : _.red) : _.faint }}>
                        {row.budget > 0 ? `${v >= 0 ? "+" : ""}${fmt(v)}` : "—"}
                      </span>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: `${_.s3}px 0 ${_.s3}px ${_.s6}px`, borderBottom: `1px solid ${_.line}`, background: _.well }}>
                        {row.budgetItems.length > 0 && (
                          <div style={{ marginBottom: _.s3 }}>
                            <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s1 }}>Budget Lines</div>
                            {row.budgetItems.map(b => (
                              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, padding: "2px 0" }}>
                                <span>{b.costCode ? `[${b.costCode}] ` : ""}{b.label}</span>
                                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{fmt(b.budgetAmount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {row.commitItems.length > 0 && (
                          <div style={{ marginBottom: _.s3 }}>
                            <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s1 }}>Commitments</div>
                            {row.commitItems.map(c => {
                              const r = commitmentRemaining(c, bills);
                              return (
                                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, padding: "2px 0" }}>
                                  <span>{c.vendorName || c.vendor || "—"} — {c.description}</span>
                                  <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi, color: _.amber }}>
                                    {fmt(c.amount)}{r.matched > 0 ? ` (rem: ${fmt(r.remaining)})` : ""}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {row.actualItems.length > 0 && (
                          <div>
                            <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s1 }}>Actuals</div>
                            {row.actualItems.map(a => (
                              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, padding: "2px 0" }}>
                                <span>{a.description} <span style={{ color: _.muted }}>({a.source || "Manual"})</span></span>
                                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{fmt(a.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 100px 100px 100px 100px", gap: _.s2, padding: `${_.s3}px 0`, fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold }}>
                <span>Total</span>
                {!mobile && (
                  <>
                    <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(T.budgetTotal)}</span>
                    <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: _.amber }}>{fmt(T.committedTotal)}</span>
                    <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(T.actualsTotal)}</span>
                  </>
                )}
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: variance >= 0 ? _.green : _.red }}>{variance >= 0 ? "+" : ""}{fmt(variance)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ COST CODE BREAKDOWN ═══ */}
      {tab === "Cost Code" && (
        <div>
          {costCodeBreakdown.length === 0 ? (
            <Empty icon={BarChart3} text="Add budget lines with cost codes to see breakdown" />
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 100px 100px 100px 100px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
                <span>Cost Code</span>
                {!mobile && <><span style={{ textAlign: "right" }}>Budget</span><span style={{ textAlign: "right" }}>Committed</span><span style={{ textAlign: "right" }}>Actual</span></>}
                <span style={{ textAlign: "right" }}>Variance</span>
              </div>
              {costCodeBreakdown.map(row => {
                const v = row.budget - row.actual;
                const isExpanded = expandedCode === row.costCode;
                return (
                  <div key={row.costCode}>
                    <div onClick={() => setExpandedCode(isExpanded ? null : row.costCode)} style={{
                      display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 100px 100px 100px 100px", gap: _.s2,
                      padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center",
                      fontSize: _.fontSize.base, cursor: "pointer", transition: `background ${_.tr}`,
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = _.well}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                        <span style={{ transform: isExpanded ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={12} color={_.muted} /></span>
                        <span style={{ fontWeight: _.fontWeight.semi, color: _.ink }}>{row.costCode === "_none" ? "No code" : row.costCode}</span>
                      </div>
                      {!mobile && (
                        <>
                          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.budget > 0 ? fmt(row.budget) : "—"}</span>
                          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: _.amber }}>{row.committed > 0 ? fmt(row.committed) : "—"}</span>
                          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.actual > 0 ? fmt(row.actual) : "—"}</span>
                        </>
                      )}
                      <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: row.budget > 0 ? (v >= 0 ? _.green : _.red) : _.faint }}>
                        {row.budget > 0 ? `${v >= 0 ? "+" : ""}${fmt(v)}` : "—"}
                      </span>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: `${_.s3}px 0 ${_.s3}px ${_.s6}px`, borderBottom: `1px solid ${_.line}`, background: _.well }}>
                        {row.budgetItems.length > 0 && (
                          <div style={{ marginBottom: _.s3 }}>
                            <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, textTransform: "uppercase", marginBottom: _.s1 }}>Budget Lines</div>
                            {row.budgetItems.map(b => (
                              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, padding: "2px 0" }}>
                                <span>{tradeName(b.tradeId)} — {b.label}</span>
                                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{fmt(b.budgetAmount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {row.actualItems.length > 0 && (
                          <div style={{ marginBottom: _.s3 }}>
                            <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, textTransform: "uppercase", marginBottom: _.s1 }}>Actuals</div>
                            {row.actualItems.map(a => (
                              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, padding: "2px 0" }}>
                                <span>{a.description} <span style={{ color: _.muted }}>({a.source || "Manual"})</span></span>
                                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{fmt(a.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {row.billItems.length > 0 && (
                          <div>
                            <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, textTransform: "uppercase", marginBottom: _.s1 }}>Bill Lines (Paid)</div>
                            {row.billItems.map((l, i) => (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, padding: "2px 0" }}>
                                <span>{l.billVendor} #{l.billNum} — {l.description}</span>
                                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{fmt(l.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ═══ BUDGET TAB ═══ */}
      {tab === "Budget" && (
        <div>
          <div style={{ marginBottom: _.s6, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s4 }}>Add Budget Line</div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 80px 1fr 140px", gap: `${_.s3}px ${_.s4}px`, alignItems: mobile ? "stretch" : "end", marginBottom: _.s3 }}>
              <TradeSelect value={budgetForm.tradeId} onChange={v => setBudgetForm({ ...budgetForm, tradeId: v })} trades={trades} />
              <div><label style={label}>Code</label><input style={input} value={budgetForm.costCode} onChange={e => setBudgetForm({ ...budgetForm, costCode: e.target.value })} placeholder="01" /></div>
              <div><label style={label}>Label *</label><input style={input} value={budgetForm.labelText} onChange={e => setBudgetForm({ ...budgetForm, labelText: e.target.value })} placeholder="Concrete works" /></div>
              <div><label style={label}>Amount *</label><input type="number" style={input} value={budgetForm.budgetAmount} onChange={e => setBudgetForm({ ...budgetForm, budgetAmount: e.target.value })} placeholder="50000" /></div>
            </div>
            <Button onClick={addBudgetLine} icon={Plus}>Add budget line</Button>
          </div>
          {budgetLines.length === 0 ? (
            <Empty icon={BarChart3} text="No budget lines yet" />
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "60px 1fr 90px 30px" : "80px 60px 1fr 120px 120px 30px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
                {!mobile && <span>Trade</span>}
                <span>Code</span><span>Label</span>
                {!mobile && <span style={{ textAlign: "right" }}>Amount</span>}
                <span style={{ textAlign: "right" }}>{mobile ? "Amt" : ""}</span><span></span>
              </div>
              {budgetLines.map((b, i) => (
                <div key={b.id || i} style={{ display: "grid", gridTemplateColumns: mobile ? "60px 1fr 90px 30px" : "80px 60px 1fr 120px 120px 30px", gap: _.s2, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: _.fontSize.base }}>
                  {!mobile && <span style={{ fontSize: _.fontSize.sm, color: _.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tradeName(b.tradeId)}</span>}
                  <span style={{ color: _.muted, fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{b.costCode || "—"}</span>
                  <span style={{ fontWeight: _.fontWeight.medium, color: _.ink }}>{b.label}</span>
                  {!mobile && <span></span>}
                  <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(b.budgetAmount)}</span>
                  <div onClick={() => setDeleteModal({ type: "budget", idx: i })} style={{ cursor: "pointer", color: _.faint, display: "flex", justifyContent: "center", transition: `color ${_.tr}` }} onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", padding: `${_.s3}px 0`, fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold }}>Total: {fmt(T.budgetTotal)}</div>
            </>
          )}
        </div>
      )}

      {/* ═══ COMMITMENTS TAB ═══ */}
      {tab === "Commitments" && (
        <div>
          <div style={{ marginBottom: _.s6, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s4 }}>Add Commitment (PO)</div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr 140px", gap: `${_.s3}px ${_.s4}px`, alignItems: mobile ? "stretch" : "end", marginBottom: _.s3 }}>
              <TradeSelect value={commitForm.tradeId} onChange={v => setCommitForm({ ...commitForm, tradeId: v })} trades={trades} />
              <div><label style={label}>Vendor</label><input style={input} value={commitForm.vendor} onChange={e => setCommitForm({ ...commitForm, vendor: e.target.value })} placeholder="Trade name" /></div>
              <div><label style={label}>Description *</label><input style={input} value={commitForm.description} onChange={e => setCommitForm({ ...commitForm, description: e.target.value })} placeholder="Concrete slab pour" /></div>
              <div><label style={label}>Amount *</label><input type="number" style={input} value={commitForm.amount} onChange={e => setCommitForm({ ...commitForm, amount: e.target.value })} placeholder="25000" /></div>
            </div>
            <Button onClick={addCommitment} icon={Plus}>Add commitment</Button>
          </div>
          {commitments.length === 0 ? (
            <Empty icon={BarChart3} text="No commitments yet" />
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto 30px" : "100px 1fr 1fr 100px 80px 100px 30px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
                {!mobile && <span>Trade</span>}
                <span>{mobile ? "Commitment" : "Vendor"}</span>
                {!mobile && <span>Description</span>}
                {!mobile && <span style={{ textAlign: "right" }}>Amount</span>}
                {!mobile && <span style={{ textAlign: "right" }}>Remain</span>}
                <span style={{ textAlign: "center" }}>Status</span><span></span>
              </div>
              {commitments.map((c, i) => {
                const st = c.status || "Draft";
                const r = commitmentRemaining(c, bills);
                return (
                  <div key={c.id || i} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto 30px" : "100px 1fr 1fr 100px 80px 100px 30px", gap: _.s2, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: _.fontSize.base, opacity: st === "Cancelled" ? 0.5 : 1 }}>
                    {!mobile && <span style={{ fontSize: _.fontSize.sm, color: _.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tradeName(c.tradeId)}</span>}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: _.fontWeight.medium, color: _.ink }}>{c.vendorName || c.vendor || "—"}</div>
                      {mobile && <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{c.description} · {fmt(c.amount)}</div>}
                    </div>
                    {!mobile && <span style={{ color: _.body }}>{c.description}</span>}
                    {!mobile && <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(c.amount)}</span>}
                    {!mobile && <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: _.fontSize.sm, color: r.remaining < c.amount ? _.amber : _.muted }}>{r.matched > 0 ? fmt(r.remaining) : "—"}</span>}
                    <div style={{ textAlign: "center" }}>
                      <select
                        value={st}
                        onChange={e => setCommitStatus(i, e.target.value)}
                        style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, padding: "3px 8px", borderRadius: _.rFull, border: "none", cursor: "pointer", background: `${COMMIT_COLOR[st] || _.muted}14`, color: COMMIT_COLOR[st] || _.muted }}
                      >
                        {COMMIT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div onClick={() => setDeleteModal({ type: "commitment", idx: i })} style={{ cursor: "pointer", color: _.faint, display: "flex", justifyContent: "center", transition: `color ${_.tr}` }} onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "flex-end", padding: `${_.s3}px 0`, fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold }}>Committed total: {fmt(T.committedTotal)}</div>
            </>
          )}
        </div>
      )}

      {/* ═══ ACTUALS TAB ═══ */}
      {tab === "Actuals" && (
        <div>
          <div style={{ marginBottom: _.s6, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s4 }}>Add Actual Cost</div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 80px 1fr 140px 120px", gap: `${_.s3}px ${_.s4}px`, alignItems: mobile ? "stretch" : "end", marginBottom: _.s3 }}>
              <TradeSelect value={actualForm.tradeId} onChange={v => setActualForm({ ...actualForm, tradeId: v })} trades={trades} />
              <div><label style={label}>Code</label><input style={input} value={actualForm.costCode} onChange={e => setActualForm({ ...actualForm, costCode: e.target.value })} placeholder="01" /></div>
              <div><label style={label}>Description *</label><input style={input} value={actualForm.description} onChange={e => setActualForm({ ...actualForm, description: e.target.value })} placeholder="Slab pour" /></div>
              <div><label style={label}>Amount *</label><input type="number" style={input} value={actualForm.amount} onChange={e => setActualForm({ ...actualForm, amount: e.target.value })} placeholder="12000" /></div>
              <div><label style={label}>Date</label><input type="date" style={{ ...input, cursor: "pointer" }} value={actualForm.date} onChange={e => setActualForm({ ...actualForm, date: e.target.value })} /></div>
            </div>
            <Button onClick={addActual} icon={Plus}>Add actual</Button>
          </div>
          {actuals.length === 0 ? (
            <Empty icon={BarChart3} text="No actual costs recorded yet" />
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 80px 30px" : "80px 1fr 100px 100px 90px 30px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
                {!mobile && <span>Trade</span>}
                <span>Description</span>
                {!mobile && <span>Source</span>}
                <span style={{ textAlign: "right" }}>Amount</span>
                {!mobile && <span>Date</span>}
                <span></span>
              </div>
              {actuals.map((a, i) => (
                <div key={a.id || i} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 80px 30px" : "80px 1fr 100px 100px 90px 30px", gap: _.s2, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: _.fontSize.base }}>
                  {!mobile && <span style={{ fontSize: _.fontSize.sm, color: _.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tradeName(a.tradeId)}</span>}
                  <span style={{ fontWeight: _.fontWeight.medium, color: _.ink }}>{a.description}</span>
                  {!mobile && <span style={{ color: _.muted, fontSize: _.fontSize.sm }}>{a.source || "Manual"}</span>}
                  <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(a.amount)}</span>
                  {!mobile && <span style={{ fontSize: _.fontSize.sm, color: _.body }}>{a.date || "—"}</span>}
                  <div onClick={() => setDeleteModal({ type: "actual", idx: i })} style={{ cursor: "pointer", color: _.faint, display: "flex", justifyContent: "center", transition: `color ${_.tr}` }} onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", padding: `${_.s3}px 0`, fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold }}>Total: {fmt(T.actualsTotal)}</div>
            </>
          )}
        </div>
      )}

      {/* ═══ REPORT TAB ═══ */}
      {tab === "Report" && (
        <div>
          <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s4 }}>Job Cost Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: `${_.s2}px ${_.s6}px`, maxWidth: 400, marginBottom: _.s6 }}>
            {[
              ["Contract Value", T.curr],
              ["Budget", T.budgetTotal],
              ["Committed", T.committedTotal],
              ["Actual", T.actualsTotal],
              ["Variance (Budget − Actual)", T.budgetTotal - T.actualsTotal],
              ["Forecast Margin", T.forecastMargin],
              ["Margin %", null],
            ].map(([lbl, val], i) => (
              <div key={lbl} style={{ display: "contents" }}>
                <span style={{ fontSize: _.fontSize.base, color: _.body, padding: `${_.s2}px 0`, borderBottom: `1px solid ${_.line}` }}>{lbl}</span>
                <span style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", textAlign: "right", padding: `${_.s2}px 0`, borderBottom: `1px solid ${_.line}`, color: lbl.includes("Variance") ? (val >= 0 ? _.green : _.red) : lbl.includes("Margin") && val !== null ? (val >= 0 ? _.green : _.red) : _.ink }}>
                  {val !== null ? (lbl.includes("%") ? `${T.marginPctCalc.toFixed(1)}%` : fmt(val)) : `${T.marginPctCalc.toFixed(1)}%`}
                </span>
              </div>
            ))}
          </div>

          <Button icon={Download} variant="secondary" onClick={downloadCSV}>Download CSV</Button>
        </div>
      )}

      {/* ═══ SCOPE COSTS TAB (legacy) ═══ */}
      {tab === "Scope Costs" && (
        <div>
          {T.cats.length === 0 && <Empty icon={BarChart3} text="Add scope items in Quote to begin tracking" action={() => navigate("../quote?step=scope")} actionText="Go to Quote" />}
          {T.cats.map(([cat, items]) => {
            const est = T.cT(p.scope, cat);
            const actVal = T.cA(p.scope, cat);
            const v = actVal - est;
            return (
              <div key={cat} style={{ marginBottom: _.s6, paddingBottom: _.s5, borderBottom: `1px solid ${_.line}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s2 }}>
                  <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi }}>{cat}</span>
                  {v !== 0 && <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: v > 0 ? _.red : _.green }}>{v > 0 ? "+" : ""}{fmt(v)}</span>}
                </div>
                <div style={{ display: "flex", gap: _.s5, fontSize: _.fontSize.base, color: _.muted, marginBottom: _.s3 }}>
                  <span>Budget <strong style={{ color: _.ink }}>{fmt(est)}</strong></span>
                  <span>Actual <strong style={{ color: actVal > est ? _.red : _.green }}>{fmt(actVal)}</strong></span>
                </div>
                {actVal > 0 && <div style={{ height: 3, background: _.line, borderRadius: 2, marginBottom: _.s3 }}><div style={{ height: "100%", width: `${Math.min((actVal / est) * 100, 100)}%`, background: actVal > est ? _.red : _.green, borderRadius: 2, transition: "width 0.4s" }} /></div>}
                {items.filter(i => i.on).map(item => (
                  <div key={item._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: _.fontSize.base }}>
                    <span style={{ color: _.body }}>{item.item}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                      <span style={{ color: _.muted, fontVariantNumeric: "tabular-nums" }}>{fmt(item.rate * item.qty)}</span>
                      <input type="number" placeholder="Actual" style={{ width: 76, padding: "3px 6px", background: _.well, border: `1px solid ${_.line}`, borderRadius: 5, color: _.ink, fontSize: _.fontSize.sm, textAlign: "right", outline: "none" }}
                        value={item.actual || ""} onChange={e => uI(cat, p.scope[cat].indexOf(item), "actual", parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Item" width={400}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, marginBottom: _.s6 }}>Are you sure you want to delete this item?</div>
        <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" onClick={removeItem}>Delete</Button>
        </div>
      </Modal>
    </Section>
  );
}
