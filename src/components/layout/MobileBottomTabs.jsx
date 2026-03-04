import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import { isJob } from "../../lib/lifecycle.js";
import _ from "../../theme/tokens.js";
import {
  LayoutDashboard, FolderOpen, Users, MoreHorizontal, BarChart3, PenLine,
  DollarSign, Calendar, Plus, X, Building2, ClipboardList,
  Wrench, Settings, ReceiptText, NotebookText, Bug, ShoppingCart,
  FileQuestion, TrendingUp, Landmark, HardHat, Library, FileText, HandCoins,
} from "lucide-react";

const GLOBAL_TABS = [
  { path: "/dashboard", label: "Home", Ic: LayoutDashboard },
  { path: "/estimates", label: "Estimates", Ic: FileText },
  null, // FAB slot
  { path: "/jobs", label: "Jobs", Ic: HardHat },
  { id: "more", label: "More", Ic: MoreHorizontal },
];

const PROJECT_TABS = [
  { path: "overview", label: "Details", Ic: BarChart3 },
  { path: "quote", label: "Quote", Ic: PenLine },
  null, // FAB slot
  { path: "costs", label: "Costs", Ic: DollarSign },
  { id: "more", label: "More", Ic: MoreHorizontal },
];

const GLOBAL_MORE = [
  { type: "header", label: "Pipeline" },
  { path: "/clients", label: "Clients", Ic: Users },
  { path: "/estimates", label: "Estimates", Ic: FileText },
  { path: "/jobs", label: "Jobs", Ic: HardHat },
  { type: "header", label: "Finance" },
  { path: "/invoices", label: "Invoices", Ic: ReceiptText },
  { path: "/bills", label: "Bills", Ic: FileText },
  { path: "/payments", label: "Payments", Ic: HandCoins },
  { type: "header", label: "Site" },
  { path: "/documents", label: "Documents", Ic: FolderOpen },
  { path: "/site-diary", label: "Site Diary", Ic: NotebookText },
  { path: "/defects", label: "Defects", Ic: Bug },
  { path: "/trades", label: "Trades", Ic: Building2 },
  { type: "header", label: "Settings" },
  { path: "/rate-library", label: "Rate Library", Ic: Library },
  { path: "/settings", label: "Settings", Ic: Settings },
];

const PROJECT_MORE = [
  { type: "header", label: "Build" },
  { path: "scope", label: "Scope", Ic: ClipboardList },
  { path: "schedule", label: "Schedule", Ic: Calendar },
  { path: "variations", label: "Variations", Ic: ClipboardList },
  { type: "header", label: "Procurement" },
  { path: "rfq", label: "RFQ", Ic: FileQuestion },
  { path: "purchase-orders", label: "Purchase Orders", Ic: ShoppingCart },
  { path: "work-orders", label: "Work Orders", Ic: Wrench },
  { type: "header", label: "Finance & Docs" },
  { path: "invoices", label: "Invoices", Ic: ReceiptText },
  { path: "bills", label: "Bills", Ic: DollarSign },
  { path: "payments", label: "Payments", Ic: ReceiptText },
  { path: "proposals", label: "Proposals", Ic: FileText },
  { path: "documents", label: "Documents", Ic: FolderOpen },
  { path: "site-diary", label: "Site Diary", Ic: NotebookText },
  { path: "defects", label: "Defects", Ic: Bug },
  { path: "trades", label: "Trades", Ic: Wrench },
];

export default function MobileBottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { projects, create, clientsHook, tradesHook, notify, settings } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const projectId = params.id || params.estimateId || params.jobId || null;
  const isProject = !!projectId;
  const project = isProject ? projects.find((p) => p.id === projectId) : null;
  const projectIsJob = project && isJob(project.stage || project.status);
  const tabs = isProject ? PROJECT_TABS : GLOBAL_TABS;
  const moreItems = isProject ? PROJECT_MORE : GLOBAL_MORE;

  const isActive = (path) => {
    if (!path) return false;
    if (isProject) {
      const canonicalBase = projectIsJob ? `/projects/${projectId}` : `/estimates/${projectId}`;
      const tabBase = `${canonicalBase}/${path}`;
      return location.pathname === tabBase || location.pathname.startsWith(`${tabBase}/`);
    }
    return location.pathname.startsWith(path);
  };

  const handleNewQuote = () => {
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

  const handleNewVariation = () => {
    if (isProject) {
      navigate(`/projects/${projectId}/variations`);
      notify("Go to Variations to create");
    }
    setShowCreate(false);
  };

  const createActions = [
    { label: "New Quote", Ic: PenLine, action: handleNewQuote, color: _.ac },
    { label: "New Client", Ic: Users, action: handleNewClient, color: _.green },
    { label: "New Trade", Ic: Building2, action: handleNewTrade, color: _.amber },
  ];
  if (isProject && projectIsJob) {
    createActions.push({ label: "New Variation", Ic: ClipboardList, action: handleNewVariation, color: _.violet });
  }

  const navTo = (path) => {
    if (isProject && projectId) {
      const base = projectIsJob ? `/projects/${projectId}` : `/estimates/${projectId}`;
      navigate(`${base}/${path}`);
    } else if (isProject) {
      navigate(`/estimates/${projectId}/${path}`);
    } else {
      navigate(path);
    }
    setShowMore(false);
  };

  const handleTabTap = (item) => {
    if (!item) return;
    if (item.id === "more") {
      setShowMore(v => !v);
      setShowCreate(false);
      return;
    }
    setShowMore(false);
    setShowCreate(false);
    navTo(item.path);
  };

  const closeAll = () => { setShowCreate(false); setShowMore(false); };

  const FAB_SIZE = 52;

  return (
    <>
      {(showCreate || showMore) && (
        <div onClick={closeAll} style={{
          position: "fixed", inset: 0, zIndex: 49,
          background: "rgba(0,0,0,0.3)",
          animation: "fadeIn 0.15s ease",
        }} />
      )}

      {showCreate && (
        <div style={{
          position: "fixed", bottom: "calc(var(--mobile-bottom-total) + 16px)", left: 16, right: 16, zIndex: 52,
          background: _.surface, borderRadius: 10, boxShadow: _.sh3,
          padding: 16, animation: "fadeUp 0.18s ease",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: _.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            Create
          </div>
          {createActions.map(a => (
            <div key={a.label} onClick={a.action} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 8px",
              borderRadius: 6, cursor: "pointer", transition: `background ${_.tr}`,
            }}
              onTouchStart={e => e.currentTarget.style.background = _.well}
              onTouchEnd={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: `${a.color}14`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <a.Ic size={18} color={a.color} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: _.ink }}>{a.label}</span>
            </div>
          ))}
        </div>
      )}

      {showMore && (
        <div style={{
          position: "fixed", bottom: "calc(var(--mobile-bottom-total) + 16px)", left: 16, right: 16, zIndex: 52,
          background: _.surface, borderRadius: 10, boxShadow: _.sh3,
          padding: 12, animation: "fadeUp 0.18s ease",
          maxHeight: "60vh", overflowY: "auto",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: _.muted, letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 8px", marginBottom: 4 }}>
            {isProject ? "Project" : "Menu"}
          </div>
          {moreItems.map((item, idx) => {
            if (item.type === "header") {
              return (
                <div key={`hdr-${idx}`} style={{
                  fontSize: 10, fontWeight: 700, color: _.muted,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  padding: "12px 8px 4px",
                  marginTop: idx > 0 ? 4 : 0,
                }}>{item.label}</div>
              );
            }
            const active = isActive(item.path);
            return (
              <div key={item.path} onClick={() => navTo(item.path)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 8px",
                borderRadius: 6, cursor: "pointer",
                background: active ? `${_.ac}08` : "transparent",
                transition: `background ${_.tr}`,
              }}
                onTouchStart={e => e.currentTarget.style.background = _.well}
                onTouchEnd={e => e.currentTarget.style.background = active ? `${_.ac}08` : "transparent"}
              >
                <item.Ic size={18} color={active ? _.ac : _.body} strokeWidth={active ? 2 : 1.5} />
                <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? _.ac : _.ink }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 51,
        background: _.surface, borderTop: "1px solid rgba(0,0,0,0.06)",
        display: "flex", alignItems: "flex-end", justifyContent: "space-around",
        height: "calc(var(--mobile-tab-h) + var(--safe-bottom))",
        paddingBottom: "var(--safe-bottom)",
        boxSizing: "border-box",
      }}>
        {tabs.map((item) => {
          if (item === null) {
            return (
              <div key="fab" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", minWidth: 56, position: "relative" }}>
                <div onClick={() => { setShowCreate(v => !v); setShowMore(false); }} style={{
                  width: FAB_SIZE, height: FAB_SIZE, borderRadius: "50%",
                  background: showCreate ? _.ink : _.ac,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.35)",
                  position: "absolute",
                  bottom: "calc(var(--safe-bottom) + 10px)",
                  transition: "background 0.15s, transform 0.15s",
                  transform: showCreate ? "rotate(45deg)" : "none",
                }}>
                  {showCreate
                    ? <X size={24} color="#fff" strokeWidth={2.5} />
                    : <Plus size={24} color="#fff" strokeWidth={2.5} />
                  }
                </div>
              </div>
            );
          }

          const active = item.id === "more" ? showMore : isActive(item.path);
          return (
            <div key={item.path || item.id} onClick={() => handleTabTap(item)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "6px 0 4px", minWidth: 56, justifyContent: "center",
              cursor: "pointer", color: active ? _.ac : _.muted, transition: "color 0.15s",
            }}>
              <item.Ic size={20} strokeWidth={active ? 2 : 1.5} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </div>
          );
        })}
      </nav>
    </>
  );
}
