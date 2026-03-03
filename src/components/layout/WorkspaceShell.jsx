import { useMemo } from "react";
import { useParams, Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useProjectsCtx } from "../../context/AppContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { ProjectProvider } from "../../context/ProjectContext.jsx";
import { calc } from "../../lib/calc.js";
import { JOB_TABS, displayStage } from "../../config/workspaceTabs.js";
import _ from "../../theme/tokens.js";
import { fmt, pName, stCol, badge as badgeStyle } from "../../theme/styles.js";
import Button from "../ui/Button.jsx";

export default function WorkspaceShell({ workspaceType }) {
  const { id, estimateId, jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { find, clients, update } = useProjectsCtx();
  const { notify } = useApp();
  const entityId = estimateId || jobId || id;
  const isEstimate = workspaceType === "estimate";

  const project = find(entityId);
  const totals = useMemo(() => project ? calc(project) : null, [project]);

  if (!project) return <Navigate to={isEstimate ? "/estimates" : "/jobs"} replace />;

  const stage = project.stage || project.status || "Lead";
  const tabs = JOB_TABS;
  const isActiveStage = String(stage).toLowerCase() === "active";

  const breadcrumbLabel = isEstimate ? "Estimates" : "Jobs";
  const breadcrumbTo = isEstimate ? "/estimates" : "/jobs";

  const projectNumber = isEstimate
    ? (project.estimateNumber || "")
    : (project.jobNumber || project.estimateNumber || "");

  const displayName = project.name || pName(project, clients) || "Project";
  const displayStatus = displayStage(stage);
  const statusColor = stCol(stage);

  // Quote / contract total
  const costingsTotal = Number(project?.costingsTotals?.quoteTotal) || 0;
  const total = isEstimate ? (costingsTotal > 0 ? costingsTotal : (totals ? totals.curr : 0)) : (totals ? totals.curr : 0);
  const marginPct = Number(totals?.marginPctNew ?? totals?.marginPctCalc ?? 0);
  const outstanding = Number(totals?.outstanding || 0);
  const marginValue = Number(totals?.forecastMarginNew ?? totals?.forecastMargin ?? 0);

  // Active tab detection
  const pathAfterBase = location.pathname.split(`/${entityId}/`)[1] || "overview";
  const activeTabPath = pathAfterBase.split("/")[0].split("?")[0];

  // Resolve which tab is active
  const resolvedActive = tabs.find(t => t.path === activeTabPath)?.path
    || tabs.find(t => !(t.isLocked?.(project)))?.path
    || "overview";
  const showConvertPrimary = !isActiveStage;

  const convertToJob = () => {
    update(project.id, (pr) => {
      pr.stage = "Active";
      pr.status = "Active";
      pr.updatedAt = new Date().toISOString();
      if (!Array.isArray(pr.activity)) pr.activity = [];
      pr.activity.unshift({
        action: "Converted to Job",
        date: new Date().toLocaleDateString("en-AU"),
        time: new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }),
      });
      if (pr.activity.length > 30) pr.activity = pr.activity.slice(0, 30);
      return pr;
    });
    notify("Project converted to job");
    navigate("overview");
  };

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
        <span style={{ fontSize: 12, color: _.muted }}>
          {project.type || project.buildType || "Project"}
        </span>

        {/* Status pill */}
        <span style={badgeStyle(statusColor)}>{displayStatus}</span>

        <div style={{ flex: 1 }} />

        {/* Buildxact-style finance strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          {total > 0 && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: _.muted, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {isEstimate ? "Quote Total" : "Contract Total"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: _.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                {fmt(total)}
              </div>
            </div>
          )}
          {!isEstimate && (
            <>
              <div style={{ textAlign: "right", minWidth: 108 }}>
                <div style={{ fontSize: 11, color: _.muted, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Margin
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: _.ink }}>
                  {marginPct.toFixed(1)}%
                </div>
                <div style={{ fontSize: 11, color: _.muted }}>{fmt(marginValue)}</div>
              </div>
              <div style={{ textAlign: "right", minWidth: 108 }}>
                <div style={{ fontSize: 11, color: _.muted, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Outstanding
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: _.ink }}>
                  {fmt(outstanding)}
                </div>
              </div>
            </>
          )}
        </div>
        <Button size="sm" onClick={showConvertPrimary ? convertToJob : () => navigate("variations")}>
          {showConvertPrimary ? "Convert to Job" : "Add Variation"}
        </Button>
      </div>

      {/* ─── Tab bar ─── */}
      <div style={{
        display: "flex", gap: 0,
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        overflowX: "auto", marginBottom: 24,
      }}>
        {tabs.map(t => {
          const active = resolvedActive === t.path;
          const locked = !!t.isLocked?.(project);

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
