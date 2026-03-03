import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName, stCol, badge } from "../../theme/styles.js";
import { STAGES } from "../../data/defaults.js";
import { getProjectValue, getOutstanding, getNextMilestone } from "../../lib/selectors.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import { FolderOpen, Trash2 } from "lucide-react";

export default function ProjectsListPage() {
  const { projects, clients, create, remove, mobile, notify, api } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  const handleNew = () => {
    if (isRemote) {
      const name = `Remote Project ${new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`;
      api.post(`/${mode}/projects`, { name, status: "Lead" })
        .then(() => {
          notify(`Project created in ${mode}`);
          loadRemoteProjects();
        })
        .catch((e) => notify(e.message || "Failed creating remote project", "error"));
      return;
    }
    const p = create();
    navigate(`/projects/${p.id}/quote?step=details`);
    notify("New project created");
  };

  const handleDelete = (id) => {
    if (isRemote) {
      notify("Remote delete not enabled yet", "info");
      setDeleteTarget(null);
      return;
    }
    remove(id);
    notify("Project deleted");
    setDeleteTarget(null);
  };

  return (
    <Section>
      <div style={{ marginBottom: _.s5 }}>
        <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight }}>All Projects</h1>
        <div style={{ fontSize: _.fontSize.base, color: _.muted, marginTop: _.s1 }}>{sourceProjects.length} project{sourceProjects.length !== 1 ? "s" : ""}</div>
      </div>

      <div style={{ display: "flex", gap: _.s3, marginBottom: _.s5, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search projects\u2026" style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
        <Tabs tabs={["All", ...STAGES]} active={filter} onChange={setFilter} />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{ border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: `${_.s2}px ${_.s3}px`, background: _.surface, color: _.ink }}
        >
          <option value="local">Local</option>
          <option value="buildxact">Buildxact</option>
          <option value="procore">Procore</option>
        </select>
        {isRemote && <Button variant="secondary" onClick={loadRemoteProjects}>{remoteLoading ? "Loading..." : "Refresh"}</Button>}
      </div>

      {filtered.length === 0 && <Empty icon={FolderOpen} text={search ? "No matching projects" : "No projects yet"} action={!search ? handleNew : undefined} actionText="New Project" />}

      {filtered.length > 0 && (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr auto 32px" : "1fr 100px 120px 100px 80px 32px", gap: _.s2,
            padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`,
            fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
          }}>
            <span>Project</span>
            {!mobile && <><span style={{ textAlign: "right" }}>Value</span><span>Next Milestone</span><span style={{ textAlign: "right" }}>Outstanding</span></>}
            <span style={{ textAlign: "center" }}>Stage</span>
            <span />
          </div>

          {filtered.map(pr => {
            const stage = pr.stage || pr.status;
            const value = getProjectValue(pr);
            const outstanding = getOutstanding(pr);
            const nextMs = getNextMilestone(pr);

            return (
              <div key={pr.id} onClick={() => navigate(`/projects/${pr.id}/overview`)} style={{
                display: "grid", gridTemplateColumns: mobile ? "1fr auto 32px" : "1fr 100px 120px 100px 80px 32px", gap: _.s2,
                padding: `${_.s3}px ${_.s1}px`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
                alignItems: "center", borderRadius: _.rXs, transition: `background ${_.tr}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pName(pr, clients)}</div>
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 1 }}>{pr.buildType || pr.type}</div>
                </div>
                {!mobile && (
                  <>
                    <span style={{ textAlign: "right", fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums" }}>
                      {value ? fmt(value) : "\u2014"}
                    </span>
                    <span style={{ fontSize: _.fontSize.sm, color: nextMs ? _.body : _.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {nextMs ? nextMs.name : "\u2014"}
                    </span>
                    <span style={{ textAlign: "right", fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium, fontVariantNumeric: "tabular-nums", color: outstanding ? _.red : _.faint }}>
                      {outstanding ? fmt(outstanding) : "\u2014"}
                    </span>
                  </>
                )}
                <div style={{ textAlign: "center" }}><span style={badge(stCol(stage))}>{stage}</span></div>
                <div onClick={e => { e.stopPropagation(); setDeleteTarget(pr); }}
                  style={{ cursor: "pointer", color: _.faint, transition: `color ${_.tr}`, padding: _.s1, display: "flex", justifyContent: "center" }}
                  onMouseEnter={e => e.currentTarget.style.color = _.red}
                  onMouseLeave={e => e.currentTarget.style.color = _.faint}
                ><Trash2 size={14} /></div>
              </div>
            );
          })}
        </>
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project" width={400}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, marginBottom: _.s6 }}>
          Delete <strong>{deleteTarget ? pName(deleteTarget, clients) : ""}</strong>? This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDelete(deleteTarget.id)}>Delete</Button>
        </div>
      </Modal>
    </Section>
  );
}
