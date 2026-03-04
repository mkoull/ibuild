import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { pName } from "../../theme/styles.js";
import { Search, Plus, Bell, FileText, HardHat, ReceiptText, ShoppingCart, ClipboardList, NotebookText, Bug, LogOut } from "lucide-react";
import { applyConvertToJobBaseline } from "../../lib/costEngine.js";
import { isSubcontractor } from "../../lib/permissions.js";

/* ─── Route → title mapping ─── */
const ROUTE_TITLES = {
  "/dashboard":  "Dashboard",
  "/portal":     "Subcontractor Portal",
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
  "/rate-library": "Cost Library",
  "/cost-library": "Cost Library",
  "/settings":   "Settings",
};

export default function TopBar() {
  const {
    projects,
    clients,
    create,
    update,
    notify,
    settings,
    notifications,
    unreadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    auth,
    currentUser,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [showCreate, setShowCreate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const createRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (createRef.current && !createRef.current.contains(e.target)) setShowCreate(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
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

  const currentWorkspaceProjectId = params.id || params.estimateId || "";
  const currentWorkspaceProject = currentWorkspaceProjectId
    ? projects.find((p) => p.id === currentWorkspaceProjectId)
    : null;
  const sortedProjects = [...projects].sort((a, b) => {
    const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return tb - ta;
  });
  const activeProjects = sortedProjects.filter((p) => String(p.stage || p.status || "").toLowerCase() === "active");
  const subRole = isSubcontractor(currentUser);

  const resolveTargetProject = (requireActive = true) => {
    if (currentWorkspaceProject) {
      const isActive = String(currentWorkspaceProject.stage || currentWorkspaceProject.status || "").toLowerCase() === "active";
      if (!requireActive || isActive) return currentWorkspaceProject;
    }
    if (requireActive) return activeProjects[0] || null;
    return sortedProjects[0] || null;
  };

  const openProjectCreateFlow = (path, label, requireActive = true) => {
    const target = resolveTargetProject(requireActive);
    if (!target) {
      notify(requireActive ? "Create or convert a project to an active job first" : "Create a project first", "info");
      navigate("/projects");
      setShowCreate(false);
      return;
    }
    navigate(`/projects/${target.id}/${path}?create=1`);
    notify(`${label} flow opened for ${pName(target, clients)}`);
    setShowCreate(false);
  };

  const handleNewEstimate = () => {
    navigate("/estimates/new");
    setShowCreate(false);
  };

  const handleNewJob = () => {
    const p = create({
      marginPct: settings.defaultMargin ?? 18,
      contingencyPct: settings.defaultContingency ?? 5,
      validDays: settings.defaultValidDays ?? 30,
    });
    update(p.id, (pr) => {
      applyConvertToJobBaseline(pr);
      return pr;
    });
    navigate(`/projects/${p.id}/overview`);
    notify("New job created");
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

      {/* Notifications */}
      <div ref={notificationsRef} style={{ position: "relative" }}>
        <button
          onClick={() => setShowNotifications((v) => !v)}
          style={{
            position: "relative",
            width: 34,
            height: 34,
            borderRadius: 8,
            border: `1px solid ${_.line}`,
            background: _.surface,
            color: _.body,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          title="Notifications"
        >
          <Bell size={16} />
          {unreadNotifications > 0 && (
            <span style={{
              position: "absolute",
              top: -5,
              right: -5,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 99,
              background: _.red,
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: "16px",
            }}>
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </span>
          )}
        </button>

        {showNotifications && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 360,
            maxHeight: 420,
            overflowY: "auto",
            background: _.surface,
            border: `1px solid ${_.line}`,
            borderRadius: 10,
            boxShadow: _.sh3,
            zIndex: 210,
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              borderBottom: `1px solid ${_.line}`,
            }}>
              <strong style={{ fontSize: 13, color: _.ink }}>Notifications</strong>
              <button
                onClick={markAllNotificationsRead}
                style={{
                  border: "none",
                  background: "transparent",
                  color: _.ac,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                Mark all read
              </button>
            </div>

            {(notifications || []).length === 0 ? (
              <div style={{ padding: "16px 12px", fontSize: 13, color: _.muted }}>No notifications yet.</div>
            ) : (
              notifications.slice(0, 40).map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    markNotificationRead(n.id);
                    setShowNotifications(false);
                    navigate(n.link || "/dashboard");
                  }}
                  style={{
                    padding: "10px 12px",
                    borderBottom: `1px solid ${_.line}`,
                    cursor: "pointer",
                    background: n.read ? "transparent" : `${_.ac}0d`,
                  }}
                >
                  <div style={{ fontSize: 13, color: _.ink, fontWeight: n.read ? 500 : 600 }}>{n.message}</div>
                  <div style={{ marginTop: 3, display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 11, color: _.muted }}>{new Date(n.createdAt).toLocaleString("en-AU")}</span>
                    <span style={{ fontSize: 11, color: _.ac }}>Open</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {!subRole && (
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
                { label: "New Estimate", Ic: FileText, action: handleNewEstimate },
                { label: "New Job", Ic: HardHat, action: handleNewJob },
                { label: "New Invoice", Ic: ReceiptText, action: () => openProjectCreateFlow("invoices", "Invoice") },
                { label: "New Purchase Order", Ic: ShoppingCart, action: () => openProjectCreateFlow("procurement", "Purchase Order") },
                { label: "New Variation", Ic: ClipboardList, action: () => openProjectCreateFlow("variations", "Variation") },
                { label: "New Site Diary Entry", Ic: NotebookText, action: () => openProjectCreateFlow("site-diary", "Site diary entry") },
                { label: "New Defect", Ic: Bug, action: () => openProjectCreateFlow("defects", "Defect") },
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
      )}
      <button
        onClick={() => { auth.logout(); navigate("/login"); }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          borderRadius: 8,
          border: `1px solid ${_.line}`,
          background: _.surface,
          color: _.body,
          cursor: "pointer",
        }}
      >
        <LogOut size={14} />
        {currentUser?.name || "Logout"}
      </button>
    </div>
  );
}
