import { useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { commitmentRemaining } from "../../lib/calc.js";
import { importSectionLevel, importItemLevel, importMissingLines, snapshotFromQuote, actualFromPercent, recalcAllowances, baselineBudgetTotal, mkAllocation, validateAllocations, autoSplitAllocations, createBudgetBaseline } from "../../lib/budgetEngine.js";
import _ from "../../theme/tokens.js";
import { fmt, input, label, uid, ds } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { BarChart3, Plus, X, ChevronRight, Download, Upload, Lock, Unlock, Split, Trash2 } from "lucide-react";

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

const TABS = ["Job Control", "Trade Breakdown", "Cost Code", "Budget", "Commitments", "Actuals", "Report", "Scope Costs"];
const COMMIT_STATUSES = ["Draft", "Committed", "Cancelled"];
const COMMIT_COLOR = { Draft: _.amber, Committed: _.green, Cancelled: _.faint };

export default function CostsPage() {
  const { project: p, update: up, T, log } = useProject();
  const { trades, mobile, notify, modulesHook } = useApp();
  const navigate = useNavigate();
  const params = useParams();

  const [tab, setTab] = useState("Job Control");
  const [budgetForm, setBudgetForm] = useState({ costCode: "", labelText: "", budgetAmount: "", tradeId: "", sectionName: "" });
  const [commitForm, setCommitForm] = useState({ vendor: "", description: "", amount: "", tradeId: "", status: "Draft", linkedBudgetLineId: "" });
  const [actualForm, setActualForm] = useState({ costCode: "", description: "", amount: "", tradeId: "", date: "", linkedBudgetLineId: "" });
  const [initMode, setInitMode] = useState("section");
  const [deleteModal, setDeleteModal] = useState(null);
  const [replaceModal, setReplaceModal] = useState(false);
  const [expandedTrade, setExpandedTrade] = useState(null);
  const [expandedCode, setExpandedCode] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [editingLine, setEditingLine] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [quickAdd, setQuickAdd] = useState({ description: "", amount: "" });
  const [allocExpanded, setAllocExpanded] = useState(null);
  const [dismissQuoteLinkHint, setDismissQuoteLinkHint] = useState(false);

  const budgetLines = p.workingBudget || p.budget || [];
  const commitments = p.commitments || [];
  const actuals = p.actuals || [];
  const bills = p.supplierBills || [];

  const variance = T.combinedActuals - T.revisedBudget;
  const committedVar = T.revisedBudget - T.committedTotal;
  const activeModule = params.moduleId ? modulesHook.find(params.moduleId) : null;
  const linkedQuoteModuleId = activeModule?.links?.derivedFrom || activeModule?.links?.sourceOfTruth || null;
  const linkedQuoteModule = linkedQuoteModuleId ? modulesHook.find(linkedQuoteModuleId) : null;

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
    budgetLines.forEach(b => {
      const allocs = b.allocations || [];
      if (allocs.length > 0) {
        allocs.forEach(al => { const tid = al.tradeId || "_none"; ensure(tid); map[tid].budget += al.amount || 0; map[tid].budgetItems.push({ ...b, _allocAmt: al.amount }); });
      } else {
        const tid = b.tradeId || "_none"; ensure(tid); map[tid].budget += (b.budgetCost ?? b.budgetAmount) || 0; map[tid].budgetItems.push(b);
      }
    });
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
    budgetLines.forEach(b => { const k = b.costCode || "_none"; ensure(k); map[k].budget += (b.budgetCost ?? b.budgetAmount) || 0; map[k].budgetItems.push(b); });
    commitments.filter(c => c.status === "Committed" || c.status === "approved").forEach(c => { const k = c.costCode || "_none"; ensure(k); map[k].committed += c.amount || 0; map[k].commitItems.push(c); });
    actuals.forEach(a => { const k = a.costCode || "_none"; ensure(k); map[k].actual += a.amount || 0; map[k].actualItems.push(a); });
    bills.filter(b => b.status !== "Void").forEach(b => {
      (b.lines || []).forEach(l => { const k = l.costCode || "_none"; ensure(k); if (b.status === "Paid") { map[k].billItems.push({ ...l, billVendor: b.vendorName, billNum: b.billNumber }); } });
    });
    return Object.values(map).sort((a, b) => b.budget - a.budget);
  }, [budgetLines, commitments, actuals, bills]);

  // ─── Budget groups (by sectionName) ───
  const budgetGroups = useMemo(() => {
    const map = {};
    budgetLines.forEach((b, idx) => {
      const sec = b.sectionName || "Ungrouped";
      if (!map[sec]) map[sec] = { sectionName: sec, lines: [], total: 0 };
      map[sec].lines.push({ ...b, _idx: idx });
      map[sec].total += (b.budgetCost ?? b.budgetAmount) || 0;
    });
    return Object.values(map).sort((a, b) => {
      if (a.sectionName === "Variations") return 1;
      if (b.sectionName === "Variations") return -1;
      return 0;
    });
  }, [budgetLines]);

  // ─── Job Control groups (budget + committed + actual per section) ───
  const jobControlGroups = useMemo(() => {
    const map = {};
    const ensure = (sec) => {
      if (!map[sec]) map[sec] = { sectionName: sec, budget: 0, sellPrice: 0, costAllowance: 0, committed: 0, actual: 0, lines: [], commitItems: [], actualItems: [] };
    };
    budgetLines.forEach((b, idx) => {
      const sec = b.sectionName || "Ungrouped";
      ensure(sec);
      map[sec].budget += (b.budgetCost ?? b.budgetAmount) || 0;
      map[sec].sellPrice += b.sellPrice || 0;
      map[sec].costAllowance += b.costAllowance || 0;
      map[sec].lines.push({ ...b, _idx: idx });
    });
    commitments.filter(c => c.status === "Committed" || c.status === "approved").forEach(c => {
      // Link to budget line's section if linkedBudgetLineId exists
      const linked = c.linkedBudgetLineId ? budgetLines.find(b => b.id === c.linkedBudgetLineId) : null;
      const sec = linked ? (linked.sectionName || "Ungrouped") : "Ungrouped";
      ensure(sec);
      map[sec].committed += c.amount || 0;
      map[sec].commitItems.push(c);
    });
    actuals.forEach(a => {
      const linked = a.linkedBudgetLineId ? budgetLines.find(b => b.id === a.linkedBudgetLineId) : null;
      const sec = linked ? (linked.sectionName || "Ungrouped") : "Ungrouped";
      ensure(sec);
      map[sec].actual += a.amount || 0;
      map[sec].actualItems.push(a);
    });
    return Object.values(map).sort((a, b) => {
      if (a.sectionName === "Variations") return 1;
      if (b.sectionName === "Variations") return -1;
      return b.budget - a.budget;
    });
  }, [budgetLines, commitments, actuals]);

  const [jcExpanded, setJcExpanded] = useState(null);

  const uI = (cat, idx, k, v) => up(pr => { pr.scope[cat][idx][k] = v; return pr; });

  const saveInlineEdit = (idx) => {
    if (!editValues || Object.keys(editValues).length === 0) { setEditingLine(null); return; }
    up(pr => {
      const line = pr.budget[idx];
      if (!line) return pr;
      if (editValues.label !== undefined) { line.label = editValues.label; line.description = editValues.label; }
      if (editValues.budgetAmount !== undefined) {
        const budgetCost = parseFloat(editValues.budgetAmount) || 0;
        line.budgetCost = budgetCost;
        line.budgetAmount = budgetCost;
        line.variance = (line.actualCost ?? line.actualAmount ?? 0) - budgetCost;
      }
      if (editValues.costCode !== undefined) line.costCode = editValues.costCode;
      return pr;
    });
    setEditingLine(null);
    setEditValues({});
  };

  const addQuickLine = (sectionName) => {
    const amt = parseFloat(quickAdd.amount);
    if (!quickAdd.description || !amt) { notify("Description and amount required", "error"); return; }
    up(pr => {
      if (!pr.budget) pr.budget = [];
      pr.budget.push({ id: uid(), costCode: "", label: quickAdd.description, description: quickAdd.description, sectionName, sellPrice: amt, costAllowance: amt, budgetCost: amt, budgetAmount: amt, actualCost: 0, variance: -amt, tradeId: "", source: "manual", actualAmount: 0, actualPct: null, allocations: [] });
      return pr;
    });
    log(`Budget line: ${quickAdd.description} (${fmt(amt)})`);
    notify("Budget line added");
    setQuickAdd({ description: "", amount: "" });
  };

  const addBudgetLine = () => {
    const amt = parseFloat(budgetForm.budgetAmount);
    if (!budgetForm.labelText || !amt) { notify("Label and amount required", "error"); return; }
    up(pr => {
      if (!pr.budget) pr.budget = [];
      pr.budget.push({ id: uid(), costCode: budgetForm.costCode, label: budgetForm.labelText, description: budgetForm.labelText, sectionName: budgetForm.sectionName, sellPrice: amt, costAllowance: amt, budgetCost: amt, budgetAmount: amt, actualCost: 0, variance: -amt, tradeId: budgetForm.tradeId, source: "manual", actualAmount: 0, actualPct: null, allocations: [] });
      return pr;
    });
    log(`Budget line: ${budgetForm.labelText} (${fmt(amt)})`);
    notify("Budget line added");
    setBudgetForm({ costCode: "", labelText: "", budgetAmount: "", tradeId: "", sectionName: "" });
  };

  const hasScope = Object.values(p.scope || {}).some(items => items.some(i => i.on));
  const hasBaseline = !!p.budgetBaseline;

  const initFromQuote = (mode) => {
    up(pr => {
      pr.quoteSnapshotBudget = snapshotFromQuote(pr);
      const lines = mode === "item" ? importItemLevel(pr) : importSectionLevel(pr);
      if (!pr.budget || pr.budget.length === 0) {
        pr.budget = lines;
      } else {
        pr.budget = [...pr.budget, ...lines];
      }
      pr.budgetBaseline = createBudgetBaseline(pr);
      if (pr.costAllowances) {
        const baseline = baselineBudgetTotal(pr.budget);
        pr.costAllowances = recalcAllowances(pr.costAllowances, baseline);
      }
      if (!Array.isArray(pr.activity)) pr.activity = [];
      pr.activity.unshift({
        type: "budget_baseline_created",
        action: `Budget baseline created (${mode}-level, ${pr.budget.length} lines)`,
        time: new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }),
        date: new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }),
        at: Date.now(),
      });
      return pr;
    });
    log(`Budget initialised from quote (${mode}-level)`);
    notify("Budget initialised from quote");
  };

  const importMissing = () => {
    up(pr => {
      if (!pr.quoteSnapshotBudget) pr.quoteSnapshotBudget = snapshotFromQuote(pr);
      const missing = importMissingLines(pr, pr.budget || []);
      if (missing.length === 0) { notify("All scope categories already in budget", "info"); return pr; }
      if (!pr.budget) pr.budget = [];
      pr.budget.push(...missing);
      return pr;
    });
    log("Budget: imported missing lines from quote");
    notify("Missing lines imported");
  };

  const replaceFromQuote = () => {
    up(pr => {
      pr.quoteSnapshotBudget = snapshotFromQuote(pr);
      pr.budget = importSectionLevel(pr);
      return pr;
    });
    log("Budget replaced from quote (section-level)");
    notify("Budget replaced from quote");
    setReplaceModal(false);
  };

  const detachBaseline = () => {
    up(pr => {
      pr.quoteSnapshotBudget = null;
      pr.budgetBaseline = null;
      return pr;
    });
    if (activeModule) {
      modulesHook.update(activeModule.id, m => {
        m.links.derivedFrom = null;
        m.links.sourceOfTruth = null;
        return m;
      });
    }
    notify("Baseline detached");
  };

  const updateBudgetActual = (idx, rawValue) => {
    const str = String(rawValue).trim();
    up(pr => {
      const line = pr.budget[idx];
      if (!line) return pr;
      if (str.endsWith("%")) {
        const pct = parseFloat(str.slice(0, -1));
        if (!isNaN(pct)) {
          line.actualPct = pct;
          const budgetCost = Number(line.budgetCost ?? line.budgetAmount) || 0;
          const actualCost = actualFromPercent(budgetCost, pct);
          line.actualCost = actualCost;
          line.actualAmount = actualCost;
          line.variance = actualCost - budgetCost;
        }
      } else {
        const amt = parseFloat(str);
        const budgetCost = Number(line.budgetCost ?? line.budgetAmount) || 0;
        const actualCost = isNaN(amt) ? 0 : amt;
        line.actualCost = actualCost;
        line.actualAmount = actualCost;
        line.variance = actualCost - budgetCost;
        line.actualPct = null;
      }
      return pr;
    });
  };

  const addCommitment = () => {
    const amt = parseFloat(commitForm.amount);
    if (!commitForm.description || !amt) { notify("Description and amount required", "error"); return; }
    up(pr => {
      if (!pr.commitments) pr.commitments = [];
      pr.commitments.push({ id: uid(), vendorName: commitForm.vendor, vendor: commitForm.vendor, description: commitForm.description, amount: amt, tradeId: commitForm.tradeId, status: commitForm.status, linkedBudgetLineId: commitForm.linkedBudgetLineId || null, createdAt: new Date().toISOString() });
      return pr;
    });
    log(`Commitment: ${commitForm.description} (${fmt(amt)})`);
    notify("Commitment added");
    setCommitForm({ vendor: "", description: "", amount: "", tradeId: "", status: "Draft", linkedBudgetLineId: "" });
  };

  const addActual = () => {
    const amt = parseFloat(actualForm.amount);
    if (!actualForm.description || !amt) { notify("Description and amount required", "error"); return; }
    up(pr => {
      if (!pr.actuals) pr.actuals = [];
      pr.actuals.push({ id: uid(), costCode: actualForm.costCode, description: actualForm.description, amount: amt, tradeId: actualForm.tradeId, date: actualForm.date || ds(), source: "Manual", linkedBudgetLineId: actualForm.linkedBudgetLineId || null });
      return pr;
    });
    log(`Actual cost: ${actualForm.description} (${fmt(amt)})`);
    notify("Actual recorded");
    setActualForm({ costCode: "", description: "", amount: "", tradeId: "", date: "", linkedBudgetLineId: "" });
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
    const rows = [["Type", "Section", "Trade", "Cost Code", "Description", "Sell Price", "Cost Allowance", "Budget", "Committed", "Actual", "Source", "Allocations"]];
    budgetLines.forEach(b => {
      const allocs = (b.allocations || []).map(a => `${a.tradeLabel || tradeName(a.tradeId)}:${a.amount}`).join("; ");
      rows.push(["Budget", b.sectionName || "", tradeName(b.tradeId), b.costCode || "", b.label, b.sellPrice || "", b.costAllowance || "", b.budgetCost ?? b.budgetAmount ?? 0, "", b.actualCost ?? b.actualAmount ?? 0, b.source || "", allocs]);
    });
    commitments.filter(c => c.status === "Committed" || c.status === "approved").forEach(c => rows.push(["Commitment", "", tradeName(c.tradeId), "", c.description, "", "", "", c.amount, "", c.vendorName || c.vendor || "", ""]));
    actuals.forEach(a => rows.push(["Actual", "", tradeName(a.tradeId), a.costCode || "", a.description, "", "", "", "", a.amount, a.source || "Manual", ""]));
    // Summary rows
    rows.push([]);
    rows.push(["Summary"]);
    rows.push(["Contract Value", "", "", "", "", "", "", T.curr]);
    rows.push(["Sell Price Total", "", "", "", "", T.sellPriceTotal]);
    rows.push(["Cost Budget", "", "", "", "", "", T.costBudget]);
    rows.push(["Original Budget", "", "", "", "", "", "", T.baselineBudget]);
    rows.push(["Variation Budget", "", "", "", "", "", "", T.variationBudget]);
    rows.push(["Revised Budget", "", "", "", "", "", "", T.revisedBudget]);
    rows.push(["Allowances", "", "", "", "", "", "", T.allowancesAmt]);
    rows.push(["Committed Total", "", "", "", "", "", "", T.committedTotal]);
    rows.push(["Actual (combined)", "", "", "", "", "", "", T.combinedActuals]);
    rows.push(["Forecast Cost", "", "", "", "", "", "", T.forecastCost]);
    rows.push(["Forecast Margin", "", "", "", "", "", "", T.forecastMarginNew]);
    rows.push(["Margin %", "", "", "", "", "", "", `${T.marginPctNew.toFixed(1)}%`]);
    const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cost-report-${ds().replace(/\s/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify("CSV downloaded");
  }, [budgetLines, commitments, actuals, notify, T, tradeName]);

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: _.s2 }}>Costs</h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s6 }}>Budget, commitments, and actual costs</div>
      {!dismissQuoteLinkHint && !linkedQuoteModule && !hasBaseline && hasScope && (
        <div style={{ marginBottom: _.s4, padding: `${_.s3}px ${_.s4}px`, borderRadius: _.rSm, border: `1px solid ${_.amber}40`, background: `${_.amber}10`, display: "flex", justifyContent: "space-between", gap: _.s3, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: _.fontSize.sm, color: _.body }}>No approved quote linked. Import cost codes?</div>
          <div style={{ display: "flex", gap: _.s2 }}>
            <Button size="sm" variant="secondary" onClick={() => initFromQuote("section")}>Import</Button>
            <Button size="sm" variant="ghost" onClick={() => setDismissQuoteLinkHint(true)}>Dismiss</Button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: mobile ? _.s2 : _.s3, marginBottom: _.s7 }}>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Budget</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.revisedBudget > 0 ? _.ink : _.faint }}>{T.revisedBudget > 0 ? fmt(T.revisedBudget) : "—"}</div>
          {T.baselineBudget > 0 && T.variationBudget > 0 && (
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginTop: 2 }}>Baseline: {fmt(T.baselineBudget)}</div>
          )}
        </Card>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Committed</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.committedTotal > 0 ? _.amber : _.faint }}>{T.committedTotal > 0 ? fmt(T.committedTotal) : "—"}</div>
          {T.revisedBudget > 0 && T.committedTotal > 0 && (
            <div style={{ fontSize: _.fontSize.xs, color: committedVar >= 0 ? _.green : _.red, marginTop: 2 }}>{committedVar >= 0 ? "+" : ""}{fmt(committedVar)} vs budget</div>
          )}
        </Card>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Actual</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.combinedActuals > 0 ? _.ac : _.faint }}>{T.combinedActuals > 0 ? fmt(T.combinedActuals) : "—"}</div>
        </Card>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Variance</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.revisedBudget > 0 ? (variance <= 0 ? _.green : _.red) : _.faint }}>
            {T.revisedBudget > 0 ? `${variance >= 0 ? "+" : ""}${fmt(variance)}` : "—"}
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

      {/* ═══ INITIALISE BUDGET CTA ═══ */}
      {linkedQuoteModule && (
        <div style={{ display: "flex", gap: _.s2, flexWrap: "wrap", marginBottom: _.s4 }}>
          <span style={{ fontSize: _.fontSize.sm, color: _.muted, marginRight: _.s2, alignSelf: "center" }}>
            Linked to quote source
          </span>
          <Button size="sm" variant="secondary" onClick={importMissing}>Sync</Button>
          <Button size="sm" variant="secondary" onClick={replaceFromQuote}>Re-import</Button>
          <Button size="sm" variant="ghost" onClick={detachBaseline}>Detach baseline</Button>
        </div>
      )}
      {!hasBaseline && hasScope && budgetLines.length === 0 && (
        <div style={{ padding: `${_.s6}px ${_.s5}px`, background: `${_.ac}06`, border: `1.5px dashed ${_.ac}30`, borderRadius: _.r, marginBottom: _.s6, textAlign: "center" }}>
          <div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s2 }}>Initialise budget from quote</div>
          <div style={{ fontSize: _.fontSize.base, color: _.muted, maxWidth: 460, margin: `0 auto ${_.s4}px` }}>
            Import your accepted quote scope into the job budget to start tracking costs.
          </div>
          <div style={{ display: "flex", gap: _.s3, justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginBottom: _.s3 }}>
            {[
              { value: "section", label: "Section-level", desc: "One line per category" },
              { value: "item", label: "Item-level", desc: "One line per item" },
            ].map(opt => (
              <div key={opt.value} onClick={() => setInitMode(opt.value)} style={{
                display: "flex", alignItems: "center", gap: _.s2, padding: `${_.s2}px ${_.s3}px`,
                borderRadius: _.rSm, cursor: "pointer",
                background: initMode === opt.value ? `${_.ac}14` : "transparent",
                border: `1px solid ${initMode === opt.value ? _.ac : _.line}`,
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: "50%", border: `2px solid ${initMode === opt.value ? _.ac : _.line2}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {initMode === opt.value && <div style={{ width: 6, height: 6, borderRadius: "50%", background: _.ac }} />}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.medium, color: _.ink }}>{opt.label}</div>
                  <div style={{ fontSize: _.fontSize.xs, color: _.muted }}>{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={() => initFromQuote(initMode)} icon={Upload}>Initialise budget</Button>
          <div style={{ marginTop: _.s3 }}>
            <span onClick={() => { up(pr => { pr.budgetBaseline = { versionId: uid(), createdAt: new Date().toISOString(), sourceQuoteId: pr.id, marginPctAtSnapshot: pr.marginPct ?? 0, lines: [] }; return pr; }); notify("Manual budget started"); }} style={{ fontSize: _.fontSize.sm, color: _.muted, cursor: "pointer", textDecoration: "underline" }}>Start manual budget instead</span>
          </div>
        </div>
      )}

      {/* ═══ JOB CONTROL ═══ */}
      {tab === "Job Control" && (
        <div>
          {budgetLines.length === 0 && hasBaseline && <Empty icon={BarChart3} text="No budget lines — add lines in the Budget tab" />}
          {budgetLines.length === 0 && !hasBaseline && !hasScope && <Empty icon={BarChart3} text="No budget data yet" />}
          {jobControlGroups.length > 0 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 110px 110px 110px 110px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
                <span>Section</span>
                {!mobile && <><span style={{ textAlign: "right" }}>Budget</span><span style={{ textAlign: "right" }}>Committed</span><span style={{ textAlign: "right" }}>Actual</span></>}
                <span style={{ textAlign: "right" }}>Variance</span>
              </div>
              {jobControlGroups.map(grp => {
                const v = grp.budget - grp.actual;
                const isExp = jcExpanded === grp.sectionName;
                return (
                  <div key={grp.sectionName}>
                    <div onClick={() => setJcExpanded(isExp ? null : grp.sectionName)} style={{
                      display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 110px 110px 110px 110px", gap: _.s2,
                      padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center",
                      cursor: "pointer", transition: `background ${_.tr}`,
                      background: grp.sectionName === "Variations" ? `${_.amber}06` : "transparent",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = _.well}
                      onMouseLeave={e => e.currentTarget.style.background = grp.sectionName === "Variations" ? `${_.amber}06` : "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                        <span style={{ transform: isExp ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={12} color={_.muted} /></span>
                        <span style={{ fontWeight: _.fontWeight.semi, color: grp.sectionName === "Variations" ? _.amber : _.ink }}>{grp.sectionName}</span>
                        <span style={{ fontSize: _.fontSize.xs, color: _.muted }}>({grp.lines.length})</span>
                      </div>
                      {!mobile && (
                        <>
                          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{grp.budget > 0 ? fmt(grp.budget) : "—"}</span>
                          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: _.amber }}>{grp.committed > 0 ? fmt(grp.committed) : "—"}</span>
                          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{grp.actual > 0 ? fmt(grp.actual) : "—"}</span>
                        </>
                      )}
                      <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: grp.budget > 0 ? (v >= 0 ? _.green : _.red) : _.faint }}>
                        {grp.budget > 0 ? `${v >= 0 ? "+" : ""}${fmt(v)}` : "—"}
                      </span>
                    </div>
                    {isExp && (
                      <div style={{ padding: `${_.s3}px 0 ${_.s3}px ${_.s6}px`, borderBottom: `1px solid ${_.line}`, background: _.well }}>
                        {grp.lines.length > 0 && (
                          <div style={{ marginBottom: grp.commitItems.length > 0 || grp.actualItems.length > 0 ? _.s3 : 0 }}>
                            <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s1 }}>Budget Lines</div>
                            {grp.lines.map(b => {
                              const budgetCost = (b.budgetCost ?? b.budgetAmount) || 0;
                              const actualCost = (b.actualCost ?? b.actualAmount) || 0;
                              const lineVar = actualCost - budgetCost;
                              return (
                                <div key={b.id} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 90px 90px", gap: _.s2, fontSize: _.fontSize.sm, padding: "3px 0", alignItems: "center" }}>
                                  <div style={{ display: "flex", gap: _.s2, alignItems: "center" }}>
                                    <span>{b.costCode ? `[${b.costCode}] ` : ""}{b.label || b.description}</span>
                                    {b.source === "variation" && <span style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, padding: "0 5px", borderRadius: _.rFull, background: `${_.amber}14`, color: _.amber }}>VO</span>}
                                  </div>
                                  {!mobile && <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{fmt(budgetCost)}</span>}
                                  <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi, color: actualCost > 0 ? (lineVar <= 0 ? _.green : _.red) : _.faint }}>
                                    {actualCost > 0 ? `${lineVar >= 0 ? "+" : ""}${fmt(lineVar)}` : fmt(budgetCost)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {grp.commitItems.length > 0 && (
                          <div style={{ marginBottom: grp.actualItems.length > 0 ? _.s3 : 0 }}>
                            <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s1 }}>Commitments</div>
                            {grp.commitItems.map(c => (
                              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, padding: "2px 0" }}>
                                <span>{c.vendorName || c.vendor || "—"} — {c.description}</span>
                                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi, color: _.amber }}>{fmt(c.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {grp.actualItems.length > 0 && (
                          <div>
                            <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s1 }}>Actuals</div>
                            {grp.actualItems.map(a => (
                              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, padding: "2px 0" }}>
                                <span>{a.description}</span>
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
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 110px 110px 110px 110px", gap: _.s2, padding: `${_.s3}px 0`, fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold }}>
                <span>Total</span>
                {!mobile && (
                  <>
                    <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(T.budgetTotal)}</span>
                    <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: _.amber }}>{fmt(T.committedTotal)}</span>
                    <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(T.combinedActuals)}</span>
                  </>
                )}
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: variance <= 0 ? _.green : _.red }}>{variance >= 0 ? "+" : ""}{fmt(variance)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ TRADE BREAKDOWN ═══ */}
      {tab === "Trade Breakdown" && (
        <div>
          {tradeBreakdown.length === 0 ? (
            <Empty icon={BarChart3} text="Add budget lines to see trade breakdown" />
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "90px 1fr 100px 100px 100px 100px 90px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
                {!mobile && <span>Code</span>}
                <span>Trade</span>
                {!mobile && <><span style={{ textAlign: "right" }}>Budget</span><span style={{ textAlign: "right" }}>Committed</span><span style={{ textAlign: "right" }}>Actual</span><span style={{ textAlign: "right" }}>Variance</span></>}
                <span style={{ textAlign: "right" }}>% Complete</span>
              </div>
              {tradeBreakdown.map(row => {
                const v = row.actual - row.budget;
                const pctComplete = row.budget > 0 ? Math.min(100, Math.max(0, (row.actual / row.budget) * 100)) : 0;
                const isExpanded = expandedTrade === row.tradeId;
                return (
                  <div key={row.tradeId}>
                    <div onClick={() => setExpandedTrade(isExpanded ? null : row.tradeId)} style={{
                      display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "90px 1fr 100px 100px 100px 100px 90px", gap: _.s2,
                      padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center",
                      fontSize: _.fontSize.base, cursor: "pointer", transition: `background ${_.tr}`,
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = _.well}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {!mobile && <span style={{ color: _.muted }}>{row.budgetItems.find(b => b.costCode)?.costCode || "—"}</span>}
                      <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                        <span style={{ transform: isExpanded ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={12} color={_.muted} /></span>
                        <span style={{ fontWeight: _.fontWeight.semi, color: _.ink }}>{tradeName(row.tradeId === "_none" ? null : row.tradeId)}</span>
                      </div>
                      {!mobile && (
                        <>
                          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.budget > 0 ? fmt(row.budget) : "—"}</span>
                          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: _.amber }}>{row.committed > 0 ? fmt(row.committed) : "—"}</span>
                          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.actual > 0 ? fmt(row.actual) : "—"}</span>
                          <span style={{ textAlign: "right", fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums", color: v <= 0 ? _.green : _.red }}>{v >= 0 ? "+" : ""}{fmt(v)}</span>
                        </>
                      )}
                      <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: row.budget > 0 ? (v <= 0 ? _.green : _.red) : _.faint }}>
                        {row.budget > 0 ? `${pctComplete.toFixed(0)}%` : "—"}
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
                                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{fmt(b.budgetCost ?? b.budgetAmount ?? 0)}</span>
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
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: variance <= 0 ? _.green : _.red }}>{variance >= 0 ? "+" : ""}{fmt(variance)}</span>
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
                const v = row.actual - row.budget;
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
                      <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: row.budget > 0 ? (v <= 0 ? _.green : _.red) : _.faint }}>
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
                                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{fmt(b.budgetCost ?? b.budgetAmount ?? 0)}</span>
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
          {/* Cost Allowances Panel */}
          <div style={{ marginBottom: _.s6, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s4 }}>Cost Allowances</div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)", gap: _.s3 }}>
              {[
                { key: "margin", label: "Margin" },
                { key: "contingency", label: "Contingency" },
                { key: "siteOverhead", label: "Site Overhead" },
                { key: "officeOverhead", label: "Office Overhead" },
              ].map(({ key, label: lbl }) => {
                const ca = (p.costAllowances || {})[key] || { pct: 0, amount: 0, locked: false };
                return (
                  <Card key={key} style={{ padding: _.s3 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s2 }}>
                      <span style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, color: _.ink }}>{lbl}</span>
                      <div
                        onClick={() => {
                          up(pr => {
                            if (!pr.costAllowances) pr.costAllowances = { margin: { pct: 0, amount: 0, locked: false }, contingency: { pct: 0, amount: 0, locked: false }, siteOverhead: { pct: 0, amount: 0, locked: false }, officeOverhead: { pct: 0, amount: 0, locked: false } };
                            pr.costAllowances[key].locked = !pr.costAllowances[key].locked;
                            return pr;
                          });
                        }}
                        style={{ cursor: "pointer", color: ca.locked ? _.ac : _.faint, display: "flex", alignItems: "center" }}
                        title={ca.locked ? "Locked — amount won't recalculate" : "Unlocked — recalculates from %"}
                      >
                        {ca.locked ? <Lock size={12} /> : <Unlock size={12} />}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: _.s2, alignItems: "center" }}>
                      <input
                        type="number"
                        style={{ ...input, width: 60, textAlign: "right", padding: "3px 6px", fontSize: _.fontSize.sm }}
                        value={ca.pct || ""}
                        placeholder="0"
                        onChange={e => {
                          const pct = parseFloat(e.target.value) || 0;
                          up(pr => {
                            if (!pr.costAllowances) pr.costAllowances = { margin: { pct: 0, amount: 0, locked: false }, contingency: { pct: 0, amount: 0, locked: false }, siteOverhead: { pct: 0, amount: 0, locked: false }, officeOverhead: { pct: 0, amount: 0, locked: false } };
                            pr.costAllowances[key].pct = pct;
                            if (!pr.costAllowances[key].locked) {
                              const baseline = baselineBudgetTotal(pr.budget || []);
                              pr.costAllowances[key].amount = Math.round(baseline * (pct / 100) * 100) / 100;
                            }
                            // Sync margin/contingency back to quote-level fields
                            if (key === "margin") pr.marginPct = pct;
                            if (key === "contingency") pr.contingencyPct = pct;
                            return pr;
                          });
                        }}
                      />
                      <span style={{ fontSize: _.fontSize.sm, color: _.muted }}>%</span>
                      <input
                        type="number"
                        style={{ ...input, flex: 1, textAlign: "right", padding: "3px 6px", fontSize: _.fontSize.sm }}
                        value={ca.amount || ""}
                        placeholder="0"
                        onChange={e => {
                          const amt = parseFloat(e.target.value) || 0;
                          up(pr => {
                            if (!pr.costAllowances) pr.costAllowances = { margin: { pct: 0, amount: 0, locked: false }, contingency: { pct: 0, amount: 0, locked: false }, siteOverhead: { pct: 0, amount: 0, locked: false }, officeOverhead: { pct: 0, amount: 0, locked: false } };
                            pr.costAllowances[key].amount = amt;
                            const baseline = baselineBudgetTotal(pr.budget || []);
                            if (baseline > 0) {
                              const derivedPct = Math.round((amt / baseline) * 100 * 100) / 100;
                              pr.costAllowances[key].pct = derivedPct;
                              // Sync margin/contingency back to quote-level fields
                              if (key === "margin") pr.marginPct = derivedPct;
                              if (key === "contingency") pr.contingencyPct = derivedPct;
                            }
                            return pr;
                          });
                        }}
                      />
                    </div>
                    <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginTop: _.s1, textAlign: "right" }}>{fmt(ca.amount || 0)}</div>
                  </Card>
                );
              })}
            </div>
            {T.allowancesAmt > 0 && (
              <div style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, color: _.ink, textAlign: "right", marginTop: _.s3 }}>
                Total Allowances: {fmt(T.allowancesAmt)}
              </div>
            )}
          </div>

          <div style={{ marginBottom: _.s6, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s4 }}>Add Budget Line</div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 80px 1fr 1fr 140px", gap: `${_.s3}px ${_.s4}px`, alignItems: mobile ? "stretch" : "end", marginBottom: _.s3 }}>
              <TradeSelect value={budgetForm.tradeId} onChange={v => setBudgetForm({ ...budgetForm, tradeId: v })} trades={trades} />
              <div><label style={label}>Code</label><input style={input} value={budgetForm.costCode} onChange={e => setBudgetForm({ ...budgetForm, costCode: e.target.value })} placeholder="01" /></div>
              <div><label style={label}>Section</label><input style={input} value={budgetForm.sectionName} onChange={e => setBudgetForm({ ...budgetForm, sectionName: e.target.value })} placeholder="Concrete & Slab" /></div>
              <div><label style={label}>Label *</label><input style={input} value={budgetForm.labelText} onChange={e => setBudgetForm({ ...budgetForm, labelText: e.target.value })} placeholder="Concrete works" /></div>
              <div><label style={label}>Amount *</label><input type="number" style={input} value={budgetForm.budgetAmount} onChange={e => setBudgetForm({ ...budgetForm, budgetAmount: e.target.value })} placeholder="50000" /></div>
            </div>
            <Button onClick={addBudgetLine} icon={Plus}>Add budget line</Button>
          </div>
          {/* Import toolbar */}
          {hasScope && (
            <div style={{ display: "flex", gap: _.s2, marginBottom: _.s5, flexWrap: "wrap" }}>
              <Button icon={Upload} variant="secondary" size="sm" onClick={importMissing}>Import missing lines</Button>
              <Button icon={Download} variant="ghost" size="sm" onClick={() => setReplaceModal(true)}>Replace all from quote</Button>
            </div>
          )}
          {budgetLines.length === 0 ? (
            <Empty icon={BarChart3} text="No budget lines yet" />
          ) : (
            <>
              {/* Section group headers */}
              {budgetGroups.map(grp => {
                const isExp = expandedGroup === grp.sectionName;
                return (
                  <div key={grp.sectionName} style={{ marginBottom: 1 }}>
                    {/* Group header */}
                    <div
                      onClick={() => setExpandedGroup(isExp ? null : grp.sectionName)}
                      style={{
                        display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 80px 80px", gap: _.s2,
                        padding: `${_.s3}px ${_.s2}px`, cursor: "pointer",
                        background: grp.sectionName === "Variations" ? `${_.amber}0a` : _.well,
                        borderBottom: `1px solid ${_.line}`, borderRadius: isExp ? `${_.rSm}px ${_.rSm}px 0 0` : _.rSm,
                        alignItems: "center", transition: `background ${_.tr}`,
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                        <span style={{ transform: isExp ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={12} color={_.muted} /></span>
                        <span style={{ fontWeight: _.fontWeight.semi, color: grp.sectionName === "Variations" ? _.amber : _.ink }}>{grp.sectionName}</span>
                        <span style={{ fontSize: _.fontSize.xs, color: _.muted }}>({grp.lines.length})</span>
                      </div>
                      {!mobile && <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.bold, fontSize: _.fontSize.sm }}>{fmt(grp.total)}</span>}
                      <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.bold, fontSize: _.fontSize.sm }}>{fmt(grp.total)}</span>
                    </div>

                    {/* Expanded lines */}
                    {isExp && (
                      <div style={{ borderLeft: `2px solid ${_.line}`, borderRight: `1px solid ${_.line}`, borderBottom: `1px solid ${_.line}`, borderRadius: `0 0 ${_.rSm}px ${_.rSm}px`, marginBottom: _.s2 }}>
                        {/* Column header */}
                        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 90px 30px" : "60px 1fr 120px 100px 100px 30px", gap: _.s2, padding: `${_.s2}px ${_.s3}px`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", borderBottom: `1px solid ${_.line}` }}>
                          {!mobile && <span>Code</span>}
                          <span>Label</span>
                          {!mobile && <span style={{ textAlign: "right" }}>Budget Cost</span>}
                          {!mobile && <span style={{ textAlign: "right" }}>Actual Cost</span>}
                          <span style={{ textAlign: "right" }}>{mobile ? "Amt" : "Variance"}</span>
                          <span></span>
                        </div>
                        {grp.lines.map(b => {
                          const i = b._idx;
                          const budgetCost = (b.budgetCost ?? b.budgetAmount) || 0;
                          const actualCost = (b.actualCost ?? b.actualAmount) || 0;
                          const lineVar = actualCost - budgetCost;
                          const srcTag = b.source === "quote_import" ? { text: "Quote", color: _.muted }
                            : b.source === "variation" ? { text: "VO", color: _.amber }
                            : null;
                          const isEditing = editingLine === b.id;
                          return (
                            <div key={b.id || i}>
                            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 90px 30px" : "60px 1fr 120px 100px 100px 30px", gap: _.s2, padding: `${_.s3}px ${_.s3}px`, borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: _.fontSize.base }}>
                              {!mobile && (
                                isEditing ? (
                                  <input style={{ ...input, padding: "2px 4px", fontSize: _.fontSize.sm }} value={editValues.costCode ?? b.costCode ?? ""} onChange={e => setEditValues({ ...editValues, costCode: e.target.value })} onKeyDown={e => { if (e.key === "Enter") saveInlineEdit(i); if (e.key === "Escape") { setEditingLine(null); setEditValues({}); } }} />
                                ) : (
                                  <span style={{ color: _.muted, fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi, cursor: "pointer" }} onClick={() => { setEditingLine(b.id); setEditValues({ costCode: b.costCode || "", label: b.label || b.description || "", budgetAmount: budgetCost || 0 }); }}>{b.costCode || "—"}</span>
                                )
                              )}
                              <div style={{ display: "flex", alignItems: "center", gap: _.s2, minWidth: 0 }}>
                                {isEditing ? (
                                  <input style={{ ...input, flex: 1, padding: "2px 4px", fontSize: _.fontSize.sm }} value={editValues.label ?? (b.label || b.description || "")} onChange={e => setEditValues({ ...editValues, label: e.target.value })} onKeyDown={e => { if (e.key === "Enter") saveInlineEdit(i); if (e.key === "Escape") { setEditingLine(null); setEditValues({}); } }} autoFocus />
                                ) : (
                                  <span style={{ fontWeight: _.fontWeight.medium, color: _.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }} onClick={() => { setEditingLine(b.id); setEditValues({ costCode: b.costCode || "", label: b.label || b.description || "", budgetAmount: budgetCost || 0 }); }}>{b.label || b.description}</span>
                                )}
                                {!isEditing && srcTag && <span onClick={b.linkedVariationId ? (e) => { e.stopPropagation(); navigate(`../variations/${b.linkedVariationId}`); } : undefined} style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, padding: "1px 6px", borderRadius: _.rFull, background: `${srcTag.color}14`, color: srcTag.color, flexShrink: 0, cursor: b.linkedVariationId ? "pointer" : "default" }}>{srcTag.text}</span>}
                              </div>
                              {!mobile && (
                                isEditing ? (
                                  <input type="number" style={{ ...input, textAlign: "right", padding: "2px 4px", fontSize: _.fontSize.sm }} value={editValues.budgetAmount ?? budgetCost ?? ""} onChange={e => setEditValues({ ...editValues, budgetAmount: e.target.value })} onKeyDown={e => { if (e.key === "Enter") saveInlineEdit(i); if (e.key === "Escape") { setEditingLine(null); setEditValues({}); } }} />
                                ) : (
                                  <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", cursor: "pointer" }} onClick={() => { setEditingLine(b.id); setEditValues({ costCode: b.costCode || "", label: b.label || b.description || "", budgetAmount: budgetCost || 0 }); }}>{fmt(budgetCost)}</span>
                                )
                              )}
                              {!mobile && (
                                <input
                                  style={{ width: "100%", padding: "3px 6px", background: _.well, border: `1px solid ${_.line}`, borderRadius: 5, color: _.ink, fontSize: _.fontSize.sm, textAlign: "right", outline: "none" }}
                                  placeholder="0"
                                  defaultValue={b.actualPct != null ? `${b.actualPct}%` : (actualCost || "")}
                                  onBlur={e => updateBudgetActual(i, e.target.value)}
                                  onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
                                />
                              )}
                              <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", fontSize: _.fontSize.sm, color: actualCost > 0 ? (lineVar <= 0 ? _.green : _.red) : _.faint }}>
                                {actualCost > 0 ? `${lineVar >= 0 ? "+" : ""}${fmt(lineVar)}` : (mobile ? fmt(budgetCost) : "—")}
                              </span>
                              <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                                <div onClick={() => setAllocExpanded(allocExpanded === b.id ? null : b.id)} style={{ cursor: "pointer", color: (b.allocations || []).length > 0 ? _.ac : _.faint, display: "flex", transition: `color ${_.tr}` }} title="Split across trades"><Split size={12} /></div>
                                <div onClick={() => setDeleteModal({ type: "budget", idx: i })} style={{ cursor: "pointer", color: _.faint, display: "flex", transition: `color ${_.tr}` }} onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                              </div>
                            </div>
                            {/* Allocation sub-rows */}
                            {allocExpanded === b.id && (() => {
                              const allocs = b.allocations || [];
                              const v = validateAllocations(b);
                              return (
                                <div style={{ padding: `${_.s2}px ${_.s3}px ${_.s2}px ${_.s6}px`, background: `${_.ac}06`, borderBottom: `1px solid ${_.line}` }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s2 }}>
                                    <span style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, textTransform: "uppercase", letterSpacing: _.letterSpacing.wide }}>Allocations</span>
                                    <div style={{ display: "flex", gap: _.s2, alignItems: "center" }}>
                                      {allocs.length > 1 && (
                                        <span onClick={() => { up(pr => { const line = pr.budget[i]; line.allocations = autoSplitAllocations(line); return pr; }); }} style={{ fontSize: _.fontSize.xs, color: _.ac, cursor: "pointer", fontWeight: _.fontWeight.semi }}>Auto-split</span>
                                      )}
                                      {allocs.length > 0 && !v.valid && (
                                        <span style={{ fontSize: _.fontSize.xs, color: _.red, fontWeight: _.fontWeight.semi }}>Off by {fmt(Math.abs(v.difference))}</span>
                                      )}
                                      {allocs.length > 0 && v.valid && (
                                        <span style={{ fontSize: _.fontSize.xs, color: _.green, fontWeight: _.fontWeight.semi }}>Balanced</span>
                                      )}
                                    </div>
                                  </div>
                                  {allocs.map((al, ai) => (
                                    <div key={ai} style={{ display: "flex", gap: _.s2, alignItems: "center", marginBottom: _.s1 }}>
                                      <select style={{ ...input, flex: 1, padding: "2px 4px", fontSize: _.fontSize.sm, cursor: "pointer" }} value={al.tradeId || ""} onChange={e => { up(pr => { const t = (trades || []).find(x => x.id === e.target.value); pr.budget[i].allocations[ai].tradeId = e.target.value; pr.budget[i].allocations[ai].tradeLabel = t ? (t.businessName || t.name || "") : ""; return pr; }); }}>
                                        <option value="">— Trade —</option>
                                        {(trades || []).map(t => <option key={t.id} value={t.id}>{t.businessName || t.name || t.id}</option>)}
                                      </select>
                                      <input type="number" style={{ ...input, width: 100, textAlign: "right", padding: "2px 4px", fontSize: _.fontSize.sm }} value={al.amount || ""} placeholder="0" onChange={e => { up(pr => { pr.budget[i].allocations[ai].amount = parseFloat(e.target.value) || 0; return pr; }); }} />
                                      <div onClick={() => { up(pr => { pr.budget[i].allocations[ai].locked = !pr.budget[i].allocations[ai].locked; return pr; }); }} style={{ cursor: "pointer", color: al.locked ? _.ac : _.faint, display: "flex" }} title={al.locked ? "Locked" : "Unlocked"}>{al.locked ? <Lock size={11} /> : <Unlock size={11} />}</div>
                                      <div onClick={() => { up(pr => { pr.budget[i].allocations.splice(ai, 1); if (pr.budget[i].allocations.length === 0) pr.budget[i].tradeId = ""; return pr; }); }} style={{ cursor: "pointer", color: _.faint, display: "flex" }}><Trash2 size={11} /></div>
                                    </div>
                                  ))}
                                  <div onClick={() => { up(pr => { if (!pr.budget[i].allocations) pr.budget[i].allocations = []; pr.budget[i].allocations.push(mkAllocation("", "", 0)); return pr; }); }} style={{ fontSize: _.fontSize.xs, color: _.ac, cursor: "pointer", fontWeight: _.fontWeight.semi, marginTop: _.s2, display: "inline-flex", alignItems: "center", gap: 3 }}><Plus size={10} /> Add trade</div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                        })}
                        {/* Quick-add row */}
                        <div style={{ display: "flex", gap: _.s2, padding: `${_.s2}px ${_.s3}px`, alignItems: "center", background: `${_.ac}04` }}>
                          <input style={{ ...input, flex: 1, padding: "3px 6px", fontSize: _.fontSize.sm }} placeholder="Description" value={quickAdd.description} onChange={e => setQuickAdd({ ...quickAdd, description: e.target.value })} onKeyDown={e => { if (e.key === "Enter") addQuickLine(grp.sectionName); }} />
                          <input type="number" style={{ ...input, width: 100, padding: "3px 6px", fontSize: _.fontSize.sm, textAlign: "right" }} placeholder="Amount" value={quickAdd.amount} onChange={e => setQuickAdd({ ...quickAdd, amount: e.target.value })} onKeyDown={e => { if (e.key === "Enter") addQuickLine(grp.sectionName); }} />
                          <div onClick={() => addQuickLine(grp.sectionName)} style={{ cursor: "pointer", color: _.ac, display: "flex", alignItems: "center" }} title="Add line"><Plus size={14} /></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "flex-end", padding: `${_.s3}px 0`, fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold }}>Total: {fmt(T.revisedBudget)}</div>
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
            {budgetLines.length > 0 && (
              <div style={{ marginBottom: _.s3 }}>
                <label style={label}>Link to budget line</label>
                <select style={{ ...input, cursor: "pointer", maxWidth: 360 }} value={commitForm.linkedBudgetLineId} onChange={e => setCommitForm({ ...commitForm, linkedBudgetLineId: e.target.value })}>
                  <option value="">— None —</option>
                  {budgetLines.map(b => <option key={b.id} value={b.id}>{b.sectionName ? `${b.sectionName} — ` : ""}{b.label || b.description} ({fmt((b.budgetCost ?? b.budgetAmount) || 0)})</option>)}
                </select>
              </div>
            )}
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
            {budgetLines.length > 0 && (
              <div style={{ marginBottom: _.s3 }}>
                <label style={label}>Link to budget line</label>
                <select style={{ ...input, cursor: "pointer", maxWidth: 360 }} value={actualForm.linkedBudgetLineId} onChange={e => setActualForm({ ...actualForm, linkedBudgetLineId: e.target.value })}>
                  <option value="">— None —</option>
                  {budgetLines.map(b => <option key={b.id} value={b.id}>{b.sectionName ? `${b.sectionName} — ` : ""}{b.label || b.description} ({fmt((b.budgetCost ?? b.budgetAmount) || 0)})</option>)}
                </select>
              </div>
            )}
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
          {(() => {
            const combined = T.combinedActuals != null ? T.combinedActuals : T.actualsTotal;
            const reportVariance = combined - T.revisedBudget;
            const kpis = [
              { label: "Contract Value", value: fmt(T.curr), color: _.ink },
              { label: "Sell Price Total", value: fmt(T.sellPriceTotal), color: T.sellPriceTotal > 0 ? _.ink : _.faint },
              { label: "Cost Budget", value: fmt(T.costBudget), color: T.costBudget > 0 ? _.ink : _.faint },
              { label: "Original Budget", value: fmt(T.baselineBudget), color: _.ink },
              { label: "Variation Budget", value: fmt(T.variationBudget), color: T.variationBudget > 0 ? _.amber : _.faint },
              { label: "Revised Budget", value: fmt(T.revisedBudget), color: _.ink },
              { label: "Allowances", value: fmt(T.allowancesAmt), color: T.allowancesAmt > 0 ? _.ink : _.faint },
              { label: "Committed", value: fmt(T.committedTotal), color: T.committedTotal > 0 ? _.amber : _.faint },
              { label: "Actual (combined)", value: fmt(combined), color: combined > 0 ? _.ac : _.faint },
              { label: "Forecast Cost", value: fmt(T.forecastCost), color: _.ink },
              { label: "Forecast Margin", value: fmt(T.forecastMarginNew), color: T.forecastMarginNew >= 0 ? _.green : _.red },
              { label: "Margin %", value: `${T.marginPctNew.toFixed(1)}%`, color: T.marginPctNew >= 0 ? _.green : _.red },
              { label: "Variance", value: `${reportVariance >= 0 ? "+" : ""}${fmt(reportVariance)}`, color: reportVariance <= 0 ? _.green : _.red },
            ];
            return (
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: _.s3, marginBottom: _.s6 }}>
                {kpis.map(k => (
                  <Card key={k.label} style={{ padding: mobile ? _.s3 : _.s4 }}>
                    <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>{k.label}</div>
                    <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: k.color }}>{k.value}</div>
                  </Card>
                ))}
              </div>
            );
          })()}

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

      {/* Replace budget confirmation modal */}
      <Modal open={replaceModal} onClose={() => setReplaceModal(false)} title="Replace Budget" width={440}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, lineHeight: _.lineHeight.body, marginBottom: _.s6 }}>
          This will <strong>replace all existing budget lines</strong> with a fresh import from the quote scope. Manual lines and variation lines will be removed.
        </div>
        <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setReplaceModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={replaceFromQuote}>Replace all</Button>
        </div>
      </Modal>
    </Section>
  );
}
