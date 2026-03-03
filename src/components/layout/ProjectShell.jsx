import { useMemo, useState, useRef, useEffect } from "react";
import { useParams, Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useProjectsCtx } from "../../context/AppContext.jsx";
import { ProjectProvider } from "../../context/ProjectContext.jsx";
import { calc } from "../../lib/calc.js";
import { isJob } from "../../lib/lifecycle.js";
import { NAV_STRUCTURE } from "../../config/navStructure.js";
import _ from "../../theme/tokens.js";

const { tabs: NAV_TABS, procurement: NAV_PROCUREMENT, moreTabs: NAV_MORE } = NAV_STRUCTURE.project;

// Tabs only shown for job-stage projects
const JOB_ONLY_PATHS = new Set([
  "schedule", "costs", "variations",
  "invoices", "bills", "payments",
  "rfq", "purchase-orders", "work-orders",
  "site-diary", "defects", "trades",
]);

export default function ProjectShell() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { find } = useProjectsCtx();

  const project = find(id);
  const totals = useMemo(() => project ? calc(project) : null, [project]);

  const [procOpen, setProcOpen] = useState(false);
  const procRef = useRef(null);

  // Outside-click to close procurement dropdown
  useEffect(() => {
    const handler = e => {
      if (procRef.current && !procRef.current.contains(e.target)) setProcOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  const status = project.stage || project.status || "Lead";
  const isJobProject = isJob(status);
  const variance = totals.revisedBudget - totals.combinedActuals;
  const clientName = project.client || "Unassigned client";

  // Build visible tabs based on stage
  const visibleTabs = isJobProject
    ? NAV_TABS
    : NAV_TABS.filter(t => !JOB_ONLY_PATHS.has(t.path));

  const visibleMore = isJobProject
    ? NAV_MORE
    : NAV_MORE.filter(t => !JOB_ONLY_PATHS.has(t.path));

  const showProcurement = isJobProject;

  // All procurement paths for active detection
  const procPaths = NAV_PROCUREMENT.children.map(c => c.path);
  const isProcActive = procPaths.some(p => location.pathname.includes(`/projects/${id}/${p}`));

  const isTabActive = (path) => location.pathname.includes(`/projects/${id}/${path}`);
  const activeTab = [...NAV_TABS, ...NAV_MORE, ...NAV_PROCUREMENT.children]
    .find(t => location.pathname.includes(`/projects/${id}/${t.path}`))?.path || "overview";

  return (
    <ProjectProvider project={project}>
      {/* Back link */}
      <div style={{ marginBottom: _.s3 }}>
        <div onClick={() => navigate("/projects")} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          cursor: "pointer", fontSize: _.fontSize.sm, color: _.ac, fontWeight: _.fontWeight.medium,
          transition: `color ${_.tr}`,
        }}
        onMouseEnter={e => e.currentTarget.style.color = _.acDark}
        onMouseLeave={e => e.currentTarget.style.color = _.ac}
        >
          <ArrowLeft size={13} /> Back to Projects
        </div>
      </div>

      {/* Header with stats (job only) */}
      {isJobProject && (
        <div style={{ marginBottom: _.s3 }}>
          <div style={{ background: _.surface, border: `1px solid ${_.line}`, borderRadius: _.r, padding: `${_.s3}px ${_.s4}px`, boxShadow: _.sh1 }}>
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
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${_.line}`, overflowX: "auto", padding: `0 ${_.s1}px`, marginBottom: isJobProject ? 0 : _.s5 }}>
        {visibleTabs.map(t => (
          <TabItem key={t.path} label={t.label} active={activeTab === t.path} onClick={() => navigate(`/projects/${id}/${t.path}`)} />
        ))}

        {/* Procurement dropdown */}
        {showProcurement && (
          <div ref={procRef} style={{ position: "relative" }}>
            <div onClick={() => setProcOpen(v => !v)} style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: `${_.s2}px ${_.s3}px`,
              cursor: "pointer",
              fontSize: _.fontSize.base,
              fontWeight: isProcActive ? _.fontWeight.semi : _.fontWeight.normal,
              color: isProcActive ? _.ink : _.muted,
              borderBottom: isProcActive ? `2px solid ${_.ink}` : "2px solid transparent",
              marginBottom: -2,
              whiteSpace: "nowrap",
            }}>
              {NAV_PROCUREMENT.label}
              <ChevronDown size={12} strokeWidth={1.5} style={{
                transition: "transform 0.15s",
                transform: procOpen ? "rotate(180deg)" : "none",
              }} />
            </div>

            {procOpen && (
              <div style={{
                position: "absolute", top: "100%", left: 0, zIndex: 50,
                background: _.surface, border: `1px solid ${_.line}`, borderRadius: _.r,
                boxShadow: _.sh3, padding: `${_.s1}px 0`, minWidth: 180,
                marginTop: 4,
              }}>
                {NAV_PROCUREMENT.children.map(c => {
                  const active = isTabActive(c.path);
                  return (
                    <div key={c.path} onClick={() => { navigate(`/projects/${id}/${c.path}`); setProcOpen(false); }} style={{
                      padding: `${_.s2}px ${_.s3}px`,
                      cursor: "pointer",
                      fontSize: _.fontSize.base,
                      color: active ? _.ac : _.ink,
                      fontWeight: active ? _.fontWeight.semi : _.fontWeight.normal,
                      background: active ? _.acSoft : "transparent",
                      transition: `background ${_.tr}`,
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = _.well; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? _.acSoft : "transparent"; }}
                    >
                      {c.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {visibleMore.map(t => (
          <TabItem key={t.path} label={t.label} active={activeTab === t.path} onClick={() => navigate(`/projects/${id}/${t.path}`)} />
        ))}
      </div>

      {isJobProject && <div style={{ height: _.s5 }} />}

      <Outlet />
    </ProjectProvider>
  );
}

function TabItem({ label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: `${_.s2}px ${_.s3}px`,
      cursor: "pointer",
      fontSize: _.fontSize.base,
      fontWeight: active ? _.fontWeight.semi : _.fontWeight.normal,
      color: active ? _.ink : _.muted,
      borderBottom: active ? `2px solid ${_.ink}` : "2px solid transparent",
      marginBottom: -2,
      whiteSpace: "nowrap",
    }}>
      {label}
    </div>
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
