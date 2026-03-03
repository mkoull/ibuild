import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { pName } from "../../theme/styles.js";
import {
  Search, FolderOpen, Users, LayoutDashboard, Settings,
  ReceiptText, FileText, HandCoins, NotebookText, Bug, HardHat,
  TrendingUp, Landmark, Building2, Plus, ArrowRight,
} from "lucide-react";
import { getWorkspaceUrl } from "../../config/workspaceTabs.js";

/* ─── Static navigation entries ─── */
const NAV_ITEMS = [
  { label: "Dashboard",    to: "/dashboard",     Ic: LayoutDashboard, group: "Navigate" },
  { label: "Estimates",    to: "/estimates",     Ic: FileText,        group: "Navigate" },
  { label: "Jobs",         to: "/jobs",           Ic: HardHat,         group: "Navigate" },
  { label: "Clients",      to: "/clients",       Ic: Users,           group: "Navigate" },
  { label: "Invoices",     to: "/invoices",       Ic: ReceiptText,     group: "Navigate" },
  { label: "Bills",        to: "/bills",          Ic: FileText,        group: "Navigate" },
  { label: "Payments",     to: "/payments",       Ic: HandCoins,       group: "Navigate" },
  { label: "Documents",    to: "/documents",      Ic: FolderOpen,      group: "Navigate" },
  { label: "Site Diary",   to: "/site-diary",     Ic: NotebookText,    group: "Navigate" },
  { label: "Defects",      to: "/defects",        Ic: Bug,             group: "Navigate" },
  { label: "Trades",       to: "/trades",         Ic: Building2,       group: "Navigate" },
  { label: "Rate Library", to: "/rate-library",   Ic: Landmark,        group: "Navigate" },
  { label: "Settings",     to: "/settings",       Ic: Settings,        group: "Navigate" },
  { label: "Projects",     to: "/projects",       Ic: FolderOpen,      group: "Navigate" },
];

export default function CommandBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { projects, clients, create, clientsHook, tradesHook, notify, settings } = useApp();

  // Open helper that also resets state
  const openBar = useCallback(() => {
    setQuery("");
    setSelectedIdx(0);
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const close = useCallback(() => { setOpen(false); setQuery(""); }, []);

  // Listen for open event from TopBar / MobileHeader
  useEffect(() => {
    const handler = () => openBar();
    window.addEventListener("open-command-bar", handler);
    return () => window.removeEventListener("open-command-bar", handler);
  }, [openBar]);

  // Ctrl+K / Cmd+K  +  Escape
  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); openBar(); }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openBar, close]);

  // Build results
  const q = query.toLowerCase().trim();

  const projectResults = q
    ? projects.filter(p => pName(p, clients).toLowerCase().includes(q)).slice(0, 5).map(p => ({
        label: pName(p, clients), sub: p.stage || "Project", Ic: FolderOpen,
        group: "Projects", action: () => { navigate(`${getWorkspaceUrl(p)}/overview`); close(); },
      }))
    : [];

  const clientResults = q
    ? clients.filter(c => `${c.displayName} ${c.companyName}`.toLowerCase().includes(q)).slice(0, 3).map(c => ({
        label: c.displayName || c.companyName, sub: "Client", Ic: Users,
        group: "Clients", action: () => { navigate(`/clients/${c.id}`); close(); },
      }))
    : [];

  const navResults = NAV_ITEMS.filter(n => !q || n.label.toLowerCase().includes(q)).slice(0, q ? 6 : 8).map(n => ({
    ...n, action: () => { navigate(n.to); close(); },
  }));

  const createResults = !q || "create new project client trade".includes(q) ? [
    { label: "New Estimate", sub: "Create", Ic: Plus, group: "Create", action: () => {
      const p = create({ marginPct: settings.defaultMargin ?? 18, contingencyPct: settings.defaultContingency ?? 5, validDays: settings.defaultValidDays ?? 30 });
      navigate(`/estimates/${p.id}/overview`); notify("New estimate created"); close();
    }},
    { label: "New Client", sub: "Create", Ic: Plus, group: "Create", action: () => {
      const c = clientsHook.create(); navigate(`/clients/${c.id}`); notify("New client created"); close();
    }},
    { label: "New Trade", sub: "Create", Ic: Plus, group: "Create", action: () => {
      const t = tradesHook.create(); navigate(`/trades/${t.id}`); notify("New trade created"); close();
    }},
  ] : [];

  const allResults = [...projectResults, ...clientResults, ...navResults, ...createResults];

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, allResults.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && allResults[selectedIdx]) { allResults[selectedIdx].action(); }
  };

  // Reset selection on query change via onChange wrapper
  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setSelectedIdx(0);
  };

  if (!open) return null;

  // Group results by group name
  const groups = [];
  let lastGroup = null;
  allResults.forEach((r, i) => {
    if (r.group !== lastGroup) { groups.push({ type: "header", label: r.group }); lastGroup = r.group; }
    groups.push({ type: "item", item: r, idx: i });
  });

  return (
    <>
      {/* Backdrop */}
      <div onClick={close} style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)",
        animation: "fadeIn 0.1s ease",
      }} />

      {/* Command bar */}
      <div style={{
        position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: "min(560px, calc(100vw - 32px))", zIndex: 1000,
        background: _.surface, borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)",
        overflow: "hidden", animation: "fadeUp 0.15s ease",
      }}>
        {/* Search input */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          <Search size={16} color={_.muted} />
          <input
            ref={inputRef}
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, navigate, or create..."
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontSize: 15, color: _.ink, fontFamily: "inherit",
            }}
          />
          <kbd style={{
            fontSize: 10, color: _.faint, fontFamily: "inherit", fontWeight: 600,
            background: _.well, border: `1px solid ${_.line}`,
            borderRadius: 4, padding: "2px 6px",
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: "auto", padding: "4px" }}>
          {allResults.length === 0 && q && (
            <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: _.muted }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {groups.map((g, gi) => {
            if (g.type === "header") {
              return (
                <div key={`h-${gi}`} style={{
                  padding: "8px 12px 4px", fontSize: 10, fontWeight: 600,
                  color: _.muted, letterSpacing: "0.06em", textTransform: "uppercase",
                }}>{g.label}</div>
              );
            }
            const { item, idx } = g;
            const selected = idx === selectedIdx;
            return (
              <div key={`r-${gi}`} onClick={item.action} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", borderRadius: 6,
                cursor: "pointer", fontSize: 13, color: _.ink,
                background: selected ? _.well : "transparent",
                transition: "background 0.08s ease",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = _.well; setSelectedIdx(idx); }}
                onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
              >
                <item.Ic size={15} color={_.body} strokeWidth={1.5} />
                <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
                {item.sub && <span style={{ fontSize: 11, color: _.faint }}>{item.sub}</span>}
                {selected && <ArrowRight size={12} color={_.faint} />}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
