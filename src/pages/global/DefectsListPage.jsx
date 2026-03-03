import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { pName, badge } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { Bug } from "lucide-react";

const STATUS_TABS = ["All", "Open", "Resolved"];

export default function DefectsListPage() {
  const { projects, clients, mobile } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const allDefects = useMemo(() => {
    const out = [];
    for (const pr of projects) {
      for (const d of pr.defects || []) {
        const resolved = d.status === "resolved" || d.done;
        out.push({ ...d, resolved, projectId: pr.id, projectName: pName(pr, clients) });
      }
    }
    return out;
  }, [projects, clients]);

  const filtered = allDefects.filter(d => {
    if (filter === "Open" && d.resolved) return false;
    if (filter === "Resolved" && !d.resolved) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(d.title || "").toLowerCase().includes(q)
        && !(d.projectName || "").toLowerCase().includes(q)
        && !(d.location || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const openCount = allDefects.filter(d => !d.resolved).length;
  const resolvedCount = allDefects.filter(d => d.resolved).length;

  return (
    <Section>
      <div style={{ marginBottom: _.s5 }}>
        <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight }}>Defects</h1>
        <div style={{ fontSize: _.fontSize.base, color: _.muted, marginTop: _.s1 }}>
          {openCount} open · {resolvedCount} resolved
        </div>
      </div>

      <div style={{ display: "flex", gap: _.s3, marginBottom: _.s5, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search defects\u2026" style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
        <Tabs tabs={STATUS_TABS} active={filter} onChange={setFilter} />
      </div>

      {filtered.length === 0 && <Empty icon={Bug} text={search ? "No matching defects" : "No defects recorded"} />}

      {filtered.length > 0 && (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 1fr auto auto", gap: _.s2,
            padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`,
            fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
          }}>
            <span>Defect</span>
            {!mobile && <span>Project</span>}
            {!mobile && <span>Location</span>}
            <span style={{ textAlign: "center" }}>Status</span>
          </div>

          {filtered.map(d => (
            <div key={`${d.projectId}-${d.id}`} onClick={() => navigate(`/projects/${d.projectId}/defects`)} style={{
              display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 1fr auto auto", gap: _.s2,
              padding: `${_.s3}px ${_.s1}px`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
              alignItems: "center", borderRadius: _.rXs, transition: `background ${_.tr}`,
            }}
              onMouseEnter={e => e.currentTarget.style.background = _.well}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.title || "Untitled defect"}
                </div>
                {mobile && <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{d.projectName}</div>}
              </div>
              {!mobile && (
                <div style={{ fontSize: _.fontSize.base, color: _.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.projectName}
                </div>
              )}
              {!mobile && (
                <div style={{ fontSize: _.fontSize.sm, color: _.muted, minWidth: 90 }}>
                  {d.location || "\u2014"}
                </div>
              )}
              <div style={{ textAlign: "center" }}>
                <span style={badge(d.resolved ? _.green : _.red)}>
                  {d.resolved ? "Resolved" : "Open"}
                </span>
              </div>
            </div>
          ))}
        </>
      )}
    </Section>
  );
}
