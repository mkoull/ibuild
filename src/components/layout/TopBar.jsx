import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { pName } from "../../theme/styles.js";
import { ChevronDown, Search, FolderOpen, Plus, Users, Building2 } from "lucide-react";

export default function TopBar() {
  const { projects, clients, create, clientsHook, tradesHook, notify, settings } = useApp();
  const navigate = useNavigate();
  const params = useParams();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const switcherRef = useRef(null);
  const searchRef = useRef(null);
  const createRef = useRef(null);

  const currentProject = params.id ? projects.find(p => p.id === params.id) : null;

  useEffect(() => {
    const handler = e => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) setShowSwitcher(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) { setShowSearch(false); setSearch(""); }
      if (createRef.current && !createRef.current.contains(e.target)) setShowCreate(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const recentProjects = [...projects].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);

  const searchResults = search.trim().length > 0 ? [
    ...projects.filter(p => pName(p, clients).toLowerCase().includes(search.toLowerCase())).slice(0, 5).map(p => ({ type: "project", id: p.id, label: pName(p, clients), sub: p.stage })),
    ...clients.filter(c => (c.displayName + " " + c.companyName).toLowerCase().includes(search.toLowerCase())).slice(0, 3).map(c => ({ type: "client", id: c.id, label: c.displayName, sub: c.companyName })),
  ] : [];

  const handleNewProject = () => {
    const p = create({
      marginPct: settings.defaultMargin ?? 18,
      contingencyPct: settings.defaultContingency ?? 5,
      validDays: settings.defaultValidDays ?? 30,
    });
    navigate(`/projects/${p.id}/quote?step=details`);
    notify("New project created");
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

  const dropdownStyle = {
    position: "absolute", top: "calc(100% + 4px)", minWidth: 220,
    background: _.surface, border: `1px solid ${_.line}`, borderRadius: _.r,
    boxShadow: _.sh3, zIndex: 200, animation: "fadeUp 0.12s ease", overflow: "hidden",
  };

  const dropdownItemStyle = {
    padding: `${_.s2}px ${_.s3}px`, cursor: "pointer", fontSize: _.fontSize.base, color: _.ink,
    transition: `background ${_.tr}`, display: "flex", alignItems: "center", gap: _.s2,
  };

  return (
    <div style={{
      height: 48, display: "flex", alignItems: "center", gap: _.s3,
      padding: `0 ${_.s6}px`, background: _.surface, borderBottom: `1px solid ${_.line}`,
      flexShrink: 0, zIndex: 100,
    }}>
      {/* Project switcher */}
      <div ref={switcherRef} style={{ position: "relative" }}>
        <div onClick={() => setShowSwitcher(v => !v)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: `5px ${_.s3}px`,
          borderRadius: _.rSm, cursor: "pointer", fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium,
          color: _.ink, background: showSwitcher ? _.well : "transparent",
          transition: `background ${_.tr}`,
        }}
          onMouseEnter={e => { if (!showSwitcher) e.currentTarget.style.background = _.well; }}
          onMouseLeave={e => { if (!showSwitcher) e.currentTarget.style.background = showSwitcher ? _.well : "transparent"; }}
        >
          <FolderOpen size={14} color={_.muted} />
          <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {currentProject ? pName(currentProject, clients) : "All Projects"}
          </span>
          <ChevronDown size={12} color={_.muted} />
        </div>

        {showSwitcher && (
          <div style={{ ...dropdownStyle, left: 0, minWidth: 260 }}>
            <div style={{ padding: `${_.s2}px ${_.s3}px`, fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase" }}>
              Recent Projects
            </div>
            {recentProjects.map(p => (
              <div key={p.id} onClick={() => { navigate(`/projects/${p.id}/overview`); setShowSwitcher(false); }} style={{
                ...dropdownItemStyle,
                background: p.id === params.id ? `${_.ac}08` : "transparent",
                flexDirection: "column", alignItems: "flex-start", gap: 1,
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = p.id === params.id ? `${_.ac}08` : "transparent"}
              >
                <div style={{ fontWeight: _.fontWeight.medium, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>{pName(p, clients)}</div>
                <div style={{ fontSize: _.fontSize.xs, color: _.muted }}>{p.stage}</div>
              </div>
            ))}
            <div onClick={() => { navigate("/projects"); setShowSwitcher(false); }} style={{
              padding: `${_.s3}px ${_.s3}px`, borderTop: `1px solid ${_.line}`, cursor: "pointer",
              fontSize: _.fontSize.sm, color: _.ac, fontWeight: _.fontWeight.semi, transition: `background ${_.tr}`,
            }}
              onMouseEnter={e => e.currentTarget.style.background = _.well}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              View all projects
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Global search */}
      <div ref={searchRef} style={{ position: "relative" }}>
        <div onClick={() => setShowSearch(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: `5px ${_.s3}px`,
          borderRadius: _.rSm, cursor: "pointer", fontSize: _.fontSize.sm, color: _.muted,
          background: showSearch ? _.well : "transparent", transition: `all ${_.tr}`,
          minWidth: showSearch ? 260 : "auto",
        }}
          onMouseEnter={e => { if (!showSearch) e.currentTarget.style.background = _.well; }}
          onMouseLeave={e => { if (!showSearch) e.currentTarget.style.background = showSearch ? _.well : "transparent"; }}
        >
          <Search size={13} />
          {showSearch ? (
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects, clients\u2026"
              style={{ border: "none", outline: "none", background: "transparent", fontSize: _.fontSize.sm, color: _.ink, fontFamily: "inherit", flex: 1 }}
              onKeyDown={e => { if (e.key === "Escape") { setShowSearch(false); setSearch(""); } }}
            />
          ) : (
            <span>Search</span>
          )}
        </div>

        {showSearch && searchResults.length > 0 && (
          <div style={{ ...dropdownStyle, right: 0, minWidth: 300 }}>
            {searchResults.map((r, i) => (
              <div key={`${r.type}-${r.id}`} onClick={() => {
                navigate(r.type === "project" ? `/projects/${r.id}/overview` : `/clients/${r.id}`);
                setShowSearch(false); setSearch("");
              }} style={{
                ...dropdownItemStyle,
                borderBottom: i < searchResults.length - 1 ? `1px solid ${_.line}` : "none",
                flexDirection: "column", alignItems: "flex-start", gap: 1,
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span style={{ fontWeight: _.fontWeight.medium }}>{r.label}</span>
                  <span style={{ fontSize: _.fontSize.xs, color: _.muted, textTransform: "uppercase", fontWeight: _.fontWeight.semi }}>{r.type}</span>
                </div>
                {r.sub && <div style={{ fontSize: _.fontSize.xs, color: _.muted }}>{r.sub}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dropdown */}
      <div ref={createRef} style={{ position: "relative" }}>
        <div onClick={() => setShowCreate(v => !v)} style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 32, height: 32, borderRadius: _.rMd, cursor: "pointer",
          background: showCreate ? _.ac : _.ink, color: "#fff",
          transition: `background ${_.tr}`,
        }}
          onMouseEnter={e => e.currentTarget.style.background = _.acDark}
          onMouseLeave={e => e.currentTarget.style.background = showCreate ? _.ac : _.ink}
        >
          <Plus size={16} strokeWidth={2.5} />
        </div>

        {showCreate && (
          <div style={{ ...dropdownStyle, right: 0 }}>
            <div style={{ padding: `${_.s2}px ${_.s3}px`, fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase" }}>
              Create new
            </div>
            <div onClick={handleNewProject} style={dropdownItemStyle}
              onMouseEnter={e => e.currentTarget.style.background = _.well}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <FolderOpen size={14} color={_.body} /> New Project
            </div>
            <div onClick={handleNewClient} style={dropdownItemStyle}
              onMouseEnter={e => e.currentTarget.style.background = _.well}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Users size={14} color={_.body} /> New Client
            </div>
            <div onClick={handleNewTrade} style={dropdownItemStyle}
              onMouseEnter={e => e.currentTarget.style.background = _.well}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Building2 size={14} color={_.body} /> New Trade
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
