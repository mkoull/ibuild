import { memo, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, ChevronRight, ChevronDown } from "lucide-react";
import _ from "../../theme/tokens.js";
import { useProjectsCtx } from "../../context/AppContext.jsx";
import { NAV_STRUCTURE } from "../../config/navStructure.js";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { saveStatus } = useProjectsCtx();

  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "74px" : "250px");
    return () => {
      document.documentElement.style.setProperty("--sidebar-w", "250px");
    };
  }, [collapsed]);

  // Auto-expand group when any child route is active
  useEffect(() => {
    const checkActive = (child) => {
      if (child.to.includes("#")) {
        const [p, h] = child.to.split("#");
        return location.pathname.startsWith(p) && location.hash === `#${h}`;
      }
      const routePath = child.match || child.to;
      if (routePath === "/settings") return location.pathname === "/settings";
      return location.pathname.startsWith(routePath);
    };
    const next = {};
    for (const item of NAV_STRUCTURE.global) {
      if (item.type === "group") {
        if (item.children.some(checkActive)) next[item.id] = true;
      }
    }
    setExpanded(prev => {
      const merged = { ...prev };
      for (const key of Object.keys(next)) merged[key] = true;
      return merged;
    });
  }, [location.pathname, location.hash]);

  function isChildActive(child) {
    if (child.to.includes("#")) {
      const [p, h] = child.to.split("#");
      return location.pathname.startsWith(p) && location.hash === `#${h}`;
    }
    const routePath = child.match || child.to;
    // Exact match for /settings vs /settings/data
    if (routePath === "/settings") {
      return location.pathname === "/settings";
    }
    return location.pathname.startsWith(routePath);
  }

  function isLinkActive(item) {
    const routePath = item.match || item.to;
    return location.pathname.startsWith(routePath);
  }

  const toggleGroup = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const nav = NAV_STRUCTURE.global;

  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0,
      width: collapsed ? 74 : 250,
      background: "#111827",
      borderRight: "1px solid rgba(148,163,184,0.22)", display: "flex", flexDirection: "column",
      zIndex: 40,
      transition: "width 0.15s ease",
    }}>
      {/* Header */}
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

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: "auto", padding: `${_.s2}px 0` }}>
        {nav.map(item => {
          if (item.type === "link") {
            return renderLink(item);
          }
          return renderGroup(item);
        })}
      </div>
    </aside>
  );

  function renderLink(item) {
    const active = isLinkActive(item);
    return (
      <div key={item.id} onClick={() => navigate(item.to)} style={{
        display: "flex", alignItems: "center", gap: _.s2,
        padding: collapsed ? "8px 0" : "7px 10px",
        justifyContent: collapsed ? "center" : "flex-start",
        fontSize: _.fontSize.base, cursor: "pointer",
        background: active ? "rgba(148,163,184,0.10)" : "transparent",
        color: active ? "#f1f5f9" : "#94a3b8",
        fontWeight: active ? _.fontWeight.semi : _.fontWeight.normal,
        transition: "all 0.1s ease",
        margin: "1px 6px",
        borderRadius: _.rSm,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(148,163,184,0.08)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
      title={item.label}
      >
        <item.Ic size={14} strokeWidth={1.5} />
        {!collapsed && item.label}
      </div>
    );
  }

  function renderGroup(item) {
    const isOpen = !!expanded[item.id];
    const hasActive = item.children.some(c => isChildActive(c));

    // Collapsed: click navigates to first child
    if (collapsed) {
      return (
        <div key={item.id} onClick={() => navigate(item.children[0].to)} style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "8px 0", cursor: "pointer",
          background: hasActive ? "rgba(148,163,184,0.10)" : "transparent",
          color: hasActive ? "#f1f5f9" : "#94a3b8",
          transition: "all 0.1s ease",
          margin: "1px 6px",
          borderRadius: _.rSm,
        }}
        onMouseEnter={e => { if (!hasActive) e.currentTarget.style.background = "rgba(148,163,184,0.08)"; }}
        onMouseLeave={e => { if (!hasActive) e.currentTarget.style.background = "transparent"; }}
        title={item.label}
        >
          <item.Ic size={14} strokeWidth={1.5} />
        </div>
      );
    }

    return (
      <div key={item.id} style={{ marginBottom: 2 }}>
        {/* Group header */}
        <div onClick={() => toggleGroup(item.id)} style={{
          display: "flex", alignItems: "center", gap: _.s2,
          padding: "7px 10px", cursor: "pointer",
          color: hasActive ? "#f1f5f9" : "#94a3b8",
          fontWeight: hasActive ? _.fontWeight.semi : _.fontWeight.normal,
          fontSize: _.fontSize.base,
          transition: "all 0.1s ease",
          margin: "1px 6px",
          borderRadius: _.rSm,
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(148,163,184,0.08)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <item.Ic size={14} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>{item.label}</span>
          {isOpen
            ? <ChevronDown size={12} strokeWidth={1.5} style={{ color: "#64748b" }} />
            : <ChevronRight size={12} strokeWidth={1.5} style={{ color: "#64748b" }} />
          }
        </div>

        {/* Children */}
        {isOpen && (
          <div>
            {item.children.map(child => {
              const active = isChildActive(child);
              return (
                <div key={child.id} onClick={() => navigate(child.to)} style={{
                  padding: "6px 10px 6px 38px",
                  cursor: "pointer",
                  fontSize: _.fontSize.sm,
                  color: active ? "#f1f5f9" : "#94a3b8",
                  fontWeight: active ? _.fontWeight.semi : _.fontWeight.normal,
                  background: active ? "rgba(148,163,184,0.10)" : "transparent",
                  transition: "all 0.1s ease",
                  margin: "0 6px",
                  borderRadius: _.rSm,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(148,163,184,0.08)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  {child.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}

export default memo(Sidebar);
