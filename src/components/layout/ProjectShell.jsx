import { useMemo } from "react";
import { useParams, Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useProjectsCtx } from "../../context/AppContext.jsx";
import { ProjectProvider } from "../../context/ProjectContext.jsx";
import { calc } from "../../lib/calc.js";
import { isJob } from "../../lib/lifecycle.js";
import { NAV_STRUCTURE } from "../../config/navStructure.js";
import _ from "../../theme/tokens.js";
import { fmt, pName } from "../../theme/styles.js";

const NAV_TABS = NAV_STRUCTURE.project.tabs;

// Tabs only visible for job-stage projects
const JOB_ONLY_PATHS = new Set([
  "schedule", "costs", "variations",
  "purchase-orders", "invoices",
  "site-diary", "defects",
]);

export default function ProjectShell() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { find, clients } = useProjectsCtx();

  const project = find(id);
  const totals = useMemo(() => project ? calc(project) : null, [project]);

  if (!project) return <Navigate to="/projects" replace />;

  const status = project.stage || project.status || "Lead";
  const isJobProject = isJob(status);
  const clientName = project.client || "Unassigned client";

  const visibleTabs = isJobProject
    ? NAV_TABS
    : NAV_TABS.filter(t => !JOB_ONLY_PATHS.has(t.path));

  const activeTab = NAV_TABS.find(t =>
    location.pathname.includes(`/projects/${id}/${t.path}`)
  )?.path || "overview";

  // Also match sub-routes: rfq/work-orders → Procurement tab
  const resolvedActive = ["rfq", "work-orders"].some(p => location.pathname.includes(`/projects/${id}/${p}`))
    ? "purchase-orders"
    : activeTab;

  return (
    <ProjectProvider project={project}>
      {/* ─── Breadcrumb back link ─── */}
      <div style={{ marginBottom: 16 }}>
        <div onClick={() => navigate("/projects")} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          cursor: "pointer", fontSize: 12, color: _.muted, fontWeight: 500,
          transition: `color ${_.tr}`,
        }}
          onMouseEnter={e => e.currentTarget.style.color = _.ac}
          onMouseLeave={e => e.currentTarget.style.color = _.muted}
        >
          <ArrowLeft size={12} /> Projects
        </div>
      </div>

      {/* ─── Project header ─── */}
      <div style={{ marginBottom: 8 }}>
        <h1 style={{
          fontSize: 24, fontWeight: 700, color: _.ink,
          letterSpacing: "-0.02em", margin: 0,
        }}>
          {project.name || pName(project, clients) || "Project"}
        </h1>
        <div style={{ fontSize: 13, color: _.muted, marginTop: 2 }}>
          {clientName} {"\u00b7"} {status}
          {isJobProject && totals && totals.curr > 0 && ` \u00b7 ${fmt(totals.curr)}`}
        </div>
      </div>

      {/* ─── Job stats (inline, minimal) ─── */}
      {isJobProject && totals && (
        <div style={{
          display: "flex", gap: 24, marginBottom: 16,
          fontSize: 12, color: _.body, flexWrap: "wrap",
        }}>
          <StatInline label="Budget" value={fmt(totals.revisedBudget)} />
          <StatInline label="Actual" value={fmt(totals.combinedActuals)} />
          <StatInline label="Variance" value={fmt(totals.revisedBudget - totals.combinedActuals)} color={(totals.revisedBudget - totals.combinedActuals) >= 0 ? _.green : _.red} />
          <StatInline label="Margin" value={`${totals.marginPctNew?.toFixed(1) ?? 0}%`} color={totals.marginPctNew >= 0 ? _.green : _.red} />
        </div>
      )}

      {/* ─── Horizontal tab bar ─── */}
      <div style={{
        display: "flex", gap: 0,
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        overflowX: "auto", marginBottom: 24,
      }}>
        {visibleTabs.map(t => {
          const active = resolvedActive === t.path;
          return (
            <div key={t.path} onClick={() => navigate(`/projects/${id}/${t.path}`)} style={{
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              color: active ? _.ink : _.muted,
              borderBottom: active ? `2px solid ${_.ink}` : "2px solid transparent",
              marginBottom: -1,
              whiteSpace: "nowrap",
              transition: "all 0.1s ease",
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = _.body; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = active ? _.ink : _.muted; }}
            >
              {t.label}
            </div>
          );
        })}
      </div>

      <Outlet />
    </ProjectProvider>
  );
}

function StatInline({ label, value, color }) {
  return (
    <span>
      <span style={{ color: _.muted, fontWeight: 500 }}>{label} </span>
      <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: color || _.ink }}>{value}</span>
    </span>
  );
}
