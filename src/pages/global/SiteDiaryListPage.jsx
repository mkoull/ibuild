import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { pName, badge } from "../../theme/styles.js";
import { isJob } from "../../lib/lifecycle.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import PageHero from "../../components/ui/PageHero.jsx";
import Card from "../../components/ui/Card.jsx";
import { NotebookText, HardHat, Sun, Clock } from "lucide-react";

const WEATHER_COLORS = {
  Clear: _.blue, Sunny: _.amber, Cloudy: _.muted, Rainy: _.blue,
  Overcast: _.muted, Windy: _.violet, Wet: _.blue, Hot: _.red, Cold: _.blue,
};

const PROJECT_FILTER_ALL = "All Projects";

export default function SiteDiaryListPage() {
  const { projects, clients, mobile } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState(PROJECT_FILTER_ALL);

  const jobProjects = useMemo(() =>
    projects.filter(pr => isJob(pr.stage || pr.status) && (pr.diary || []).length > 0),
  [projects]);

  const projectTabs = useMemo(() =>
    [PROJECT_FILTER_ALL, ...jobProjects.map(pr => pName(pr, clients))],
  [jobProjects, clients]);

  const allEntries = useMemo(() => {
    const out = [];
    for (const pr of jobProjects) {
      const name = pName(pr, clients);
      for (const entry of pr.diary || []) {
        out.push({ ...entry, projectId: pr.id, projectName: name });
      }
    }
    return out.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [jobProjects, clients]);

  const filtered = allEntries.filter(entry => {
    if (projectFilter !== PROJECT_FILTER_ALL && entry.projectName !== projectFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (entry.notes || "").toLowerCase().includes(q)
      || (entry.projectName || "").toLowerCase().includes(q)
      || (entry.trades || "").toLowerCase().includes(q)
      || (entry.weather || "").toLowerCase().includes(q);
  });

  // KPI calculations
  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    return allEntries.filter(e => e.date && new Date(e.date) >= weekAgo).length;
  }, [allEntries]);

  const commonWeather = useMemo(() => {
    const counts = {};
    for (const e of allEntries) {
      if (e.weather) counts[e.weather] = (counts[e.weather] || 0) + 1;
    }
    let best = null, max = 0;
    for (const [w, c] of Object.entries(counts)) {
      if (c > max) { best = w; max = c; }
    }
    return best;
  }, [allEntries]);

  const projectCount = jobProjects.length;

  const kpis = [
    { label: "Total Entries", value: allEntries.length > 0 ? `${allEntries.length}` : "\u2014", color: _.blue, Ic: NotebookText, sub: `${projectCount} job${projectCount !== 1 ? "s" : ""}` },
    { label: "This Week", value: thisWeekCount > 0 ? `${thisWeekCount}` : "\u2014", color: _.green, Ic: Clock },
    { label: "Most Common Weather", value: commonWeather || "\u2014", color: _.amber, Ic: Sun },
  ];

  return (
    <Section>
      <PageHero
        icon={NotebookText}
        title="Site Diary"
        subtitle={`${allEntries.length} entries across ${projectCount} job${projectCount !== 1 ? "s" : ""}`}
      />

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : `repeat(${kpis.length}, 1fr)`, gap: mobile ? _.s2 : _.s3, marginBottom: mobile ? _.s6 : _.s8 }}>
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search notes, trades, weather\u2026" style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
        {projectTabs.length > 2 && <Tabs tabs={projectTabs} active={projectFilter} onChange={setProjectFilter} />}
      </div>

      {/* Section header */}
      <div style={{ height: 1, background: _.line, marginBottom: mobile ? _.s6 : _.s8 }} />
      <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3, paddingLeft: _.s2, borderLeft: `3px solid ${_.amber}` }}>Diary Entries</div>

      {filtered.length === 0 && <Empty icon={NotebookText} text={search ? "No matching entries" : "No diary entries yet"} />}

      {filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: _.s2 }}>
          {filtered.map((entry, idx) => {
            const wColor = WEATHER_COLORS[entry.weather] || _.muted;
            return (
              <Card key={`${entry.projectId}-${idx}`} interactive onClick={() => navigate(`/projects/${entry.projectId}/site-diary`)} style={{
                padding: `${_.s3}px ${_.s4}px`,
                borderLeft: entry.weather ? `3px solid ${wColor}` : undefined,
              }}>
                {/* Header row: date, project, weather */}
                <div style={{ display: "flex", alignItems: "center", gap: _.s3, flexWrap: "wrap", marginBottom: entry.notes || entry.trades ? _.s2 : 0 }}>
                  <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, minWidth: 90 }}>
                    {entry.date || "\u2014"}
                  </span>
                  <span style={{ fontSize: _.fontSize.sm, color: _.ac, fontWeight: _.fontWeight.medium }}>
                    {entry.projectName}
                  </span>
                  <div style={{ flex: 1 }} />
                  {entry.weather && (
                    <span style={{ ...badge(wColor), fontSize: _.fontSize.sm, padding: "4px 12px" }}>
                      {entry.weather}
                    </span>
                  )}
                </div>

                {/* Trade pills */}
                {entry.trades && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: entry.notes ? _.s1 : 0 }}>
                    <HardHat size={12} color={_.muted} />
                    {entry.trades.split(",").map((t, i) => (
                      <span key={i} style={badge(_.violet)}>{t.trim()}</span>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {entry.notes && (
                  <div style={{ fontSize: _.fontSize.base, color: _.body, lineHeight: 1.5 }}>
                    {entry.notes}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Section>
  );
}
