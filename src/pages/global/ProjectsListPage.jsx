import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName, stCol, badge, btnPrimary } from "../../theme/styles.js";
import { calc } from "../../lib/calc.js";
import { STAGES } from "../../data/defaults.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import { Plus, FolderOpen, Trash2 } from "lucide-react";

export default function ProjectsListPage() {
  const { projects, clients, create, remove, mobile, notify } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = projects.filter(pr => {
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
    const p = create();
    navigate(`/projects/${p.id}/scope`);
    notify("New project created");
  };

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: mobile ? 28 : 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Projects</h1>
        <button onClick={handleNew} style={btnPrimary}><Plus size={14} /> New Project</button>
      </div>

      {/* Search + Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
        <Tabs tabs={["All", ...STAGES]} active={filter} onChange={setFilter} />
      </div>

      {filtered.length === 0 && <Empty icon={FolderOpen} text={search ? "No matching projects" : "No projects found"} action={!search ? handleNew : undefined} actionText="Create Project" />}

      {/* Table header */}
      {filtered.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: mobile ? "1fr auto 32px" : "1fr 120px 120px 120px 80px 32px", gap: 8,
          padding: "8px 0", borderBottom: `2px solid ${_.ink}`,
          fontSize: 10, color: _.muted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
        }}>
          <span>Project</span>
          {!mobile && <><span style={{ textAlign: "right" }}>Value</span><span>Next Milestone</span><span style={{ textAlign: "right" }}>Outstanding</span></>}
          <span style={{ textAlign: "center" }}>Stage</span>
          <span></span>
        </div>
      )}

      {filtered.map(pr => {
        const T = calc(pr);
        const stage = pr.stage || pr.status;
        const nextMs = (pr.schedule || []).find(m => !m.done);
        const outstanding = pr.invoices.filter(i => i.status === "pending").reduce((s, i) => s + (i.amount || 0), 0);

        return (
          <div key={pr.id} onClick={() => navigate(`/projects/${pr.id}/overview`)} style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr auto 32px" : "1fr 120px 120px 120px 80px 32px", gap: 8,
            padding: "12px 0", borderBottom: `1px solid ${_.line}`, cursor: "pointer",
            alignItems: "center", transition: "padding-left 0.12s",
          }}
            onMouseEnter={e => e.currentTarget.style.paddingLeft = "4px"}
            onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pName(pr, clients)}</div>
              <div style={{ fontSize: 12, color: _.muted, marginTop: 1 }}>{pr.buildType || pr.type}</div>
            </div>
            {!mobile && (
              <>
                <span style={{ textAlign: "right", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {T.curr > 0 ? fmt(T.curr) : "—"}
                </span>
                <span style={{ fontSize: 12, color: nextMs ? _.body : _.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {nextMs ? nextMs.name : "—"}
                </span>
                <span style={{ textAlign: "right", fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: outstanding > 0 ? _.red : _.faint }}>
                  {outstanding > 0 ? fmt(outstanding) : "—"}
                </span>
              </>
            )}
            <div style={{ textAlign: "center" }}><span style={badge(stCol(stage))}>{stage}</span></div>
            <div onClick={e => { e.stopPropagation(); setDeleteTarget(pr); }}
              style={{ cursor: "pointer", color: _.faint, transition: `color ${_.tr}`, padding: 4, display: "flex", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.color = _.red}
              onMouseLeave={e => e.currentTarget.style.color = _.faint}
            ><Trash2 size={14} /></div>
          </div>
        );
      })}

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project" width={400}>
        <div style={{ fontSize: 14, color: _.body, marginBottom: 24 }}>
          Delete <strong>{deleteTarget ? pName(deleteTarget, clients) : ""}</strong>? This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            remove(deleteTarget.id);
            notify("Project deleted");
            setDeleteTarget(null);
          }}>Delete</Button>
        </div>
      </Modal>
    </Section>
  );
}
