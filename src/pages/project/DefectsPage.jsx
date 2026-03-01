import { useState } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { input, label, btnPrimary, ds } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import { Search, Check } from "lucide-react";

export default function DefectsPage() {
  const { project: p, update: up, log } = useProject();
  const { mobile, notify } = useApp();
  const [defectForm, setDefectForm] = useState({ location: "", desc: "", assignee: "" });

  return (
    <Section>
      <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 4 }}>Defects</h1>
      <div style={{ fontSize: 14, color: _.muted, marginBottom: _.s7 }}>{p.defects.filter(d => d.done).length} of {p.defects.length} resolved</div>

      <div style={{ marginBottom: _.s7, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: _.s4, marginBottom: _.s3 }}>
          <div><label style={label}>Location</label><input style={input} value={defectForm.location} onChange={e => setDefectForm({ ...defectForm, location: e.target.value })} placeholder="Master ensuite" /></div>
          <div><label style={label}>Description *</label><input style={input} value={defectForm.desc} onChange={e => setDefectForm({ ...defectForm, desc: e.target.value })} placeholder="Cracked tile" /></div>
          <div><label style={label}>Assigned to</label><input style={input} value={defectForm.assignee} onChange={e => setDefectForm({ ...defectForm, assignee: e.target.value })} placeholder="Tiler" /></div>
        </div>
        <button onClick={() => {
          if (!defectForm.desc) { notify("Add description", "error"); return; }
          up(pr => { pr.defects.push({ ...defectForm, date: ds(), done: false }); return pr; });
          log("Defect: " + defectForm.desc); setDefectForm({ location: "", desc: "", assignee: "" }); notify("Logged");
        }} style={btnPrimary}>Add defect</button>
      </div>

      {p.defects.length === 0 && <Empty icon={Search} text="No defects" />}
      {p.defects.map((d, i) => (
        <div key={i} onClick={() => {
          const wasDone = d.done;
          up(pr => { pr.defects[i] = { ...d, done: !d.done }; return pr; });
          if (!wasDone) log("Defect resolved: " + d.desc);
          notify(d.done ? "Reopened" : "Resolved");
        }} style={{
          display: "flex", alignItems: "center", gap: _.s4, padding: `${_.s3}px 0`,
          borderBottom: `1px solid ${_.line}`, cursor: "pointer",
          opacity: d.done ? 0.4 : 1, transition: "opacity 0.2s",
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: 10,
            border: `1.5px solid ${d.done ? _.green : _.line2}`,
            background: d.done ? _.green : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>{d.done && <Check size={11} strokeWidth={3} color="#fff" />}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{d.desc}</div>
            <div style={{ fontSize: 12, color: _.muted, marginTop: 1 }}>{[d.location, d.assignee && `→ ${d.assignee}`, d.date].filter(Boolean).join(" · ")}</div>
          </div>
        </div>
      ))}
    </Section>
  );
}
