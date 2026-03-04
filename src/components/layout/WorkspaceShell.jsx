import { useMemo } from "react";
import { useParams, Outlet, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useProjectsCtx } from "../../context/AppContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { ProjectProvider } from "../../context/ProjectContext.jsx";
import { calc } from "../../lib/calc.js";
import { JOB_TABS, PROJECT_WORKFLOW_SECTIONS, displayStage, getProjectTabUrl } from "../../config/workspaceTabs.js";
import { applyConvertToJobBaseline, calculateTotals } from "../../lib/costEngine.js";
import _ from "../../theme/tokens.js";
import { fmt, pName, stCol, badge as badgeStyle } from "../../theme/styles.js";
import Button from "../ui/Button.jsx";

const LIFECYCLE_STEPS = ["Lead", "Quoted", "Approved", "Active", "Complete"];

function lifecycleIndex(stage) {
  const s = String(stage || "").toLowerCase();
  if (s === "invoiced") return LIFECYCLE_STEPS.indexOf("Active");
  const direct = LIFECYCLE_STEPS.findIndex((x) => x.toLowerCase() === s);
  return direct >= 0 ? direct : 0;
}

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
  const estimateTotals = calculateTotals(project?.estimate?.categories || project?.costCategories || []);
  const activeContract = Number(project?.job?.contract?.currentContractValue) || 0;
  const total = isActiveStage ? activeContract : estimateTotals.totalSell;
  const baselineSell = Number(project?.job?.baseline?.totals?.totalSell) || 0;
  const marginPct = Number(totals?.marginPctNew ?? totals?.marginPctCalc ?? 0);
  const outstanding = Number(totals?.outstanding || 0);
  const marginValue = Number(totals?.forecastMarginNew ?? totals?.forecastMargin ?? 0);
  const createdAt = project?.createdAt ? new Date(project.createdAt) : null;
  const createdLabel = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
    : "Unknown";
  const stageIdx = lifecycleIndex(stage);

  // Active tab detection (robust against nested routes)
  const projectBase = isEstimate ? `/estimates/${entityId}` : `/projects/${entityId}`;
  const resolvedActive = tabs.find((t) => {
    const tabBase = `${projectBase}/${t.path}`;
    return location.pathname === tabBase || location.pathname.startsWith(`${tabBase}/`);
  })?.path || tabs.find((t) => !(t.isLocked?.(project)))?.path || "overview";
  const activeTab = tabs.find((t) => t.path === resolvedActive) || tabs[0];
  const activeSectionKey = PROJECT_WORKFLOW_SECTIONS.find((section) => (
    section.tabs.includes(activeTab?.key)
  ))?.key;
  const showConvertPrimary = !isActiveStage;
  const overviewUrl = isEstimate ? `${projectBase}/overview` : getProjectTabUrl(entityId, "overview");
  const variationsUrl = isEstimate ? `${projectBase}/variations` : getProjectTabUrl(entityId, "variations");

  const convertToJob = () => {
    let converted = false;
    update(project.id, (pr) => {
      converted = applyConvertToJobBaseline(pr);
      return pr;
    });
    if (!converted) {
      notify("Already converted to job.");
      return;
    }
    notify("Project converted to job");
    navigate(overviewUrl);
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

        <div style={{ flex: 1 }} />

        {/* Buildxact-style finance strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontSize: 11, color: _.muted, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Status
            </div>
            <span style={badgeStyle(statusColor)}>{displayStatus}</span>
            <div style={{ fontSize: 11, color: _.muted, marginTop: 4 }}>
              Created {createdLabel}
            </div>
          </div>
          {total > 0 && (
            <div style={{ textAlign: "right", flexShrink: 0, minWidth: 170 }}>
              <div style={{ fontSize: 11, color: _.muted, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {isActiveStage ? "Contract Value" : "Estimate Total"}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: _.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                {fmt(total)}
              </div>
              {isActiveStage && baselineSell > 0 && (
                <div style={{ fontSize: 11, color: _.muted, marginTop: 4 }}>
                  Baseline: {fmt(baselineSell)}
                </div>
              )}
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
        <Button size="sm" onClick={showConvertPrimary ? convertToJob : () => navigate(variationsUrl)}>
          {showConvertPrimary ? "Convert to Job" : "Add Variation"}
        </Button>
      </div>

      {/* ─── Workflow navigation ─── */}
      <div style={{
        display: "flex",
        gap: 8,
        alignItems: "stretch",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        overflowX: "auto",
        marginBottom: 24,
        paddingBottom: 10,
      }}>
        {PROJECT_WORKFLOW_SECTIONS.map((section) => {
          const sectionActive = section.key === activeSectionKey;
          return (
            <div
              key={section.key}
              style={{
                minWidth: 160,
                border: `1px solid ${sectionActive ? `${_.ac}55` : _.line}`,
                borderRadius: _.rSm,
                background: sectionActive ? `${_.ac}08` : _.surface,
                padding: "8px 10px",
                boxShadow: sectionActive ? `inset 0 0 0 1px ${_.ac}22` : "none",
                flexShrink: 0,
              }}
            >
              <div style={{
                fontSize: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: sectionActive ? _.ac : _.muted,
                fontWeight: 700,
                marginBottom: 6,
              }}>
                {section.label}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {section.tabs.map((tabKey) => {
                  const tab = tabs.find((x) => x.key === tabKey);
                  if (!tab) return null;
                  const active = resolvedActive === tab.path;
                  const tabUrl = isEstimate ? `${projectBase}/${tab.path}` : getProjectTabUrl(entityId, tab.key);
                  return (
                    <NavLink
                      key={tab.key}
                      to={tabUrl}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: active ? 700 : 500,
                        color: active ? _.ink : _.muted,
                        background: active ? `${_.ac}18` : "transparent",
                        border: `1px solid ${active ? `${_.ac}55` : "transparent"}`,
                        whiteSpace: "nowrap",
                        transition: "all 0.1s ease",
                        textDecoration: "none",
                      }}
                    >
                      {tab.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 0, alignItems: "center", marginBottom: 18, overflowX: "auto" }}>
        {LIFECYCLE_STEPS.map((s, idx) => {
          const active = idx <= stageIdx;
          const current = idx === stageIdx;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 92 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: active ? _.ac : _.line2,
                  boxShadow: current ? `0 0 0 3px ${_.ac}22` : "none",
                }} />
                <div style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: current ? _.ink : _.muted,
                  fontWeight: current ? 600 : 500,
                  whiteSpace: "nowrap",
                }}>
                  {s}
                </div>
              </div>
              {idx < LIFECYCLE_STEPS.length - 1 && (
                <div style={{
                  width: 42,
                  height: 1,
                  background: idx < stageIdx ? `${_.ac}88` : _.line2,
                  margin: "0 4px",
                }} />
              )}
            </div>
          );
        })}
      </div>

      <Outlet />
    </ProjectProvider>
  );
}
