import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, label, btnPrimary, badge, uid, ds } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import { ClipboardList, ChevronRight, ArrowRight } from "lucide-react";

export default function VariationsPage() {
  const { project: p, update: up, T, log } = useProject();
  const { mobile, notify } = useApp();
  const navigate = useNavigate();
  const [voForm, setVoForm] = useState({ desc: "", cat: "", amount: "", reason: "" });

  return (
    <Section>
      <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 4 }}>Variation Orders</h1>
      <div style={{ fontSize: 14, color: _.muted, marginBottom: _.s7 }}>Changes to original contract scope</div>

      {/* VO equation */}
      <div style={{ display: "flex", gap: mobile ? _.s4 : _.s7, marginBottom: _.s7, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}`, alignItems: "baseline", flexWrap: mobile ? "wrap" : "nowrap" }}>
        <div><div style={label}>Original</div><div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(T.orig)}</div></div>
        <span style={{ color: _.faint, fontSize: 18 }}>+</span>
        <div><div style={{ ...label, color: _.ac }}>Approved</div><div style={{ fontSize: 22, fontWeight: 700, color: _.ac }}>{fmt(T.aV)}</div></div>
        <span style={{ color: _.faint, fontSize: 18 }}>=</span>
        <div><div style={{ ...label, color: _.green }}>Current</div><div style={{ fontSize: 22, fontWeight: 700, color: _.green }}>{fmt(T.curr)}</div></div>
      </div>

      {/* New VO form */}
      <div style={{ marginBottom: _.s7, paddingBottom: _.s7, borderBottom: `1px solid ${_.line}` }}>
        <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: _.s4 }}>New Variation</div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: `${_.s3}px ${_.s4}px`, marginBottom: _.s3 }}>
          <div><label style={label}>Description *</label><input style={{ ...input, borderColor: voForm._err && !voForm.desc ? _.red : "transparent" }} value={voForm.desc} onChange={e => setVoForm({ ...voForm, desc: e.target.value, _err: false })} placeholder="Upgraded stone benchtop" /></div>
          <div><label style={label}>Category</label><input style={input} value={voForm.cat} onChange={e => setVoForm({ ...voForm, cat: e.target.value })} placeholder="Kitchen" /></div>
          <div><label style={label}>Amount (inc GST) *</label><input type="number" style={{ ...input, borderColor: voForm._err && !voForm.amount ? _.red : "transparent" }} value={voForm.amount} onChange={e => setVoForm({ ...voForm, amount: e.target.value, _err: false })} placeholder="3500" /></div>
          <div><label style={label}>Reason</label><input style={input} value={voForm.reason} onChange={e => setVoForm({ ...voForm, reason: e.target.value })} placeholder="Owner selection change" /></div>
        </div>
        {voForm._err && <div style={{ fontSize: 13, color: _.red, marginBottom: _.s2 }}>Description and amount are required</div>}
        {voForm.amount && <div style={{ fontSize: 14, color: _.muted, marginBottom: _.s3 }}>Contract {parseFloat(voForm.amount) >= 0 ? "increases" : "decreases"} by <strong style={{ color: _.ac }}>{fmt(Math.abs(parseFloat(voForm.amount) || 0))}</strong></div>}
        <button onClick={() => {
          if (!voForm.desc || !voForm.amount) { setVoForm({ ...voForm, _err: true }); return; }
          up(pr => {
            pr.variations.push({ id: `VO-${String(pr.variations.length + 1).padStart(3, "0")}`, description: voForm.desc, category: voForm.cat, amount: parseFloat(voForm.amount), reason: voForm.reason, date: ds(), status: "draft", builderSig: null, clientSig: null, approvedDate: "" });
            return pr;
          });
          log(`VO created: ${voForm.desc} (${fmt(parseFloat(voForm.amount))})`);
          notify(`VO created — ${fmt(parseFloat(voForm.amount))}`);
          setVoForm({ desc: "", cat: "", amount: "", reason: "" });
        }} style={btnPrimary}>Create VO <ArrowRight size={14} /></button>
      </div>

      {p.variations.length === 0 && <Empty icon={ClipboardList} text="No variations yet" />}
      {p.variations.map((v, i) => (
        <div key={i} onClick={() => navigate(`${i}`)} style={{
          padding: `${_.s4}px 0`, cursor: "pointer", display: "flex", justifyContent: "space-between",
          alignItems: "center", borderBottom: `1px solid ${_.line}`, transition: "all 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.paddingLeft = "4px"}
        onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: _.s4 }}>
            <div style={{ width: 36, height: 36, borderRadius: _.rXs, background: _.well, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: _.ink, flexShrink: 0 }}>{v.id.split("-")[1]}</div>
            <div><div style={{ fontSize: 14, fontWeight: 500 }}>{v.description}</div><div style={{ fontSize: 12, color: _.muted, marginTop: 1 }}>{v.category ? `${v.category} · ` : ""}{v.date}</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: _.s3 }}>
            <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{v.amount >= 0 ? "+" : ""}{fmt(v.amount)}</span>
            <span style={badge(v.status === "approved" ? _.green : v.status === "rejected" ? _.red : _.amber)}>{v.status}</span>
            <ChevronRight size={14} color={_.faint} />
          </div>
        </div>
      ))}
    </Section>
  );
}
