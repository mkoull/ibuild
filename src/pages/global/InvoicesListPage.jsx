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
import { ReceiptText } from "lucide-react";

const STATUS_TABS = ["All", "Draft", "Sent", "Pending", "Paid", "Void"];
const STATUS_COLORS = { draft: _.muted, sent: _.amber, pending: _.amber, paid: _.green, void: _.faint };

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
        out.push({ ...inv, projectId: pr.id, projectName: pName(pr, clients) });
      }
    }
    return out.sort((a, b) => (b.issuedAt || "").localeCompare(a.issuedAt || ""));
  }, [projects, clients]);

  const filtered = allInvoices.filter(inv => {
    const st = (inv.status || "draft").toLowerCase();
    if (filter !== "All" && st !== filter.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(inv.title || "").toLowerCase().includes(q)
        && !(inv.projectName || "").toLowerCase().includes(q)
        && !(inv.id || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const total = filtered.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <Section>
      <div style={{ marginBottom: _.s5 }}>
        <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight }}>Invoices</h1>
        <div style={{ fontSize: _.fontSize.base, color: _.muted, marginTop: _.s1 }}>All invoices across projects · Total: {fmt(total)}</div>
      </div>

      <div style={{ display: "flex", gap: _.s3, marginBottom: _.s5, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoices\u2026" style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
        <Tabs tabs={STATUS_TABS} active={filter} onChange={setFilter} />
      </div>

      {filtered.length === 0 && <Empty icon={ReceiptText} text={search ? "No matching invoices" : "No invoices yet"} />}

      {filtered.length > 0 && (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 1fr auto auto", gap: _.s2,
            padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`,
            fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
          }}>
            <span>Invoice</span>
            {!mobile && <span>Project</span>}
            {!mobile && <span style={{ textAlign: "right" }}>Amount</span>}
            <span style={{ textAlign: "center" }}>Status</span>
          </div>

          {filtered.map(inv => {
            const st = (inv.status || "draft").toLowerCase();
            const color = STATUS_COLORS[st] || _.muted;
            return (
              <div key={`${inv.projectId}-${inv.id}`} onClick={() => navigate(`/projects/${inv.projectId}/invoices`)} style={{
                display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr 1fr auto auto", gap: _.s2,
                padding: `${_.s3}px ${_.s1}px`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
                alignItems: "center", borderRadius: _.rXs, transition: `background ${_.tr}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {inv.title || inv.id}
                  </div>
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 1 }}>{inv.type || "Progress"}{inv.issuedAt ? ` · ${inv.issuedAt}` : ""}</div>
                  {mobile && <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{inv.projectName}</div>}
                </div>
                {!mobile && (
                  <div style={{ fontSize: _.fontSize.base, color: _.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {inv.projectName}
                  </div>
                )}
                {!mobile && (
                  <span style={{ textAlign: "right", fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums", minWidth: 90 }}>
                    {fmt(inv.amount || 0)}
                  </span>
                )}
                <div style={{ textAlign: "center" }}><span style={badge(color)}>{st}</span></div>
              </div>
            );
          })}
        </>
      )}
    </Section>
  );
}
