import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, btnGhost, badge } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import SignatureCanvas from "../../components/ui/SignatureCanvas.jsx";
import { ArrowRight, Printer, Check, X } from "lucide-react";

export default function ProposalDetail() {
  const { propIndex } = useParams();
  const navigate = useNavigate();
  const { project: p, update: up, log } = useProject();
  const { notify } = useApp();
  const propRef = useRef(null);
  const idx = parseInt(propIndex);
  const propD = p.proposals[idx];
  const [editName, setEditName] = useState(false);
  const [editValid, setEditValid] = useState(false);

  const sig = SignatureCanvas({ width: 600, height: 100 });

  if (!propD) return <Section><div style={{ color: _.muted }}>Proposal not found</div></Section>;

  const propDCats = Object.entries(propD.scope).filter(([, items]) => items.some(x => x.on));
  const propCT = (sc, c) => sc[c].filter(i => i.on).reduce((t, i) => t + i.rate * i.qty, 0);

  const printEl = () => {
    if (!propRef.current) return;
    const w = window.open("", "_blank");
    w.document.write('<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}@media print{body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}@page{margin:0;size:A4}}</style></head><body>' + propRef.current.outerHTML + '</body></html>');
    w.document.close(); setTimeout(() => w.print(), 600);
  };

  return (
    <Section>
      <div style={{ display: "flex", alignItems: "center", gap: _.s2, marginBottom: _.s5 }}>
        <button onClick={() => navigate("../proposals")} style={btnGhost}><ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back</button>
        {editName ? (
          <input autoFocus style={{ ...input, fontSize: 22, fontWeight: 600, padding: "2px 8px", maxWidth: 260 }}
            value={propD.name} onChange={e => up(pr => { pr.proposals[idx].name = e.target.value; return pr; })}
            onKeyDown={e => { if (e.key === "Enter") setEditName(false); if (e.key === "Escape") setEditName(false); }}
            onBlur={() => setEditName(false)}
          />
        ) : (
          <span onClick={() => setEditName(true)} style={{ fontSize: 22, fontWeight: 600, cursor: "text" }}>{propD.name}</span>
        )}
        <span style={badge(propD.status === "signed" ? _.green : propD.status === "declined" ? _.red : propD.status === "sent" ? _.blue : _.amber)}>{propD.status}</span>
        <div style={{ flex: 1 }} />
        <div onClick={() => { if (confirm(`Delete "${propD.name}"?`)) { up(pr => { pr.proposals.splice(idx, 1); return pr; }); navigate("../proposals"); } }}
          style={{ cursor: "pointer", color: _.faint, transition: "color 0.15s", padding: 4 }}
          onMouseEnter={e => e.currentTarget.style.color = _.red}
          onMouseLeave={e => e.currentTarget.style.color = _.faint}
        ><X size={16} /></div>
        <button onClick={printEl} style={btnGhost}><Printer size={14} /> Print</button>
      </div>

      {/* Status buttons */}
      <div style={{ display: "flex", gap: _.s2, marginBottom: _.s5 }}>
        {["draft", "sent", "signed", "declined"].map(s => (
          <div key={s} onClick={() => { up(pr => { pr.proposals[idx].status = s; return pr; }); log(`Proposal → ${s}`); notify(`Marked ${s}`); }}
            style={{ padding: "6px 14px", borderRadius: _.rFull, fontSize: 12, fontWeight: 600, cursor: "pointer", background: propD.status === s ? `${(s === "signed" ? _.green : s === "declined" ? _.red : s === "sent" ? _.blue : _.amber)}14` : _.well, color: propD.status === s ? (s === "signed" ? _.green : s === "declined" ? _.red : s === "sent" ? _.blue : _.amber) : _.muted, transition: "all 0.15s" }}>{s}</div>
        ))}
      </div>

      {/* Proposal document */}
      <div ref={propRef} style={{ background: "#fff", fontFamily: "'Inter',sans-serif", borderRadius: _.r, overflow: "hidden", border: `1px solid ${_.line}` }}>
        <div style={{ padding: "28px 40px", borderBottom: `1px solid ${_.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 24, height: 24, background: _.ink, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>i</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: _.ink }}>iBuild National</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: _.muted, letterSpacing: "0.08em", fontWeight: 600 }}>PROPOSAL</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: _.ink }}>{propD.name}</div>
          </div>
        </div>
        <div style={{ padding: "36px 40px", borderBottom: `1px solid ${_.line}` }}>
          <div style={{ fontSize: 10, color: _.muted, marginBottom: 8, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Prepared for</div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: _.ink, lineHeight: 1.15 }}>{propD.client}</div>
          <div style={{ fontSize: 14, color: _.body, marginTop: 6 }}>{propD.address}{propD.suburb ? `, ${propD.suburb}` : ""}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: `1px solid ${_.line}` }}>
          {[["Date", propD.date], ["Type", propD.type + (propD.stories ? ` · ${propD.stories}` : "")], ["Valid", null], ["Value", fmt(propD.pricing.total)]].map(([l, v], ci) => (
            <div key={l} style={{ padding: "14px 20px", borderRight: ci < 3 ? `1px solid ${_.line}` : "none" }}>
              <div style={{ fontSize: 9, color: _.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</div>
              {l === "Valid" ? (
                editValid ? (
                  <input autoFocus type="number" style={{ fontSize: 13, fontWeight: 500, color: _.ink, marginTop: 3, background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, padding: "2px 6px", width: 60, outline: "none", fontFamily: "inherit" }}
                    value={propD.validDays || 30}
                    onChange={e => up(pr => { pr.proposals[idx].validDays = parseInt(e.target.value) || 30; return pr; })}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setEditValid(false); }}
                    onBlur={() => setEditValid(false)}
                  />
                ) : (
                  <div onClick={() => setEditValid(true)} style={{ fontSize: 13, fontWeight: 500, color: _.ink, marginTop: 3, cursor: "text" }}>{propD.validDays || 30} days</div>
                )
              ) : (
                <div style={{ fontSize: 13, fontWeight: ci === 3 ? 700 : 500, color: _.ink, marginTop: 3 }}>{v}</div>
              )}
            </div>
          ))}
        </div>
        {propD.notes && <div style={{ padding: "20px 40px", borderBottom: `1px solid ${_.line}` }}>
          <div style={{ fontSize: 10, color: _.muted, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>Brief</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: _.body }}>{propD.type}{propD.area ? ` · ${propD.area}m²` : ""}. {propD.notes}</div>
        </div>}
        <div style={{ padding: "24px 40px" }}>
          <div style={{ fontSize: 10, color: _.muted, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>Scope of Works</div>
          {propDCats.map(([cat, items], ci) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `2px solid ${_.ink}`, fontSize: 12, fontWeight: 600, color: _.ink, marginBottom: 4 }}>
                <span>{String(ci + 1).padStart(2, "0")}. {cat}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(propCT(propD.scope, cat))}</span>
              </div>
              {items.filter(i2 => i2.on).map((item, ix) => (
                <div key={ix} style={{ display: "grid", gridTemplateColumns: "1fr 40px 56px 28px 64px", gap: 4, padding: "4px 0", fontSize: 10, borderBottom: `1px solid ${_.line}`, color: _.body }}>
                  <span style={{ color: _.ink }}>{item.item}</span>
                  <span>{item.unit}</span>
                  <span style={{ textAlign: "right" }}>{fmt(item.rate)}</span>
                  <span style={{ textAlign: "center" }}>x{item.qty}</span>
                  <span style={{ textAlign: "right", fontWeight: 600, color: _.ink, fontVariantNumeric: "tabular-nums" }}>{fmt(item.rate * item.qty)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: "0 40px 28px", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 260 }}>
            {[["Subtotal", propD.pricing.sub], [`Margin (${propD.pricing.margin}%)`, propD.pricing.mar], [`Contingency (${propD.pricing.contingency}%)`, propD.pricing.con], ["GST", propD.pricing.gst]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11, color: _.muted }}>
                <span>{l}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(v)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px", fontSize: 20, fontWeight: 700, borderTop: `2px solid ${_.ink}`, marginTop: 6, letterSpacing: "-0.02em" }}>
              <span>Total (inc GST)</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(propD.pricing.total)}</span>
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 40px", borderTop: `1px solid ${_.line}`, fontSize: 10, color: _.muted, lineHeight: 1.7 }}>
          <div style={{ fontSize: 10, color: _.muted, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>Terms</div>
          {`Valid ${propD.validDays || 30} days · 5% deposit · Progress claims 7 days · Variations via VO · Full insurance · 13-week defects`}
        </div>
        <div style={{ padding: "16px 40px", borderTop: `1px solid ${_.line}` }}>
          <div style={{ fontSize: 10, color: _.muted, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>Acceptance</div>
          <div style={{ fontSize: 10, color: _.muted, marginBottom: 10 }}>I/We accept and authorise iBuild National to proceed.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {["Client", "Builder"].map(r => (
              <div key={r}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>{r}</div>
                {propD.sigData && r === "Client" ? <div><img src={propD.sigData} alt="" style={{ maxHeight: 32 }} /><div style={{ fontSize: 9, color: _.muted, marginTop: 2 }}>Signed</div></div> : <div style={{ borderBottom: `1px solid ${_.line2}`, height: 32 }} />}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "10px 40px", background: _.ink, fontSize: 9, color: "#888", display: "flex", justifyContent: "space-between" }}>
          <span>iBuild National Pty Ltd · ABN 12 345 678 901</span><span>(03) 8510 5472</span>
        </div>
      </div>

      {/* Signature */}
      {!propD.sigData && (
        <div style={{ marginTop: _.s5 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: _.s2 }}>Client signature</div>
          <div style={{ background: "#fff", borderRadius: _.rXs, touchAction: "none", overflow: "hidden", border: `1.5px solid ${_.line2}` }}>
            <canvas ref={sig.refCb} width={sig.width} height={sig.height} style={{ width: "100%", height: 100, cursor: "crosshair" }} {...sig.handlers} />
          </div>
          <div style={{ display: "flex", gap: _.s2, marginTop: _.s2 }}>
            <button onClick={() => {
              const data = sig.getData(); if (!data) return;
              up(pr => { pr.proposals[idx].sigData = data; pr.proposals[idx].status = "signed"; return pr; });
              log("Proposal signed"); notify("Signed");
            }} style={{ padding: "9px 18px", background: _.ac, color: "#fff", border: "none", borderRadius: _.rSm, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Confirm</button>
            <button onClick={() => sig.clear()} style={{ padding: "9px 18px", background: _.surface, color: _.body, border: `1.5px solid ${_.line}`, borderRadius: _.rSm, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Clear</button>
          </div>
        </div>
      )}
      {propD.sigData && <div style={{ marginTop: _.s5, padding: `${_.s3}px`, background: `${_.green}0a`, borderRadius: _.rXs, fontSize: 13, color: _.green, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}><Check size={13} /> Client signed</div>}
    </Section>
  );
}
