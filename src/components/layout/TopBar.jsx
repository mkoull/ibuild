import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { pName } from "../../theme/styles.js";
import { Search, Plus, FolderOpen, Users, Building2 } from "lucide-react";

/* ─── Route → title mapping ─── */
const ROUTE_TITLES = {
  "/dashboard":  "Dashboard",
  "/projects":   "All Projects",
  "/estimates":  "Estimates",
  "/quotes":     "Quotes",
  "/jobs":       "Jobs",
  "/leads":      "Leads",
  "/clients":    "Clients",
  "/invoices":   "Invoices",
  "/bills":      "Bills",
  "/payments":   "Payments",
  "/documents":  "Documents",
  "/site-diary": "Site Diary",
  "/defects":    "Defects",
  "/trades":     "Trades",
  "/rate-library": "Rate Library",
  "/settings":   "Settings",
};

export default function TopBar() {
  const { projects, clients, create, clientsHook, tradesHook, notify, settings } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [showCreate, setShowCreate] = useState(false);
  const createRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (createRef.current && !createRef.current.contains(e.target)) setShowCreate(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Emit custom event to open CommandBar
  const openSearch = useCallback(() => {
    window.dispatchEvent(new CustomEvent("open-command-bar"));
  }, []);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openSearch]);

  // Derive contextual title
  const currentProject = params.id ? projects.find(p => p.id === params.id) : null;
  let title = "";
  if (currentProject) {
    title = pName(currentProject, clients);
  } else {
    const path = location.pathname;
    for (const [route, t] of Object.entries(ROUTE_TITLES)) {
      if (path === route || (route !== "/" && path.startsWith(route + "/"))) { title = t; break; }
    }
    if (!title) {
      for (const [route, t] of Object.entries(ROUTE_TITLES)) {
        if (route !== "/" && path.startsWith(route)) { title = t; break; }
      }
    }
  }

  const handleNewProject = () => {
    const p = create({
      marginPct: settings.defaultMargin ?? 18,
      contingencyPct: settings.defaultContingency ?? 5,
      validDays: settings.defaultValidDays ?? 30,
    });
    navigate(`/estimates/${p.id}/overview`);
    notify("New estimate created");
    setShowCreate(false);
  };

  const handleNewClient = () => {
    const c = clientsHook.create();
    navigate(`/clients/${c.id}`);
    notify("New client created");
    setShowCreate(false);
  };

  const handleNewTrade = () => {
    const t = tradesHook.create();
    navigate(`/trades/${t.id}`);
    notify("New trade created");
    setShowCreate(false);
  };

  return (
    <div style={{
      position: "sticky", top: 0, height: 56,
      display: "flex", alignItems: "center", gap: _.s4,
      padding: "0 32px", background: _.surface,
      borderBottom: "1px solid rgba(0,0,0,0.06)",
      zIndex: 100,
    }}>
      {/* Contextual title */}
      <div style={{ fontSize: 15, fontWeight: 600, color: _.ink, letterSpacing: "-0.01em" }}>
        {title}
      </div>

      <div style={{ flex: 1 }} />

      {/* Search trigger */}
      <div onClick={openSearch} style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 14px", borderRadius: 8,
        background: _.well, cursor: "pointer",
        transition: `all ${_.tr}`, minWidth: 200,
      }}
        onMouseEnter={e => e.currentTarget.style.background = _.line}
        onMouseLeave={e => e.currentTarget.style.background = _.well}
      >
        <Search size={14} color={_.muted} />
        <span style={{ fontSize: 13, color: _.muted, flex: 1 }}>Search projects, quotes, invoices...</span>
        <kbd style={{
          fontSize: 10, color: _.faint, fontFamily: "inherit", fontWeight: 600,
          background: _.surface, border: `1px solid ${_.line}`,
          borderRadius: 4, padding: "1px 5px",
        }}>{navigator.platform?.includes("Mac") ? "\u2318K" : "Ctrl+K"}</kbd>
      </div>

      {/* Create dropdown */}
      <div ref={createRef} style={{ position: "relative" }}>
        <button onClick={() => setShowCreate(v => !v)} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 8,
          background: _.ink, color: "#fff", border: "none",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit", transition: `background ${_.tr}`,
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#1e293b"}
          onMouseLeave={e => e.currentTarget.style.background = _.ink}
        >
          <Plus size={14} strokeWidth={2.5} /> Create
        </button>

        {showCreate && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            minWidth: 200, background: _.surface,
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: 10, boxShadow: _.sh3,
            padding: "4px", animation: "fadeUp 0.12s ease",
            zIndex: 200,
          }}>
            {[
              { label: "New Project", Ic: FolderOpen, action: handleNewProject },
              { label: "New Client",  Ic: Users,      action: handleNewClient },
              { label: "New Trade",   Ic: Building2,   action: handleNewTrade },
            ].map(item => (
              <div key={item.label} onClick={item.action} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", borderRadius: 6,
                cursor: "pointer", fontSize: 13, color: _.ink,
                transition: `background ${_.tr}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <item.Ic size={15} color={_.body} strokeWidth={1.5} />
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
