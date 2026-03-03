import { useMemo } from "react";
import { useParams, Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useProjectsCtx } from "../../context/AppContext.jsx";
import { ProjectProvider } from "../../context/ProjectContext.jsx";
import { calc } from "../../lib/calc.js";
import { isQuote } from "../../lib/lifecycle.js";
import { ESTIMATE_TABS, JOB_TABS, displayStage } from "../../config/workspaceTabs.js";
import _ from "../../theme/tokens.js";
import { fmt, pName, stCol, badge as badgeStyle } from "../../theme/styles.js";

export default function WorkspaceShell({ workspaceType }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { find, clients } = useProjectsCtx();

  const project = find(id);
  const totals = useMemo(() => project ? calc(project) : null, [project]);

  if (!project) return <Navigate to="/estimates" replace />;

  const stage = project.stage || project.status || "Lead";
  const isEstimate = workspaceType === "estimate" || isQuote(stage);
  const tabs = isEstimate ? ESTIMATE_TABS : JOB_TABS;

  const breadcrumbLabel = isEstimate ? "Estimates" : "Jobs";
  const breadcrumbTo = isEstimate ? "/estimates" : "/jobs";

  const projectNumber = isEstimate
    ? (project.estimateNumber || "")
    : (project.jobNumber || project.estimateNumber || "");

  const displayName = project.name || pName(project, clients) || "Project";
  const displayStatus = displayStage(stage);
  const statusColor = stCol(stage);

  // Quote / contract total
  const total = totals ? totals.curr : 0;

  // Active tab detection
  const pathAfterBase = location.pathname.split(`/${id}/`)[1] || "overview";
  const activeTabPath = pathAfterBase.split("/")[0].split("?")[0];

  // Resolve which tab is active
  const resolvedActive = tabs.find(t => t.path === activeTabPath)?.path
    || tabs.find(t => !t.locked)?.path
    || "overview";

  return (
    <ProjectProvider project={project}>
      {/* ─── Context header ─── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        padding: "0 0 12px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        marginBottom: 0,
      }}>
        {/* Back link */}
        <div onClick={() => navigate(breadcrumbTo)} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          cursor: "pointer", fontSize: 13, color: _.muted, fontWeight: 500,
          transition: `color ${_.tr}`, flexShrink: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.color = _.ac}
          onMouseLeave={e => e.currentTarget.style.color = _.muted}
        >
          <ArrowLeft size={14} /> {breadcrumbLabel}
        </div>

        {/* Number badge */}
        {projectNumber && (
          <span style={{
            fontSize: 13, fontWeight: 600, color: _.ac,
            background: `${_.ac}0f`, padding: "3px 10px",
            borderRadius: 4, letterSpacing: "0.02em",
          }}>{projectNumber}</span>
        )}

        {/* Project name */}
        <span style={{
          fontSize: 15, fontWeight: 600, color: _.ink,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: 340,
        }}>{displayName}</span>

        {/* Status pill */}
        <span style={badgeStyle(statusColor)}>{displayStatus}</span>

        <div style={{ flex: 1 }} />

        {/* Quote/Contract total */}
        {total > 0 && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: _.muted, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {isEstimate ? "Quote Total" : "Contract Value"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: _.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
              {fmt(total)}
            </div>
          </div>
        )}
      </div>

      {/* ─── Tab bar ─── */}
      <div style={{
        display: "flex", gap: 0,
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        overflowX: "auto", marginBottom: 24,
      }}>
        {tabs.map(t => {
          const active = resolvedActive === t.path;
          const locked = !!t.locked;

          return (
            <div
              key={t.label}
              onClick={() => {
                if (locked) {
                  navigate(t.path);
                } else {
                  navigate(t.path);
                }
              }}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: locked ? _.faint : active ? _.ink : _.muted,
                borderBottom: active ? `2px solid ${_.ac}` : "2px solid transparent",
                marginBottom: -1,
                whiteSpace: "nowrap",
                transition: "all 0.1s ease",
                opacity: locked ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                if (!active && !locked) e.currentTarget.style.color = _.body;
              }}
              onMouseLeave={e => {
                if (!active && !locked) e.currentTarget.style.color = _.muted;
              }}
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
