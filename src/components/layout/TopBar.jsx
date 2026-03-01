import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { pName } from "../../theme/styles.js";
import { ChevronDown, Search, FolderOpen } from "lucide-react";

export default function TopBar() {
  const { projects, clients } = useApp();
  const navigate = useNavigate();
  const params = useParams();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const switcherRef = useRef(null);
  const searchRef = useRef(null);

  const currentProject = params.id ? projects.find(p => p.id === params.id) : null;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = e => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) setShowSwitcher(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) { setShowSearch(false); setSearch(""); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const recentProjects = [...projects].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);

  // Global search: filter projects + clients
  const searchResults = search.trim().length > 0 ? [
    ...projects.filter(p => pName(p, clients).toLowerCase().includes(search.toLowerCase())).slice(0, 5).map(p => ({ type: "project", id: p.id, label: pName(p, clients), sub: p.stage })),
    ...clients.filter(c => (c.displayName + " " + c.companyName).toLowerCase().includes(search.toLowerCase())).slice(0, 3).map(c => ({ type: "client", id: c.id, label: c.displayName, sub: c.companyName })),
  ] : [];

  return (
    <div style={{
      height: 44, display: "flex", alignItems: "center", gap: 12,
      padding: "0 24px", background: _.surface, borderBottom: `1px solid ${_.line}`,
      flexShrink: 0, zIndex: 100,
    }}>
      {/* Project switcher */}
      <div ref={switcherRef} style={{ position: "relative" }}>
        <div onClick={() => setShowSwitcher(v => !v)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
          borderRadius: _.rSm, cursor: "pointer", fontSize: 13, fontWeight: 500,
          color: _.ink, background: showSwitcher ? _.well : "transparent",
          transition: `background ${_.tr}`,
        }}
          onMouseEnter={e => { if (!showSwitcher) e.currentTarget.style.background = _.well; }}
          onMouseLeave={e => { if (!showSwitcher) e.currentTarget.style.background = "transparent"; }}
        >
          <FolderOpen size={14} color={_.muted} />
          <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {currentProject ? pName(currentProject, clients) : "All Projects"}
          </span>
          <ChevronDown size={12} color={_.muted} />
        </div>

        {showSwitcher && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 260,
            background: _.surface, border: `1px solid ${_.line}`, borderRadius: _.r,
            boxShadow: _.sh3, zIndex: 200, animation: "fadeUp 0.12s ease", overflow: "hidden",
          }}>
            <div style={{ padding: "8px 12px", fontSize: 10, fontWeight: 600, color: _.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Recent Projects
            </div>
            {recentProjects.map(p => (
              <div key={p.id} onClick={() => { navigate(`/projects/${p.id}/overview`); setShowSwitcher(false); }} style={{
                padding: "8px 12px", cursor: "pointer", fontSize: 13, color: _.ink,
                background: p.id === params.id ? `${_.ac}08` : "transparent",
                transition: `background ${_.tr}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = p.id === params.id ? `${_.ac}08` : "transparent"}
              >
                <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pName(p, clients)}</div>
                <div style={{ fontSize: 11, color: _.muted, marginTop: 1 }}>{p.stage}</div>
              </div>
            ))}
            <div onClick={() => { navigate("/projects"); setShowSwitcher(false); }} style={{
              padding: "10px 12px", borderTop: `1px solid ${_.line}`, cursor: "pointer",
              fontSize: 12, color: _.ac, fontWeight: 600, transition: `background ${_.tr}`,
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
          display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
          borderRadius: _.rSm, cursor: "pointer", fontSize: 12, color: _.muted,
          background: showSearch ? _.well : "transparent", transition: `all ${_.tr}`,
          minWidth: showSearch ? 240 : "auto",
        }}
          onMouseEnter={e => { if (!showSearch) e.currentTarget.style.background = _.well; }}
          onMouseLeave={e => { if (!showSearch) e.currentTarget.style.background = showSearch ? _.well : "transparent"; }}
        >
          <Search size={13} />
          {showSearch ? (
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects, clients..."
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, color: _.ink, fontFamily: "inherit", flex: 1 }}
              onKeyDown={e => { if (e.key === "Escape") { setShowSearch(false); setSearch(""); } }}
            />
          ) : (
            <span>Search</span>
          )}
        </div>

        {showSearch && searchResults.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", right: 0, minWidth: 280,
            background: _.surface, border: `1px solid ${_.line}`, borderRadius: _.r,
            boxShadow: _.sh3, zIndex: 200, animation: "fadeUp 0.12s ease", overflow: "hidden",
          }}>
            {searchResults.map((r, i) => (
              <div key={`${r.type}-${r.id}`} onClick={() => {
                navigate(r.type === "project" ? `/projects/${r.id}/overview` : `/clients/${r.id}`);
                setShowSearch(false); setSearch("");
              }} style={{
                padding: "8px 12px", cursor: "pointer", fontSize: 13, color: _.ink,
                borderBottom: i < searchResults.length - 1 ? `1px solid ${_.line}` : "none",
                transition: `background ${_.tr}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500 }}>{r.label}</span>
                  <span style={{ fontSize: 10, color: _.muted, textTransform: "uppercase", fontWeight: 600 }}>{r.type}</span>
                </div>
                {r.sub && <div style={{ fontSize: 11, color: _.muted, marginTop: 1 }}>{r.sub}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
