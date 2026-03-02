import { useLocation, useNavigate, useParams } from "react-router-dom";
import { BarChart3, PenLine, FileText, Receipt, BookOpen, Menu, LayoutDashboard, FolderOpen, Users } from "lucide-react";
import _ from "../../theme/tokens.js";
import { useState } from "react";

const GLOBAL_TABS = [
  { path: "/dashboard", label: "Home", Ic: LayoutDashboard },
  { path: "/projects", label: "Projects", Ic: FolderOpen },
  { path: "/clients", label: "Clients", Ic: Users },
];

const PROJECT_TABS = [
  { path: "overview", label: "Overview", Ic: BarChart3 },
  { path: "quote", label: "Quote", Ic: PenLine },
  { path: "proposals", label: "Proposals", Ic: FileText },
  { path: "invoices", label: "Invoices", Ic: Receipt },
  { path: "site-diary", label: "Diary", Ic: BookOpen },
];

export default function MobileBottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const isProject = !!params.id;
  const tabs = isProject ? PROJECT_TABS : GLOBAL_TABS;

  const isActive = (path) => {
    if (isProject) return location.pathname.includes(`/${path}`);
    return location.pathname.startsWith(path);
  };

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: _.surface, borderTop: `1px solid ${_.line}`,
      display: "flex", justifyContent: "space-around",
      padding: "6px 0 env(safe-area-inset-bottom, 6px)",
    }}>
      {tabs.map(item => {
        const active = isActive(item.path);
        return (
          <div key={item.path} onClick={() => {
            if (isProject) navigate(`/projects/${params.id}/${item.path}`);
            else navigate(item.path);
          }} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            padding: "4px 0", minWidth: 56, minHeight: 44, justifyContent: "center",
            cursor: "pointer", color: active ? _.ac : _.muted, transition: "color 0.15s",
          }}>
            <item.Ic size={20} strokeWidth={active ? 2 : 1.5} />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
