import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { pName } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { NotebookText } from "lucide-react";

export default function SiteDiaryListPage() {
  const { projects, clients, mobile } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const allEntries = useMemo(() => {
    const out = [];
    for (const pr of projects) {
      for (const entry of pr.diary || []) {
        out.push({ ...entry, projectId: pr.id, projectName: pName(pr, clients) });
      }
    }
    return out.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [projects, clients]);

  const filtered = allEntries.filter(entry => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (entry.notes || "").toLowerCase().includes(q)
      || (entry.projectName || "").toLowerCase().includes(q)
      || (entry.trades || "").toLowerCase().includes(q);
  });

  return (
    <Section>
      <div style={{ marginBottom: _.s5 }}>
        <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight }}>Site Diary</h1>
        <div style={{ fontSize: _.fontSize.base, color: _.muted, marginTop: _.s1 }}>{allEntries.length} entries across all projects</div>
      </div>

      <div style={{ display: "flex", gap: _.s3, marginBottom: _.s5, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search diary entries\u2026" style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
      </div>

      {filtered.length === 0 && <Empty icon={NotebookText} text={search ? "No matching entries" : "No diary entries yet"} />}

      {filtered.length > 0 && (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr" : "100px 1fr 1fr 100px", gap: _.s2,
            padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`,
            fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
          }}>
            <span>Date</span>
            {!mobile && <span>Project</span>}
            {!mobile && <span>Notes</span>}
            {!mobile && <span>Weather</span>}
          </div>

          {filtered.map((entry, idx) => (
            <div key={`${entry.projectId}-${idx}`} onClick={() => navigate(`/projects/${entry.projectId}/site-diary`)} style={{
              display: "grid", gridTemplateColumns: mobile ? "1fr" : "100px 1fr 1fr 100px", gap: _.s2,
              padding: `${_.s3}px ${_.s1}px`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
              alignItems: "center", borderRadius: _.rXs, transition: `background ${_.tr}`,
            }}
              onMouseEnter={e => e.currentTarget.style.background = _.well}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium }}>{entry.date || "\u2014"}</div>
                {mobile && <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{entry.projectName}</div>}
              </div>
              {!mobile && (
                <div style={{ fontSize: _.fontSize.base, color: _.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.projectName}
                </div>
              )}
              {!mobile && (
                <div style={{ fontSize: _.fontSize.sm, color: _.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.notes || "\u2014"}
                </div>
              )}
              {!mobile && (
                <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{entry.weather || "\u2014"}</div>
              )}
              {mobile && entry.notes && (
                <div style={{ fontSize: _.fontSize.sm, color: _.body, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.notes}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </Section>
  );
}
