import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, label, btnGhost, btnPrimary, pName } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import { ArrowRight, Printer, X } from "lucide-react";

export default function InvoiceDetail() {
  const { invIndex } = useParams();
  const navigate = useNavigate();
  const { project: p, update: up, T, log } = useProject();
  const { clients, notify } = useApp();
  const [editing, setEditing] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editPct, setEditPct] = useState("");
  const invDocRef = useRef(null);
  const idx = parseInt(invIndex);
  const invD = p.invoices[idx];

  if (!invD) return <Section><div style={{ color: _.muted }}>Invoice not found</div></Section>;

  const invGst = invD.amount / 11;

  const printEl = () => {
    if (!invDocRef.current) return;
    const w = window.open("", "_blank");
    w.document.write('<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}@media print{body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}@page{margin:0;size:A4}}</style></head><body>' + invDocRef.current.outerHTML + '</body></html>');
    w.document.close(); setTimeout(() => w.print(), 600);
  };

  return (
    <Section>
      <div style={{ display: "flex", alignItems: "center", gap: _.s2, marginBottom: _.s7 }}>
        <button onClick={() => navigate("../invoices")} style={btnGhost}><ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back</button>
        <span style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.semi }}>{invD.id}</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => { if (editing) { setEditing(false); } else { setEditDesc(invD.desc); setEditPct(String(invD.pct)); setEditing(true); } }} style={btnGhost}>{editing ? "Cancel" : "Edit"}</button>
        <div onClick={() => { if (confirm(`Delete "${invD.id}"?`)) { up(pr => { pr.invoices.splice(idx, 1); return pr; }); navigate("../invoices"); } }}
          style={{ cursor: "pointer", color: _.faint, transition: "color 0.15s", padding: 4 }}
          onMouseEnter={e => e.currentTarget.style.color = _.red}
          onMouseLeave={e => e.currentTarget.style.color = _.faint}
        ><X size={16} /></div>
        <button onClick={printEl} style={btnGhost}><Printer size={14} /> Print</button>
      </div>

      {invD.proposalId && (() => { const lp = p.proposals.find(pp => pp.id === invD.proposalId); return lp ? <div style={{ padding: `${_.s3}px ${_.s4}px`, background: `${_.ac}0a`, borderRadius: _.rXs, fontSize: _.fontSize.base, color: _.ac, fontWeight: _.fontWeight.medium, marginBottom: _.s4 }}>Linked to {lp.name}</div> : null; })()}

      {editing && (
        <div style={{ padding: _.s4, background: _.well, borderRadius: _.r, marginBottom: _.s4, display: "flex", gap: _.s3, alignItems: "end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}><label style={label}>Description</label><input style={input} value={editDesc} onChange={e => setEditDesc(e.target.value)} /></div>
          <div style={{ width: 80 }}><label style={label}>%</label><input type="number" style={{ ...input, textAlign: "center", fontWeight: _.fontWeight.bold }} value={editPct} onChange={e => setEditPct(e.target.value)} /></div>
          <button onClick={() => {
            const pc = parseFloat(editPct); if (!pc) { notify("Enter %", "error"); return; }
            up(pr => { pr.invoices[idx].desc = editDesc; pr.invoices[idx].pct = pc; pr.invoices[idx].amount = T.curr * (pc / 100); return pr; });
            notify("Updated"); setEditing(false);
          }} style={btnPrimary}>Save</button>
        </div>
      )}

      <div ref={invDocRef} style={{ background: "#fff", fontFamily: "'Inter',sans-serif", borderRadius: _.r, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: `1px solid ${_.line}` }}>
        <div style={{ background: _.ink, color: "#fff", padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 22, height: 22, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: _.fontSize.sm, fontWeight: 800, color: _.ink }}>i</div><span style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.bold }}>iBuild National</span></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: _.fontSize.xs, color: _.ac, letterSpacing: "0.1em", fontWeight: _.fontWeight.semi }}>TAX INVOICE</div><div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.bold, color: _.ac }}>{invD.id}</div></div>
        </div>
        <div style={{ padding: "16px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, borderBottom: `1px solid ${_.line}` }}>
          <div><div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, textTransform: "uppercase" }}>From</div><div style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, marginTop: 1 }}>iBuild National Pty Ltd</div><div style={{ fontSize: _.fontSize.caption, color: _.muted }}>ABN 12 345 678 901</div></div>
          <div><div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, textTransform: "uppercase" }}>To</div><div style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, marginTop: 1 }}>{p.client || "Client"}</div><div style={{ fontSize: _.fontSize.caption, color: _.muted }}>{p.address}{p.suburb ? `, ${p.suburb}` : ""}</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${_.line}` }}>
          {[["Date", invD.date], ["Project", pName(p, clients)], ["Due", "14 days"]].map(([l, v]) => (
            <div key={l} style={{ padding: "10px 16px", borderRight: `1px solid ${_.line}` }}><div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, textTransform: "uppercase", letterSpacing: _.letterSpacing.wider }}>{l}</div><div style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.medium, marginTop: 1 }}>{v}</div></div>
          ))}
        </div>
        <div style={{ padding: "18px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, textTransform: "uppercase" }}><span>Description</span><span>Amount</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${_.line}` }}>
            <div><div style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium }}>{invD.desc}</div><div style={{ fontSize: _.fontSize.caption, color: _.muted, marginTop: 2 }}>{invD.pct}% of {fmt(T.curr)}</div></div>
            <span style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi }}>{fmt(invD.amount)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <div style={{ width: 200 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: _.fontSize.caption, color: _.muted }}><span>Subtotal</span><span>{fmt(invD.amount - invGst)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: _.fontSize.caption, color: _.muted, borderBottom: `1px solid ${_.line}` }}><span>GST</span><span>{fmt(invGst)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: _.fontSize.lg, fontWeight: _.fontWeight.bold, borderTop: `2px solid ${_.ink}`, marginTop: 2 }}><span>Total</span><span>{fmt(invD.amount)}</span></div>
            </div>
          </div>
          <div style={{ marginTop: 14, padding: 10, background: _.well, borderRadius: _.r, fontSize: _.fontSize.caption, color: _.muted }}><strong>Payment</strong> BSB: 063-000 · Acct: 1234 5678 · Ref: {invD.id}</div>
        </div>
        <div style={{ padding: "10px 28px", background: _.ink, fontSize: _.fontSize.xs, color: _.muted }}>iBuild National · ABN 12 345 678 901</div>
      </div>
    </Section>
  );
}
