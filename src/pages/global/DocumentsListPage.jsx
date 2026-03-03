import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { pName, badge } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import PageHero from "../../components/ui/PageHero.jsx";
import Card from "../../components/ui/Card.jsx";
import { FolderOpen } from "lucide-react";

const CATEGORIES = ["Plans", "Specs", "Contracts", "Permits", "Photos", "Correspondence", "Other"];
const CAT_COLORS = { Plans: _.blue, Specs: _.violet, Contracts: _.green, Permits: _.amber, Photos: _.ac, Correspondence: _.muted, Other: _.body };

function formatSize(bytes) {
  if (!bytes) return "\u2014";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
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

  const catCounts = useMemo(() => {
    const counts = {};
    for (const doc of allDocs) {
      const cat = doc.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [allDocs]);

  const filtered = allDocs.filter(doc => {
    if (filter !== "All" && (doc.category || "Other") !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(doc.name || "").toLowerCase().includes(q)
        && !(doc.projectName || "").toLowerCase().includes(q)
        && !(doc.category || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const projectCount = new Set(allDocs.map(d => d.projectId)).size;

  return (
    <Section>
      <PageHero
        icon={FolderOpen}
        title="Documents"
        subtitle={`${allDocs.length} files across ${projectCount} project${projectCount !== 1 ? "s" : ""}`}
      />

      {/* Category tiles */}
      {Object.keys(catCounts).length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(3, 1fr)" : `repeat(${Math.min(CATEGORIES.length, 7)}, 1fr)`, gap: mobile ? _.s2 : _.s3, marginBottom: mobile ? _.s6 : _.s8 }}>
          {CATEGORIES.filter(c => catCounts[c]).map(cat => (
            <Card key={cat} interactive onClick={() => setFilter(filter === cat ? "All" : cat)} style={{
              padding: `${_.s3}px ${_.s4}px`,
              borderColor: filter === cat ? CAT_COLORS[cat] : undefined,
              background: filter === cat ? `${CAT_COLORS[cat]}08` : undefined,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: _.s2 }}>
                <span style={{ width: 8, height: 8, borderRadius: 8, background: CAT_COLORS[cat] || _.body }} />
                <span style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.medium, color: filter === cat ? CAT_COLORS[cat] : _.body }}>{cat}</span>
              </div>
              <div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: filter === cat ? CAT_COLORS[cat] : _.ink }}>{catCounts[cat]}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Search + Clear filter */}
      <div style={{ display: "flex", gap: _.s3, marginBottom: _.s5, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search documents\u2026" style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
        {filter !== "All" && (
          <button onClick={() => setFilter("All")} style={{
            background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
            fontSize: _.fontSize.sm, color: _.ac, fontWeight: _.fontWeight.semi,
          }}>Clear filter</button>
        )}
      </div>

      {/* Section header */}
      <div style={{ height: 1, background: _.line, marginBottom: mobile ? _.s6 : _.s8 }} />
      <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3, paddingLeft: _.s2, borderLeft: `3px solid ${_.violet}` }}>
        {filter === "All" ? "All Files" : `${filter} Files`}
      </div>

      {filtered.length === 0 && <Empty icon={FolderOpen} text={search ? "No matching documents" : "No documents yet"} />}

      {filtered.length > 0 && (
        <Card style={{ padding: 0 }}>
          <div style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 1fr 80px 80px auto", gap: _.s2,
            padding: `${_.s2}px ${_.s4}px`, borderBottom: `2px solid ${_.ink}`,
            fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
          }}>
            <span>Document</span>
            {!mobile && <span>Project</span>}
            {!mobile && <span style={{ textAlign: "right" }}>Size</span>}
            {!mobile && <span>Uploaded</span>}
            <span style={{ textAlign: "center" }}>Category</span>
          </div>

          {filtered.map(doc => {
            const cat = doc.category || "Other";
            const color = CAT_COLORS[cat] || _.body;
            return (
              <div key={`${doc.projectId}-${doc.id}`} onClick={() => navigate(`/projects/${doc.projectId}/documents`)} style={{
                display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 1fr 80px 80px auto", gap: _.s2,
                padding: `${_.s3}px ${_.s4}px`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
                alignItems: "center", transition: `background ${_.tr}`,
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
                  <span style={{ textAlign: "right", fontSize: _.fontSize.sm, color: _.muted }}>
                    {formatSize(doc.size)}
                  </span>
                )}
                {!mobile && (
                  <span style={{ fontSize: _.fontSize.sm, color: _.muted }}>
                    {formatDate(doc.createdAt)}
                  </span>
                )}
                <div style={{ textAlign: "center" }}><span style={badge(color)}>{cat}</span></div>
              </div>
            );
          })}
        </Card>
      )}
    </Section>
  );
}
