import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName, stCol, badge } from "../../theme/styles.js";
import { STAGES } from "../../data/defaults.js";
import { getProjectValue, getOutstanding, getNextMilestone } from "../../lib/selectors.js";
import { getPipelineValue, getJobProjects } from "../../lib/metrics.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import { FolderOpen, Trash2, ArrowRight, Plus } from "lucide-react";
import { getWorkspaceUrl } from "../../config/workspaceTabs.js";

const FILTERS = ["All", ...STAGES];

export default function ProjectsListPage() {
  const { projects, clients, create, remove, mobile, notify, api } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [mode, setMode] = useState(() => api.getIntegrationMode());
  const [remoteProjects, setRemoteProjects] = useState([]);
  const [remoteLoading, setRemoteLoading] = useState(false);

  const isRemote = mode === "buildxact" || mode === "procore";

  const loadRemoteProjects = useCallback(async () => {
    if (!isRemote) return;
    setRemoteLoading(true);
    try {
      const rows = await api.get(`/${mode}/projects`);
      setRemoteProjects(Array.isArray(rows) ? rows : []);
    } catch (e) {
      notify(e.message || "Failed loading remote projects", "error");
    } finally {
      setRemoteLoading(false);
    }
  }, [api, isRemote, mode, notify]);

  useEffect(() => {
    api.setIntegrationMode(mode);
    if (isRemote) loadRemoteProjects();
  }, [api, isRemote, loadRemoteProjects, mode]);

  const sourceProjects = useMemo(() => (isRemote ? remoteProjects : projects), [isRemote, remoteProjects, projects]);

  const filtered = sourceProjects.filter(pr => {
    const stage = pr.stage || pr.status;
    if (filter !== "All" && stage !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = pName(pr, clients).toLowerCase();
      const client = (pr.client || "").toLowerCase();
      if (!name.includes(q) && !client.includes(q)) return false;
    }
    return true;
  });

  // Summary stats
  const activeJobs = getJobProjects(projects);
  const pipelineValue = getPipelineValue(projects);

  const handleNew = () => {
    if (isRemote) {
      const name = `Remote Project ${new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`;
      api.post(`/${mode}/projects`, { name, status: "Lead" })
        .then(() => { notify(`Project created in ${mode}`); loadRemoteProjects(); })
        .catch((e) => notify(e.message || "Failed creating remote project", "error"));
      return;
    }
    const p = create();
    navigate(`/estimates/${p.id}/overview`);
    notify("New estimate created");
  };

  const handleDelete = (id) => {
    if (isRemote) { notify("Remote delete not enabled yet", "info"); setDeleteTarget(null); return; }
    remove(id);
    notify("Project deleted");
    setDeleteTarget(null);
  };

  return (
    <Section>
      {/* ─── Header ─── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: mobile ? 28 : 32, fontWeight: 700, letterSpacing: "-0.03em", color: _.ink, margin: 0 }}>
          All Projects
        </h1>
        <div style={{ fontSize: 14, color: _.muted, marginTop: 4 }}>
          {activeJobs.length} active job{activeJobs.length !== 1 ? "s" : ""}
          {pipelineValue > 0 ? ` \u00b7 ${fmt(pipelineValue)} pipeline value` : ""}
        </div>
      </div>

      {/* ─── Filter bar ─── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        {/* Segmented control */}
        <div style={{
          display: "inline-flex", background: _.well, borderRadius: 8, padding: 3,
        }}>
          {FILTERS.map(f => {
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "6px 14px", borderRadius: 6, border: "none",
                fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer",
                fontFamily: "inherit",
                background: active ? _.surface : "transparent",
                color: active ? _.ink : _.muted,
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.12s ease",
              }}>{f}</button>
            );
          })}
        </div>

        <SearchInput value={search} onChange={setSearch} placeholder="Search projects\u2026" style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />

        {isRemote && (
          <select value={mode} onChange={e => setMode(e.target.value)} style={{
            border: `1px solid ${_.line}`, borderRadius: 6, padding: "6px 12px",
            background: _.surface, color: _.ink, fontSize: 13, fontFamily: "inherit",
          }}>
            <option value="local">Local</option>
            <option value="buildxact">Buildxact</option>
            <option value="procore">Procore</option>
          </select>
        )}

        <div style={{ flex: 1 }} />

        <button onClick={handleNew} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 16px", borderRadius: 8,
          background: _.ink, color: "#fff", border: "none",
          fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          transition: `background ${_.tr}`,
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#1e293b"}
          onMouseLeave={e => e.currentTarget.style.background = _.ink}
        >
          <Plus size={14} strokeWidth={2.5} />
          {isRemote && remoteLoading ? "Loading..." : "New Project"}
        </button>
      </div>

      {/* ─── Empty state ─── */}
      {filtered.length === 0 && (
        <Empty icon={FolderOpen} text={search ? "No matching projects" : "No projects yet"} action={!search ? handleNew : undefined} actionText="Create your first project" />
      )}

      {/* ─── Project list ─── */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {filtered.map(pr => {
            const stage = pr.stage || pr.status;
            const value = getProjectValue(pr);
            const outstanding = getOutstanding(pr);
            const nextMs = getNextMilestone(pr);
            const name = pName(pr, clients);
            const clientStr = pr.client || pr.buildType || pr.type || "";
            const isHovered = hoveredId === pr.id;

            return (
              <div key={pr.id}
                onClick={() => navigate(`${getWorkspaceUrl(pr)}/overview`)}
                onMouseEnter={() => setHoveredId(pr.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "12px 16px", borderRadius: 8,
                  cursor: "pointer",
                  background: isHovered ? _.well : "transparent",
                  borderBottom: `1px solid rgba(0,0,0,0.04)`,
                  transition: "background 0.1s ease",
                }}
              >
                {/* Left: name + client */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: _.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {name}
                  </div>
                  <div style={{ fontSize: 12, color: _.muted, marginTop: 2 }}>{clientStr}</div>
                </div>

                {/* Right: value + milestone + stage + quick actions */}
                {!mobile && (
                  <>
                    {value ? (
                      <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: _.ink, minWidth: 90, textAlign: "right" }}>
                        {fmt(value)}
                      </span>
                    ) : (
                      <span style={{ minWidth: 90, textAlign: "right", fontSize: 13, color: _.faint }}>{"\u2014"}</span>
                    )}

                    <span style={{ fontSize: 12, color: nextMs ? _.body : _.faint, minWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {nextMs ? nextMs.name : "\u2014"}
                    </span>

                    {outstanding ? (
                      <span style={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: _.red, minWidth: 90, textAlign: "right" }}>
                        {fmt(outstanding)}
                      </span>
                    ) : (
                      <span style={{ minWidth: 90, textAlign: "right", fontSize: 13, color: _.faint }}>{"\u2014"}</span>
                    )}
                  </>
                )}

                <span style={badge(stCol(stage))}>{stage}</span>

                {/* Quick actions (visible on hover) */}
                {!mobile && (
                  <div style={{
                    display: "flex", gap: 4, minWidth: 56, justifyContent: "flex-end",
                    opacity: isHovered ? 1 : 0, transition: "opacity 0.12s ease",
                  }}>
                    <div onClick={e => { e.stopPropagation(); navigate(`${getWorkspaceUrl(pr)}/overview`); }}
                      title="Open"
                      style={{ padding: 4, borderRadius: 4, color: _.body, cursor: "pointer" }}
                    >
                      <ArrowRight size={14} />
                    </div>
                    <div onClick={e => { e.stopPropagation(); setDeleteTarget(pr); }}
                      title="Delete"
                      style={{ padding: 4, borderRadius: 4, color: _.faint, cursor: "pointer", transition: `color ${_.tr}` }}
                      onMouseEnter={e => e.currentTarget.style.color = _.red}
                      onMouseLeave={e => e.currentTarget.style.color = _.faint}
                    >
                      <Trash2 size={14} />
                    </div>
                  </div>
                )}

                {mobile && (
                  <div onClick={e => { e.stopPropagation(); setDeleteTarget(pr); }}
                    style={{ padding: 4, color: _.faint }}
                  >
                    <Trash2 size={14} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project" width={400}>
        <div style={{ fontSize: 14, color: _.body, marginBottom: 24 }}>
          Delete <strong>{deleteTarget ? pName(deleteTarget, clients) : ""}</strong>? This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDelete(deleteTarget.id)}>Delete</Button>
        </div>
      </Modal>
    </Section>
  );
}
