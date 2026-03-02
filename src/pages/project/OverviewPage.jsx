import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName, ds } from "../../theme/styles.js";
import { getNextActions } from "../../lib/nextActions.js";
import { getNextStepForProject } from "../../lib/nextStep.js";
import { canTransition, isJob } from "../../lib/lifecycle.js";
import StagePipeline from "../../components/ui/StagePipeline.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { ArrowRight, Pencil, TrendingUp, Calendar, DollarSign, ChevronRight, Receipt } from "lucide-react";

export default function OverviewPage() {
  const { project: p, update: up, T, client, log, transitionStage, convertToJob } = useProject();
  const { projects, clients, mobile, notify } = useApp();
  const navigate = useNavigate();

  const stage = p.stage || p.status;
  const stageIsJob = isJob(stage);
  const milestones = p.schedule || [];
  const msDone = milestones.filter(m => m.status === "complete" || m.done).length;
  const nextMs = milestones.find(m => m.status ? m.status !== "complete" : !m.done);

  // ─── Deterministic primary CTA ───
  const step = getNextStepForProject(p, T);

  const handlePrimary = () => {
    if (!step) return;
    if (step.actionId === "convert_to_job") {
      convertToJob();
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
  const schedPct = milestones.length > 0 ? Math.round((msDone / milestones.length) * 100) : 0;
  const collPct = T.curr > 0 ? Math.round((T.paid / T.curr) * 100) : 0;

  const nextClaim = (p.paymentSchedule || []).find(c => c.status === "Planned") || null;

  const recentActivity = (p.activity || []).slice(0, 8);

  return (
    <div style={{ animation: "fadeUp 0.2s ease", maxWidth: 1200 }}>
      {/* HERO */}
      <div style={{ marginBottom: mobile ? _.s7 : _.s9 }}>
        <div style={{ marginBottom: mobile ? _.s6 : _.s8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: _.s3 }}>
            <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, margin: 0, lineHeight: _.lineHeight.tight, color: _.ink }}>
              {pName(p, clients) === "New Project" ? "Overview" : pName(p, clients)}
            </h1>
            <div onClick={() => navigate("../quote?step=details")}
              style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: _.fontSize.sm, color: _.muted, cursor: "pointer", fontWeight: _.fontWeight.medium, transition: `color ${_.tr}`, flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = _.ac}
              onMouseLeave={e => e.currentTarget.style.color = _.muted}
            ><Pencil size={10} /></div>
          </div>
          <div style={{ fontSize: _.fontSize.base, color: _.muted, marginTop: _.s2 }}>
            {stage} · {p.buildType || p.type}{p.floorArea || p.area ? ` · ${p.floorArea || p.area}m²` : ""} · {ds()}
          </div>
        </div>

        {/* Contract Value */}
        <div style={{ marginBottom: _.s7 }}>
          <div style={{ fontSize: _.fontSize.caption, color: _.body, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s3 }}>Contract Value</div>
          <div style={{ fontSize: mobile ? _.fontSize.stat : _.fontSize.display, fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: T.curr > 0 ? _.ink : _.faint }}>
            {fmt(T.curr)}
          </div>
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

      {/* ─── Commercial Snapshot (Jobs only) ─── */}
      {stageIsJob && (
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: mobile ? _.s2 : _.s3, marginBottom: mobile ? _.s6 : _.s8 }}>
          <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
            <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Contract Value</div>
            <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: _.ink }}>{T.curr > 0 ? fmt(T.curr) : "—"}</div>
          </Card>
          <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
            <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Invoiced</div>
            <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.inv > 0 ? _.ac : _.faint }}>{T.inv > 0 ? fmt(T.inv) : "—"}</div>
          </Card>
          <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
            <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Outstanding</div>
            <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.outstanding > 0 ? _.red : _.faint }}>{T.outstanding > 0 ? fmt(T.outstanding) : "—"}</div>
          </Card>
          <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
            <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Variations</div>
            <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.aVCount > 0 ? _.ink : _.faint }}>
              {T.aVCount > 0 ? `${T.aVCount} · ${fmt(T.aV)}` : "—"}
            </div>
          </Card>
        </div>
      )}

      {/* Financial Health (Jobs only) */}
      {stageIsJob && (
        <div style={{ marginBottom: mobile ? _.s6 : _.s8 }}>
          <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3 }}>Financial Health</div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: mobile ? _.s2 : _.s3 }}>
            <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
              <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Budget</div>
              <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.budgetTotal > 0 ? _.ink : _.faint }}>{T.budgetTotal > 0 ? fmt(T.budgetTotal) : "—"}</div>
            </Card>
            <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
              <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Actual</div>
              <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.actualsTotal > 0 ? _.ac : _.faint }}>{T.actualsTotal > 0 ? fmt(T.actualsTotal) : "—"}</div>
            </Card>
            <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
              <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Forecast Margin</div>
              <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.curr > 0 ? (T.forecastMargin >= 0 ? _.green : _.red) : _.faint }}>{T.curr > 0 ? fmt(T.forecastMargin) : "—"}</div>
            </Card>
            <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
              <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Margin %</div>
              <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.curr > 0 ? (T.marginPctCalc >= 0 ? _.green : _.red) : _.faint }}>{T.curr > 0 ? `${T.marginPctCalc.toFixed(1)}%` : "—"}</div>
            </Card>
          </div>
        </div>
      )}

      {/* Health Snapshot */}
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
            <span style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{msDone}/{milestones.length}</span>
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
    </div>
  );
}
