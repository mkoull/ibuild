import { memo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { BarChart3, PenLine, Ruler, DollarSign, ClipboardList, FileText, ArrowUpRight, Receipt, BookOpen, AlertTriangle, Wrench, FolderOpen, Users, Building2, Library, Settings, LayoutDashboard, ArrowLeft, Calendar, PieChart, Hammer } from "lucide-react";
import _ from "../../theme/tokens.js";
import { useProjectsCtx } from "../../context/AppContext.jsx";
import { pName } from "../../theme/styles.js";

const GLOBAL_NAV = [
  { group: "MAIN", items: [
    { path: "/dashboard", label: "Dashboard", Ic: LayoutDashboard },
    { path: "/quotes", label: "Quotes", Ic: FileText },
    { path: "/jobs", label: "Jobs", Ic: Hammer },
    { path: "/projects", label: "All Projects", Ic: FolderOpen },
  ]},
  { group: "MASTER DATA", items: [
    { path: "/clients", label: "Clients", Ic: Users },
    { path: "/trades", label: "Trades", Ic: Building2 },
    { path: "/rate-library", label: "Rate Library", Ic: Library },
  ]},
  { group: "SYSTEM", items: [
    { path: "/settings", label: "Settings", Ic: Settings },
  ]},
];

const PROJECT_NAV = [
  { group: "PROJECT", items: [
    { path: "overview", label: "Overview", Ic: BarChart3 },
    { path: "quote", label: "Quote", Ic: PenLine },
    { path: "plans", label: "Plans AI", Ic: Ruler },
    { path: "costs", label: "Costs", Ic: DollarSign },
    { path: "schedule", label: "Schedule", Ic: ClipboardList },
  ]},
  { group: "FINANCIALS", items: [
    { path: "proposals", label: "Proposals", Ic: FileText },
    { path: "variations", label: "Variations", Ic: ArrowUpRight },
    { path: "invoices", label: "Invoices", Ic: Receipt },
    { path: "bills", label: "Bills", Ic: PieChart },
    { path: "documents", label: "Documents", Ic: FolderOpen },
  ]},
  { group: "SITE", items: [
    { path: "site-diary", label: "Site Diary", Ic: BookOpen },
    { path: "defects", label: "Defects", Ic: AlertTriangle },
    { path: "trades", label: "Trades", Ic: Wrench },
  ]},
];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { find, clients, saveStatus } = useProjectsCtx();

  const isProjectMode = !!params.id;

  const project = isProjectMode ? find(params.id) : null;

  const nav = isProjectMode ? PROJECT_NAV : GLOBAL_NAV;

  const isActive = (path) => {
    if (isProjectMode) {
      const full = `/projects/${params.id}/${path}`;
      return location.pathname.startsWith(full);
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside style={{
      width: 240, flexShrink: 0, background: _.sidebar,
      borderRight: `1px solid ${_.line}`, display: "flex", flexDirection: "column",
    }}>
      {/* Logo */}
      <div style={{ padding: `${_.s5}px ${_.s4}px ${_.s4}px`, display: "flex", alignItems: "center", gap: _.s2, borderBottom: `1px solid ${_.line}` }}>
        <div onClick={() => navigate("/dashboard")} style={{
          width: 26, height: 26, background: _.ink, borderRadius: _.rMd,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: _.fontSize.sm, fontWeight: 800, color: "#fff", cursor: "pointer",
        }}>i</div>
        <span onClick={() => navigate("/dashboard")} style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold, color: _.ink, letterSpacing: _.letterSpacing.tight, cursor: "pointer" }}>iBuild</span>
        <div style={{ flex: 1 }} />
        {saveStatus && <span style={{ fontSize: _.fontSize.xs, color: _.faint, fontWeight: _.fontWeight.medium, whiteSpace: "nowrap" }}>
          {saveStatus === "saving" ? "Saving\u2026" : `Saved ${saveStatus}`}
        </span>}
      </div>

      {/* Project header in project mode */}
      {isProjectMode && project && (
        <div style={{ padding: `${_.s3}px ${_.s3}px`, borderBottom: `1px solid ${_.line}` }}>
          <div onClick={() => navigate("/projects")} style={{
            display: "flex", alignItems: "center", gap: 6, padding: `${_.s1}px 0`,
            cursor: "pointer", fontSize: _.fontSize.sm, color: _.muted, fontWeight: _.fontWeight.medium,
            transition: `color ${_.tr}`,
          }}
          onMouseEnter={e => e.currentTarget.style.color = _.ink}
          onMouseLeave={e => e.currentTarget.style.color = _.muted}
          >
            <ArrowLeft size={13} /> Back to Projects
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: _.ink }}>
              {pName(project, clients)}
            </div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginTop: 1 }}>
              {project.stage || project.status} · {project.buildType || project.type}
            </div>
          </div>
        </div>
      )}

      {/* Nav groups */}
      <div style={{ flex: 1, overflowY: "auto", padding: `${_.s2}px 0` }}>
        {nav.map(g => (
          <div key={g.group} style={{ marginBottom: _.s2 }}>
            <div style={{ padding: `${_.s3}px ${_.s4}px ${_.s1}px`, fontSize: _.fontSize.xs, fontWeight: _.fontWeight.bold, color: _.muted, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase" }}>
              {g.group}
            </div>
            {g.items.map(item => {
              const active = item.path ? isActive(item.path) : false;
              if (item.disabled) {
                return (
                  <div key={item.label} style={{
                    display: "flex", alignItems: "center", gap: _.s2, padding: `7px ${_.s4}px`, fontSize: _.fontSize.base,
                    borderLeft: "2px solid transparent", color: _.faint, cursor: "default",
                  }}>
                    <item.Ic size={15} strokeWidth={1.5} />
                    {item.label}
                    <span style={{ fontSize: 9, fontWeight: _.fontWeight.semi, color: _.faint, marginLeft: "auto" }}>SOON</span>
                  </div>
                );
              }
              return (
                <div key={item.path} onClick={() => {
                  if (isProjectMode) navigate(`/projects/${params.id}/${item.path}`);
                  else navigate(item.path);
                }} style={{
                  display: "flex", alignItems: "center", gap: _.s2, padding: `7px ${_.s4}px`, fontSize: _.fontSize.base, cursor: "pointer",
                  borderLeft: active ? `2px solid ${_.ink}` : "2px solid transparent",
                  background: active ? "rgba(0,0,0,0.05)" : "transparent",
                  color: active ? _.ink : _.body,
                  fontWeight: active ? _.fontWeight.semi : _.fontWeight.normal,
                  transition: `all 0.1s ease`,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <item.Ic size={15} strokeWidth={active ? 2 : 1.5} />
                  {item.label}
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
