import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName, stCol, badge, ds } from "../../theme/styles.js";
import { normaliseStage } from "../../lib/lifecycle.js";
import { calc } from "../../lib/calc.js";
import { applyConvertToJobBaseline } from "../../lib/costEngine.js";
import Card from "../../components/ui/Card.jsx";
import PageHero from "../../components/ui/PageHero.jsx";
import {
  AlertCircle,
  ArrowRight,
  ClipboardList,
  DollarSign,
  FileText,
  FileWarning,
  FolderKanban,
  HardHat,
  ReceiptText,
  ShoppingCart,
} from "lucide-react";
import { isSubcontractor } from "../../lib/permissions.js";

function toTimestamp(value, fallback = 0) {
  if (!value) return fallback;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : fallback;
}

function buildRecentActivity(projects, clients) {
  const events = [];

  projects.forEach((pr) => {
    const projectName = pName(pr, clients);
    const projectPath = `/projects/${pr.id}/overview`;

    (pr.invoices || [])
      .filter((inv) => String(inv.status || "").toLowerCase() === "paid")
      .forEach((inv) => {
        events.push({
          id: `${pr.id}-invoice-${inv.id || inv.number || Math.random()}`,
          icon: DollarSign,
          color: _.green,
          text: `${projectName} — Invoice paid`,
          at: toTimestamp(inv.paidDate || inv.updatedAt || inv.issuedDate, toTimestamp(pr.updatedAt || pr.createdAt)),
          path: `/projects/${pr.id}/invoices`,
        });
      });

    (pr.variations || [])
      .filter((v) => String(v.status || "").toLowerCase() === "approved")
      .forEach((v) => {
        events.push({
          id: `${pr.id}-variation-${v.id || v.number || Math.random()}`,
          icon: ClipboardList,
          color: _.blue,
          text: `${projectName} — Variation approved`,
          at: toTimestamp(v.updatedAt || v.approvedAt || v.createdAt, toTimestamp(pr.updatedAt || pr.createdAt)),
          path: `/projects/${pr.id}/variations`,
        });
      });

    (pr.procurement?.purchaseOrders || [])
      .filter((po) => String(po.status || "").toLowerCase() === "issued")
      .forEach((po) => {
        events.push({
          id: `${pr.id}-po-${po.id || po.number || Math.random()}`,
          icon: FolderKanban,
          color: _.amber,
          text: `${projectName} — PO issued`,
          at: toTimestamp(po.updatedAt || po.createdAt, toTimestamp(pr.updatedAt || pr.createdAt)),
          path: `/projects/${pr.id}/procurement`,
        });
      });

    (pr.defects || []).forEach((d) => {
      events.push({
        id: `${pr.id}-defect-${d.id || d.number || Math.random()}`,
        icon: FileWarning,
        color: _.red,
        text: `${projectName} — Defect created`,
        at: toTimestamp(d.createdAt || d.updatedAt, toTimestamp(pr.updatedAt || pr.createdAt)),
        path: `/projects/${pr.id}/defects`,
      });
    });

    if (events.length === 0 && Array.isArray(pr.activity)) {
      pr.activity.slice(0, 2).forEach((a, idx) => {
        events.push({
          id: `${pr.id}-activity-${idx}`,
          icon: AlertCircle,
          color: _.muted,
          text: `${projectName} — ${a.action || "Updated project"}`,
          at: toTimestamp(a.time || a.date, toTimestamp(pr.updatedAt || pr.createdAt)),
          path: projectPath,
        });
      });
    }
  });

  return events.sort((a, b) => b.at - a.at).slice(0, 12);
}

export default function DashboardPage() {
  const { projects, clients, create, update, notify, currentUser } = useApp();
  const navigate = useNavigate();
  if (isSubcontractor(currentUser)) return <Navigate to="/portal" replace />;

  const projectCalcs = useMemo(
    () => projects.map((pr) => ({ pr, t: calc(pr) })),
    [projects],
  );

  const activeProjects = projectCalcs.filter(({ pr }) => String(pr.stage || pr.status || "").toLowerCase() === "active");
  const outstandingInvoices = projectCalcs.reduce((sum, { t }) => sum + Number(t.outstanding || 0), 0);
  const pendingVariations = projects.reduce(
    (sum, pr) => sum + (pr.variations || []).filter((v) => ["pending", "sent"].includes(String(v.status || "").toLowerCase())).length,
    0,
  );
  const openDefects = projects.reduce(
    (sum, pr) => sum + (pr.defects || []).filter((d) => !["completed", "closed"].includes(String(d.status || "").toLowerCase())).length,
    0,
  );

  const totalContractValue = activeProjects.reduce((sum, { t }) => sum + Number(t.curr || 0), 0);
  const budgetTotal = activeProjects.reduce((sum, { t }) => sum + Number(t.budgetTotal || 0), 0);
  const actualTotal = activeProjects.reduce((sum, { t }) => sum + Number(t.combinedActuals || 0), 0);
  const projectedMargin = activeProjects.reduce((sum, { t }) => sum + Number(t.forecastMarginNew || t.forecastMargin || 0), 0);
  const budgetUsedPct = budgetTotal > 0 ? Math.min(100, (actualTotal / budgetTotal) * 100) : 0;

  const recentActivity = useMemo(() => buildRecentActivity(projects, clients), [projects, clients]);
  const recentProjects = useMemo(
    () => [...projects]
      .sort((a, b) => toTimestamp(b.updatedAt || b.createdAt) - toTimestamp(a.updatedAt || a.createdAt))
      .slice(0, 8),
    [projects],
  );
  const primaryActiveProject = activeProjects[0]?.pr || null;

  const quickCreateEstimate = () => {
    const p = create();
    navigate(`/estimates/${p.id}/overview?step=estimate`);
    notify("New estimate created");
  };

  const quickCreateJob = () => {
    const p = create();
    update(p.id, (pr) => {
      applyConvertToJobBaseline(pr);
      return pr;
    });
    navigate(`/projects/${p.id}/overview`);
    notify("New job created");
  };

  const openProjectCreateFlow = (path, label) => {
    if (!primaryActiveProject) {
      notify("Create or convert an active project first", "info");
      navigate("/projects");
      return;
    }
    navigate(`/projects/${primaryActiveProject.id}/${path}?create=1`);
    notify(`${label} flow opened`);
  };

  const kpiCards = [
    { label: "Active Projects", value: activeProjects.length, sub: "Projects in delivery", link: "/projects", icon: FolderKanban, color: _.blue },
    { label: "Outstanding Invoices", value: fmt(outstandingInvoices), sub: "Across all projects", link: "/finance/invoices", icon: DollarSign, color: _.red },
    { label: "Pending Variations", value: pendingVariations, sub: "Awaiting approval", link: "/projects", icon: ClipboardList, color: _.amber },
    { label: "Open Defects", value: openDefects, sub: "Action required", link: "/site/defects", icon: FileWarning, color: _.violet },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHero
        title="Project Command Centre"
        subtitle={`${projects.length} project${projects.length !== 1 ? "s" : ""} · ${ds()}`}
        actions={(
          <button
            onClick={() => navigate("/projects")}
            style={{ border: "none", background: "transparent", cursor: "pointer", color: _.ac, fontSize: 14, fontWeight: 600 }}
          >
            View all projects
          </button>
        )}
      />

      <div className="layout-grid-12">
        {kpiCards.map((kpi) => (
          <Card
            key={kpi.label}
            className="col-3"
            icon={kpi.icon}
            subtitle={kpi.label}
            interactive
            onClick={() => navigate(kpi.link)}
            style={{ padding: 16 }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: kpi.color, marginBottom: 10 }} />
            <div style={{ fontSize: 24, fontWeight: 700, color: _.ink, fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: _.muted, marginTop: 6 }}>{kpi.sub}</div>
          </Card>
        ))}
      </div>

      <Card title="Quick Actions">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={quickCreateEstimate} style={quickActionBtn}>
            <FileText size={14} />
            Create Estimate
          </button>
          <button type="button" onClick={quickCreateJob} style={quickActionBtn}>
            <HardHat size={14} />
            Create Job
          </button>
          <button type="button" onClick={() => openProjectCreateFlow("invoices", "Invoice")} style={quickActionBtn}>
            <ReceiptText size={14} />
            Create Invoice
          </button>
          <button type="button" onClick={() => openProjectCreateFlow("procurement", "Purchase Order")} style={quickActionBtn}>
            <ShoppingCart size={14} />
            Create Purchase Order
          </button>
        </div>
      </Card>

      <div className="layout-grid-12">
        <Card className="col-6" title="Recent Activity" style={{ minHeight: 280 }}>
          {recentActivity.length === 0 && (
            <div style={{ fontSize: 14, color: _.muted }}>No activity yet.</div>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            {recentActivity.slice(0, 8).map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => navigate(event.path)}
                style={{
                  border: `1px solid ${_.line}`,
                  borderRadius: 8,
                  background: _.surface,
                  padding: "10px 12px",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
              >
                <event.icon size={14} color={event.color} />
                <span style={{ fontSize: 14, color: _.body, flex: 1 }}>{event.text}</span>
                <span style={{ fontSize: 12, color: _.muted }}>{new Date(event.at).toLocaleDateString("en-AU")}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="col-6" title="Financial Snapshot" style={{ minHeight: 280 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <SnapshotRow label="Total Contract Value" value={fmt(totalContractValue)} />
            <SnapshotRow label="Budget vs Actual" value={`${fmt(budgetTotal)} / ${fmt(actualTotal)}`} />
            <div style={{ height: 10, background: _.well, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${budgetUsedPct}%`, height: "100%", background: budgetUsedPct > 100 ? _.red : _.ac }} />
            </div>
            <SnapshotRow label="Projected Margin" value={fmt(projectedMargin)} tone={projectedMargin >= 0 ? _.green : _.red} />
          </div>
        </Card>
      </div>

      <Card title="Recent Projects" headerRight={(
        <button
          type="button"
          onClick={() => navigate("/projects")}
          style={{ border: "none", background: "transparent", color: _.ac, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          Open Projects <ArrowRight size={12} />
        </button>
      )}>
        {recentProjects.length === 0 && (
          <div style={{ fontSize: 14, color: _.muted }}>No projects yet.</div>
        )}
        {recentProjects.length > 0 && (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 0.7fr 0.9fr",
              gap: 8,
              fontSize: 12,
              color: _.muted,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              padding: "0 8px",
            }}>
              <span>Project</span>
              <span>Client</span>
              <span>Status</span>
              <span style={{ textAlign: "right" }}>Contract</span>
            </div>
            {recentProjects.map((pr) => {
              const t = calc(pr);
              const stage = normaliseStage(pr.stage || pr.status);
              const linkedClient = pr.clientId ? clients.find((c) => c.id === pr.clientId) : null;
              const clientName = linkedClient?.displayName || pr.client || "—";
              return (
                <button
                  key={pr.id}
                  type="button"
                  onClick={() => navigate(`/projects/${pr.id}/overview`)}
                  style={{
                    border: `1px solid ${_.line}`,
                    borderRadius: 8,
                    background: _.surface,
                    padding: "10px 8px",
                    textAlign: "left",
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr 0.7fr 0.9fr",
                    gap: 8,
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 14, color: _.ink, fontWeight: 600 }}>{pName(pr, clients)}</span>
                  <span style={{ fontSize: 14, color: _.body }}>{clientName}</span>
                  <span><span style={badge(stCol(stage))}>{stage}</span></span>
                  <span style={{ textAlign: "right", fontSize: 14, color: _.ink, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {fmt(t.curr || 0)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

const quickActionBtn = {
  border: `1px solid ${_.line}`,
  background: _.surface,
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 14,
  color: _.ink,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 600,
};

function SnapshotRow({ label, value, tone }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <span style={{ fontSize: 14, color: _.muted }}>{label}</span>
      <span style={{ fontSize: 16, color: tone || _.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}
