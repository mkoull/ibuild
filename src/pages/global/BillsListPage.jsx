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
import { FileText, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const STATUS_TABS = ["All", "Draft", "Approved", "Paid", "Overdue", "Void"];
const STATUS_COLORS = { draft: _.muted, approved: _.amber, paid: _.green, void: _.faint, overdue: _.red };

function isOverdue(bill) {
  if (!bill.dueDate || bill.status === "Paid" || bill.status === "Void") return false;
  return new Date(bill.dueDate) < new Date();
}

function daysOverdue(bill) {
  if (!bill.dueDate) return 0;
  const diff = Date.now() - new Date(bill.dueDate).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

export default function BillsListPage() {
  const { projects, clients, mobile } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const allBills = useMemo(() => {
    const out = [];
    for (const pr of projects) {
      if (!isJob(pr.stage || pr.status)) continue;
      for (const bill of pr.supplierBills || []) {
        out.push({
          ...bill,
          projectId: pr.id,
          projectName: pName(pr, clients),
          overdue: isOverdue(bill),
        });
      }
    }
    return out.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [projects, clients]);

  const summary = useMemo(() => {
    let total = 0, draft = 0, approved = 0, paid = 0, overdueAmt = 0, overdueCount = 0;
    for (const bill of allBills) {
      if (bill.status === "Void") continue;
      const amt = bill.total || 0;
      total += amt;
      if (bill.status === "Paid") paid += amt;
      else if (bill.status === "Approved") approved += amt;
      else draft += amt;
      if (bill.overdue) { overdueAmt += amt; overdueCount++; }
    }
    return { total, draft, approved, paid, unpaid: draft + approved, overdueAmt, overdueCount };
  }, [allBills]);

  const filtered = allBills.filter(bill => {
    const st = (bill.status || "Draft").toLowerCase();
    if (filter === "Overdue") { if (!bill.overdue) return false; }
    else if (filter !== "All" && st !== filter.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(bill.vendorName || "").toLowerCase().includes(q)
        && !(bill.projectName || "").toLowerCase().includes(q)
        && !(bill.billNumber || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const jobCount = new Set(allBills.map(b => b.projectId)).size;

  const kpis = [
    { label: "Unpaid", value: summary.unpaid > 0 ? fmt(summary.unpaid) : "\u2014", color: _.amber, Ic: Clock },
    { label: "Paid", value: summary.paid > 0 ? fmt(summary.paid) : "\u2014", color: _.green, Ic: CheckCircle2 },
    { label: "Total Bills", value: summary.total > 0 ? fmt(summary.total) : "\u2014", color: _.blue, Ic: FileText },
    { label: "Overdue", value: summary.overdueAmt > 0 ? fmt(summary.overdueAmt) : "\u2014", color: _.red, Ic: AlertCircle, sub: summary.overdueCount > 0 ? `${summary.overdueCount} bill${summary.overdueCount > 1 ? "s" : ""}` : null },
  ];

  return (
    <Section>
      <PageHero
        icon={FileText}
        title="Bills"
        subtitle={`${allBills.length} bills across ${jobCount} job${jobCount !== 1 ? "s" : ""}`}
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search bills\u2026" style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
        <Tabs tabs={STATUS_TABS} active={filter} onChange={setFilter} />
      </div>

      {/* Section header */}
      <div style={{ height: 1, background: _.line, marginBottom: mobile ? _.s6 : _.s8 }} />
      <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3, paddingLeft: _.s2, borderLeft: `3px solid ${_.red}` }}>All Bills</div>

      {filtered.length === 0 && <Empty icon={FileText} text={search ? "No matching bills" : "No bills yet"} />}

      {filtered.length > 0 && (
        <Card style={{ padding: 0 }}>
          <div style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr auto auto" : "1fr 1fr 90px 90px 80px", gap: _.s2,
            padding: `${_.s2}px ${_.s4}px`, borderBottom: `2px solid ${_.ink}`,
            fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
          }}>
            <span>Vendor</span>
            {!mobile && <span>Project</span>}
            <span style={{ textAlign: "right" }}>Amount</span>
            {!mobile && <span style={{ textAlign: "right" }}>Due</span>}
            <span style={{ textAlign: "center" }}>Status</span>
          </div>

          {filtered.map(bill => {
            const st = (bill.status || "Draft").toLowerCase();
            const displayStatus = bill.overdue ? "overdue" : st;
            const color = STATUS_COLORS[displayStatus] || _.muted;
            const days = bill.overdue ? daysOverdue(bill) : 0;
            return (
              <div key={`${bill.projectId}-${bill.id}`} onClick={() => navigate(`/projects/${bill.projectId}/bills`)} style={{
                display: "grid", gridTemplateColumns: mobile ? "1fr auto auto" : "1fr 1fr 90px 90px 80px", gap: _.s2,
                padding: `${_.s3}px ${_.s4}px`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
                alignItems: "center", transition: `background ${_.tr}`,
                borderLeft: bill.overdue ? `3px solid ${_.red}` : "3px solid transparent",
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {bill.overdue && <AlertCircle size={12} color={_.red} />}
                    <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {bill.vendorName || "Unknown vendor"}
                    </span>
                  </div>
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 1 }}>
                    {bill.billNumber || "\u2014"}{bill.date ? ` \u00b7 ${bill.date}` : ""}
                  </div>
                  {mobile && <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{bill.projectName}</div>}
                </div>
                {!mobile && (
                  <div style={{ fontSize: _.fontSize.base, color: _.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {bill.projectName}
                  </div>
                )}
                <span style={{ textAlign: "right", fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums" }}>
                  {fmt(bill.total || 0)}
                </span>
                {!mobile && (
                  <span style={{ textAlign: "right", fontSize: _.fontSize.sm, color: bill.overdue ? _.red : _.muted, fontWeight: bill.overdue ? _.fontWeight.semi : _.fontWeight.normal }}>
                    {bill.dueDate || "\u2014"}
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
