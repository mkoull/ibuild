import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName, stCol, badge, ds } from "../../theme/styles.js";
import { calc } from "../../lib/calc.js";
import { isThisWeek } from "../../lib/dateHelpers.js";
import { STAGES } from "../../data/defaults.js";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import { ArrowRight, AlertCircle, Clock, FileText, CheckCircle } from "lucide-react";

export default function DashboardPage() {
  const { projects, clients, mobile } = useApp();
  const navigate = useNavigate();
  const [pipeFilter, setPipeFilter] = useState(null);

  // Pipeline counts
  const pipeline = STAGES.map(s => ({
    stage: s,
    count: projects.filter(p => (p.stage || p.status) === s).length,
    color: stCol(s),
  }));

  // My Tasks Today
  const tasks = [];
  projects.forEach(pr => {
    const name = pName(pr, clients);
    // Milestones due this week
    (pr.schedule || []).forEach(m => {
      if (m.planned && !m.done && isThisWeek(m.planned)) {
        tasks.push({ text: `${name}: ${m.name}`, icon: Clock, color: _.amber, id: pr.id, path: "schedule" });
      }
    });
    // Pending invoices
    pr.invoices.forEach(inv => {
      if (inv.status === "pending") {
        tasks.push({ text: `${name}: ${inv.desc || "Invoice"} — ${fmt(inv.amount)}`, icon: AlertCircle, color: _.red, id: pr.id, path: "invoices" });
      }
    });
    // Unsigned variations
    pr.variations.forEach(v => {
      if (v.status === "draft" || v.status === "pending") {
        tasks.push({ text: `${name}: ${v.id} needs signature`, icon: FileText, color: _.amber, id: pr.id, path: "variations" });
      }
    });
    // Open defects
    pr.defects.forEach(d => {
      if (!d.done) {
        tasks.push({ text: `${name}: ${d.desc}`, icon: AlertCircle, color: _.blue, id: pr.id, path: "defects" });
      }
    });
  });

  // Recent activity
  const recentActivity = projects
    .flatMap(pr => (pr.activity || []).slice(0, 4).map(a => ({ ...a, project: pName(pr, clients), id: pr.id })))
    .slice(0, 10);

  // Filtered project list
  const displayProjects = pipeFilter
    ? projects.filter(p => (p.stage || p.status) === pipeFilter)
    : projects;

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? 28 : 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Dashboard</h1>
      <div style={{ fontSize: 13, color: _.muted, marginBottom: mobile ? 24 : 40 }}>{projects.length} projects · {ds()}</div>

      {/* Pipeline cards */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: mobile ? 8 : 12, marginBottom: mobile ? 24 : 40 }}>
        {pipeline.map(p => (
          <div key={p.stage} onClick={() => setPipeFilter(pipeFilter === p.stage ? null : p.stage)} style={{
            padding: mobile ? "12px 10px" : "16px", borderRadius: _.r, cursor: "pointer",
            background: pipeFilter === p.stage ? `${p.color}12` : _.surface,
            border: `1px solid ${pipeFilter === p.stage ? p.color : _.line}`,
            transition: `all ${_.tr}`, textAlign: "center",
          }}
            onMouseEnter={e => { if (pipeFilter !== p.stage) e.currentTarget.style.borderColor = p.color; }}
            onMouseLeave={e => { if (pipeFilter !== p.stage) e.currentTarget.style.borderColor = _.line; }}
          >
            <div style={{ fontSize: mobile ? 24 : 32, fontWeight: 700, color: p.count > 0 ? _.ink : _.faint, lineHeight: 1, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>{p.count}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: p.color, letterSpacing: "0.02em" }}>{p.stage}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 320px", gap: mobile ? 24 : 40, alignItems: "start" }}>
        <div>
          {/* My Tasks */}
          {tasks.length > 0 && (
            <Card title="My Tasks" style={{ marginBottom: mobile ? 16 : 24 }}>
              {tasks.slice(0, 8).map((t, i) => (
                <div key={i} onClick={() => navigate(`/projects/${t.id}/${t.path}`)} style={{
                  padding: "10px 0", display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                  borderBottom: i < Math.min(tasks.length, 8) - 1 ? `1px solid ${_.line}` : "none",
                  transition: `opacity ${_.tr}`,
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  <t.icon size={14} color={t.color} />
                  <span style={{ fontSize: 13, color: _.body, lineHeight: 1.4 }}>{t.text}</span>
                </div>
              ))}
            </Card>
          )}

          {/* Project list */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: _.ink }}>
                {pipeFilter ? `${pipeFilter} Projects` : "All Projects"}
                {pipeFilter && <span onClick={() => setPipeFilter(null)} style={{ fontSize: 12, color: _.ac, marginLeft: 8, cursor: "pointer", fontWeight: 500 }}>Clear</span>}
              </div>
              <button onClick={() => navigate("/projects")} style={{ fontSize: 12, color: _.ac, background: "none", border: "none", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                View all <ArrowRight size={12} />
              </button>
            </div>

            {displayProjects.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: _.muted, fontSize: 14, border: `1.5px dashed ${_.line2}`, borderRadius: _.r }}>
                {pipeFilter ? `No ${pipeFilter} projects` : "No projects yet"}
              </div>
            )}

            {/* Table header */}
            {displayProjects.length > 0 && (
              <div style={{
                display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 100px 100px 80px", gap: 8,
                padding: "8px 0", borderBottom: `2px solid ${_.ink}`,
                fontSize: 10, color: _.muted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
                <span>Project</span>
                {!mobile && <><span style={{ textAlign: "right" }}>Value</span><span style={{ textAlign: "right" }}>Outstanding</span></>}
                <span style={{ textAlign: "center" }}>Stage</span>
              </div>
            )}

            {displayProjects.slice(0, 15).map(pr => {
              const T = calc(pr);
              const stage = pr.stage || pr.status;
              const outstanding = pr.invoices.filter(i => i.status === "pending").reduce((s, i) => s + (i.amount || 0), 0);

              return (
                <div key={pr.id} onClick={() => navigate(`/projects/${pr.id}/overview`)} style={{
                  display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 100px 100px 80px", gap: 8,
                  padding: "12px 0", borderBottom: `1px solid ${_.line}`, cursor: "pointer",
                  alignItems: "center", transition: "padding-left 0.12s",
                }}
                  onMouseEnter={e => e.currentTarget.style.paddingLeft = "4px"}
                  onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pName(pr, clients)}</div>
                    <div style={{ fontSize: 12, color: _.muted, marginTop: 1 }}>{pr.buildType || pr.type}</div>
                  </div>
                  {!mobile && (
                    <>
                      <span style={{ textAlign: "right", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{T.curr > 0 ? fmt(T.curr) : "—"}</span>
                      <span style={{ textAlign: "right", fontSize: 13, fontWeight: 500, color: outstanding > 0 ? _.red : _.faint, fontVariantNumeric: "tabular-nums" }}>
                        {outstanding > 0 ? fmt(outstanding) : "—"}
                      </span>
                    </>
                  )}
                  <div style={{ textAlign: "center" }}><span style={badge(stCol(stage))}>{stage}</span></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity sidebar */}
        <Card title="Recent Activity">
          {recentActivity.length === 0 ? (
            <div style={{ fontSize: 13, color: _.faint, padding: "8px 0" }}>No activity yet</div>
          ) : recentActivity.map((a, i) => (
            <div key={i} style={{ padding: "8px 0", display: "flex", alignItems: "flex-start", gap: 10, borderBottom: i < recentActivity.length - 1 ? `1px solid ${_.line}` : "none" }}>
              <div style={{ width: 5, height: 5, borderRadius: 3, background: _.line2, flexShrink: 0, marginTop: 6 }} />
              <div>
                <div style={{ fontSize: 13, color: _.body, lineHeight: 1.5 }}>{a.action}</div>
                <div style={{ fontSize: 11, color: _.faint, marginTop: 2 }}>{a.project} · {a.time}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </Section>
  );
}
