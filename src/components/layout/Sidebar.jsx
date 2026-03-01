import { useLocation, useNavigate, useParams } from "react-router-dom";
import { BarChart3, PenLine, Ruler, DollarSign, ClipboardList, FileText, ArrowUpRight, Receipt, BookOpen, AlertTriangle, Wrench, FolderOpen, Users, Building2, Library, Settings, LayoutDashboard, ArrowLeft } from "lucide-react";
import _ from "../../theme/tokens.js";
import { useApp } from "../../context/AppContext.jsx";
import { pName } from "../../theme/styles.js";

const GLOBAL_NAV = [
  { group: "MAIN", items: [
    { path: "/dashboard", label: "Dashboard", Ic: LayoutDashboard },
    { path: "/projects", label: "Projects", Ic: FolderOpen },
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
    { path: "scope", label: "Scope/Quote", Ic: PenLine },
    { path: "plans", label: "Plans AI", Ic: Ruler },
    { path: "costs", label: "Costs", Ic: DollarSign },
    { path: "schedule", label: "Schedule", Ic: ClipboardList },
  ]},
  { group: "DOCUMENTS", items: [
    { path: "proposals", label: "Proposals", Ic: FileText },
    { path: "variations", label: "Variations", Ic: ArrowUpRight },
    { path: "invoices", label: "Invoices", Ic: Receipt },
    { path: "documents", label: "Documents", Ic: FolderOpen },
  ]},
  { group: "SITE", items: [
    { path: "site-diary", label: "Site Diary", Ic: BookOpen },
    { path: "defects", label: "Defects", Ic: AlertTriangle },
    { path: "trades", label: "Trades", Ic: Wrench },
  ]},
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { projects, clients, saveStatus } = useApp();

  const isProjectMode = !!params.id;

  const project = isProjectMode ? projects.find(p => p.id === params.id) : null;

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
      width: 240, flexShrink: 0, background: "#ECEDF0",
      borderRight: `1px solid ${_.line}`, display: "flex", flexDirection: "column",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${_.line}` }}>
        <div onClick={() => navigate("/dashboard")} style={{
          width: 24, height: 24, background: _.ink, borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: "#fff", cursor: "pointer",
        }}>i</div>
        <span onClick={() => navigate("/dashboard")} style={{ fontSize: 14, fontWeight: 700, color: _.ink, letterSpacing: "-0.03em", cursor: "pointer" }}>iBuild</span>
        <div style={{ flex: 1 }} />
        {saveStatus && <span style={{ fontSize: 10, color: _.faint, fontWeight: 500, whiteSpace: "nowrap" }}>
          {saveStatus === "saving" ? "Saving\u2026" : `Saved ${saveStatus}`}
        </span>}
      </div>

      {/* Project header in project mode */}
      {isProjectMode && project && (
        <div style={{ padding: "10px 12px", borderBottom: `1px solid ${_.line}` }}>
          <div onClick={() => navigate("/projects")} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "4px 0",
            cursor: "pointer", fontSize: 12, color: _.muted, fontWeight: 500,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = _.ink}
          onMouseLeave={e => e.currentTarget.style.color = _.muted}
          >
            <ArrowLeft size={13} /> Back to Projects
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: _.ink }}>
              {pName(project, clients)}
            </div>
            <div style={{ fontSize: 11, color: _.muted, marginTop: 1 }}>
              {project.stage || project.status} · {project.buildType || project.type}
            </div>
          </div>
        </div>
      )}

      {/* Nav groups */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {nav.map(g => (
          <div key={g.group} style={{ marginBottom: 8 }}>
            <div style={{ padding: "12px 16px 4px", fontSize: 10, fontWeight: 700, color: _.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {g.group}
            </div>
            {g.items.map(item => {
              const active = isActive(item.path);
              return (
                <div key={item.path} onClick={() => {
                  if (isProjectMode) navigate(`/projects/${params.id}/${item.path}`);
                  else navigate(item.path);
                }} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer",
                  borderLeft: active ? `2px solid ${_.ink}` : "2px solid transparent",
                  background: active ? "rgba(0,0,0,0.05)" : "transparent",
                  color: active ? _.ink : _.body,
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.1s ease",
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
