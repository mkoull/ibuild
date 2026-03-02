import { memo, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ClipboardList, FileText, Users, ListChecks, BriefcaseBusiness, CalendarClock,
  Landmark, GitCompareArrows, ShoppingCart, Wrench, ReceiptText, FileCheck,
  HandCoins, FolderOpen, NotebookText, Bug, HardHat, ArrowLeft, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import _ from "../../theme/tokens.js";
import { useProjectsCtx } from "../../context/AppContext.jsx";
import { pName } from "../../theme/styles.js";
import { calc } from "../../lib/calc.js";
import { isJob } from "../../lib/lifecycle.js";

const GLOBAL_NAV = [
  { group: "LEADS & CLIENTS", items: [
    { path: "/clients", label: "Clients", Ic: Users },
    { path: "/leads", label: "Leads", Ic: ClipboardList },
  ]},
  { group: "PRE-CONSTRUCTION", items: [
    { path: "/projects", label: "Scope", Ic: ListChecks },
    { path: "/quotes", label: "Proposal", Ic: FileCheck },
    { path: "/quotes", label: "Quote", Ic: FileText },
  ]},
  { group: "JOB", items: [
    { path: "/jobs", label: "Job Details", Ic: BriefcaseBusiness },
    { path: "/jobs", label: "Schedule", Ic: CalendarClock },
    { path: "/jobs", label: "Cost Tracker", Ic: Landmark },
    { path: "/jobs", label: "Variations", Ic: GitCompareArrows },
    { path: "/jobs", label: "Purchase Orders", Ic: ShoppingCart },
    { path: "/jobs", label: "Work Orders", Ic: Wrench },
  ]},
  { group: "FINANCIALS", items: [
    { path: "/jobs", label: "Invoices", Ic: ReceiptText },
    { path: "/jobs", label: "Bills", Ic: FileText },
    { path: "/jobs", label: "Payments", Ic: HandCoins },
  ]},
  { group: "SITE", items: [
    { path: "/jobs", label: "Documents", Ic: FolderOpen },
    { path: "/jobs", label: "Site Diary", Ic: NotebookText },
    { path: "/jobs", label: "Defects", Ic: Bug },
    { path: "/trades", label: "Trades", Ic: HardHat },
  ]},
];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { find, clients, saveStatus } = useProjectsCtx();

  const isProjectMode = !!params.id;

  const project = isProjectMode ? find(params.id) : null;
  const projectIsJob = !!project && isJob(project.stage || project.status);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "74px" : "250px");
    return () => {
      document.documentElement.style.setProperty("--sidebar-w", "250px");
    };
  }, [collapsed]);

  const PROJECT_NAV = [
    { group: "LEADS & CLIENTS", items: [
      { path: "overview", label: "Clients", Ic: Users },
      { path: "overview", label: "Leads", Ic: ClipboardList },
    ]},
    { group: "PRE-CONSTRUCTION", items: [
      { path: "scope", label: "Scope", Ic: ListChecks },
      { path: "proposals", label: "Proposal", Ic: FileCheck },
      { path: "quote", label: "Quote", Ic: FileText },
    ]},
    { group: "JOB", items: [
      { path: "overview", label: "Job Details", Ic: BriefcaseBusiness },
      { path: "schedule", label: "Schedule", Ic: CalendarClock },
      { path: "costs", label: "Cost Tracker", Ic: Landmark },
      { path: "variations", label: "Variations", Ic: GitCompareArrows },
      { path: "purchase-orders", label: "Purchase Orders", Ic: ShoppingCart },
      { path: "work-orders", label: "Work Orders", Ic: Wrench },
    ]},
    { group: "FINANCIALS", items: [
      { path: "invoices", label: "Invoices", Ic: ReceiptText },
      { path: "bills", label: "Bills", Ic: FileText },
      { path: "payments", label: "Payments", Ic: HandCoins },
    ]},
    { group: "SITE", items: [
      { path: "documents", label: "Documents", Ic: FolderOpen },
      { path: "site-diary", label: "Site Diary", Ic: NotebookText },
      { path: "defects", label: "Defects", Ic: Bug },
      { path: "trades", label: "Trades", Ic: HardHat },
    ]},
  ];

  const nav = isProjectMode ? PROJECT_NAV : GLOBAL_NAV;
  const totals = project ? calc(project) : null;
  const variance = totals ? totals.revisedBudget - totals.combinedActuals : 0;

  const isActive = (path) => {
    if (isProjectMode) {
      const full = `/projects/${params.id}/${path}`;
      return location.pathname.startsWith(full);
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0,
      width: collapsed ? 74 : 250,
      background: "#111827",
      borderRight: "1px solid rgba(148,163,184,0.22)", display: "flex", flexDirection: "column",
      zIndex: 40,
      transition: "width 0.15s ease",
    }}>
      <div style={{ padding: `${_.s3}px ${_.s3}px`, display: "flex", alignItems: "center", gap: _.s2, borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
        <div onClick={() => navigate("/dashboard")} style={{
          width: 24, height: 24, background: "#0f172a", borderRadius: _.rMd,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: _.fontSize.sm, fontWeight: 800, color: "#dbeafe", cursor: "pointer",
        }}>i</div>
        {!collapsed && <span onClick={() => navigate("/dashboard")} style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold, color: "#e5e7eb", letterSpacing: _.letterSpacing.tight, cursor: "pointer" }}>iBuild</span>}
        <div style={{ flex: 1 }} />
        {!collapsed && saveStatus && <span style={{ fontSize: _.fontSize.xs, color: "#94a3b8", fontWeight: _.fontWeight.medium, whiteSpace: "nowrap" }}>
          {saveStatus === "saving" ? "Saving\u2026" : `Saved ${saveStatus}`}
        </span>}
        <div
          onClick={() => setCollapsed(v => !v)}
          style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderRadius: _.rSm, color: "#cbd5e1", background: "rgba(148,163,184,0.12)" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </div>
      </div>

      {isProjectMode && project && (
        <div style={{ padding: `${_.s2}px ${_.s3}px`, borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
          <div onClick={() => navigate("/projects")} style={{
            display: "flex", alignItems: "center", gap: 6, padding: `${_.s1}px 0`,
            cursor: "pointer", fontSize: _.fontSize.sm, color: "#93c5fd", fontWeight: _.fontWeight.medium,
            transition: `color ${_.tr}`,
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#dbeafe"}
          onMouseLeave={e => e.currentTarget.style.color = "#93c5fd"}
          >
            <ArrowLeft size={13} /> Back to Projects
          </div>
          {!collapsed && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#f8fafc" }}>
              {pName(project, clients)}
            </div>
            <div style={{ fontSize: _.fontSize.xs, color: "#94a3b8", marginTop: 1 }}>
              {project.stage || project.status} · {project.buildType || project.type}
            </div>
            {projectIsJob && totals && (
              <div style={{ marginTop: 6, fontSize: _.fontSize.xs, color: "#cbd5e1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                <span>B {totals.revisedBudget > 0 ? `$${Math.round(totals.revisedBudget).toLocaleString()}` : "—"}</span>
                <span>A {totals.combinedActuals > 0 ? `$${Math.round(totals.combinedActuals).toLocaleString()}` : "—"}</span>
                <span style={{ color: variance >= 0 ? "#34d399" : "#fca5a5" }}>V {variance >= 0 ? "+" : ""}${Math.round(variance).toLocaleString()}</span>
                <span style={{ color: totals.marginPctNew >= 0 ? "#34d399" : "#fca5a5" }}>P {totals.marginPctNew.toFixed(1)}%</span>
              </div>
            )}
          </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: `${_.s1}px 0` }}>
        {nav.map(g => (
          <div key={g.group} style={{ marginBottom: _.s1 }}>
            {!collapsed && <div style={{ padding: `${_.s2}px ${_.s3}px ${_.s1}px`, fontSize: _.fontSize.xs, fontWeight: _.fontWeight.bold, color: "#64748b", letterSpacing: _.letterSpacing.wider, textTransform: "uppercase" }}>
              {g.group}
            </div>}
            {g.items.map(item => {
              const active = item.path ? isActive(item.path) : false;
              return (
                <div key={item.path} onClick={() => {
                  if (isProjectMode) navigate(`/projects/${params.id}/${item.path}`);
                  else navigate(item.path);
                }} style={{
                  display: "flex", alignItems: "center", gap: _.s2, padding: collapsed ? "8px 0" : "7px 10px", justifyContent: collapsed ? "center" : "flex-start", fontSize: _.fontSize.base, cursor: "pointer",
                  borderLeft: active ? "2px solid #60a5fa" : "2px solid transparent",
                  background: active ? "rgba(59,130,246,0.16)" : "transparent",
                  color: active ? "#f8fafc" : "#cbd5e1",
                  fontWeight: active ? _.fontWeight.semi : _.fontWeight.normal,
                  transition: `all 0.1s ease`,
                  margin: collapsed ? "1px 6px" : "1px 6px",
                  borderRadius: _.rSm,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(148,163,184,0.12)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                title={item.label}
                >
                  <item.Ic size={15} strokeWidth={active ? 2 : 1.5} />
                  {!collapsed && item.label}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}

export default memo(Sidebar);
