import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName, ds } from "../../theme/styles.js";
import { STAGES } from "../../data/defaults.js";
import { getNextActions } from "../../lib/nextActions.js";
import StagePipeline from "../../components/ui/StagePipeline.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { ArrowRight, Pencil, TrendingUp, Calendar, DollarSign, ChevronRight } from "lucide-react";

export default function OverviewPage() {
  const { project: p, T, client, log, transitionStage } = useProject();
  const { projects, clients, mobile, notify } = useApp();
  const navigate = useNavigate();

  const stage = p.stage || p.status;
  const milestones = p.schedule || [];
  const msDone = milestones.filter(m => m.done).length;
  const nextMs = milestones.find(m => !m.done);
  const pendingSum = p.invoices.filter(i => i.status === "pending").reduce((s, i) => s + (i.amount || 0), 0);
  const paidSum = p.invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);

  // Stage CTA
  const stageCTA = () => {
    switch (stage) {
      case "Lead": return { label: "Build Quote", action: () => navigate("../scope") };
      case "Quoted": return { label: "Mark Approved", action: () => transitionStage("Approved") };
      case "Approved": return { label: "Start Build", action: () => transitionStage("Active") };
      case "Active": return { label: "Raise Claim", action: () => navigate("../invoices") };
      case "Invoiced": return { label: "Complete Build", action: () => transitionStage("Complete") };
      case "Complete": return null;
      case "Quote": return { label: "Mark Approved", action: () => transitionStage("Approved") };
      default: return null;
    }
  };

  const cta = stageCTA();

  // Next actions
  const nextActions = getNextActions({ project: p, totals: T, clients });

  // Health snapshot values
  const budgetVariance = T.sub > 0 ? ((T.act / T.sub) * 100).toFixed(0) : 0;
  const schedPct = milestones.length > 0 ? Math.round((msDone / milestones.length) * 100) : 0;
  const collPct = T.curr > 0 ? Math.round((paidSum / T.curr) * 100) : 0;

  // Recent activity
  const recentActivity = (p.activity || []).slice(0, 8);

  return (
    <div style={{ animation: "fadeUp 0.2s ease", maxWidth: 1200 }}>
      {/* HERO */}
      <div style={{ marginBottom: mobile ? 32 : 48 }}>
        <div style={{ marginBottom: mobile ? 24 : 36 }}>
          <h1 style={{ fontSize: mobile ? 28 : 40, fontWeight: 700, letterSpacing: "-0.03em", margin: 0, lineHeight: 1.1, color: _.ink }}>
            {pName(p, clients) === "New Project" ? "Overview" : pName(p, clients)}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <div style={{ fontSize: 13, color: _.muted }}>
              {stage} · {p.buildType || p.type}{p.floorArea || p.area ? ` · ${p.floorArea || p.area}m²` : ""} · {ds()}
            </div>
            <div onClick={() => navigate("../scope")}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: _.ac, cursor: "pointer", fontWeight: 500, transition: `opacity ${_.tr}` }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            ><Pencil size={11} /> Edit</div>
          </div>
        </div>

        {/* Contract Value */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: _.body, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Contract Value</div>
          <div style={{ fontSize: mobile ? 48 : 72, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: T.curr > 0 ? "#0a0f1a" : _.faint }}>
            {fmt(T.curr)}
          </div>
        </div>

        {/* Stage pipeline */}
        <StagePipeline currentStage={stage} />

        {/* Stage CTA */}
        {cta && (
          <div style={{ marginTop: 24 }}>
            <Button onClick={cta.action} icon={ArrowRight}>{cta.label}</Button>
          </div>
        )}
        {stage === "Complete" && <div style={{ marginTop: 24, fontSize: 13, color: _.green, fontWeight: 500 }}>Project complete</div>}
      </div>

      {/* Health Snapshot */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: mobile ? 12 : 16, marginBottom: mobile ? 24 : 40 }}>
        {/* Budget vs Actual */}
        <Card style={{ padding: mobile ? 16 : 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <TrendingUp size={14} color={_.ac} />
            <span style={{ fontSize: 11, fontWeight: 600, color: _.muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>Budget vs Actual</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(T.act)}</span>
            <span style={{ fontSize: 12, color: _.muted }}>of {fmt(T.sub)}</span>
          </div>
          <div style={{ height: 6, background: _.well, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, budgetVariance)}%`, background: budgetVariance > 100 ? _.red : _.green, borderRadius: 3, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: budgetVariance > 100 ? _.red : _.green, fontWeight: 600, marginTop: 4 }}>
            {budgetVariance > 0 ? `${budgetVariance}% spent` : "No costs logged"}
          </div>
        </Card>

        {/* Schedule Status */}
        <Card style={{ padding: mobile ? 16 : 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Calendar size={14} color={_.ac} />
            <span style={{ fontSize: 11, fontWeight: 600, color: _.muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>Schedule</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{msDone}/{milestones.length}</span>
            <span style={{ fontSize: 12, color: _.muted }}>{schedPct}%</span>
          </div>
          <div style={{ height: 6, background: _.well, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${schedPct}%`, background: _.ac, borderRadius: 3, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: nextMs ? _.body : _.faint, fontWeight: 500, marginTop: 4 }}>
            {nextMs ? `Next: ${nextMs.name}` : "All complete"}
          </div>
        </Card>

        {/* Outstanding Invoices */}
        <Card style={{ padding: mobile ? 16 : 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <DollarSign size={14} color={_.ac} />
            <span style={{ fontSize: 11, fontWeight: 600, color: _.muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>Collections</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: pendingSum > 0 ? _.red : _.ink }}>{fmt(pendingSum)}</span>
            <span style={{ fontSize: 12, color: _.muted }}>pending</span>
          </div>
          <div style={{ height: 6, background: _.well, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${collPct}%`, background: _.green, borderRadius: 3, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: _.green, fontWeight: 600, marginTop: 4 }}>
            {collPct > 0 ? `${collPct}% collected` : "No payments yet"}
          </div>
        </Card>
      </div>

      <div style={{ height: 1, background: _.line, marginBottom: mobile ? 24 : 40 }} />

      {/* Two-column: next actions + activity */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 300px", gap: mobile ? 24 : 48, alignItems: "start" }}>
        {/* Next Actions */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: _.ink, marginBottom: 16 }}>Next Actions</div>
          {nextActions.length === 0 ? (
            <div style={{ fontSize: 13, color: _.faint, padding: "8px 0" }}>No pending actions</div>
          ) : nextActions.map((a, i) => (
            <div key={i} onClick={() => navigate(`../${a.path}`)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 0", cursor: "pointer",
              borderBottom: i < nextActions.length - 1 ? `1px solid ${_.line}` : "none",
              transition: "padding-left 0.12s",
            }}
              onMouseEnter={e => e.currentTarget.style.paddingLeft = "4px"}
              onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: _.ink }}>{a.label}</div>
                <div style={{ fontSize: 12, color: _.muted, marginTop: 1 }}>{a.detail}</div>
              </div>
              <ChevronRight size={14} color={_.faint} />
            </div>
          ))}
        </div>

        {/* Activity */}
        <div style={{ position: mobile ? "static" : "sticky", top: 48 }}>
          <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>Activity</div>
          {recentActivity.length === 0 ? (
            <div style={{ fontSize: 13, color: _.faint, padding: "8px 0" }}>No activity yet</div>
          ) : recentActivity.map((a, i) => (
            <div key={i} style={{ padding: "8px 0", display: "flex", alignItems: "flex-start", gap: 10, borderBottom: i < recentActivity.length - 1 ? `1px solid ${_.line}` : "none" }}>
              <div style={{ width: 5, height: 5, borderRadius: 3, background: _.line2, flexShrink: 0, marginTop: 6 }} />
              <div>
                <div style={{ fontSize: 13, color: _.body, lineHeight: 1.5 }}>{a.action}</div>
                <div style={{ fontSize: 11, color: _.faint, marginTop: 2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
