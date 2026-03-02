import { useState } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { input, label, ds } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { Search, Check, X, Pencil } from "lucide-react";

export default function DefectsPage() {
  const { project: p, update: up, log } = useProject();
  const { mobile, notify } = useApp();
  const [defectForm, setDefectForm] = useState({ location: "", desc: "", assignee: "" });
  const [editIdx, setEditIdx] = useState(null);
  const [editDefect, setEditDefect] = useState({});
  const [deleteIdx, setDeleteIdx] = useState(null);

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Defects</h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s7 }}>{p.defects.filter(d => d.done).length} of {p.defects.length} resolved</div>

      <div style={{ marginBottom: _.s7, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: _.s4, marginBottom: _.s3 }}>
          <div><label style={label}>Location</label><input style={input} value={defectForm.location} onChange={e => setDefectForm({ ...defectForm, location: e.target.value })} placeholder="Master ensuite" /></div>
          <div><label style={label}>Description *</label><input style={input} value={defectForm.desc} onChange={e => setDefectForm({ ...defectForm, desc: e.target.value })} placeholder="Cracked tile" /></div>
          <div><label style={label}>Assigned to</label><input style={input} value={defectForm.assignee} onChange={e => setDefectForm({ ...defectForm, assignee: e.target.value })} placeholder="Tiler" /></div>
        </div>
        <Button onClick={() => {
          if (!defectForm.desc) { notify("Add description", "error"); return; }
          up(pr => { pr.defects.push({ ...defectForm, date: ds(), done: false }); return pr; });
          log("Defect: " + defectForm.desc); setDefectForm({ location: "", desc: "", assignee: "" }); notify("Logged");
        }}>Add defect</Button>
      </div>

      {p.defects.length === 0 && <Empty icon={Search} text="No defects" />}
      {p.defects.map((d, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: _.s4, padding: `${_.s3}px 0`,
          borderBottom: `1px solid ${_.line}`,
          opacity: d.done ? 0.4 : 1, transition: `opacity ${_.tr}`,
        }}>
          <div onClick={() => {
            const wasDone = d.done;
            up(pr => { pr.defects[i] = { ...d, done: !d.done }; return pr; });
            if (!wasDone) log("Defect resolved: " + d.desc);
            notify(d.done ? "Reopened" : "Resolved");
          }} style={{
            width: 20, height: 20, borderRadius: 10, cursor: "pointer",
            border: `1.5px solid ${d.done ? _.green : _.line2}`,
            background: d.done ? _.green : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>{d.done && <Check size={11} strokeWidth={3} color="#fff" />}</div>
          {editIdx === i ? (
            <div style={{ flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: _.s3, marginBottom: _.s2 }}>
                <div><label style={label}>Location</label><input style={input} value={editDefect.location} onChange={e => setEditDefect({ ...editDefect, location: e.target.value })} /></div>
                <div><label style={label}>Description</label><input style={input} value={editDefect.desc} onChange={e => setEditDefect({ ...editDefect, desc: e.target.value })} /></div>
                <div><label style={label}>Assigned to</label><input style={input} value={editDefect.assignee} onChange={e => setEditDefect({ ...editDefect, assignee: e.target.value })} /></div>
              </div>
              <div style={{ display: "flex", gap: _.s2 }}>
                <Button size="sm" onClick={() => { up(pr => { pr.defects[i] = { ...pr.defects[i], location: editDefect.location, desc: editDefect.desc, assignee: editDefect.assignee }; return pr; }); setEditIdx(null); notify("Updated"); }}>Save</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditIdx(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium }}>{d.desc}</div>
                <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 1 }}>{[d.location, d.assignee && `→ ${d.assignee}`, d.date].filter(Boolean).join(" · ")}</div>
              </div>
              <div onClick={() => { setEditIdx(i); setEditDefect({ location: d.location || "", desc: d.desc, assignee: d.assignee || "" }); }}
                style={{ cursor: "pointer", color: _.faint, transition: `color ${_.tr}`, flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = _.ac}
                onMouseLeave={e => e.currentTarget.style.color = _.faint}
              ><Pencil size={13} /></div>
              <div onClick={() => setDeleteIdx(i)}
                style={{ cursor: "pointer", color: _.faint, transition: `color ${_.tr}`, flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = _.red}
                onMouseLeave={e => e.currentTarget.style.color = _.faint}
              ><X size={14} /></div>
            </>
          )}
        </div>
      ))}

      <Modal open={deleteIdx !== null} onClose={() => setDeleteIdx(null)} title="Delete Defect" width={400}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, marginBottom: 24 }}>
          Delete <strong>{deleteIdx !== null && p.defects[deleteIdx] ? p.defects[deleteIdx].desc : ""}</strong>?
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDeleteIdx(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { up(pr => { pr.defects.splice(deleteIdx, 1); return pr; }); notify("Deleted"); setDeleteIdx(null); }}>Delete</Button>
        </div>
      </Modal>
    </Section>
  );
}
