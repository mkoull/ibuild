import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName, stCol, badge, btnPrimary } from "../../theme/styles.js";
import { calc } from "../../lib/calc.js";
import { STAGES } from "../../data/defaults.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
import { useState } from "react";

export default function ProjectsListPage() {
  const { projects, clients, create, remove, mobile, notify } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? projects : projects.filter(pr => (pr.stage || pr.status) === filter);

  const handleNew = () => {
    const p = create();
    navigate(`/projects/${p.id}/scope`);
    notify("New project created");
  };

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: mobile ? 28 : 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Projects</h1>
        <button onClick={handleNew} style={btnPrimary}><Plus size={14} /> New Project</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {["All", ...STAGES].map(s => (
          <div key={s} onClick={() => setFilter(s)} style={{
            padding: "6px 14px", borderRadius: _.rFull, fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: filter === s ? _.ink : _.well, color: filter === s ? "#fff" : _.muted,
            transition: "all 0.15s",
          }}>{s}</div>
        ))}
      </div>

      {filtered.length === 0 && <Empty icon={FolderOpen} text="No projects found" action={handleNew} actionText="Create Project" />}

      {filtered.map(pr => {
        const T = calc(pr);
        const stage = pr.stage || pr.status;
        return (
          <div key={pr.id} onClick={() => navigate(`/projects/${pr.id}/overview`)} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: `${_.s4}px 0`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
            transition: "padding-left 0.12s",
          }}
          onMouseEnter={e => e.currentTarget.style.paddingLeft = "4px"}
          onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pName(pr, clients)}</div>
              <div style={{ fontSize: 12, color: _.muted, marginTop: 1 }}>
                {pr.buildType || pr.type}{T.curr > 0 ? ` · ${fmt(T.curr)}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: _.s3 }}>
              <span style={badge(stCol(stage))}>{stage}</span>
              <div onClick={e => {
                e.stopPropagation();
                if (confirm(`Delete "${pName(pr, clients)}"? This cannot be undone.`)) {
                  remove(pr.id);
                  notify("Project deleted");
                }
              }}
                style={{ cursor: "pointer", color: _.faint, transition: "color 0.15s", padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = _.red}
                onMouseLeave={e => e.currentTarget.style.color = _.faint}
              ><Trash2 size={14} /></div>
            </div>
          </div>
        );
      })}
    </Section>
  );
}
