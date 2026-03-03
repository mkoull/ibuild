import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { pName, badge } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import PageHero from "../../components/ui/PageHero.jsx";
import Card from "../../components/ui/Card.jsx";
import { Bug, AlertCircle, CheckCircle2 } from "lucide-react";

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
    return out.sort((a, b) => {
      if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
      return (b.date || "").localeCompare(a.date || "");
    });
  }, [projects, clients]);

  const filtered = allDefects.filter(d => {
    if (filter === "Open" && d.resolved) return false;
    if (filter === "Resolved" && !d.resolved) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(d.title || d.desc || "").toLowerCase().includes(q)
        && !(d.projectName || "").toLowerCase().includes(q)
        && !(d.location || "").toLowerCase().includes(q)
        && !(d.assignee || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const openCount = allDefects.filter(d => !d.resolved).length;
  const resolvedCount = allDefects.filter(d => d.resolved).length;
  const projectCount = new Set(allDefects.map(d => d.projectId)).size;
  const resolvedPct = allDefects.length > 0 ? Math.round((resolvedCount / allDefects.length) * 100) : 0;

  const kpis = [
    { label: "Open", value: openCount > 0 ? `${openCount}` : "\u2014", color: _.red, Ic: AlertCircle, sub: openCount > 0 ? "Needs attention" : null },
    { label: "Resolved", value: resolvedCount > 0 ? `${resolvedCount}` : "\u2014", color: _.green, Ic: CheckCircle2 },
    { label: "Total", value: allDefects.length > 0 ? `${allDefects.length}` : "\u2014", color: _.blue, Ic: Bug, sub: allDefects.length > 0 ? `${resolvedPct}% resolved` : null },
  ];

  return (
    <Section>
      <PageHero
        icon={Bug}
        title="Defects"
        subtitle={`Punch list across ${projectCount} project${projectCount !== 1 ? "s" : ""}`}
      />

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(3, 1fr)" : `repeat(${kpis.length}, 1fr)`, gap: mobile ? _.s2 : _.s3, marginBottom: mobile ? _.s6 : _.s8 }}>
        {kpis.map(k => (
          <Card key={k.label} icon={k.Ic} subtitle={k.label} accent={k.value !== "\u2014"} style={{ padding: mobile ? _.s3 : _.s5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: _.s3 }}>
              <span style={{ width: 8, height: 8, borderRadius: 8, background: k.color }} />
            </div>
            <div style={{ fontSize: mobile ? _.fontSize.xl : _.fontSize["2xl"], fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", lineHeight: _.lineHeight.heading, color: k.value === "\u2014" ? _.faint : _.ink }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: _.s1 }}>{k.sub}</div>}
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: _.s3, marginBottom: _.s5, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search defects, locations, assignees\u2026" style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
        <Tabs tabs={STATUS_TABS} active={filter} onChange={setFilter} />
      </div>

      {/* Section header */}
      <div style={{ height: 1, background: _.line, marginBottom: mobile ? _.s6 : _.s8 }} />
      <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3, paddingLeft: _.s2, borderLeft: `3px solid ${_.red}` }}>All Defects</div>

      {filtered.length === 0 && <Empty icon={Bug} text={search ? "No matching defects" : "No defects recorded"} />}

      {filtered.length > 0 && (
        <Card style={{ padding: 0 }}>
          <div style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 1fr auto auto auto", gap: _.s2,
            padding: `${_.s2}px ${_.s4}px`, borderBottom: `2px solid ${_.ink}`,
            fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
          }}>
            <span>Defect</span>
            {!mobile && <span>Project</span>}
            {!mobile && <span>Location</span>}
            {!mobile && <span>Assignee</span>}
            <span style={{ textAlign: "center" }}>Status</span>
          </div>

          {filtered.map(d => (
            <div key={`${d.projectId}-${d.id}`} onClick={() => navigate(`/projects/${d.projectId}/defects`)} style={{
              display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 1fr auto auto auto", gap: _.s2,
              padding: `${_.s3}px ${_.s4}px`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
              alignItems: "center", transition: `background ${_.tr}`,
              opacity: d.resolved ? 0.55 : 1,
              background: d.resolved ? _.well : "transparent",
              borderLeft: !d.resolved ? `3px solid ${_.red}` : "3px solid transparent",
            }}
              onMouseEnter={e => e.currentTarget.style.background = _.well}
              onMouseLeave={e => e.currentTarget.style.background = d.resolved ? _.well : "transparent"}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.title || d.desc || "Untitled defect"}
                </div>
                <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 1 }}>
                  {d.date || ""}
                  {mobile && d.location ? ` \u00b7 ${d.location}` : ""}
                </div>
                {mobile && <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{d.projectName}</div>}
              </div>
              {!mobile && (
                <div style={{ fontSize: _.fontSize.base, color: _.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.projectName}
                </div>
              )}
              {!mobile && (
                <div style={{ fontSize: _.fontSize.sm, color: _.muted, minWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.location || "\u2014"}
                </div>
              )}
              {!mobile && (
                <div style={{ fontSize: _.fontSize.sm, color: d.assignee ? _.body : _.faint, minWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.assignee || "\u2014"}
                </div>
              )}
              <div style={{ textAlign: "center" }}>
                <span style={badge(d.resolved ? _.green : _.red)}>
                  {d.resolved ? "Resolved" : "Open"}
                </span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </Section>
  );
}
