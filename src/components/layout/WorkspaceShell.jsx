import { useMemo } from "react";
import { useParams, Outlet, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useProjectsCtx } from "../../context/AppContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { ProjectProvider } from "../../context/ProjectContext.jsx";
import { calc } from "../../lib/calc.js";
import { displayStage } from "../../config/workspaceTabs.js";
import { applyConvertToJobBaseline, calculateTotals } from "../../lib/costEngine.js";
import { isSubcontractor } from "../../lib/permissions.js";
import _ from "../../theme/tokens.js";
import { fmt, pName, stCol, badge as badgeStyle } from "../../theme/styles.js";
import Button from "../ui/Button.jsx";

const LIFECYCLE_STEPS = ["Lead", "Quoted", "Approved", "Active", "Complete"];
const WORKSPACE_SECTIONS = [
  { key: "overview", label: "Overview", path: "overview", matches: ["overview"] },
  { key: "estimate", label: "Estimate", path: "estimate", matches: ["estimate", "scope"] },
  { key: "quote", label: "Quote", path: "quote", matches: ["quote", "quote-review"] },
  { key: "build", label: "Build", path: "build", matches: ["build", "schedule", "procurement", "variations", "site-diary"] },
  { key: "financial", label: "Financial", path: "financial", matches: ["financial", "costs", "invoices"] },
  { key: "closeout", label: "Closeout", path: "closeout", matches: ["closeout", "defects", "documents"] },
];

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
  const { notify, currentUser } = useApp();
  const entityId = estimateId || jobId || id;
  const isEstimate = workspaceType === "estimate";

  const project = find(entityId);
  const totals = useMemo(() => project ? calc(project) : null, [project]);

  if (!project) return <Navigate to={isEstimate ? "/estimates" : "/jobs"} replace />;

  const stage = project.stage || project.status || "Lead";
  const isActiveStage = String(stage).toLowerCase() === "active";

  const breadcrumbLabel = isEstimate ? "Estimates" : "Jobs";
  const breadcrumbTo = isEstimate ? "/estimates" : "/jobs";

  const projectNumber = isEstimate
    ? (project.estimateNumber || "")
    : (project.jobNumber || project.estimateNumber || "");
  const linkedClient = project.clientId ? clients.find((c) => c.id === project.clientId) : null;
  const clientLabel = linkedClient?.displayName || project.client || "—";

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

  // Active section detection (robust against legacy nested routes)
  const projectBase = isEstimate ? `/estimates/${entityId}` : `/projects/${entityId}`;
  const activeLeaf = location.pathname.replace(`${projectBase}/`, "").split("/")[0] || "overview";
  const activeSectionKey = WORKSPACE_SECTIONS.find((section) => section.matches.includes(activeLeaf))?.key || "overview";
  const visibleSections = isSubcontractor(currentUser)
    ? WORKSPACE_SECTIONS.filter((s) => ["build", "closeout"].includes(s.key))
    : WORKSPACE_SECTIONS;
  const showConvertPrimary = !isActiveStage;
  const overviewUrl = `${projectBase}/overview`;
  const variationsUrl = `${projectBase}/variations`;

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

      {/* ─── Workspace section navigation ─── */}
      <div style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        overflowX: "auto",
        marginBottom: 24,
        paddingBottom: 10,
      }}>
        {visibleSections.map((section) => {
          const sectionActive = section.key === activeSectionKey;
          const sectionUrl = `${projectBase}/${section.path}`;
          return (
            <NavLink
              key={section.key}
              to={sectionUrl}
              style={{
                minWidth: 118,
                border: `1px solid ${sectionActive ? `${_.ac}55` : _.line}`,
                borderRadius: _.rSm,
                background: sectionActive ? `${_.ac}08` : _.surface,
                padding: "8px 12px",
                boxShadow: sectionActive ? `inset 0 0 0 1px ${_.ac}22` : "none",
                flexShrink: 0,
                textDecoration: "none",
                color: sectionActive ? _.ink : _.muted,
                fontSize: 13,
                fontWeight: sectionActive ? 700 : 600,
                textAlign: "center",
              }}
            >
              {section.label}
            </NavLink>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 18 }}>
        <div style={metaCellStyle}>
          <div style={metaLabelStyle}>Project</div>
          <div style={metaValueStyle}>{displayName}</div>
        </div>
        <div style={metaCellStyle}>
          <div style={metaLabelStyle}>Status</div>
          <div style={metaValueStyle}>{displayStatus}</div>
        </div>
        <div style={metaCellStyle}>
          <div style={metaLabelStyle}>Contract Value</div>
          <div style={metaValueStyle}>{fmt(total)}</div>
        </div>
        <div style={metaCellStyle}>
          <div style={metaLabelStyle}>Margin</div>
          <div style={metaValueStyle}>{marginPct.toFixed(1)}%</div>
        </div>
        <div style={metaCellStyle}>
          <div style={metaLabelStyle}>Client</div>
          <div style={metaValueStyle}>{clientLabel}</div>
        </div>
      </div>

      <Outlet />
    </ProjectProvider>
  );
}

const metaCellStyle = {
  border: `1px solid ${_.line}`,
  borderRadius: _.rSm,
  background: _.surface,
  padding: "10px 12px",
  minWidth: 0,
};

const metaLabelStyle = {
  fontSize: 11,
  color: _.muted,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontWeight: 600,
  marginBottom: 4,
};

const metaValueStyle = {
  fontSize: 14,
  color: _.ink,
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
