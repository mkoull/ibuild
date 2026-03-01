import { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, btnGhost, pName } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import { ArrowRight, Printer } from "lucide-react";

export default function InvoiceDetail() {
  const { invIndex } = useParams();
  const navigate = useNavigate();
  const { project: p, T } = useProject();
  const { clients } = useApp();
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
        <span style={{ fontSize: 22, fontWeight: 600 }}>{invD.id}</span>
        <div style={{ flex: 1 }} />
        <button onClick={printEl} style={btnGhost}><Printer size={14} /> Print</button>
      </div>

      <div ref={invDocRef} style={{ background: "#fff", fontFamily: "'Inter',sans-serif", borderRadius: _.r, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: `1px solid ${_.line}` }}>
        <div style={{ background: _.ink, color: "#fff", padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 22, height: 22, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: _.ink }}>i</div><span style={{ fontSize: 13, fontWeight: 700 }}>iBuild National</span></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 9, color: _.ac, letterSpacing: "0.1em", fontWeight: 600 }}>TAX INVOICE</div><div style={{ fontSize: 16, fontWeight: 700, color: _.ac }}>{invD.id}</div></div>
        </div>
        <div style={{ padding: "16px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, borderBottom: `1px solid ${_.line}` }}>
          <div><div style={{ fontSize: 9, color: _.muted, fontWeight: 600, textTransform: "uppercase" }}>From</div><div style={{ fontSize: 12, fontWeight: 600, marginTop: 1 }}>iBuild National Pty Ltd</div><div style={{ fontSize: 11, color: _.muted }}>ABN 12 345 678 901</div></div>
          <div><div style={{ fontSize: 9, color: _.muted, fontWeight: 600, textTransform: "uppercase" }}>To</div><div style={{ fontSize: 12, fontWeight: 600, marginTop: 1 }}>{p.client || "Client"}</div><div style={{ fontSize: 11, color: _.muted }}>{p.address}{p.suburb ? `, ${p.suburb}` : ""}</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${_.line}` }}>
          {[["Date", invD.date], ["Project", pName(p, clients)], ["Due", "14 days"]].map(([l, v]) => (
            <div key={l} style={{ padding: "10px 16px", borderRight: `1px solid ${_.line}` }}><div style={{ fontSize: 9, color: _.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div><div style={{ fontSize: 12, fontWeight: 500, marginTop: 1 }}>{v}</div></div>
          ))}
        </div>
        <div style={{ padding: "18px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `2px solid ${_.ink}`, fontSize: 10, color: _.muted, fontWeight: 600, textTransform: "uppercase" }}><span>Description</span><span>Amount</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${_.line}` }}>
            <div><div style={{ fontSize: 13, fontWeight: 500 }}>{invD.desc}</div><div style={{ fontSize: 11, color: _.muted, marginTop: 2 }}>{invD.pct}% of {fmt(T.curr)}</div></div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(invD.amount)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <div style={{ width: 200 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11, color: _.muted }}><span>Subtotal</span><span>{fmt(invD.amount - invGst)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11, color: _.muted, borderBottom: `1px solid ${_.line}` }}><span>GST</span><span>{fmt(invGst)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 16, fontWeight: 700, borderTop: `2px solid ${_.ink}`, marginTop: 2 }}><span>Total</span><span>{fmt(invD.amount)}</span></div>
            </div>
          </div>
          <div style={{ marginTop: 14, padding: 10, background: _.well, borderRadius: _.r, fontSize: 11, color: _.muted }}><strong>Payment</strong> BSB: 063-000 · Acct: 1234 5678 · Ref: {invD.id}</div>
        </div>
        <div style={{ padding: "10px 28px", background: _.ink, fontSize: 9, color: _.muted }}>iBuild National · ABN 12 345 678 901</div>
      </div>
    </Section>
  );
}
