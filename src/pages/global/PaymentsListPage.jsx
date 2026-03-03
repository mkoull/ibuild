import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName } from "../../theme/styles.js";
import { isJob } from "../../lib/lifecycle.js";
import { calc } from "../../lib/calc.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import PageHero from "../../components/ui/PageHero.jsx";
import Card from "../../components/ui/Card.jsx";
import { HandCoins } from "lucide-react";

export default function PaymentsListPage() {
  const { projects, clients, mobile } = useApp();
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const out = [];
    for (const pr of projects) {
      if (!isJob(pr.stage || pr.status)) continue;
      const T = calc(pr);
      let billsUnpaid = 0, billsPaid = 0;
      for (const bill of pr.supplierBills || []) {
        if (bill.status === "Void") continue;
        const amt = bill.total || 0;
        if (bill.status === "Paid") billsPaid += amt;
        else billsUnpaid += amt;
      }
      out.push({
        id: pr.id,
        name: pName(pr, clients),
        contract: T.curr || 0,
        invoiced: T.inv || 0,
        received: T.paid || 0,
        receivable: T.outstanding || 0,
        billsPaid,
        billsUnpaid,
        net: (T.paid || 0) - billsPaid,
      });
    }
    return out;
  }, [projects, clients]);

  const totals = useMemo(() => rows.reduce((acc, r) => ({
    contract: acc.contract + r.contract,
    invoiced: acc.invoiced + r.invoiced,
    received: acc.received + r.received,
    receivable: acc.receivable + r.receivable,
    billsPaid: acc.billsPaid + r.billsPaid,
    billsUnpaid: acc.billsUnpaid + r.billsUnpaid,
    net: acc.net + r.net,
  }), { contract: 0, invoiced: 0, received: 0, receivable: 0, billsPaid: 0, billsUnpaid: 0, net: 0 }), [rows]);

  return (
    <Section>
      <PageHero
        icon={HandCoins}
        title="Payments"
        subtitle={`Cash flow across ${rows.length} active job${rows.length !== 1 ? "s" : ""}`}
      />

      {/* Receivables vs Payables */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? _.s2 : _.s3, marginBottom: mobile ? _.s4 : _.s5 }}>
        {/* Receivables (Money In) */}
        <Card style={{ padding: mobile ? _.s3 : _.s5 }}>
          <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3, paddingLeft: _.s2, borderLeft: `3px solid ${_.green}` }}>Receivables (Money In)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s3 }}>
            {[
              { label: "Invoiced", value: totals.invoiced, color: _.ink },
              { label: "Received", value: totals.received, color: _.green },
              { label: "Outstanding", value: totals.receivable, color: totals.receivable > 0 ? _.amber : _.green },
              { label: "Contract Value", value: totals.contract, color: _.ink },
            ].map(s => (
              <div key={s.label}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 6, background: s.color }} />
                  <span style={{ fontSize: _.fontSize.xs, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", fontWeight: _.fontWeight.semi }}>{s.label}</span>
                </div>
                <div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.bold, color: s.color, fontVariantNumeric: "tabular-nums" }}>{fmt(s.value)}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Payables (Money Out) */}
        <Card style={{ padding: mobile ? _.s3 : _.s5 }}>
          <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3, paddingLeft: _.s2, borderLeft: `3px solid ${_.red}` }}>Payables (Money Out)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s3 }}>
            {[
              { label: "Bills Paid", value: totals.billsPaid, color: _.green },
              { label: "Bills Unpaid", value: totals.billsUnpaid, color: totals.billsUnpaid > 0 ? _.red : _.muted },
            ].map(s => (
              <div key={s.label}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 6, background: s.color }} />
                  <span style={{ fontSize: _.fontSize.xs, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", fontWeight: _.fontWeight.semi }}>{s.label}</span>
                </div>
                <div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.bold, color: s.color, fontVariantNumeric: "tabular-nums" }}>{fmt(s.value)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Net Cash Position */}
      <Card accent style={{ padding: mobile ? _.s4 : _.s5, marginBottom: mobile ? _.s6 : _.s8, textAlign: "center" }}>
        <div style={{ fontSize: _.fontSize.xs, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", fontWeight: _.fontWeight.semi, marginBottom: _.s2 }}>Net Cash Position</div>
        <div style={{ fontSize: mobile ? _.fontSize["2xl"] : _.fontSize["3xl"], fontWeight: _.fontWeight.bold, color: totals.net >= 0 ? _.green : _.red, fontVariantNumeric: "tabular-nums", lineHeight: _.lineHeight.heading }}>
          {totals.net >= 0 ? "+" : "\u2212"}{fmt(Math.abs(totals.net))}
        </div>
      </Card>

      {/* Section header */}
      <div style={{ height: 1, background: _.line, marginBottom: mobile ? _.s6 : _.s8 }} />
      <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s3, paddingLeft: _.s2, borderLeft: `3px solid ${_.ac}` }}>Per-Project Breakdown</div>

      {rows.length === 0 && <Empty icon={HandCoins} text="No jobs with payment data yet" />}

      {rows.length > 0 && (
        <Card style={{ padding: 0 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr auto auto" : "1fr auto auto auto auto auto auto",
            gap: _.s2,
            padding: `${_.s2}px ${_.s4}px`, borderBottom: `2px solid ${_.ink}`,
            fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
          }}>
            <span>Project</span>
            {!mobile && <span style={{ textAlign: "right" }}>Invoiced</span>}
            <span style={{ textAlign: "right" }}>Received</span>
            {!mobile && <span style={{ textAlign: "right" }}>Outstanding</span>}
            {!mobile && <span style={{ textAlign: "right" }}>Bills Paid</span>}
            <span style={{ textAlign: "right" }}>Unpaid</span>
            {!mobile && <span style={{ textAlign: "right" }}>Net</span>}
          </div>

          {rows.map(r => (
            <div key={r.id} onClick={() => navigate(`/projects/${r.id}/payments`)} style={{
              display: "grid",
              gridTemplateColumns: mobile ? "1fr auto auto" : "1fr auto auto auto auto auto auto",
              gap: _.s2,
              padding: `${_.s3}px ${_.s4}px`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
              alignItems: "center", transition: `background ${_.tr}`,
            }}
              onMouseEnter={e => e.currentTarget.style.background = _.well}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.name}
              </div>
              {!mobile && <Num value={r.invoiced} />}
              <Num value={r.received} color={_.green} />
              {!mobile && <Num value={r.receivable} color={r.receivable > 0 ? _.amber : undefined} />}
              {!mobile && <Num value={r.billsPaid} />}
              <Num value={r.billsUnpaid} color={r.billsUnpaid > 0 ? _.red : undefined} />
              {!mobile && <Num value={r.net} color={r.net >= 0 ? _.green : _.red} signed />}
            </div>
          ))}

          {/* Totals row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr auto auto" : "1fr auto auto auto auto auto auto",
            gap: _.s2,
            padding: `${_.s3}px ${_.s4}px`, background: _.well, borderTop: `2px solid ${_.ink}`,
            fontSize: _.fontSize.base, fontWeight: _.fontWeight.bold,
          }}>
            <span>Totals</span>
            {!mobile && <Num value={totals.invoiced} bold />}
            <Num value={totals.received} color={_.green} bold />
            {!mobile && <Num value={totals.receivable} color={totals.receivable > 0 ? _.amber : undefined} bold />}
            {!mobile && <Num value={totals.billsPaid} bold />}
            <Num value={totals.billsUnpaid} color={totals.billsUnpaid > 0 ? _.red : undefined} bold />
            {!mobile && <Num value={totals.net} color={totals.net >= 0 ? _.green : _.red} signed bold />}
          </div>
        </Card>
      )}
    </Section>
  );
}

function Num({ value, color, signed, bold }) {
  const display = fmt(Math.abs(value));
  const prefix = signed ? (value >= 0 ? "+" : "\u2212") : "";
  return (
    <span style={{
      textAlign: "right", fontSize: _.fontSize.base,
      fontWeight: bold ? _.fontWeight.bold : _.fontWeight.semi,
      fontVariantNumeric: "tabular-nums", color: color || _.ink, minWidth: 80,
    }}>
      {prefix}{display}
    </span>
  );
}
