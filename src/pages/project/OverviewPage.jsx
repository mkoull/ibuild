import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName, ds } from "../../theme/styles.js";
import { getNextActions } from "../../lib/nextActions.js";
import { getNextStepForProject } from "../../lib/nextStep.js";
import { canTransition, isJob, isQuote, normaliseStage } from "../../lib/lifecycle.js";
import { snapshotFromQuote, importSectionLevel, importItemLevel, recalcAllowances, baselineBudgetTotal, createBudgetBaseline } from "../../lib/budgetEngine.js";
import { applyConvertToJobBaseline } from "../../lib/costEngine.js";
import StagePipeline from "../../components/ui/StagePipeline.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import PageHero from "../../components/ui/PageHero.jsx";
import { ArrowRight, Pencil, TrendingUp, Calendar, DollarSign, ChevronRight, Receipt } from "lucide-react";

const kpiLabel = {
  fontSize: _.fontSize.xs,
  fontWeight: _.fontWeight.semi,
  color: _.muted,
  letterSpacing: _.letterSpacing.wide,
  textTransform: "uppercase",
  marginBottom: _.s2,
};

const kpiValue = {
  fontSize: _.fontSize.xl,
  fontWeight: _.fontWeight.bold,
  fontVariantNumeric: "tabular-nums",
  color: _.ink,
};

export default function OverviewPage() {
  const { project: p, update: up, T, log, transitionStage } = useProject();
  const { clients, mobile, notify } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Convert modal state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [importMode, setImportMode] = useState("section");
  const [mergeMode, setMergeMode] = useState("replace");
  const [importSchedule, setImportSchedule] = useState(true);
  const [lockQuoteOnConvert, setLockQuoteOnConvert] = useState(true);
  const [allowQuoteEditsAfterConvert, setAllowQuoteEditsAfterConvert] = useState(false);
  const [pendingReturnPath, setPendingReturnPath] = useState("");

  // Open modal from URL param (e.g. from JobModuleGate redirect)
  useEffect(() => {
    if (searchParams.get("action") === "convert") {
      const requestedReturn = (searchParams.get("return") || "").trim();
      setPendingReturnPath(/^[a-z0-9-]+$/i.test(requestedReturn) ? requestedReturn : ""); // eslint-disable-line react-hooks/set-state-in-effect -- parse URL params on mount
      setSearchParams({}, { replace: true });
      // Only open convert modal if project is at a quote stage
      const s = normaliseStage(p.stage || p.status);
      if (isQuote(s)) {
        setShowConvertModal(true);
      }
    }
  }, [searchParams, setSearchParams, p.stage, p.status]);

  const stage = p.stage || p.status;
  const stageIsJob = isJob(stage);
  const scheduleTasks = p?.schedule && typeof p.schedule === "object" && !Array.isArray(p.schedule)
    ? (p.schedule.tasks || [])
    : (p.schedule || []);
  const msDone = scheduleTasks.filter((m) => m.status === "complete" || m.done).length;
  const nextMs = scheduleTasks.find((m) => (m.status ? m.status !== "complete" : !m.done));

  // ─── Deterministic primary CTA ───
  const step = getNextStepForProject(p, T);

  const handleConvertConfirm = () => {
    // Guard: only convert from a quote stage
    const s = normaliseStage(p.stage || p.status);
    if (!isQuote(s)) {
      setShowConvertModal(false);
      setPendingReturnPath("");
      return;
    }
    let converted = false;
    up(pr => {
      converted = applyConvertToJobBaseline(pr);
      return pr;
    });
    if (!converted) {
      notify("Already converted to job.");
      setShowConvertModal(false);
      return;
    }
    up(pr => {
      pr.lockedQuote = lockQuoteOnConvert && !allowQuoteEditsAfterConvert;
      pr.allowQuoteEditsAfterConversion = !!allowQuoteEditsAfterConvert;
      if (!pr.jobMeta) pr.jobMeta = {};
      pr.jobMeta.convertedFromQuoteAt = Date.now();
      return pr;
    });
    if (importMode !== "skip") {
      up(pr => {
        pr.quoteSnapshotBudget = snapshotFromQuote(pr);
        const lines = importMode === "item" ? importItemLevel(pr) : importSectionLevel(pr);
        const working = Array.isArray(pr.workingBudget) ? pr.workingBudget : (Array.isArray(pr.budget) ? pr.budget : []);
        if (mergeMode === "replace" || working.length === 0) {
          pr.workingBudget = lines;
        } else {
          pr.workingBudget = [...working, ...lines];
        }
        // Keep legacy alias stable for existing consumers.
        pr.budget = pr.workingBudget;
        // Create immutable budget baseline snapshot
        pr.budgetBaseline = createBudgetBaseline(pr);
        // Recalc cost allowance amounts from baseline total
        if (pr.costAllowances) {
          const baseline = baselineBudgetTotal(pr.workingBudget);
          pr.costAllowances = recalcAllowances(pr.costAllowances, baseline);
        }
        // Log baseline creation
        if (!Array.isArray(pr.activity)) pr.activity = [];
        pr.activity.unshift({
          type: "budget_baseline_created",
          action: `Budget baseline created (${importMode}-level, ${pr.workingBudget.length} lines)`,
          time: new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }),
          date: new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }),
          at: Date.now(),
        });
        return pr;
      });
      log(`Budget imported from quote (${importMode}-level)`);
    }
    if (importSchedule) {
      up(pr => {
        if (!Array.isArray(pr.schedule)) pr.schedule = [];
        const hasTasks = pr.schedule.length > 0;
        if (hasTasks) return pr;
        const categories = Object.entries(pr.scope || {})
          .filter(([, items]) => Array.isArray(items) && items.some(i => i.on))
          .map(([cat]) => cat);
        let offset = 0;
        categories.forEach((cat, i) => {
          offset += 14;
          pr.schedule.push({
            id: `MS-${Date.now()}-${i}`,
            name: cat,
            durationDays: 14,
            offsetDays: offset,
            dependsOn: [],
            tradeId: null,
            freeTextTrade: "",
            status: "not_started",
            percentComplete: 0,
            manuallyPinned: false,
            pinnedStart: "",
            pinnedFinish: "",
            plannedStart: "",
            plannedFinish: "",
            order: i,
          });
        });
        return pr;
      });
      log("Schedule imported from quote scope");
    }
    setShowConvertModal(false);
    notify("Converted to Job");
    if (pendingReturnPath) {
      navigate(`/projects/${p.id}/${pendingReturnPath}`);
      setPendingReturnPath("");
    } else {
      navigate(`/projects/${p.id}/overview`);
    }
  };

  const handlePrimary = () => {
    if (!step) return;
    if (step.actionId === "convert_to_job") {
      setShowConvertModal(true);
    } else if (step.actionId === "start_job" && canTransition(stage, "Active")) {
      transitionStage("Active");
    } else if (step.actionId === "complete_build" && canTransition(stage, "Complete")) {
      transitionStage("Complete");
    } else if (step.actionId === "send_quote" && canTransition(stage, "Quoted")) {
      transitionStage("Quoted");
      log("Quote sent to client");
    } else if (step.route) {
      navigate(`../${step.route}`);
    }
  };

  // ─── Secondary actions (primary filtered out) ───
  const secondaryActions = getNextActions({
    project: p,
    totals: T,
    primaryRoute: step?.route || null,
    primaryReason: step?.reason || null,
  });

  // Health snapshot values
  const budgetVariance = T.sub > 0 ? ((T.act / T.sub) * 100).toFixed(0) : 0;
  const schedPct = scheduleTasks.length > 0 ? Math.round((msDone / scheduleTasks.length) * 100) : 0;
  const collPct = T.curr > 0 ? Math.round((T.paid / T.curr) * 100) : 0;

  const nextClaim = (p.paymentSchedule || []).find(c => c.status === "Planned") || null;

  const recentActivity = (p.activity || []).slice(0, 8);
  const baselineDate = p?.job?.baseline?.createdAt || p?.convertedAt || null;
  const contractDisplay = stageIsJob
    ? (p?.job?.contract?.currentContractValue ?? T.curr)
    : T.curr;
  const baseContract = Number(p?.job?.contract?.baseContractValue || 0);
  const approvedVariationValue = Number(p?.job?.contract?.approvedVariationsValue || 0);
  const budgetCost = Number(p?.job?.budget?.totals?.totalCost || T.budgetTotal || 0);
  const contractMarginValue = stageIsJob ? (contractDisplay - budgetCost) : (T.curr - T.sub);
  const contractMarginPct = contractDisplay > 0 ? (contractMarginValue / contractDisplay) * 100 : 0;
  const pendingVariationValue = (p.variations || [])
    .filter((v) => {
      const s = String(v.status || "").toLowerCase();
      return s === "sent" || s === "pending";
    })
    .reduce((t, v) => t + (Number(v.sellImpact) || 0), 0);
  const budgetFromJobCategories = (p?.job?.budget?.categories || []).reduce((sum, cat) => {
    return sum + (cat.items || []).reduce((s, item) => s + (Number(item.costTotal) || 0), 0);
  }, 0);
  const budgetValue = budgetFromJobCategories > 0
    ? budgetFromJobCategories
    : Number(p?.job?.budget?.totals?.totalCost || T.budgetTotal || 0);
  const actualCostValue = (p.workingBudget || p.budget || []).reduce((sum, line) => {
    return sum + (Number(line.actualCost ?? line.actualAmount) || 0);
  }, 0);
  const remainingBudgetValue = budgetValue - actualCostValue;
  const projectedMarginValue = contractDisplay - actualCostValue;
  const totalClaimed = Number((p.claims || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0));
  const totalPaid = Number((p.invoices || [])
    .filter((inv) => String(inv.status || "").toLowerCase() === "paid")
    .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0));
  const outstandingReceivables = totalClaimed - totalPaid;
  const remainingToClaim = contractDisplay - totalClaimed;
  const claimProgressPct = contractDisplay > 0 ? Math.min(100, Math.max(0, (totalClaimed / contractDisplay) * 100)) : 0;
  const budgetProgressPct = budgetValue > 0 ? Math.min(100, Math.max(0, (actualCostValue / budgetValue) * 100)) : 0;
  const budgetHealth = (() => {
    if (budgetValue <= 0) return { label: "No budget", color: _.muted };
    if (actualCostValue > budgetValue) return { label: "Over budget", color: _.red };
    if (actualCostValue >= budgetValue * 0.95) return { label: "Within 5%", color: _.amber };
    return { label: "Under budget", color: _.green };
  })();
  const upcomingTasks = [...scheduleTasks]
    .filter((task) => task.startDate && String(task.status || "").toLowerCase() !== "complete")
    .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
    .slice(0, 3);
  const quickActions = [
    { label: "Add Variation", to: "../variations" },
    { label: "Create Purchase Order", to: "../procurement" },
    { label: "Record Bill", to: "../bills" },
    { label: "Add Diary Entry", to: "../site-diary" },
    { label: "Create Invoice", to: "../invoices" },
  ];

  return (
    <div style={{ animation: "fadeUp 0.2s ease", maxWidth: 1200 }}>
      {/* HERO */}
      <div style={{ marginBottom: mobile ? _.s7 : _.s9 }}>
        <PageHero
          icon={TrendingUp}
          title={pName(p, clients) === "New Project" ? "Overview" : pName(p, clients)}
          subtitle={`${stage} · ${p.buildType || p.type}${p.floorArea || p.area ? ` · ${p.floorArea || p.area}m²` : ""} · ${ds()}`}
          actions={(
            <Button variant="ghost" size="sm" onClick={() => navigate("../quote?step=details")} icon={Pencil}>
              Edit details
            </Button>
          )}
          style={{ marginBottom: mobile ? _.s6 : _.s8 }}
        />

        {/* Contract Value */}
        <div style={{ marginBottom: _.s7 }}>
          <div style={{ fontSize: _.fontSize.caption, color: _.body, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s3 }}>Contract Value</div>
          <div style={{ fontSize: mobile ? _.fontSize.stat : _.fontSize.display, fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: T.curr > 0 ? _.ink : _.faint }}>
            {fmt(contractDisplay)}
          </div>
          {stageIsJob && baselineDate && (
            <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: _.s2 }}>
              Baseline locked on {new Date(baselineDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          )}
          {stageIsJob && T.aV !== 0 && (
            <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: _.s2 }}>
              Base {fmt(T.orig)} + {T.aVCount} variation{T.aVCount !== 1 ? "s" : ""} {fmt(T.aV)}
            </div>
          )}
        </div>

        {/* Stage pipeline */}
        <StagePipeline currentStage={stage} />

        {/* Single primary CTA */}
        {step && (
          <div style={{ marginTop: _.s6 }}>
            <Button onClick={handlePrimary} icon={ArrowRight}>{step.label}</Button>
            {step.description && (
              <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: _.s2 }}>{step.description}</div>
            )}
          </div>
        )}
        {stage === "Complete" && !step && <div style={{ marginTop: _.s6, fontSize: _.fontSize.base, color: _.green, fontWeight: _.fontWeight.medium }}>Project complete</div>}
      </div>

      {/* ─── Job Command Centre ─── */}
      {stageIsJob ? (
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "2fr 1fr", gap: mobile ? _.s4 : _.s6, marginBottom: _.s8 }}>
        <div style={{ display: "grid", gap: _.s4 }}>
          {/* A) Job Health Cards */}
          <div>
            <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3 }}>Job Health</div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: _.s3 }}>
              <Card style={{ padding: mobile ? _.s3 : _.s4 }} icon={DollarSign} accent>
                <div style={kpiLabel}>Contract Value</div>
                <div style={kpiValue}>{contractDisplay > 0 ? fmt(contractDisplay) : "—"}</div>
              </Card>
              <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
                <div style={kpiLabel}>Budget</div>
                <div style={kpiValue}>{budgetValue > 0 ? fmt(budgetValue) : "—"}</div>
              </Card>
              <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
                <div style={kpiLabel}>Actual Cost</div>
                <div style={kpiValue}>{actualCostValue > 0 ? fmt(actualCostValue) : "—"}</div>
              </Card>
              <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
                <div style={kpiLabel}>Remaining Budget</div>
                <div style={{ ...kpiValue, color: remainingBudgetValue >= 0 ? _.green : _.red }}>
                  {budgetValue > 0 ? fmt(remainingBudgetValue) : "—"}
                </div>
              </Card>
              <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
                <div style={kpiLabel}>Projected Margin</div>
                <div style={{ ...kpiValue, color: projectedMarginValue >= 0 ? _.green : _.red }}>
                  {fmt(projectedMarginValue)}
                </div>
              </Card>
            </div>
            <div style={{ marginTop: _.s3, padding: `${_.s2}px ${_.s3}px`, borderRadius: _.rSm, border: `1px solid ${budgetHealth.color}33`, background: `${budgetHealth.color}10`, fontSize: _.fontSize.sm, color: _.body }}>
              <strong style={{ color: budgetHealth.color }}>Project Health:</strong> {budgetHealth.label}
              <span style={{ color: _.muted }}> · {budgetValue > 0 ? `${budgetProgressPct.toFixed(1)}% of budget used` : "Set budget to track health"}</span>
            </div>
          </div>

          {/* B) Job Stage Progress */}
          <div>
            <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3 }}>Job Stage Progress</div>
            <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
              <StagePipeline currentStage={stage} />
            </Card>
          </div>

          {/* C) Financial Status */}
          <div>
            <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3 }}>Financial Status</div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: _.s3 }}>
              <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
                <div style={kpiLabel}>Total Claimed</div>
                <div style={kpiValue}>{totalClaimed > 0 ? fmt(totalClaimed) : "—"}</div>
              </Card>
              <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
                <div style={kpiLabel}>Total Paid</div>
                <div style={{ ...kpiValue, color: totalPaid > 0 ? _.green : _.ink }}>{totalPaid > 0 ? fmt(totalPaid) : "—"}</div>
              </Card>
              <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
                <div style={kpiLabel}>Outstanding Receivables</div>
                <div style={{ ...kpiValue, color: outstandingReceivables > 0 ? _.red : _.green }}>{fmt(outstandingReceivables)}</div>
              </Card>
            </div>
            <div style={{ height: 6, background: _.well, borderRadius: 3, overflow: "hidden", marginTop: _.s3 }}>
              <div style={{ height: "100%", width: `${claimProgressPct}%`, background: _.ac, borderRadius: 3, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, marginTop: _.s1 }}>
              Claimed {claimProgressPct.toFixed(1)}% of contract • Remaining to claim {fmt(remainingToClaim)}
            </div>
          </div>
        </div>

        {/* D + E */}
        <div style={{ display: "grid", gap: _.s4, alignContent: "start" }}>
          <div>
            <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3 }}>Timeline Snapshot</div>
            <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
              {upcomingTasks.length === 0 ? (
                <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>
                  No upcoming tasks yet. Add schedule tasks to see the next 3 activities here.
                </div>
              ) : (
                <div style={{ display: "grid", gap: _.s2 }}>
                  {upcomingTasks.map((task) => (
                    <div key={task.id} style={{ display: "flex", justifyContent: "space-between", gap: _.s2, borderBottom: `1px solid ${_.line}`, paddingBottom: _.s2 }}>
                      <div>
                        <div style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium, color: _.ink }}>{task.name || "Untitled task"}</div>
                        <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{task.trade || "Unassigned trade"}</div>
                      </div>
                      <div style={{ fontSize: _.fontSize.sm, color: _.body, fontVariantNumeric: "tabular-nums" }}>
                        {task.startDate || "No date"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div>
            <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3 }}>Quick Actions</div>
            <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
              <div style={{ display: "grid", gap: _.s2 }}>
                {quickActions.map((action) => (
                  <Button key={action.label} variant="secondary" onClick={() => navigate(action.to)}>
                    {action.label}
                  </Button>
                ))}
              </div>
              <div style={{ marginTop: _.s3, fontSize: _.fontSize.caption, color: _.muted }}>
                Jump straight to common project actions from one place.
              </div>
            </Card>
          </div>
        </div>
      </div>
      ) : (
        <Card style={{ padding: mobile ? _.s4 : _.s5, marginBottom: _.s8 }}>
          <div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s2 }}>
            Job Command Centre unlocks after conversion
          </div>
          <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginBottom: _.s4 }}>
            Convert this quote to a job to view live budget, cost, receivables, schedule snapshot, and quick delivery actions.
          </div>
          <Button onClick={() => setShowConvertModal(true)}>Convert to Job</Button>
        </Card>
      )}

      {/* Supporting snapshot + actions */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: mobile ? _.s3 : _.s4, marginBottom: mobile ? _.s6 : _.s8 }}>
        <Card style={{ padding: mobile ? _.s4 : _.s5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: _.s2, marginBottom: _.s3 }}>
            <TrendingUp size={14} color={_.ac} />
            <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>Budget vs Actual</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s2 }}>
            <span style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(T.act)}</span>
            <span style={{ fontSize: _.fontSize.sm, color: _.muted }}>of {fmt(T.sub)}</span>
          </div>
          <div style={{ height: 6, background: _.well, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, budgetVariance)}%`, background: budgetVariance > 100 ? _.red : _.green, borderRadius: 3, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: _.fontSize.caption, color: budgetVariance > 100 ? _.red : _.green, fontWeight: _.fontWeight.semi, marginTop: _.s1 }}>
            {budgetVariance > 0 ? `${budgetVariance}% spent` : "No costs logged"}
          </div>
        </Card>

        <Card style={{ padding: mobile ? _.s4 : _.s5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: _.s2, marginBottom: _.s3 }}>
            <Calendar size={14} color={_.ac} />
            <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>Schedule</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s2 }}>
            <span style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{msDone}/{scheduleTasks.length}</span>
            <span style={{ fontSize: _.fontSize.sm, color: _.muted }}>{schedPct}%</span>
          </div>
          <div style={{ height: 6, background: _.well, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${schedPct}%`, background: _.ac, borderRadius: 3, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: _.fontSize.caption, color: nextMs ? _.body : _.faint, fontWeight: _.fontWeight.medium, marginTop: _.s1 }}>
            {nextMs ? `Next: ${nextMs.name}` : "All complete"}
          </div>
        </Card>

        <Card style={{ padding: mobile ? _.s4 : _.s5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: _.s2, marginBottom: _.s3 }}>
            <DollarSign size={14} color={_.ac} />
            <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>Paid / Contract</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s2 }}>
            <span style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: _.ink }}>{fmt(T.paid)}</span>
            <span style={{ fontSize: _.fontSize.sm, color: _.muted }}>of {fmt(T.curr)}</span>
          </div>
          <div style={{ height: 6, background: _.well, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${collPct}%`, background: _.green, borderRadius: 3, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, marginTop: _.s1, display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: collPct > 0 ? _.green : _.faint }}>{collPct > 0 ? `${collPct}% collected` : "No payments yet"}</span>
            {T.outstanding > 0 && <span style={{ color: _.red }}>{fmt(T.outstanding)} owing</span>}
          </div>
          {nextClaim && (
            <div style={{ fontSize: _.fontSize.caption, color: _.body, marginTop: _.s2, display: "flex", alignItems: "center", gap: 4 }}>
              <Receipt size={10} color={_.muted} />
              Next claim: {nextClaim.label}
            </div>
          )}
        </Card>
      </div>

      <div style={{ height: 1, background: _.line, marginBottom: mobile ? _.s6 : _.s8 }} />

      {/* Two-column: next actions + activity */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 300px", gap: mobile ? _.s6 : _.s9, alignItems: "start" }}>
        <div>
          <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s4 }}>Next Actions</div>
          {secondaryActions.length === 0 ? (
            <div style={{ fontSize: _.fontSize.base, color: _.faint, padding: `${_.s2}px 0` }}>No pending actions</div>
          ) : secondaryActions.map((a, i) => (
            <div key={i} onClick={() => navigate(`../${a.path}`)} style={{
              display: "flex", alignItems: "center", gap: _.s3, padding: `${_.s3}px 0`, cursor: "pointer",
              borderBottom: i < secondaryActions.length - 1 ? `1px solid ${_.line}` : "none",
              transition: `background ${_.tr}`,
            }}
              onMouseEnter={e => e.currentTarget.style.background = _.well}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium, color: _.ink }}>{a.label}</div>
                <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 1 }}>{a.detail}</div>
              </div>
              <ChevronRight size={14} color={_.faint} />
            </div>
          ))}
        </div>

        {/* Activity */}
        <div style={{ position: mobile ? "static" : "sticky", top: _.s9 }}>
          <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s4 }}>Activity</div>
          {recentActivity.length === 0 ? (
            <div style={{ fontSize: _.fontSize.base, color: _.faint, padding: `${_.s2}px 0` }}>No activity yet</div>
          ) : recentActivity.map((a, i) => (
            <div key={i} style={{ padding: `${_.s2}px 0`, display: "flex", alignItems: "flex-start", gap: _.s3, borderBottom: i < recentActivity.length - 1 ? `1px solid ${_.line}` : "none" }}>
              <div style={{ width: 5, height: 5, borderRadius: 3, background: _.line2, flexShrink: 0, marginTop: 6 }} />
              <div>
                <div style={{ fontSize: _.fontSize.base, color: _.body, lineHeight: _.lineHeight.body }}>{a.action}</div>
                <div style={{ fontSize: _.fontSize.caption, color: _.faint, marginTop: 2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Convert to Job Modal */}
      <Modal open={showConvertModal} onClose={() => setShowConvertModal(false)} title="Convert to Job" width={480}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, marginBottom: _.s5, lineHeight: _.lineHeight.body }}>
          Create a job instance from this quote and choose what to import.
        </div>

        <div style={{ marginBottom: _.s5 }}>
          <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s3 }}>Import budget from quote?</div>
          {[
            { value: "section", label: "Section-level", desc: "One line per scope category" },
            { value: "item", label: "Item-level", desc: "One line per scope item" },
            { value: "skip", label: "Skip", desc: "Start with an empty budget" },
          ].map(opt => (
            <div key={opt.value} onClick={() => setImportMode(opt.value)} style={{
              display: "flex", alignItems: "center", gap: _.s3, padding: `${_.s2}px ${_.s3}px`,
              borderRadius: _.rSm, cursor: "pointer", marginBottom: 2,
              background: importMode === opt.value ? `${_.ac}0a` : "transparent",
              transition: `background ${_.tr}`,
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: "50%", border: `2px solid ${importMode === opt.value ? _.ac : _.line2}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {importMode === opt.value && <div style={{ width: 8, height: 8, borderRadius: "50%", background: _.ac }} />}
              </div>
              <div>
                <div style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium, color: _.ink }}>{opt.label}</div>
                <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{opt.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: _.s5 }}>
          <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s3 }}>Conversion options</div>
          {[
            { checked: importMode !== "skip", onChange: () => setImportMode(v => (v === "skip" ? "section" : "skip")), label: "Import scope items to cost tracker" },
            { checked: importSchedule, onChange: () => setImportSchedule(v => !v), label: "Import tasks to schedule" },
            { checked: lockQuoteOnConvert, onChange: () => { setLockQuoteOnConvert(v => !v); setAllowQuoteEditsAfterConvert(false); }, label: "Lock original quote" },
            { checked: allowQuoteEditsAfterConvert, onChange: () => { setAllowQuoteEditsAfterConvert(v => !v); setLockQuoteOnConvert(false); }, label: "Allow quote edits after conversion" },
          ].map(opt => (
            <div key={opt.label} onClick={opt.onChange} style={{ display: "flex", alignItems: "center", gap: _.s2, padding: `${_.s2}px 0`, cursor: "pointer" }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${opt.checked ? _.ac : _.line2}`, background: opt.checked ? _.ac : "transparent", boxShadow: opt.checked ? `inset 0 0 0 2px #fff` : "none" }} />
              <span style={{ fontSize: _.fontSize.base, color: _.ink }}>{opt.label}</span>
            </div>
          ))}
        </div>

        {(p.budget || []).length > 0 && importMode !== "skip" && (
          <div style={{ marginBottom: _.s5 }}>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s3 }}>Existing budget lines</div>
            {[
              { value: "replace", label: "Replace", desc: "Remove existing lines" },
              { value: "merge", label: "Merge", desc: "Add alongside existing lines" },
            ].map(opt => (
              <div key={opt.value} onClick={() => setMergeMode(opt.value)} style={{
                display: "flex", alignItems: "center", gap: _.s3, padding: `${_.s2}px ${_.s3}px`,
                borderRadius: _.rSm, cursor: "pointer", marginBottom: 2,
                background: mergeMode === opt.value ? `${_.ac}0a` : "transparent",
                transition: `background ${_.tr}`,
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", border: `2px solid ${mergeMode === opt.value ? _.ac : _.line2}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {mergeMode === opt.value && <div style={{ width: 8, height: 8, borderRadius: "50%", background: _.ac }} />}
                </div>
                <div>
                  <div style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium, color: _.ink }}>{opt.label}</div>
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setShowConvertModal(false)}>Cancel</Button>
          <Button onClick={handleConvertConfirm}>{importMode === "skip" ? "Convert" : "Convert & Import"}</Button>
        </div>
      </Modal>
    </div>
  );
}
