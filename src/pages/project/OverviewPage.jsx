import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName, ds, btnPrimary } from "../../theme/styles.js";
import { STAGES } from "../../data/defaults.js";
import { getNextStep } from "../../lib/nextStep.js";
import StagePipeline from "../../components/ui/StagePipeline.jsx";
import { ArrowRight, Check } from "lucide-react";

export default function OverviewPage() {
  const { project: p, T, client, log, transitionStage } = useProject();
  const { projects, clients, mobile, notify } = useApp();
  const navigate = useNavigate();

  const stage = p.stage || p.status;
  const sIdx = STAGES.indexOf(stage);

  // Workflow steps
  const { steps: wfSteps, next: wfNext, done: wfDone } = getNextStep({ project: p, totals: T, hasPlanData: false });

  // Alerts across this project
  const alerts = [];
  p.invoices.forEach(inv => {
    if (inv.status === "pending") alerts.push({ text: `${inv.desc} — ${fmt(inv.amount)}`, c: _.red, path: "invoices" });
  });
  p.variations.forEach(v => {
    if (v.status === "draft" || v.status === "pending") alerts.push({ text: `${v.id} needs signature`, c: _.amber, path: "variations" });
  });
  p.defects.forEach(d => {
    if (!d.done) alerts.push({ text: d.desc, c: _.blue, path: "defects" });
  });

  // Recent activity
  const recentActivity = (p.activity || []).slice(0, 8);

  // Stage CTA
  const stageCTA = () => {
    switch (stage) {
      case "Lead": return { label: "Build Quote", action: () => navigate("../scope") };
      case "Quoted": return { label: "Mark Approved", action: () => transitionStage("Approved") };
      case "Approved": return { label: "Start Build", action: () => transitionStage("Active") };
      case "Active": return { label: "Raise Claim", action: () => navigate("../invoices") };
      case "Invoiced": return { label: "Complete Build", action: () => transitionStage("Complete") };
      case "Complete": return { label: "View Summary", action: () => {} };
      // Legacy compat
      case "Quote": return { label: "Mark Approved", action: () => transitionStage("Approved") };
      default: return null;
    }
  };

  const cta = stageCTA();

  const stepAction = (step) => {
    if (step.key === "proposal") {
      if (step.needsQuote) navigate("../scope");
      else navigate("../proposals");
      return;
    }
    if (step.key === "scope" || step.key === "client") {
      navigate("../scope");
      return;
    }
    if (step.key === "plans") { navigate("../plans"); return; }
    if (step.key === "schedule") { navigate("../schedule"); return; }
    navigate(`../${step.tab || step.key}`);
  };

  return (
    <div style={{ animation: "fadeUp 0.2s ease", maxWidth: 1200 }}>
      {/* HERO */}
      <div style={{ marginBottom: mobile ? 40 : 64 }}>
        <div style={{ marginBottom: mobile ? 32 : 48 }}>
          <h1 style={{ fontSize: mobile ? 28 : 40, fontWeight: 700, letterSpacing: "-0.03em", margin: 0, lineHeight: 1.1, color: _.ink }}>
            {pName(p, clients) === "New Project" ? "Overview" : pName(p, clients)}
          </h1>
          <div style={{ fontSize: 13, color: _.muted, marginTop: 8, letterSpacing: "-0.01em" }}>
            {stage} · {p.buildType || p.type}{p.floorArea || p.area ? ` · ${p.floorArea || p.area}m²` : ""} · {ds()}
          </div>
        </div>

        {/* Contract Value */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: _.body, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Contract Value</div>
          <div style={{ fontSize: mobile ? 48 : 72, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: T.curr > 0 ? "#0a0f1a" : _.faint }}>
            {fmt(T.curr)}
          </div>
        </div>

        {/* Stage pipeline */}
        <StagePipeline currentStage={stage} />

        {/* Stage CTA */}
        {cta && stage !== "Complete" && (
          <div style={{ marginTop: 32 }}>
            <button onClick={cta.action} style={{ ...btnPrimary, padding: "11px 20px" }}>{cta.label} <ArrowRight size={14} /></button>
          </div>
        )}
        {stage === "Complete" && <div style={{ marginTop: 32, fontSize: 13, color: _.green, fontWeight: 500 }}>Project complete</div>}
      </div>

      <div style={{ height: 1, background: _.line, marginBottom: mobile ? 32 : 48 }} />

      {/* Two-column: checklist + activity */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 300px", gap: mobile ? 32 : 64, alignItems: "start" }}>
        {/* Setup progress */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: _.ink }}>Project setup</div>
            <div style={{ fontSize: 12, color: _.muted }}>{wfDone} of {wfSteps.length}</div>
          </div>
          {wfSteps.map(step => (
            <div key={step.key} onClick={() => stepAction(step)} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "12px 0", cursor: "pointer",
              borderBottom: `1px solid ${_.line}`, transition: "padding-left 0.12s",
            }}
            onMouseEnter={e => e.currentTarget.style.paddingLeft = "4px"}
            onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 10,
                background: step.done ? _.ink : "transparent",
                border: step.done ? "none" : `1.5px solid ${_.line2}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>{step.done && <Check size={10} strokeWidth={3} color="#fff" />}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: step.done ? _.muted : _.ink }}>
                  {step.label}{step.optional ? <span style={{ fontSize: 11, color: _.faint, marginLeft: 6 }}>Optional</span> : ""}
                </div>
                <div style={{ fontSize: 12, color: step.done ? _.faint : _.muted, marginTop: 1 }}>{step.detail}</div>
              </div>
              {!step.done && <ArrowRight size={13} color={_.faint} />}
            </div>
          ))}

          {/* Alerts */}
          {alerts.length > 0 && (
            <div style={{ paddingTop: 32, marginTop: 16, borderTop: `1px solid ${_.line}` }}>
              <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>Needs attention</div>
              {alerts.slice(0, 5).map((a, i) => (
                <div key={i} onClick={() => navigate(`../${a.path}`)} style={{
                  padding: "10px 0", display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                  borderBottom: i < Math.min(alerts.length, 5) - 1 ? `1px solid ${_.line}` : "none",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: a.c, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: _.body, lineHeight: 1.4 }}>{a.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity */}
        <div style={{ position: mobile ? "static" : "sticky", top: 48 }}>
          <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>Activity</div>
          {recentActivity.length === 0 ? (
            <div style={{ fontSize: 13, color: _.faint, padding: "8px 0" }}>No activity yet</div>
          ) : recentActivity.map((a, i) => (
            <div key={i} style={{ padding: "10px 0", display: "flex", alignItems: "flex-start", gap: 10, borderBottom: i < recentActivity.length - 1 ? `1px solid ${_.line}` : "none" }}>
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
