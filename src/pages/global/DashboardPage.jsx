import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName, stCol, badge, ds } from "../../theme/styles.js";
import { selectCalc, getNextMilestone } from "../../lib/selectors.js";
import { normaliseStage } from "../../lib/lifecycle.js";
import {
  getPipelineValue, getQuoteProjects, getJobProjects,
  getAwaitingAcceptance, getActiveContractValue,
  getOutstandingReceivables, getJobsInProgress,
  getOverrunJobs,
} from "../../lib/metrics.js";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import { ArrowRight, AlertCircle, Clock, DollarSign, FileText, Hammer, TrendingUp, Check } from "lucide-react";

const SEED_TRADES = [
  { name: "Concreter", costCodes: ["SLAB", "CONCRETE"] },
  { name: "Carpenter / Framer", costCodes: ["FRAME", "FIX"] },
  { name: "Electrician", costCodes: ["ELEC-RI", "ELEC-FO"] },
  { name: "Plumber", costCodes: ["PLUMB-RI", "PLUMB-FO"] },
  { name: "Roofer", costCodes: ["ROOF"] },
  { name: "Plasterer", costCodes: ["PLASTER"] },
  { name: "Painter", costCodes: ["PAINT-INT", "PAINT-EXT"] },
  { name: "Tiler", costCodes: ["TILE"] },
  { name: "Landscaper", costCodes: ["LAND"] },
  { name: "Bricklayer", costCodes: ["BRICK"] },
];

export default function DashboardPage() {
  const { projects, clients, trades, tradesHook, mobile, notify } = useApp();
  const navigate = useNavigate();

  const pipelineValue = getPipelineValue(projects);
  const quoteProjects = getQuoteProjects(projects);
  const jobProjects = getJobProjects(projects);
  const awaiting = getAwaitingAcceptance(projects);
  const activeContract = getActiveContractValue(projects);
  const receivables = getOutstandingReceivables(projects);
  const inProgress = getJobsInProgress(projects);

  const kpis = [
    { label: "Pipeline Value", value: pipelineValue > 0 ? fmt(pipelineValue) : "\u2014", sub: `${quoteProjects.length} quote${quoteProjects.length !== 1 ? "s" : ""}`, color: _.amber, Ic: TrendingUp },
    { label: "Awaiting Acceptance", value: awaiting.count > 0 ? `${awaiting.count}` : "\u2014", sub: awaiting.value > 0 ? fmt(awaiting.value) : null, color: _.violet, Ic: FileText },
    { label: "Active Contract Value", value: activeContract.value > 0 ? fmt(activeContract.value) : "\u2014", sub: `${activeContract.count} job${activeContract.count !== 1 ? "s" : ""}`, color: _.blue, Ic: Hammer },
    { label: "Outstanding Receivables", value: receivables.value > 0 ? fmt(receivables.value) : "\u2014", sub: receivables.count > 0 ? `${receivables.count} job${receivables.count !== 1 ? "s" : ""}` : null, color: _.red, Ic: DollarSign },
    { label: "Jobs In Progress", value: inProgress.length > 0 ? `${inProgress.length}` : "\u2014", sub: null, color: _.green, Ic: Hammer },
  ];

  const overruns = getOverrunJobs(projects);

  // ─── Needs Attention ───
  const attention = [];
  overruns.forEach(pr => {
    const t = selectCalc(pr);
    const over = t.actualsTotal - t.budgetTotal;
    attention.push({ text: `${pName(pr, clients)} — Budget overrun by ${fmt(over)}`, icon: AlertCircle, color: _.red, id: pr.id });
  });
  awaiting.projects.forEach(pr => {
    attention.push({ text: `${pName(pr, clients)} — Awaiting acceptance`, icon: FileText, color: _.violet, id: pr.id });
  });
  receivables.projects.forEach(pr => {
    const os = selectCalc(pr).outstanding;
    attention.push({ text: `${pName(pr, clients)} — ${fmt(os)} outstanding`, icon: AlertCircle, color: _.red, id: pr.id });
  });
  jobProjects.forEach(pr => {
    const ms = getNextMilestone(pr);
    if (ms && ms.planned) {
      const d = new Date(ms.planned);
      const now = new Date(); now.setHours(0, 0, 0, 0);
      const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
      if (diff <= 7) {
        attention.push({ text: `${pName(pr, clients)} — ${ms.name} ${diff < 0 ? "overdue" : diff === 0 ? "today" : `in ${diff}d`}`, icon: Clock, color: diff < 0 ? _.red : _.amber, id: pr.id });
      }
      const nextClaim = (pr.paymentSchedule || []).find(c => c.status === "Planned" && c.dueOn === "milestone" && c.milestoneIdx != null);
      if (nextClaim && diff <= 7 && diff >= 0) {
        attention.push({ text: `${pName(pr, clients)} — Claim "${nextClaim.label}" due (milestone soon)`, icon: DollarSign, color: _.amber, id: pr.id });
      }
    }
  });

  const tableProjects = projects.slice(0, 20);

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: _.s2 }}>Dashboard</h1>
      <div style={{ fontSize: _.fontSize.base, color: _.muted, marginBottom: mobile ? _.s6 : _.s8 }}>{projects.length} project{projects.length !== 1 ? "s" : ""} · {ds()}</div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : `repeat(${kpis.length}, 1fr)`, gap: mobile ? _.s2 : _.s3, marginBottom: mobile ? _.s6 : _.s8 }}>
        {kpis.map(k => (
          <Card key={k.label} style={{ padding: mobile ? _.s3 : _.s5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: _.s3 }}>
              <k.Ic size={14} color={k.color} />
              <span style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>{k.label}</span>
            </div>
            <div style={{ fontSize: mobile ? _.fontSize.xl : _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: k.value === "\u2014" ? _.faint : _.ink, fontVariantNumeric: "tabular-nums", lineHeight: _.lineHeight.heading }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: _.s1 }}>{k.sub}</div>}
          </Card>
        ))}
      </div>

      {/* First-run onboarding checklist */}
      {(clients.length === 0 || trades.length === 0 || projects.length === 0) && (
        <Card style={{ marginBottom: mobile ? _.s6 : _.s8, padding: mobile ? _.s4 : _.s6 }}>
          <div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3 }}>Getting started</div>
          <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginBottom: _.s5 }}>Complete these steps to set up your workspace.</div>
          {[
            { done: clients.length > 0, text: "Add a client", action: () => navigate("/clients"), label: "Clients" },
            { done: trades.length > 0, text: "Add a trade", action: () => navigate("/trades"), label: "Trades" },
            { done: projects.length > 0, text: "Create your first quote", action: () => navigate("/quotes"), label: "Quotes" },
          ].map(step => (
            <div key={step.text} onClick={step.done ? undefined : step.action} style={{
              display: "flex", alignItems: "center", gap: _.s3, padding: `${_.s3}px 0`,
              borderBottom: `1px solid ${_.line}`, cursor: step.done ? "default" : "pointer",
              opacity: step.done ? 0.5 : 1,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11, border: `2px solid ${step.done ? _.green : _.line2}`,
                background: step.done ? _.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {step.done && <Check size={12} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: _.fontSize.base, color: step.done ? _.muted : _.ink, fontWeight: _.fontWeight.medium, textDecoration: step.done ? "line-through" : "none" }}>{step.text}</span>
              {!step.done && <ArrowRight size={14} color={_.ac} style={{ marginLeft: "auto" }} />}
            </div>
          ))}
          {trades.length === 0 && (
            <button onClick={() => {
              SEED_TRADES.forEach(t => tradesHook.create({ name: t.name, businessName: t.name, costCodes: t.costCodes }));
              notify("Sample trades added — you can edit or remove them from Trades");
            }} style={{
              marginTop: _.s4, padding: `${_.s2}px ${_.s4}px`, background: "transparent", border: `1.5px dashed ${_.line2}`,
              borderRadius: _.rSm, fontSize: _.fontSize.sm, color: _.muted, cursor: "pointer", fontFamily: "inherit",
              transition: `all ${_.tr}`,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = _.ac; e.currentTarget.style.color = _.ac; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = _.line2; e.currentTarget.style.color = _.muted; }}
            >
              + Add sample trades & cost codes (optional, removable)
            </button>
          )}
        </Card>
      )}

      {/* Needs Attention */}
      <div style={{ marginBottom: mobile ? _.s6 : _.s8 }}>
        <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3 }}>Needs Attention</div>
        {attention.length === 0 ? (
          <div style={{ padding: `${_.s4}px 0`, fontSize: _.fontSize.base, color: _.faint }}>No urgent items</div>
        ) : (
          <Card style={{ padding: 0 }}>
            {attention.slice(0, 8).map((a, i) => (
              <div key={`${a.id}-${i}`} onClick={() => navigate(`/projects/${a.id}/overview`)} style={{
                padding: `${_.s3}px ${_.s4}px`, display: "flex", alignItems: "center", gap: _.s3, cursor: "pointer",
                borderBottom: i < Math.min(attention.length, 8) - 1 ? `1px solid ${_.line}` : "none",
                transition: `background ${_.tr}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <a.icon size={14} color={a.color} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: _.fontSize.base, color: _.body, lineHeight: _.lineHeight.body }}>{a.text}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      <div style={{ height: 1, background: _.line, marginBottom: mobile ? _.s6 : _.s8 }} />

      {/* Condensed Projects Table */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s3 }}>
        <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>All Projects</div>
        <button onClick={() => navigate("/projects")} style={{ fontSize: _.fontSize.sm, color: _.ac, background: "none", border: "none", cursor: "pointer", fontWeight: _.fontWeight.semi, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
          View all <ArrowRight size={12} />
        </button>
      </div>

      {tableProjects.length === 0 && (
        <div style={{ padding: _.s7, textAlign: "center", color: _.muted, fontSize: _.fontSize.md, border: `1.5px dashed ${_.line2}`, borderRadius: _.r }}>
          No projects yet
        </div>
      )}

      {tableProjects.length > 0 && (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 100px 120px 100px 80px", gap: _.s2,
            padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`,
            fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
          }}>
            <span>Project</span>
            {!mobile && <><span style={{ textAlign: "right" }}>Value</span><span>Next Milestone</span><span style={{ textAlign: "right" }}>Outstanding</span></>}
            <span style={{ textAlign: "center" }}>Stage</span>
          </div>

          {tableProjects.map(pr => {
            const T = selectCalc(pr);
            const stage = normaliseStage(pr.stage || pr.status);
            const value = T.curr > 0 ? T.curr : null;
            const outstanding = T.outstanding > 0 ? T.outstanding : null;
            const nextMs = getNextMilestone(pr);

            return (
              <div key={pr.id} onClick={() => navigate(`/projects/${pr.id}/overview`)} style={{
                display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 100px 120px 100px 80px", gap: _.s2,
                padding: `${_.s3}px ${_.s1}px`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
                alignItems: "center", borderRadius: _.rXs, transition: `background ${_.tr}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pName(pr, clients)}</div>
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 1 }}>{pr.buildType || pr.type}</div>
                </div>
                {!mobile && (
                  <>
                    <span style={{ textAlign: "right", fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums" }}>
                      {value ? fmt(value) : "\u2014"}
                    </span>
                    <span style={{ fontSize: _.fontSize.sm, color: nextMs ? _.body : _.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {nextMs ? nextMs.name : "\u2014"}
                    </span>
                    <span style={{ textAlign: "right", fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium, fontVariantNumeric: "tabular-nums", color: outstanding ? _.red : _.faint }}>
                      {outstanding ? fmt(outstanding) : "\u2014"}
                    </span>
                  </>
                )}
                <div style={{ textAlign: "center" }}><span style={badge(stCol(stage))}>{stage}</span></div>
              </div>
            );
          })}
        </>
      )}
    </Section>
  );
}
