import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { pName, badge } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { FolderOpen } from "lucide-react";

const CATEGORIES = ["All", "Plans", "Specs", "Contracts", "Permits", "Photos", "Correspondence", "Other"];
const CAT_COLORS = { Plans: _.blue, Specs: _.violet, Contracts: _.green, Permits: _.amber, Photos: _.ac, Correspondence: _.muted, Other: _.body };

function formatSize(bytes) {
  if (!bytes) return "\u2014";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsListPage() {
  const { projects, clients, mobile } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const allDocs = useMemo(() => {
    const out = [];
    for (const pr of projects) {
      for (const doc of pr.documents || []) {
        out.push({ ...doc, projectId: pr.id, projectName: pName(pr, clients) });
      }
    }
    return out.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [projects, clients]);

  const filtered = allDocs.filter(doc => {
    if (filter !== "All" && (doc.category || "Other") !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(doc.name || "").toLowerCase().includes(q)
        && !(doc.projectName || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <Section>
      <div style={{ marginBottom: _.s5 }}>
        <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight }}>Documents</h1>
        <div style={{ fontSize: _.fontSize.base, color: _.muted, marginTop: _.s1 }}>{allDocs.length} documents across all projects</div>
      </div>

      <div style={{ display: "flex", gap: _.s3, marginBottom: _.s5, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search documents\u2026" style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
        <Tabs tabs={CATEGORIES} active={filter} onChange={setFilter} />
      </div>

      {filtered.length === 0 && <Empty icon={FolderOpen} text={search ? "No matching documents" : "No documents yet"} />}

      {filtered.length > 0 && (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 1fr auto auto", gap: _.s2,
            padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`,
            fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
          }}>
            <span>Document</span>
            {!mobile && <span>Project</span>}
            {!mobile && <span style={{ textAlign: "right" }}>Size</span>}
            <span style={{ textAlign: "center" }}>Category</span>
          </div>

          {filtered.map(doc => {
            const cat = doc.category || "Other";
            const color = CAT_COLORS[cat] || _.body;
            return (
              <div key={`${doc.projectId}-${doc.id}`} onClick={() => navigate(`/projects/${doc.projectId}/documents`)} style={{
                display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 1fr auto auto", gap: _.s2,
                padding: `${_.s3}px ${_.s1}px`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
                alignItems: "center", borderRadius: _.rXs, transition: `background ${_.tr}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.name}
                  </div>
                  {mobile && <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{doc.projectName}</div>}
                </div>
                {!mobile && (
                  <div style={{ fontSize: _.fontSize.base, color: _.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.projectName}
                  </div>
                )}
                {!mobile && (
                  <span style={{ textAlign: "right", fontSize: _.fontSize.sm, color: _.muted, minWidth: 70 }}>
                    {formatSize(doc.size)}
                  </span>
                )}
                <div style={{ textAlign: "center" }}><span style={badge(color)}>{cat}</span></div>
              </div>
            );
          })}
        </>
      )}
    </Section>
  );
}
