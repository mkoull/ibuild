import { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, btnPrimary, btnSecondary, btnGhost, badge, pName, ds } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import SignatureCanvas from "../../components/ui/SignatureCanvas.jsx";
import { ArrowRight, Printer } from "lucide-react";
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
        <span style={{ fontSize: 22, fontWeight: 600 }}>{voD.id}</span>
        <span style={badge(voD.status === "approved" ? _.green : voD.status === "pending" ? _.amber : _.muted)}>{voD.status}</span>
        <div style={{ flex: 1 }} />
        <button onClick={printEl} style={btnGhost}><Printer size={14} /> Print</button>
      </div>

      <div ref={voDocRef} style={{ background: "#fff", fontFamily: "'Inter',sans-serif", borderRadius: _.r, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: `1px solid ${_.line}` }}>
        <div style={{ background: _.ink, color: "#fff", padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 22, height: 22, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: _.ink }}>i</div><span style={{ fontSize: 13, fontWeight: 700 }}>iBuild National</span></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 9, color: _.ac, letterSpacing: "0.1em", fontWeight: 600 }}>VARIATION ORDER</div><div style={{ fontSize: 16, fontWeight: 700, color: _.ac }}>{voD.id}</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${_.line}` }}>
          {[["Project", pName(p, clients)], ["Client", p.client || ""], ["Date", voD.date]].map(([l, v]) => (
            <div key={l} style={{ padding: "10px 16px", borderRight: `1px solid ${_.line}` }}><div style={{ fontSize: 9, color: _.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div><div style={{ fontSize: 12, fontWeight: 500, marginTop: 1 }}>{v || "—"}</div></div>
          ))}
        </div>
        <div style={{ padding: "18px 28px", borderBottom: `1px solid ${_.line}` }}><div style={{ fontSize: 9, color: _.ac, letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4 }}>DESCRIPTION</div><div style={{ fontSize: 13, lineHeight: 1.7 }}>{voD.description}</div>{voD.reason && <div style={{ fontSize: 11, color: _.muted, marginTop: 3 }}>Reason: {voD.reason}</div>}</div>
        <div style={{ padding: "18px 28px", borderBottom: `1px solid ${_.line}` }}>
          <div style={{ fontSize: 9, color: _.ac, letterSpacing: "0.06em", fontWeight: 600, marginBottom: 10 }}>CONTRACT IMPACT</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div style={{ background: _.well, padding: 12, borderRadius: _.r }}><div style={{ fontSize: 9, color: _.muted, fontWeight: 600 }}>BEFORE</div><div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{fmt(voCB)}</div></div>
            <div style={{ background: _.ink, padding: 12, borderRadius: _.r, color: "#f8f8f6" }}><div style={{ fontSize: 9, color: _.ac, fontWeight: 600 }}>THIS VO</div><div style={{ fontSize: 17, fontWeight: 600, color: _.ac, marginTop: 2 }}>{voD.amount >= 0 ? "+" : ""}{fmt(voD.amount)}</div></div>
            <div style={{ background: _.well, padding: 12, borderRadius: _.r }}><div style={{ fontSize: 9, color: _.muted, fontWeight: 600 }}>REVISED</div><div style={{ fontSize: 17, fontWeight: 600, color: _.ac, marginTop: 2 }}>{fmt(voCB + voD.amount)}</div></div>
          </div>
        </div>
        <div style={{ padding: "18px 28px" }}>
          <div style={{ fontSize: 9, color: _.ac, letterSpacing: "0.06em", fontWeight: 600, marginBottom: 10 }}>AUTHORISATION</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {[["Builder — iBuild National", voD.builderSig], [`Client — ${p.client || "Owner"}`, voD.clientSig]].map(([l, s]) => (
              <div key={l}><div style={{ fontSize: 11, fontWeight: 600, marginBottom: 3 }}>{l}</div>{s ? <div><img src={s} alt="" style={{ maxHeight: 34 }} /><div style={{ fontSize: 9, color: _.muted, marginTop: 2 }}>Signed {voD.approvedDate || voD.date}</div></div> : <div style={{ borderBottom: `1px solid ${_.line2}`, height: 34 }} />}</div>
            ))}
          </div>
          {voD.status === "approved" && <div style={{ marginTop: 10, padding: "8px 12px", background: `${_.green}0a`, borderRadius: _.rSm, fontSize: 12, color: _.green, fontWeight: 600 }}>Approved {voD.approvedDate}</div>}
        </div>
        <div style={{ padding: "10px 28px", background: _.ink, fontSize: 9, color: _.muted }}>iBuild National · ABN 12 345 678 901 · (03) 8510 5472</div>
      </div>

      {voD.status !== "approved" && voD.status !== "rejected" && (
        <div style={{ marginTop: _.s5 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: _.s3 }}>Sign variation</div>
          <div style={{ display: "inline-flex", background: _.well, borderRadius: _.rFull, padding: 2, marginBottom: _.s3 }}>
            {["builder", "client"].map(role => (
              <div key={role} onClick={() => { setVoSignAs(role); sig.clear(); }} style={{ padding: "6px 16px", borderRadius: _.rFull, fontSize: 12, fontWeight: 600, cursor: "pointer", background: voSignAs === role ? _.surface : "transparent", color: voSignAs === role ? _.ink : _.muted, boxShadow: voSignAs === role ? "0 1px 3px rgba(0,0,0,0.06)" : "none", transition: "all 0.15s" }}>
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
                    if (voSignAs === "builder") pr.variations[idx].builderSig = data;
                    else pr.variations[idx].clientSig = data;
                    if (pr.variations[idx].builderSig && pr.variations[idx].clientSig) {
                      pr.variations[idx].status = "approved"; pr.variations[idx].approvedDate = ds(); notify("VO approved");
                    } else { pr.variations[idx].status = "pending"; notify((voSignAs === "builder" ? "Builder" : "Client") + " signed"); }
                    return pr;
                  });
                  log(voD.id + " signed by " + voSignAs); sig.clear();
                }} style={btnPrimary}>Confirm</button>
                <button onClick={() => sig.clear()} style={btnSecondary}>Clear</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: _.s3, background: `${_.green}0a`, borderRadius: _.rXs, fontSize: 13, color: _.green, fontWeight: 500 }}>{voSignAs === "builder" ? "Builder" : "Client"} signed</div>
          )}
        </div>
      )}
    </Section>
  );
}
