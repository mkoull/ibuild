import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, CalendarCheck2, ClipboardCheck } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import _ from "../../theme/tokens.js";
import { pName, badge } from "../../theme/styles.js";
import { isSubcontractor } from "../../lib/permissions.js";

function includesTrade(value, tradeNames) {
  const v = String(value || "").toLowerCase();
  if (!v) return false;
  return tradeNames.some((t) => v.includes(String(t || "").toLowerCase()));
}

export default function SubcontractorPortalPage() {
  const { projects, clients, currentUser } = useApp();
  const navigate = useNavigate();
  const isSub = isSubcontractor(currentUser);

  const assignedTradeNames = useMemo(
    () => (Array.isArray(currentUser?.assignedTradeNames) ? currentUser.assignedTradeNames : []),
    [currentUser],
  );
  const assignedProjectIds = useMemo(
    () => (Array.isArray(currentUser?.assignedProjectIds) ? currentUser.assignedProjectIds : []),
    [currentUser],
  );

  const myJobs = useMemo(() => {
    if (!isSub) return projects;
    return projects.filter((p) => {
      if (assignedProjectIds.includes(p.id)) return true;
      const hasTaskTrade = (p.schedule?.tasks || []).some((t) => includesTrade(t.trade, assignedTradeNames));
      const hasDefectTrade = (p.defects || []).some((d) => includesTrade(d.trade, assignedTradeNames));
      const hasPoTrade = (p.procurement?.purchaseOrders || []).some((po) => includesTrade(po.supplier, assignedTradeNames));
      return hasTaskTrade || hasDefectTrade || hasPoTrade;
    });
  }, [assignedProjectIds, assignedTradeNames, isSub, projects]);

  const myTasks = useMemo(() => {
    const rows = [];
    myJobs.forEach((p) => {
      (p.schedule?.tasks || []).forEach((t) => {
        if (!isSub || includesTrade(t.trade, assignedTradeNames)) {
          rows.push({
            id: `${p.id}-${t.id}`,
            projectId: p.id,
            projectName: pName(p, clients),
            name: t.name || "Task",
            trade: t.trade || "—",
            status: t.status || "Not started",
          });
        }
      });
    });
    return rows;
  }, [assignedTradeNames, clients, isSub, myJobs]);

  const myDefects = useMemo(() => {
    const rows = [];
    myJobs.forEach((p) => {
      (p.defects || []).forEach((d) => {
        if (!isSub || includesTrade(d.trade, assignedTradeNames)) {
          rows.push({
            id: `${p.id}-${d.id}`,
            projectId: p.id,
            projectName: pName(p, clients),
            title: d.title || d.description || "Defect",
            trade: d.trade || "—",
            status: d.status || "Open",
          });
        }
      });
    });
    return rows;
  }, [assignedTradeNames, clients, isSub, myJobs]);

  return (
    <Section>
      <h1 style={{ marginTop: 0, marginBottom: 4 }}>Subcontractor Portal</h1>
      <div style={{ fontSize: 14, color: _.muted, marginBottom: 16 }}>
        View assigned jobs, update tasks, and action defects.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
        <Card icon={Briefcase} subtitle="My Jobs"><div style={metric}>{myJobs.length}</div></Card>
        <Card icon={CalendarCheck2} subtitle="My Tasks"><div style={metric}>{myTasks.length}</div></Card>
        <Card icon={ClipboardCheck} subtitle="My Defects"><div style={metric}>{myDefects.length}</div></Card>
      </div>

      <Card title="My Jobs" style={{ marginBottom: 12 }}>
        {myJobs.length === 0 ? (
          <Empty title="No assigned jobs" text="Your assigned jobs will appear here." />
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {myJobs.map((p) => (
              <div key={p.id} style={rowStyle}>
                <div>
                  <div style={{ fontWeight: 600 }}>{pName(p, clients)}</div>
                  <div style={{ fontSize: 12, color: _.muted }}>{p.address || "No site address"}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/projects/${p.id}/schedule`)}>Schedule</Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/projects/${p.id}/procurement`)}>POs</Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/projects/${p.id}/defects`)}>Defects</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="My Tasks" style={{ marginBottom: 12 }}>
        {myTasks.length === 0 ? (
          <Empty title="No assigned tasks" text="Assigned schedule tasks will appear here." />
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {myTasks.slice(0, 12).map((t) => (
              <button key={t.id} type="button" onClick={() => navigate(`/projects/${t.projectId}/schedule`)} style={{ ...rowStyle, border: `1px solid ${_.line}`, background: _.surface, textAlign: "left", cursor: "pointer" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: _.muted }}>{t.projectName} · {t.trade}</div>
                </div>
                <span style={badge(_.blue)}>{t.status}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card title="My Defects">
        {myDefects.length === 0 ? (
          <Empty title="No assigned defects" text="Assigned defects will appear here." />
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {myDefects.slice(0, 12).map((d) => (
              <button key={d.id} type="button" onClick={() => navigate(`/projects/${d.projectId}/defects`)} style={{ ...rowStyle, border: `1px solid ${_.line}`, background: _.surface, textAlign: "left", cursor: "pointer" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{d.title}</div>
                  <div style={{ fontSize: 12, color: _.muted }}>{d.projectName} · {d.trade}</div>
                </div>
                <span style={badge(_.amber)}>{d.status}</span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </Section>
  );
}

const metric = {
  fontSize: 24,
  fontWeight: 700,
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  padding: 10,
  borderRadius: 8,
};
