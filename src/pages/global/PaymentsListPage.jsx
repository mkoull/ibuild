import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName } from "../../theme/styles.js";
import { isJob } from "../../lib/lifecycle.js";
import { calc } from "../../lib/calc.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import { HandCoins } from "lucide-react";

export default function PaymentsListPage() {
  const { projects, clients, mobile } = useApp();
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const out = [];
    for (const pr of projects) {
      if (!isJob(pr.stage || pr.status)) continue;
      const T = calc(pr);
      out.push({
        id: pr.id,
        name: pName(pr, clients),
        contract: T.curr || 0,
        invoiced: T.inv || 0,
        paid: T.paid || 0,
        outstanding: T.outstanding || 0,
      });
    }
    return out;
  }, [projects, clients]);

  const totals = useMemo(() => rows.reduce((acc, r) => ({
    contract: acc.contract + r.contract,
    invoiced: acc.invoiced + r.invoiced,
    paid: acc.paid + r.paid,
    outstanding: acc.outstanding + r.outstanding,
  }), { contract: 0, invoiced: 0, paid: 0, outstanding: 0 }), [rows]);

  return (
    <Section>
      <div style={{ marginBottom: _.s5 }}>
        <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight }}>Payments</h1>
        <div style={{ fontSize: _.fontSize.base, color: _.muted, marginTop: _.s1 }}>Payment summary across all jobs</div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: _.s3, marginBottom: _.s6 }}>
        <SummaryCard label="Contract" value={totals.contract} />
        <SummaryCard label="Invoiced" value={totals.invoiced} />
        <SummaryCard label="Paid" value={totals.paid} color={_.green} />
        <SummaryCard label="Outstanding" value={totals.outstanding} color={totals.outstanding > 0 ? _.red : _.green} />
      </div>

      {rows.length === 0 && <Empty icon={HandCoins} text="No jobs with payment data yet" />}

      {rows.length > 0 && (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr auto auto auto auto", gap: _.s2,
            padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`,
            fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
          }}>
            <span>Project</span>
            {!mobile && <span style={{ textAlign: "right" }}>Contract</span>}
            {!mobile && <span style={{ textAlign: "right" }}>Invoiced</span>}
            <span style={{ textAlign: "right" }}>Paid</span>
            {!mobile && <span style={{ textAlign: "right" }}>Outstanding</span>}
          </div>

          {rows.map(r => (
            <div key={r.id} onClick={() => navigate(`/projects/${r.id}/payments`)} style={{
              display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr auto auto auto auto", gap: _.s2,
              padding: `${_.s3}px ${_.s1}px`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
              alignItems: "center", borderRadius: _.rXs, transition: `background ${_.tr}`,
            }}
              onMouseEnter={e => e.currentTarget.style.background = _.well}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.name}
              </div>
              {!mobile && <Num value={r.contract} />}
              {!mobile && <Num value={r.invoiced} />}
              <Num value={r.paid} color={_.green} />
              {!mobile && <Num value={r.outstanding} color={r.outstanding > 0 ? _.red : undefined} />}
            </div>
          ))}
        </>
      )}
    </Section>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{ background: _.surface, border: `1px solid ${_.line}`, borderRadius: _.r, padding: `${_.s3}px ${_.s4}px`, boxShadow: _.sh1 }}>
      <div style={{ fontSize: _.fontSize.xs, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", fontWeight: _.fontWeight.semi }}>{label}</div>
      <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, color: color || _.ink, marginTop: _.s1 }}>{fmt(value)}</div>
    </div>
  );
}

function Num({ value, color }) {
  return (
    <span style={{ textAlign: "right", fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums", color: color || _.ink, minWidth: 90 }}>
      {fmt(value)}
    </span>
  );
}
