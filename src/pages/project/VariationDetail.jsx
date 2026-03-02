import { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { createVariationBudgetLine, createVariationLedgerEntry } from "../../lib/budgetEngine.js";
import _ from "../../theme/tokens.js";
import { fmt, input, label, btnPrimary, btnSecondary, btnGhost, badge, pName, ds } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import SignatureCanvas from "../../components/ui/SignatureCanvas.jsx";
import { ArrowRight, Printer, X } from "lucide-react";
import { useState } from "react";

export default function VariationDetail() {
  const { voIndex } = useParams();
  const navigate = useNavigate();
  const { project: p, update: up, T, log } = useProject();
  const { clients, notify } = useApp();
  const idx = parseInt(voIndex);
  const voD = p.variations[idx];
  const voDocRef = useRef(null);
  const [voSignAs, setVoSignAs] = useState("builder");
  const [editing, setEditing] = useState(false);
  const [editVO, setEditVO] = useState({});

  // Signature canvas
  const sig = SignatureCanvas({ width: 500, height: 100 });

  if (!voD) return <Section><div style={{ color: _.muted }}>Variation not found</div></Section>;

  const voCB = T.orig + p.variations.slice(0, idx).filter(x => x.status === "approved").reduce((s, x) => s + x.amount, 0);

  const printEl = () => {
    if (!voDocRef.current) return;
    const w = window.open("", "_blank");
    w.document.write('<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}@media print{body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}@page{margin:0;size:A4}}</style></head><body>' + voDocRef.current.outerHTML + '</body></html>');
    w.document.close(); setTimeout(() => w.print(), 600);
  };

  return (
    <Section>
      <div style={{ display: "flex", alignItems: "center", gap: _.s2, marginBottom: _.s7 }}>
        <button onClick={() => navigate("../variations")} style={btnGhost}><ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back</button>
        <span style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.semi }}>{voD.id}</span>
        <span style={badge(voD.status === "approved" ? _.green : voD.status === "pending" ? _.amber : _.muted)}>{voD.status}</span>
        <div style={{ flex: 1 }} />
        {voD.status === "draft" && <button onClick={() => { if (editing) { setEditing(false); } else { setEditVO({ description: voD.description, category: voD.category, amount: String(voD.amount), reason: voD.reason }); setEditing(true); } }} style={btnGhost}>{editing ? "Cancel" : "Edit"}</button>}
        <div onClick={() => { if (confirm(`Delete "${voD.id}"?`)) { up(pr => { pr.variations.splice(idx, 1); return pr; }); navigate("../variations"); } }}
          style={{ cursor: "pointer", color: _.faint, transition: "color 0.15s", padding: 4 }}
          onMouseEnter={e => e.currentTarget.style.color = _.red}
          onMouseLeave={e => e.currentTarget.style.color = _.faint}
        ><X size={16} /></div>
        <button onClick={printEl} style={btnGhost}><Printer size={14} /> Print</button>
      </div>

      {editing && (
        <div style={{ padding: _.s4, background: _.well, borderRadius: _.r, marginBottom: _.s4 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${_.s3}px ${_.s4}px`, marginBottom: _.s3 }}>
            <div><label style={label}>Description</label><input style={input} value={editVO.description} onChange={e => setEditVO({ ...editVO, description: e.target.value })} /></div>
            <div><label style={label}>Category</label><input style={input} value={editVO.category} onChange={e => setEditVO({ ...editVO, category: e.target.value })} /></div>
            <div><label style={label}>Amount (inc GST)</label><input type="number" style={input} value={editVO.amount} onChange={e => setEditVO({ ...editVO, amount: e.target.value })} /></div>
            <div><label style={label}>Reason</label><input style={input} value={editVO.reason} onChange={e => setEditVO({ ...editVO, reason: e.target.value })} /></div>
          </div>
          <button onClick={() => {
            up(pr => { const v = pr.variations[idx]; v.description = editVO.description; v.category = editVO.category; v.amount = parseFloat(editVO.amount) || 0; v.reason = editVO.reason; return pr; });
            notify("Updated"); setEditing(false);
          }} style={btnPrimary}>Save</button>
        </div>
      )}

      <div ref={voDocRef} style={{ background: "#fff", fontFamily: "'Inter',sans-serif", borderRadius: _.r, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: `1px solid ${_.line}` }}>
        <div style={{ background: _.ink, color: "#fff", padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 22, height: 22, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: _.fontSize.sm, fontWeight: 800, color: _.ink }}>i</div><span style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.bold }}>iBuild National</span></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: _.fontSize.xs, color: _.ac, letterSpacing: "0.1em", fontWeight: _.fontWeight.semi }}>VARIATION ORDER</div><div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.bold, color: _.ac }}>{voD.id}</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${_.line}` }}>
          {[["Project", pName(p, clients)], ["Client", p.client || ""], ["Date", voD.date]].map(([l, v]) => (
            <div key={l} style={{ padding: "10px 16px", borderRight: `1px solid ${_.line}` }}><div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, textTransform: "uppercase", letterSpacing: _.letterSpacing.wider }}>{l}</div><div style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.medium, marginTop: 1 }}>{v || "—"}</div></div>
          ))}
        </div>
        <div style={{ padding: "18px 28px", borderBottom: `1px solid ${_.line}` }}><div style={{ fontSize: _.fontSize.xs, color: _.ac, letterSpacing: _.letterSpacing.wider, fontWeight: _.fontWeight.semi, marginBottom: 4 }}>DESCRIPTION</div><div style={{ fontSize: _.fontSize.base, lineHeight: 1.7 }}>{voD.description}</div>{voD.reason && <div style={{ fontSize: _.fontSize.caption, color: _.muted, marginTop: 3 }}>Reason: {voD.reason}</div>}</div>
        <div style={{ padding: "18px 28px", borderBottom: `1px solid ${_.line}` }}>
          <div style={{ fontSize: _.fontSize.xs, color: _.ac, letterSpacing: _.letterSpacing.wider, fontWeight: _.fontWeight.semi, marginBottom: 10 }}>CONTRACT IMPACT</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div style={{ background: _.well, padding: 12, borderRadius: _.r }}><div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi }}>BEFORE</div><div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, marginTop: 2 }}>{fmt(voCB)}</div></div>
            <div style={{ background: _.ink, padding: 12, borderRadius: _.r, color: "#f8f8f6" }}><div style={{ fontSize: _.fontSize.xs, color: _.ac, fontWeight: _.fontWeight.semi }}>THIS VO</div><div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, color: _.ac, marginTop: 2 }}>{voD.amount >= 0 ? "+" : ""}{fmt(voD.amount)}</div></div>
            <div style={{ background: _.well, padding: 12, borderRadius: _.r }}><div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi }}>REVISED</div><div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, color: _.ac, marginTop: 2 }}>{fmt(voCB + voD.amount)}</div></div>
          </div>
        </div>
        <div style={{ padding: "18px 28px" }}>
          <div style={{ fontSize: _.fontSize.xs, color: _.ac, letterSpacing: _.letterSpacing.wider, fontWeight: _.fontWeight.semi, marginBottom: 10 }}>AUTHORISATION</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {[["Builder — iBuild National", voD.builderSig], [`Client — ${p.client || "Owner"}`, voD.clientSig]].map(([l, s]) => (
              <div key={l}><div style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, marginBottom: 3 }}>{l}</div>{s ? <div><img src={s} alt="" style={{ maxHeight: 34 }} /><div style={{ fontSize: _.fontSize.xs, color: _.muted, marginTop: 2 }}>Signed {voD.approvedDate || voD.date}</div></div> : <div style={{ borderBottom: `1px solid ${_.line2}`, height: 34 }} />}</div>
            ))}
          </div>
          {voD.status === "approved" && <div style={{ marginTop: 10, padding: "8px 12px", background: `${_.green}0a`, borderRadius: _.rSm, fontSize: _.fontSize.sm, color: _.green, fontWeight: _.fontWeight.semi }}>Approved {voD.approvedDate}</div>}
        </div>
        <div style={{ padding: "10px 28px", background: _.ink, fontSize: _.fontSize.xs, color: _.muted }}>iBuild National · ABN 12 345 678 901 · (03) 8510 5472</div>
      </div>

      {voD.status !== "approved" && voD.status !== "rejected" && (
        <div style={{ marginTop: _.s5 }}>
          <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, marginBottom: _.s3 }}>Sign variation</div>
          <div style={{ display: "inline-flex", background: _.well, borderRadius: _.rFull, padding: 2, marginBottom: _.s3 }}>
            {["builder", "client"].map(role => (
              <div key={role} onClick={() => { setVoSignAs(role); sig.clear(); }} style={{ padding: "6px 16px", borderRadius: _.rFull, fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, cursor: "pointer", background: voSignAs === role ? _.surface : "transparent", color: voSignAs === role ? _.ink : _.muted, boxShadow: voSignAs === role ? "0 1px 3px rgba(0,0,0,0.06)" : "none", transition: "all 0.15s" }}>
                {role === "builder" ? "Builder" : "Client"}{((role === "builder" && voD.builderSig) || (role === "client" && voD.clientSig)) ? " ✓" : ""}
              </div>
            ))}
          </div>
          {((voSignAs === "builder" && !voD.builderSig) || (voSignAs === "client" && !voD.clientSig)) ? (
            <div>
              <div style={{ background: "#fff", borderRadius: _.rXs, touchAction: "none", overflow: "hidden", border: `1.5px solid ${_.line2}` }}>
                <canvas ref={sig.refCb} width={sig.width} height={sig.height} style={{ width: "100%", height: 100, cursor: "crosshair" }} {...sig.handlers} />
              </div>
              <div style={{ display: "flex", gap: _.s2, marginTop: _.s2 }}>
                <button onClick={() => {
                  const data = sig.getData(); if (!data) return;
                  up(pr => {
                    const v = pr.variations[idx];
                    if (voSignAs === "builder") v.builderSig = data;
                    else v.clientSig = data;
                    if (v.builderSig && v.clientSig) {
                      v.status = "approved"; v.approvedDate = ds(); v.approvedAt = ds();
                      // Feed-through: create budget line + ledger entry
                      if (!pr.budget) pr.budget = [];
                      if (!pr.variationLedger) pr.variationLedger = [];
                      const alreadyLinked = pr.budget.some(b => b.linkedVariationId === v.id);
                      if (!alreadyLinked) {
                        const budgetLine = createVariationBudgetLine(v);
                        pr.budget.push(budgetLine);
                        pr.variationLedger.push(createVariationLedgerEntry(v, budgetLine.id));
                      }
                      notify("VO approved");
                    } else { v.status = "pending"; notify((voSignAs === "builder" ? "Builder" : "Client") + " signed"); }
                    return pr;
                  });
                  log(voD.id + " signed by " + voSignAs); sig.clear();
                }} style={btnPrimary}>Confirm</button>
                <button onClick={() => sig.clear()} style={btnSecondary}>Clear</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: _.s3, background: `${_.green}0a`, borderRadius: _.rXs, fontSize: _.fontSize.base, color: _.green, fontWeight: _.fontWeight.medium }}>{voSignAs === "builder" ? "Builder" : "Client"} signed</div>
          )}
        </div>
      )}
    </Section>
  );
}
