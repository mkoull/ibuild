import { useMemo } from "react";
import { useParams, Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useProjectsCtx } from "../../context/AppContext.jsx";
import { ProjectProvider } from "../../context/ProjectContext.jsx";
import { calc } from "../../lib/calc.js";
import { isJob } from "../../lib/lifecycle.js";
import _ from "../../theme/tokens.js";

export default function ProjectShell() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { find } = useProjectsCtx();

  const project = find(id);

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  const totals = useMemo(() => calc(project), [project]);
  const status = project.stage || project.status || "Lead";
  const isJobProject = isJob(status);
  const variance = totals.revisedBudget - totals.combinedActuals;
  const clientName = project.client || "Unassigned client";
  const tabs = [
    { label: "Details", path: "overview" },
    { label: "Scope", path: "scope" },
    { label: "Quote", path: "quote" },
    { label: "Schedule", path: "schedule" },
    { label: "Costs", path: "costs" },
    { label: "Variations", path: "variations" },
    { label: "Invoices", path: "invoices" },
    { label: "Documents", path: "documents" },
  ];
  const activeTab = tabs.find(t => location.pathname.includes(`/projects/${id}/${t.path}`))?.path || "overview";

  return (
    <ProjectProvider project={project}>
      {isJobProject && (
        <div style={{ marginBottom: _.s5 }}>
          <div style={{ background: _.surface, border: `1px solid ${_.line}`, borderRadius: _.r, padding: `${_.s3}px ${_.s4}px`, boxShadow: _.sh1, marginBottom: _.s3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: _.s3, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, color: _.ink, letterSpacing: _.letterSpacing.tight }}>{project.name || "Job Workspace"}</div>
                <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{clientName} · {status}</div>
              </div>
              <div style={{ display: "flex", gap: _.s3, flexWrap: "wrap" }}>
                <StatChip label="Budget" value={totals.revisedBudget} />
                <StatChip label="Actual" value={totals.combinedActuals} />
                <StatChip label="Variance" value={variance} tone={variance >= 0 ? "good" : "bad"} signed />
                <StatChip label="Profit %" value={totals.marginPctNew} suffix="%" tone={totals.marginPctNew >= 0 ? "good" : "bad"} fixed={1} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${_.line}`, overflowX: "auto", padding: `0 ${_.s1}px` }}>
            {tabs.map(t => (
              <div
                key={t.path}
                onClick={() => navigate(`/projects/${id}/${t.path}`)}
                style={{
                  padding: `${_.s2}px ${_.s3}px`,
                  cursor: "pointer",
                  fontSize: _.fontSize.base,
                  fontWeight: activeTab === t.path ? _.fontWeight.semi : _.fontWeight.normal,
                  color: activeTab === t.path ? _.ink : _.muted,
                  borderBottom: activeTab === t.path ? `2px solid ${_.ink}` : "2px solid transparent",
                  marginBottom: -2,
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
              </div>
            ))}
          </div>
        </div>
      )}
      <Outlet />
    </ProjectProvider>
  );
}

function StatChip({ label, value, tone = "normal", signed = false, suffix = "", fixed }) {
  const color = tone === "good" ? _.green : tone === "bad" ? _.red : _.ink;
  const number = typeof value === "number" ? value : 0;
  const text = fixed != null ? number.toFixed(fixed) : Math.round(number).toLocaleString();
  return (
    <div style={{ minWidth: 112 }}>
      <div style={{ fontSize: _.fontSize.xs, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", fontWeight: _.fontWeight.semi }}>{label}</div>
      <div style={{ fontSize: _.fontSize.md, color, fontWeight: _.fontWeight.bold }}>
        {signed && number > 0 ? "+" : ""}{text}{suffix}
      </div>
    </div>
  );
}
