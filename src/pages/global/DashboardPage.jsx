import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName, stCol, badge, ds } from "../../theme/styles.js";
import { calc } from "../../lib/calc.js";
import Section from "../../components/ui/Section.jsx";
import { ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { projects, clients, mobile } = useApp();
  const navigate = useNavigate();

  const recentActivity = projects
    .flatMap(pr => (pr.activity || []).slice(0, 4).map(a => ({ ...a, project: pName(pr, clients), id: pr.id })))
    .slice(0, 8);

  const alerts = [];
  projects.forEach(pr => {
    pr.invoices.forEach(inv => {
      if (inv.status === "pending") alerts.push({ text: `${pName(pr, clients)}: ${inv.desc} — ${fmt(inv.amount)}`, c: _.red, id: pr.id, path: "invoices" });
    });
    pr.variations.forEach(v => {
      if (v.status === "draft" || v.status === "pending") alerts.push({ text: `${pName(pr, clients)}: ${v.id} needs signature`, c: _.amber, id: pr.id, path: "variations" });
    });
    pr.defects.forEach(d => {
      if (!d.done) alerts.push({ text: `${pName(pr, clients)}: ${d.desc}`, c: _.blue, id: pr.id, path: "defects" });
    });
  });

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? 28 : 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Dashboard</h1>
      <div style={{ fontSize: 13, color: _.muted, marginBottom: mobile ? 32 : 48 }}>{projects.length} projects · {ds()}</div>

      {/* Projects table */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: _.ink }}>All Projects</div>
          <button onClick={() => navigate("/projects")} style={{ fontSize: 12, color: _.ac, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
            View all <ArrowRight size={12} style={{ verticalAlign: "middle" }} />
          </button>
        </div>
        {projects.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: _.muted, fontSize: 14, border: `1.5px dashed ${_.line2}`, borderRadius: _.r }}>
            No projects yet
          </div>
        )}
        {projects.slice(0, 10).map(pr => {
          const T = calc(pr);
          const stage = pr.stage || pr.status;
          return (
            <div key={pr.id} onClick={() => navigate(`/projects/${pr.id}/overview`)} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 0", borderBottom: `1px solid ${_.line}`, cursor: "pointer",
              transition: "padding-left 0.12s",
            }}
            onMouseEnter={e => e.currentTarget.style.paddingLeft = "4px"}
            onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pName(pr, clients)}</div>
                <div style={{ fontSize: 12, color: _.muted, marginTop: 1 }}>{pr.buildType || pr.type}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                {T.curr > 0 && <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</span>}
                <span style={badge(stCol(stage))}>{stage}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two columns: alerts + activity */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 300px", gap: mobile ? 32 : 64, alignItems: "start" }}>
        {/* Alerts */}
        {alerts.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>Needs attention</div>
            {alerts.slice(0, 8).map((a, i) => (
              <div key={i} onClick={() => navigate(`/projects/${a.id}/${a.path}`)} style={{
                padding: "10px 0", display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                borderBottom: i < Math.min(alerts.length, 8) - 1 ? `1px solid ${_.line}` : "none",
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

        {/* Activity */}
        <div>
          <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>Activity</div>
          {recentActivity.length === 0 ? (
            <div style={{ fontSize: 13, color: _.faint, padding: "8px 0" }}>No activity yet</div>
          ) : recentActivity.map((a, i) => (
            <div key={i} style={{ padding: "10px 0", display: "flex", alignItems: "flex-start", gap: 10, borderBottom: i < recentActivity.length - 1 ? `1px solid ${_.line}` : "none" }}>
              <div style={{ width: 5, height: 5, borderRadius: 3, background: _.line2, flexShrink: 0, marginTop: 6 }} />
              <div>
                <div style={{ fontSize: 13, color: _.body, lineHeight: 1.5 }}>{a.action}</div>
                <div style={{ fontSize: 11, color: _.faint, marginTop: 2 }}>{a.project} · {a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
