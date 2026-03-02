import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import { isJob } from "../../lib/lifecycle.js";
import _ from "../../theme/tokens.js";
import {
  LayoutDashboard, FolderOpen, Users, MoreHorizontal, BarChart3, PenLine,
  DollarSign, Calendar, Plus, X, FileText, Building2, ClipboardList,
  Wrench, Library, Settings, Receipt, BookOpen, AlertTriangle,
} from "lucide-react";

const GLOBAL_TABS = [
  { path: "/dashboard", label: "Home", Ic: LayoutDashboard },
  { path: "/projects", label: "Projects", Ic: FolderOpen },
  null, // FAB slot
  { path: "/clients", label: "Clients", Ic: Users },
  { id: "more", label: "More", Ic: MoreHorizontal },
];

const PROJECT_TABS = [
  { path: "overview", label: "Overview", Ic: BarChart3 },
  { path: "quote", label: "Quote", Ic: PenLine },
  null, // FAB slot
  { path: "costs", label: "Costs", Ic: DollarSign },
  { id: "more", label: "More", Ic: MoreHorizontal },
];

const GLOBAL_MORE = [
  { path: "/trades", label: "Trades", Ic: Building2 },
  { path: "/rate-library", label: "Rate Library", Ic: Library },
  { path: "/quotes", label: "Quotes", Ic: FileText },
  { path: "/jobs", label: "Jobs", Ic: Wrench },
  { path: "/settings", label: "Settings", Ic: Settings },
];

const PROJECT_MORE = [
  { path: "schedule", label: "Schedule", Ic: Calendar },
  { path: "proposals", label: "Proposals", Ic: FileText },
  { path: "variations", label: "Variations", Ic: ClipboardList },
  { path: "invoices", label: "Invoices", Ic: Receipt },
  { path: "bills", label: "Bills", Ic: DollarSign },
  { path: "site-diary", label: "Site Diary", Ic: BookOpen },
  { path: "defects", label: "Defects", Ic: AlertTriangle },
  { path: "documents", label: "Documents", Ic: FolderOpen },
  { path: "trades", label: "Trades", Ic: Wrench },
];

export default function MobileBottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { projects, clients, create, clientsHook, tradesHook, notify, settings } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const isProject = !!params.id;
  const project = isProject ? projects.find(p => p.id === params.id) : null;
  const projectIsJob = project && isJob(project.stage || project.status);
  const tabs = isProject ? PROJECT_TABS : GLOBAL_TABS;
  const moreItems = isProject ? PROJECT_MORE : GLOBAL_MORE;

  const isActive = (path) => {
    if (!path) return false;
    if (isProject) return location.pathname.includes(`/${path}`);
    return location.pathname.startsWith(path);
  };

  // ─── Create actions ───
  const handleNewQuote = () => {
    const p = create({
      marginPct: settings.defaultMargin ?? 18,
      contingencyPct: settings.defaultContingency ?? 5,
      validDays: settings.defaultValidDays ?? 30,
    });
    navigate(`/projects/${p.id}/quote?step=details`);
    notify("New quote created");
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
      navigate(`/projects/${params.id}/variations`);
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
    if (isProject) navigate(`/projects/${params.id}/${path}`);
    else navigate(path);
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

  // Close sheets on overlay tap
  const closeAll = () => { setShowCreate(false); setShowMore(false); };

  const TAB_H = 56;
  const FAB_SIZE = 52;

  return (
    <>
      {/* Backdrop */}
      {(showCreate || showMore) && (
        <div onClick={closeAll} style={{
          position: "fixed", inset: 0, zIndex: 49,
          background: "rgba(0,0,0,0.3)",
          animation: "fadeIn 0.15s ease",
        }} />
      )}

      {/* ─── Create Sheet ─── */}
      {showCreate && (
        <div style={{
          position: "fixed", bottom: "calc(var(--mobile-bottom-total) + 16px)", left: 16, right: 16, zIndex: 52,
          background: _.surface, borderRadius: _.r, boxShadow: _.sh3,
          padding: `${_.s4}px`, animation: "fadeUp 0.18s ease",
        }}>
          <div style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s3 }}>
            Create
          </div>
          {createActions.map(a => (
            <div key={a.label} onClick={a.action} style={{
              display: "flex", alignItems: "center", gap: _.s3, padding: `${_.s3}px ${_.s2}px`,
              borderRadius: _.rSm, cursor: "pointer", transition: `background ${_.tr}`,
            }}
              onTouchStart={e => e.currentTarget.style.background = _.well}
              onTouchEnd={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: 36, height: 36, borderRadius: _.rMd, background: `${a.color}14`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <a.Ic size={18} color={a.color} strokeWidth={2} />
              </div>
              <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, color: _.ink }}>{a.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── More Sheet ─── */}
      {showMore && (
        <div style={{
          position: "fixed", bottom: "calc(var(--mobile-bottom-total) + 16px)", left: 16, right: 16, zIndex: 52,
          background: _.surface, borderRadius: _.r, boxShadow: _.sh3,
          padding: `${_.s3}px`, animation: "fadeUp 0.18s ease",
          maxHeight: "60vh", overflowY: "auto",
        }}>
          <div style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", padding: `${_.s1}px ${_.s2}px`, marginBottom: _.s1 }}>
            {isProject ? "Project" : "Menu"}
          </div>
          {moreItems.map(item => {
            const active = isActive(item.path);
            return (
              <div key={item.path} onClick={() => navTo(item.path)} style={{
                display: "flex", alignItems: "center", gap: _.s3, padding: `${_.s3}px ${_.s2}px`,
                borderRadius: _.rSm, cursor: "pointer",
                background: active ? `${_.ac}08` : "transparent",
                transition: `background ${_.tr}`,
              }}
                onTouchStart={e => e.currentTarget.style.background = _.well}
                onTouchEnd={e => e.currentTarget.style.background = active ? `${_.ac}08` : "transparent"}
              >
                <item.Ic size={18} color={active ? _.ac : _.body} strokeWidth={active ? 2 : 1.5} />
                <span style={{ fontSize: _.fontSize.md, fontWeight: active ? _.fontWeight.semi : _.fontWeight.normal, color: active ? _.ac : _.ink }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Bottom Nav Bar ─── */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 51,
        background: _.surface, borderTop: `1px solid ${_.line}`,
        display: "flex", alignItems: "flex-end", justifyContent: "space-around",
        height: "var(--mobile-tab-h)",
        paddingBottom: "var(--safe-bottom)",
        boxSizing: "content-box",
      }}>
        {tabs.map((item, i) => {
          // Center FAB
          if (item === null) {
            return (
              <div key="fab" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", minWidth: 56, position: "relative" }}>
                <div onClick={() => { setShowCreate(v => !v); setShowMore(false); }} style={{
                  width: FAB_SIZE, height: FAB_SIZE, borderRadius: "50%",
                  background: showCreate ? _.ink : _.ac,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.35)",
                  position: "absolute", bottom: 10,
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
