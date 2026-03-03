import { memo, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useProjectsCtx } from "../../context/AppContext.jsx";
import { NAV_STRUCTURE } from "../../config/navStructure.js";

/* ─── Sidebar palette (desaturated navy) ─── */
const S = {
  bg:       "#1a1f2e",
  border:   "rgba(255,255,255,0.06)",
  text:     "#7c8497",
  textHi:   "#e2e6ef",
  hover:    "rgba(255,255,255,0.04)",
  activeBg: "rgba(99,142,255,0.08)",
  accent:   "#6B8AFF",
  logo:     "#0f1420",
  logoBrand:"#dbeafe",
};

const W_COLLAPSED = 72;
const W_EXPANDED = 240;

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { saveStatus } = useProjectsCtx();
  const [collapsed, setCollapsed] = useState(false);
  const w = collapsed ? W_COLLAPSED : W_EXPANDED;

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", `${w}px`);
    return () => document.documentElement.style.setProperty("--sidebar-w", `${W_EXPANDED}px`);
  }, [w]);

  const nav = NAV_STRUCTURE.global;
  const activeMap = NAV_STRUCTURE.activeMap;

  const isActive = (item) => {
    const routes = activeMap[item.id] || [item.to];
    return routes.some(r => location.pathname.startsWith(r));
  };

  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0, width: w,
      background: S.bg, borderRight: `1px solid ${S.border}`,
      display: "flex", flexDirection: "column", zIndex: 40,
      transition: "width 0.15s ease",
    }}>
      {/* ─── Logo ─── */}
      <div style={{
        height: 56, display: "flex", alignItems: "center",
        padding: collapsed ? "0 22px" : "0 16px", gap: 10,
        borderBottom: `1px solid ${S.border}`,
      }}>
        <div onClick={() => navigate("/dashboard")} style={{
          width: 28, height: 28, borderRadius: 7, background: S.logo,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: S.logoBrand, cursor: "pointer",
          flexShrink: 0,
        }}>i</div>
        {!collapsed && (
          <span onClick={() => navigate("/dashboard")} style={{
            fontSize: 15, fontWeight: 700, color: S.textHi,
            letterSpacing: "-0.03em", cursor: "pointer",
          }}>iBuild</span>
        )}
        <div style={{ flex: 1 }} />
        {!collapsed && saveStatus && (
          <span style={{ fontSize: 10, color: S.text, fontWeight: 500, whiteSpace: "nowrap" }}>
            {saveStatus === "saving" ? "Saving\u2026" : `Saved ${saveStatus}`}
          </span>
        )}
      </div>

      {/* ─── Navigation ─── */}
      <nav style={{ flex: 1, padding: "8px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map(item => {
          const active = isActive(item);
          return (
            <div key={item.id} onClick={() => navigate(item.to)} title={item.label} style={{
              display: "flex", alignItems: "center", gap: 12,
              height: 40, borderRadius: 6,
              padding: collapsed ? "0" : "0 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              cursor: "pointer",
              background: active ? S.activeBg : "transparent",
              borderLeft: active ? `2px solid ${S.accent}` : "2px solid transparent",
              color: active ? S.textHi : S.text,
              fontWeight: active ? 600 : 400,
              fontSize: 13,
              transition: "all 0.12s ease",
              boxShadow: active ? `0 0 12px rgba(107,138,255,0.06)` : "none",
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = S.hover; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? S.activeBg : "transparent"; }}
            >
              <item.Ic size={18} strokeWidth={active ? 2 : 1.5} />
              {!collapsed && <span>{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* ─── Collapse toggle ─── */}
      <div style={{ padding: "12px 8px", borderTop: `1px solid ${S.border}` }}>
        <div onClick={() => setCollapsed(v => !v)} title={collapsed ? "Expand" : "Collapse"} style={{
          display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
          gap: 10, height: 36, borderRadius: 6,
          padding: collapsed ? 0 : "0 12px",
          cursor: "pointer", color: S.text, fontSize: 12,
          transition: "all 0.12s ease",
        }}
          onMouseEnter={e => e.currentTarget.style.background = S.hover}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          {!collapsed && <span>Collapse</span>}
        </div>
      </div>
    </aside>
  );
}

export default memo(Sidebar);
