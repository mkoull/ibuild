import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName, badge } from "../../theme/styles.js";
import { isJob } from "../../lib/lifecycle.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import PageHero from "../../components/ui/PageHero.jsx";
import Card from "../../components/ui/Card.jsx";
import { ReceiptText, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const STATUS_TABS = ["All", "Draft", "Sent", "Pending", "Unpaid", "Paid", "Overdue", "Void"];
const STATUS_COLORS = { draft: _.muted, sent: _.blue, pending: _.amber, unpaid: _.amber, paid: _.green, void: _.faint, overdue: _.red };

function isOverdue(inv) {
  const status = String(inv.status || "").toLowerCase();
  if (!inv.dueAt || status === "paid" || status === "void") return false;
  return new Date(inv.dueAt) < new Date();
}

function daysOverdue(inv) {
  if (!inv.dueAt) return 0;
  const diff = Date.now() - new Date(inv.dueAt).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

export default function InvoicesListPage() {
  const { projects, clients, mobile } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const allInvoices = useMemo(() => {
    const out = [];
    for (const pr of projects) {
      if (!isJob(pr.stage || pr.status)) continue;
      for (const inv of pr.invoices || []) {
        out.push({
          ...inv,
          projectId: pr.id,
          projectName: pName(pr, clients),
          overdue: isOverdue(inv),
        });
      }
    }
    return out.sort((a, b) => (b.issuedAt || "").localeCompare(a.issuedAt || ""));
  }, [projects, clients]);

  const summary = useMemo(() => {
    let invoiced = 0, paid = 0, outstanding = 0, overdueAmt = 0, overdueCount = 0;
    for (const inv of allInvoices) {
      if (inv.status === "void") continue;
      const amt = inv.amount || 0;
      invoiced += amt;
      if (inv.status === "paid") { paid += amt; }
      else { outstanding += amt; }
      if (inv.overdue) { overdueAmt += amt; overdueCount++; }
    }
    return { invoiced, paid, outstanding, overdueAmt, overdueCount };
  }, [allInvoices]);

  const filtered = allInvoices.filter(inv => {
    const st = (inv.status || "draft").toLowerCase();
    if (filter === "Overdue") { if (!inv.overdue) return false; }
    else if (filter !== "All" && st !== filter.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(inv.title || "").toLowerCase().includes(q)
        && !(inv.projectName || "").toLowerCase().includes(q)
        && !(inv.id || "").toLowerCase().includes(q)
        && !(inv.type || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const jobCount = new Set(allInvoices.map(i => i.projectId)).size;

  const kpis = [
    { label: "Total Invoiced", value: summary.invoiced > 0 ? fmt(summary.invoiced) : "\u2014", color: _.blue, Ic: ReceiptText },
    { label: "Received", value: summary.paid > 0 ? fmt(summary.paid) : "\u2014", color: _.green, Ic: CheckCircle2 },
    { label: "Outstanding", value: summary.outstanding > 0 ? fmt(summary.outstanding) : "\u2014", color: _.amber, Ic: Clock },
    { label: "Overdue", value: summary.overdueAmt > 0 ? fmt(summary.overdueAmt) : "\u2014", color: _.red, Ic: AlertCircle, sub: summary.overdueCount > 0 ? `${summary.overdueCount} invoice${summary.overdueCount > 1 ? "s" : ""}` : null },
  ];

  return (
    <Section>
      <PageHero
        icon={ReceiptText}
        title="Invoices"
        subtitle={`${allInvoices.length} invoices across ${jobCount} job${jobCount !== 1 ? "s" : ""}`}
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoices\u2026" style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
        <Tabs tabs={STATUS_TABS} active={filter} onChange={setFilter} />
      </div>

      {/* Section header */}
      <div style={{ height: 1, background: _.line, marginBottom: mobile ? _.s6 : _.s8 }} />
      <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3, paddingLeft: _.s2, borderLeft: `3px solid ${_.amber}` }}>All Invoices</div>

      {filtered.length === 0 && (
        <Empty
          icon={ReceiptText}
          title={search ? "No matching invoices" : "No invoices yet"}
          text={search ? "Try a different search term." : "Create an invoice from a project workspace to see it here."}
          action={!search ? () => navigate("/projects") : undefined}
          actionText="Open Projects"
        />
      )}

      {filtered.length > 0 && (
        <Card style={{ padding: 0 }}>
          <div style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr auto auto" : "1fr 1fr 90px 90px 80px", gap: _.s2,
            padding: `${_.s2}px ${_.s4}px`, borderBottom: `2px solid ${_.ink}`,
            fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
          }}>
            <span>Invoice</span>
            {!mobile && <span>Project</span>}
            <span style={{ textAlign: "right" }}>Amount</span>
            {!mobile && <span style={{ textAlign: "right" }}>Due</span>}
            <span style={{ textAlign: "center" }}>Status</span>
          </div>

          {filtered.map(inv => {
            const st = (inv.status || "draft").toLowerCase();
            const displayStatus = inv.overdue ? "overdue" : st;
            const color = STATUS_COLORS[displayStatus] || _.muted;
            const days = inv.overdue ? daysOverdue(inv) : 0;
            return (
              <div key={`${inv.projectId}-${inv.id}`} onClick={() => navigate(`/projects/${inv.projectId}/invoices`)} style={{
                display: "grid", gridTemplateColumns: mobile ? "1fr auto auto" : "1fr 1fr 90px 90px 80px", gap: _.s2,
                padding: `${_.s3}px ${_.s4}px`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
                alignItems: "center", transition: `background ${_.tr}`,
                borderLeft: inv.overdue ? `3px solid ${_.red}` : "3px solid transparent",
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {inv.overdue && <AlertCircle size={12} color={_.red} />}
                    <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {inv.title || inv.id}
                    </span>
                  </div>
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 1 }}>
                    {inv.type || "Progress"}{inv.issuedAt ? ` \u00b7 ${inv.issuedAt}` : ""}
                  </div>
                  {mobile && <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{inv.projectName}</div>}
                </div>
                {!mobile && (
                  <div style={{ fontSize: _.fontSize.base, color: _.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {inv.projectName}
                  </div>
                )}
                <span style={{ textAlign: "right", fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums" }}>
                  {fmt(inv.amount || 0)}
                </span>
                {!mobile && (
                  <span style={{ textAlign: "right", fontSize: _.fontSize.sm, color: inv.overdue ? _.red : _.muted, fontWeight: inv.overdue ? _.fontWeight.semi : _.fontWeight.normal }}>
                    {inv.dueAt || "\u2014"}
                    {days > 0 && <span style={{ display: "block", fontSize: _.fontSize.xs, color: _.red }}>{days}d late</span>}
                  </span>
                )}
                <div style={{ textAlign: "center" }}><span style={badge(color)}>{displayStatus}</span></div>
              </div>
            );
          })}
        </Card>
      )}
    </Section>
  );
}
