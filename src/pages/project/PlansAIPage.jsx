import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, btnPrimary, btnGhost, badge, uid } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import { Upload, ArrowRight, AlertTriangle } from "lucide-react";

export default function PlansAIPage() {
  const { project: p, update: up, log } = useProject();
  const { mobile, notify } = useApp();
  const navigate = useNavigate();
  const [planLoad, setPlanLoad] = useState(false);
  const [planImg, setPlanImg] = useState(null);
  const [planData, setPlanData] = useState(null);
  const planFileRef = useRef(null);

  const analysePlan = async file => {
    setPlanLoad(true); setPlanData(null);
    try {
      const url = URL.createObjectURL(file); setPlanImg(url);
      const fd = new FormData(); fd.append("file", file);
      const resp = await fetch("http://localhost:3001/api/floorplan/analyse", { method: "POST", body: fd });
      if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
      const d = await resp.json();
      if (d.error) throw new Error(d.error);
      setPlanData(d);
    } catch (e) { setPlanData({ error: e.message || "Analysis failed — is the server running? (npm run server)" }); }
    setPlanLoad(false);
  };

  const addPlanItems = () => {
    if (!planData?.scope_items?.length) return;
    up(pr => {
      planData.scope_items.forEach(si => {
        const cat = si.category;
        if (!pr.scope[cat]) return;
        const exists = pr.scope[cat].find(x => x.item === si.item);
        if (exists) { exists.on = true; exists.qty = si.qty; exists.rate = si.rate; }
        else { pr.scope[cat].push({ item: si.item, unit: si.unit, rate: si.rate, qty: si.qty, on: true, actual: 0, custom: true, _id: uid() }); }
      });
      if (planData.total_m2) { pr.floorArea = String(planData.total_m2); pr.area = String(planData.total_m2); }
      return pr;
    });
    log("Plan items added: " + planData.scope_items.length + " items");
    notify(planData.scope_items.length + " items added to quote");
    navigate("../scope");
  };

  return (
    <Section>
      <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 4 }}>Plans AI</h1>
      <div style={{ fontSize: 14, color: _.muted, marginBottom: _.s3 }}>Upload floor plans for AI-powered scope extraction</div>
      <div style={{ fontSize: 12, color: _.faint, marginBottom: _.s8 }}>Analyses your plan image and suggests construction line items with Australian rates.</div>

      {/* Upload zone */}
      {!planData && !planLoad && (
        <div style={{ textAlign: "center", padding: `${_.s9}px ${_.s7}px`, border: `1.5px dashed ${_.line2}`, borderRadius: _.r, marginBottom: _.s7, transition: "border-color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = _.ink}
          onMouseLeave={e => e.currentTarget.style.borderColor = _.line2}
        >
          <Upload size={28} strokeWidth={1.5} color={_.muted} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, color: _.ink, marginBottom: 4, fontWeight: 500 }}>Upload a floor plan</div>
          <div style={{ fontSize: 13, color: _.muted, marginBottom: _.s5 }}>PNG, JPG, or PDF up to 20MB</div>
          <label style={btnPrimary}><input ref={planFileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) analysePlan(e.target.files[0]); }} />Choose file</label>
        </div>
      )}

      {/* Loading */}
      {planLoad && (
        <div style={{ textAlign: "center", padding: _.s9 }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${_.line}`, borderTopColor: _.ac, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <div style={{ fontSize: 14, color: _.body, fontWeight: 500 }}>Analysing floor plan...</div>
        </div>
      )}

      {/* Results */}
      {planData && !planData.error && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 32, marginBottom: 32 }}>
            {planImg && (
              <div>
                <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: _.s3 }}>Floor Plan</div>
                <div style={{ border: `1px solid ${_.line}`, borderRadius: _.r, overflow: "hidden", background: _.well }}>
                  <img src={planImg} alt="Floor plan" style={{ width: "100%", display: "block" }} />
                </div>
              </div>
            )}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s5 }}>
                <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>AI Analysis</div>
                <span style={badge(_.green)}>AI Confidence: High</span>
              </div>
              <div style={{ display: "flex", gap: 0, marginBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
                <div style={{ flex: 1, padding: "16px 0" }}>
                  <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>Total Area</div>
                  <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{planData.total_m2}m²</div>
                </div>
                <div style={{ width: 1, background: _.line, margin: "0 20px" }} />
                <div style={{ flex: 1, padding: "16px 0" }}>
                  <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>Estimated Cost</div>
                  <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
                    {planData.scope_items?.length ? fmt(planData.scope_items.reduce((s, si) => s + si.rate * si.qty, 0)) : "—"}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: _.s3 }}>Detected Rooms ({planData.rooms?.length || 0})</div>
              {planData.rooms?.map((rm, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${_.line}`, fontSize: 13 }}>
                  <span style={{ color: _.body }}>{rm.name}</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{rm.m2}m²</span>
                </div>
              ))}
              {planData.notes && <div style={{ marginTop: _.s5, fontSize: 13, color: _.muted, lineHeight: 1.6 }}>{planData.notes}</div>}
            </div>
          </div>

          {planData.scope_items?.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s4, paddingTop: _.s5, borderTop: `1px solid ${_.line}` }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: _.ink }}>Extracted Scope Items</div>
                <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(planData.scope_items.reduce((s, si) => s + si.rate * si.qty, 0))}</span>
              </div>
              {planData.scope_items.map((si, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 100px", gap: 8, padding: "10px 0", borderBottom: `1px solid ${_.line}`, fontSize: 13, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500, color: _.ink }}>{si.item}</div>
                    <div style={{ fontSize: 11, color: _.muted, marginTop: 1 }}>{si.category}</div>
                  </div>
                  <div style={{ color: _.muted, fontSize: 12 }}>{si.qty} {si.unit}</div>
                  <div style={{ color: _.muted, fontSize: 12, textAlign: "right" }}>@ {fmt(si.rate)}</div>
                  <div style={{ fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(si.rate * si.qty)}</div>
                </div>
              ))}
              <div style={{ marginTop: _.s7, paddingTop: _.s6, borderTop: `1px solid ${_.line}`, display: "flex", alignItems: "center", gap: _.s3 }}>
                <button onClick={addPlanItems} style={{ ...btnPrimary, padding: "12px 24px", fontSize: 14 }}>Add {planData.scope_items.length} items to Quote <ArrowRight size={14} /></button>
                <label style={{ ...btnGhost, cursor: "pointer" }}><input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) analysePlan(e.target.files[0]); }} />Re-upload</label>
              </div>
            </div>
          )}
        </div>
      )}

      {planData?.error && (
        <div style={{ padding: _.s4, border: `1px solid ${_.red}30`, borderRadius: _.r, background: `${_.red}08`, display: "flex", alignItems: "center", gap: _.s3 }}>
          <AlertTriangle size={16} color={_.red} />
          <div style={{ fontSize: 14, color: _.red, fontWeight: 500 }}>{planData.error}</div>
        </div>
      )}
    </Section>
  );
}
