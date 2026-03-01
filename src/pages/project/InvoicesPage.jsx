import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, label, btnPrimary, badge, uid, ds } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import { Receipt, ChevronRight, AlertTriangle, X } from "lucide-react";

export default function InvoicesPage() {
  const { project: p, update: up, T, log } = useProject();
  const { mobile, notify } = useApp();
  const navigate = useNavigate();
  const [invPct, setInvPct] = useState("");
  const [invDesc, setInvDesc] = useState("");
  const [invProposalId, setInvProposalId] = useState("");

  return (
    <Section>
      <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: _.s7 }}>Invoices</h1>
      <div style={{ display: "flex", gap: mobile ? _.s4 : _.s9, marginBottom: _.s5, alignItems: "baseline", flexWrap: mobile ? "wrap" : "nowrap" }}>
        <div><div style={label}>Contract</div><div style={{ fontSize: 24, fontWeight: 700 }}>{fmt(T.curr)}</div></div>
        <div><div style={{ ...label, color: _.ac }}>Claimed</div><div style={{ fontSize: 24, fontWeight: 700, color: _.ac }}>{fmt(T.inv)}</div></div>
        <div><div style={{ ...label, color: _.green }}>Paid</div><div style={{ fontSize: 24, fontWeight: 700, color: _.green }}>{fmt(T.paid)}</div></div>
      </div>
      <div style={{ height: 4, background: _.line, borderRadius: 2, marginBottom: _.s2 }}><div style={{ height: "100%", width: `${Math.min((T.inv / (T.curr || 1)) * 100, 100)}%`, background: _.ac, borderRadius: 2, transition: "width 0.4s" }} /></div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: _.muted, marginBottom: _.s7, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
        <span>{((T.inv / (T.curr || 1)) * 100).toFixed(1)}% claimed</span><span>{fmt(T.curr - T.inv)} remaining</span>
      </div>

      {/* New claim */}
      <div style={{ marginBottom: _.s7, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
        <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: _.s4 }}>New Progress Claim</div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "80px 1fr auto", gap: _.s2, alignItems: mobile ? "stretch" : "end" }}>
          <div><label style={label}>%</label><input type="text" inputMode="decimal" style={{ ...input, fontSize: 20, fontWeight: 700, textAlign: "center" }} value={invPct} onChange={e => { const v = e.target.value; if (v === "" || /^\d*\.?\d*$/.test(v)) setInvPct(v); }} placeholder="25" /></div>
          <div><label style={label}>Description</label><input style={input} value={invDesc} onChange={e => setInvDesc(e.target.value)} placeholder="Frame stage" /></div>
          {p.proposals.length > 0 && <div><label style={label}>Link to proposal</label><select style={{ ...input, cursor: "pointer" }} value={invProposalId} onChange={e => { setInvProposalId(e.target.value); if (e.target.value) { const lp = p.proposals.find(pp => pp.id === e.target.value); if (lp && !invDesc) setInvDesc(lp.name); } }}><option value="">None</option>{p.proposals.map(pp => <option key={pp.id} value={pp.id}>{pp.name}</option>)}</select></div>}
          <button onClick={() => {
            const pc = parseFloat(invPct); if (!pc) { notify("Enter %", "error"); return; }
            const amt = T.curr * (pc / 100);
            up(pr => { const inv = { id: `INV-${uid()}`, date: ds(), pct: pc, amount: amt, desc: invDesc || `Claim ${pr.invoices.length + 1}`, status: "pending" }; if (invProposalId) inv.proposalId = invProposalId; pr.invoices.push(inv); return pr; });
            log(`Invoice: ${invDesc || "Claim"} (${fmt(amt)})`); notify(`Invoice — ${fmt(amt)}`);
            setInvPct(""); setInvDesc(""); setInvProposalId("");
          }} style={btnPrimary}>Generate</button>
        </div>
        {invPct && <div style={{ marginTop: _.s2, fontSize: 15, fontWeight: 600, color: (T.inv + T.curr * (parseFloat(invPct) || 0) / 100 > T.curr) ? _.red : _.ac, display: "flex", alignItems: "center", gap: 4 }}>
          = {fmt(T.curr * (parseFloat(invPct) || 0) / 100)} {(T.inv + T.curr * (parseFloat(invPct) || 0) / 100 > T.curr) && <><AlertTriangle size={13} /> Over-claim</>}
        </div>}
      </div>

      {p.invoices.length === 0 && <Empty icon={Receipt} text="No invoices yet" />}
      {p.invoices.map((inv, i) => (
        <div key={i} onClick={() => navigate(`${i}`)} style={{
          padding: `${_.s4}px 0`, cursor: "pointer", display: "flex", justifyContent: "space-between",
          alignItems: "center", borderBottom: `1px solid ${_.line}`, transition: "all 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.paddingLeft = "4px"}
        onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
        >
          <div><div style={{ fontSize: 14, fontWeight: 500 }}>{inv.desc}</div><div style={{ fontSize: 12, color: _.muted, marginTop: 1 }}>{inv.id} · {inv.date}</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: _.s3 }}>
            <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(inv.amount)}</span>
            <div onClick={e => {
              e.stopPropagation();
              up(pr => { pr.invoices[i] = { ...inv, status: inv.status === "paid" ? "pending" : "paid" }; return pr; });
              log(`Invoice ${inv.status === "paid" ? "unpaid" : "paid"}: ${inv.desc}`);
              notify(inv.status === "paid" ? "Unpaid" : "Paid");
            }} style={{ ...badge(inv.status === "paid" ? _.green : _.amber), cursor: "pointer" }}>{inv.status}</div>
            <div onClick={e => { e.stopPropagation(); if (confirm(`Delete "${inv.desc}"?`)) { up(pr => { pr.invoices.splice(i, 1); return pr; }); notify("Deleted"); } }}
              style={{ cursor: "pointer", color: _.faint, transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = _.red}
              onMouseLeave={e => e.currentTarget.style.color = _.faint}
            ><X size={14} /></div>
            <ChevronRight size={14} color={_.faint} />
          </div>
        </div>
      ))}
    </Section>
  );
}
