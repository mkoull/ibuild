import { useState } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { input, btnPrimary, btnSecondary, ds, pName } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import { Check, ChevronRight, X, Printer } from "lucide-react";

export default function SchedulePage() {
  const { project: p, update: up, log } = useProject();
  const { clients, mobile, notify } = useApp();
  const milestones = p.schedule || p.milestones || [];

  const [newMs, setNewMs] = useState("");
  const [editMsIdx, setEditMsIdx] = useState(null);
  const [editMsName, setEditMsName] = useState("");
  const [shiftWeeks, setShiftWeeks] = useState("");
  const [keepOffsets, setKeepOffsets] = useState(true);
  const [clientView, setClientView] = useState(false);
  const [dragMs, setDragMs] = useState(null);
  const [dragOverMs, setDragOverMs] = useState(null);

  const msKey = p.schedule ? "schedule" : "milestones";

  const ganttMaxWk = Math.max(...milestones.map(m => m.wk || 0), 36);
  const ganttLastDoneIdx = [...milestones].reverse().findIndex(m => m.done);
  const ganttLastDone = ganttLastDoneIdx >= 0 ? milestones[milestones.length - 1 - ganttLastDoneIdx] : null;
  const ganttPct = ganttLastDone ? ((ganttLastDone.wk || 0) / ganttMaxWk) * 100 : 0;

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s7 }}>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 4 }}>Schedule</h1>
          <div style={{ fontSize: 14, color: _.muted }}>{milestones.filter(m => m.done).length} of {milestones.length} milestones · {milestones.length > 0 ? Math.round((milestones.filter(m => m.done).length / milestones.length) * 100) : 0}%</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: _.s3 }}>
          <button onClick={() => setClientView(v => !v)} style={clientView ? btnPrimary : btnSecondary}>{clientView ? "Edit view" : "Client view"}</button>
          <button onClick={() => { if (clientView) window.print(); else notify("Switch to Client view to print"); }} style={btnSecondary}><Printer size={14} /> Print</button>
        </div>
      </div>

      {/* Progress + controls */}
      {!clientView && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: _.s6, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}`, flexWrap: "wrap", gap: _.s4 }}>
          <div>
            <div style={{ fontSize: 11, color: _.body, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Build Progress</div>
            <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: _.ink }}>
              {milestones.length > 0 ? Math.round((milestones.filter(m => m.done).length / milestones.length) * 100) : 0}<span style={{ fontSize: 18, color: _.muted }}>%</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: _.s3, alignItems: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
              <span style={{ fontSize: 12, color: _.muted }}>Shift undone by</span>
              <input type="number" style={{ width: 56, padding: "5px 8px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: 13, textAlign: "center", outline: "none", fontWeight: 600 }}
                value={shiftWeeks} onChange={e => setShiftWeeks(e.target.value)} placeholder="0" />
              <span style={{ fontSize: 12, color: _.muted }}>wks</span>
              <button onClick={() => {
                const w = parseInt(shiftWeeks); if (!w) return;
                up(pr => { (pr[msKey] || pr.milestones).forEach(ms => { if (!ms.done) ms.wk = Math.max(0, (ms.wk || 0) + w); }); return pr; });
                log(`Schedule shifted ${w > 0 ? "+" : ""}${w} weeks`); setShiftWeeks(""); notify(`Shifted ${w > 0 ? "+" : ""}${w} weeks`);
              }} style={{ ...btnSecondary, padding: "5px 12px", fontSize: 12 }}>Shift</button>
            </div>
            <div onClick={() => setKeepOffsets(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
              <span style={{ fontSize: 12, color: _.muted }}>Keep relative offsets</span>
              <div style={{ width: 32, height: 18, borderRadius: 9, background: keepOffsets ? _.ac : _.line2, transition: "background 0.15s", position: "relative" }}>
                <div style={{ position: "absolute", top: 2, left: keepOffsets ? 16 : 2, width: 14, height: 14, borderRadius: 7, background: "#fff", transition: "left 0.15s", boxShadow: _.sh1 }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gantt bar */}
      <div style={{ marginBottom: _.s7 }}>
        <div style={{ position: "relative", height: 24, background: _.well, borderRadius: _.rSm, marginBottom: _.s3, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${ganttPct}%`, background: _.ink, borderRadius: _.rSm, transition: "width 0.6s ease" }} />
          {milestones.map((ms, i) => {
            const left = ganttMaxWk ? ((ms.wk || 0) / ganttMaxWk) * 100 : 0;
            return (
              <div key={i} style={{ position: "absolute", left: `${left}%`, top: "50%", transform: "translate(-50%,-50%)", width: ms.done ? 8 : 6, height: ms.done ? 8 : 6, borderRadius: "50%", background: ms.done ? "#fff" : _.line2, border: ms.done ? "none" : `1.5px solid ${_.muted}`, zIndex: 1, transition: "all 0.2s" }} title={`${ms.name} — Wk ${ms.wk || 0}`} />
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: _.faint }}>
          <span>Wk 0</span><span>Wk {ganttMaxWk}</span>
        </div>
      </div>

      {/* CLIENT VIEW */}
      {clientView && <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 100px", gap: 8, padding: "8px 0", borderBottom: `2px solid ${_.ink}`, fontSize: 10, color: _.muted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          <span>Milestone</span><span style={{ textAlign: "center" }}>Week</span><span>Target Date</span><span>Status</span>
        </div>
        {milestones.map((ms, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 100px", gap: 8, padding: "12px 0", borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: 13 }}>
            <span style={{ fontWeight: 500, color: _.ink }}>{ms.name}</span>
            <span style={{ textAlign: "center", color: _.body, fontVariantNumeric: "tabular-nums" }}>Wk {ms.wk || 0}</span>
            <span style={{ color: _.body, fontSize: 12 }}>{ms.planned || "—"}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: ms.done ? _.green : _.muted }}>{ms.done ? "Complete" : "Pending"}</span>
          </div>
        ))}
        <div style={{ marginTop: _.s6, fontSize: 12, color: _.faint }}>{pName(p, clients)} · Generated {ds()}</div>
      </>}

      {/* EDIT VIEW */}
      {!clientView && <>
        <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 60px 120px 120px 80px", gap: 8, padding: "8px 0", borderBottom: `2px solid ${_.ink}`, fontSize: 10, color: _.muted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          <span></span><span>Milestone</span><span style={{ textAlign: "center" }}>Week</span><span>Planned</span><span>Completed</span><span></span>
        </div>
        {milestones.map((ms, i) => {
          const isNext = i === milestones.findIndex(m => !m.done) && !ms.done;
          const isEditing = editMsIdx === i;
          return (
            <div key={i}
              draggable={!isEditing}
              onDragStart={e => { setDragMs(i); e.dataTransfer.effectAllowed = "move"; e.currentTarget.style.opacity = "0.4"; }}
              onDragEnd={e => {
                e.currentTarget.style.opacity = "1";
                if (dragMs !== null && dragOverMs !== null && dragMs !== dragOverMs) {
                  up(pr => { const arr = pr[msKey] || pr.milestones; const item = arr.splice(dragMs, 1)[0]; arr.splice(dragOverMs, 0, item); return pr; });
                }
                setDragMs(null); setDragOverMs(null);
              }}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverMs(i); }}
              onDragEnter={e => e.preventDefault()}
              style={{
                display: "grid", gridTemplateColumns: "32px 1fr 60px 120px 120px 80px", gap: 8, padding: "10px 0",
                borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: 13,
                background: dragOverMs === i && dragMs !== null && dragMs !== i ? `${_.ac}08` : isNext ? `${_.ac}06` : "transparent",
                cursor: isEditing ? "default" : "grab", transition: "background 0.1s",
              }}
            >
              {/* Done toggle */}
              <div onClick={() => {
                const wasDone = ms.done;
                up(pr => { (pr[msKey] || pr.milestones)[i] = { ...ms, done: !ms.done, date: !ms.done ? ds() : ms.date }; return pr; });
                if (!wasDone) log("Milestone: " + ms.name);
              }} style={{
                width: 18, height: 18, borderRadius: 9,
                border: ms.done ? "none" : `1.5px solid ${isNext ? _.ac : _.line2}`,
                background: ms.done ? _.ink : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}>{ms.done && <Check size={10} strokeWidth={3} color="#fff" />}</div>

              {/* Name */}
              {isEditing ? (
                <input autoFocus style={{ fontSize: 13, fontWeight: 500, color: _.ink, border: "none", borderBottom: `1px solid ${_.ac}`, outline: "none", padding: "2px 0", background: "transparent", fontFamily: "inherit" }}
                  value={editMsName} onChange={e => setEditMsName(e.target.value)}
                  onBlur={() => { if (editMsName.trim()) up(pr => { (pr[msKey] || pr.milestones)[i].name = editMsName.trim(); return pr; }); setEditMsIdx(null); }}
                  onKeyDown={e => { if (e.key === "Enter") { if (editMsName.trim()) up(pr => { (pr[msKey] || pr.milestones)[i].name = editMsName.trim(); return pr; }); setEditMsIdx(null); } if (e.key === "Escape") setEditMsIdx(null); }} />
              ) : (
                <div onClick={() => { setEditMsIdx(i); setEditMsName(ms.name); }} style={{ cursor: "text", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: ms.done ? 500 : isNext ? 600 : 400, color: ms.done ? _.muted : _.ink }}>{ms.name}</span>
                  {isNext && <span style={{ fontSize: 10, fontWeight: 600, color: _.ac }}>NEXT</span>}
                </div>
              )}

              {/* Week */}
              <input type="number" style={{ width: 48, padding: "3px 6px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: 12, textAlign: "center", outline: "none", fontWeight: 600, fontFamily: "inherit" }}
                value={ms.wk || 0} onChange={e => {
                  const newWk = parseInt(e.target.value) || 0; const delta = newWk - (ms.wk || 0);
                  up(pr => { const arr = pr[msKey] || pr.milestones; arr[i].wk = newWk; if (keepOffsets && delta !== 0) { for (let j = i + 1; j < arr.length; j++) arr[j].wk = Math.max(0, (arr[j].wk || 0) + delta); } return pr; });
                }} />

              {/* Planned date */}
              <input type="date" value={ms.planned || ""} onChange={e => {
                const newDate = e.target.value;
                up(pr => {
                  const arr = pr[msKey] || pr.milestones;
                  const oldDate = arr[i].planned; arr[i].planned = newDate;
                  if (keepOffsets && oldDate && newDate) {
                    const oldMs2 = new Date(oldDate).getTime(); const newMs2 = new Date(newDate).getTime(); const deltaMs = newMs2 - oldMs2;
                    if (deltaMs !== 0) { for (let j = i + 1; j < arr.length; j++) { if (arr[j].planned) { const shifted = new Date(new Date(arr[j].planned).getTime() + deltaMs); arr[j].planned = shifted.toISOString().split("T")[0]; } } }
                  }
                  return pr;
                });
              }} style={{ padding: "3px 6px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: 11, outline: "none", cursor: "pointer", fontFamily: "inherit" }} />

              {/* Completed date */}
              <div style={{ fontSize: 12, color: ms.done ? _.green : _.faint }}>{ms.done && ms.date ? ms.date : "—"}</div>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                {i > 0 && <div onClick={() => up(pr => { const arr = pr[msKey] || pr.milestones; const tmp = arr[i]; arr[i] = arr[i - 1]; arr[i - 1] = tmp; return pr; })} style={{ cursor: "pointer", color: _.faint, padding: 2, display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = _.ink} onMouseLeave={e => e.currentTarget.style.color = _.faint}><ChevronRight size={12} style={{ transform: "rotate(-90deg)" }} /></div>}
                {i < milestones.length - 1 && <div onClick={() => up(pr => { const arr = pr[msKey] || pr.milestones; const tmp = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = tmp; return pr; })} style={{ cursor: "pointer", color: _.faint, padding: 2, display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = _.ink} onMouseLeave={e => e.currentTarget.style.color = _.faint}><ChevronRight size={12} style={{ transform: "rotate(90deg)" }} /></div>}
                <div onClick={() => { if (milestones.length <= 1) return; up(pr => { (pr[msKey] || pr.milestones).splice(i, 1); return pr; }); notify("Removed"); }} style={{ cursor: "pointer", color: _.faint, padding: 2, display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={12} /></div>
              </div>
            </div>
          );
        })}

        {/* Add milestone */}
        <div style={{ display: "flex", gap: _.s2, marginTop: _.s4, paddingTop: _.s4, borderTop: `1px solid ${_.line}` }}>
          <input style={{ ...input, flex: 1 }} placeholder="Add milestone…" value={newMs} onChange={e => setNewMs(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && newMs.trim()) {
                const maxWk = Math.max(...milestones.map(m => m.wk || 0), 0);
                up(pr => { (pr[msKey] || pr.milestones).push({ name: newMs.trim(), wk: maxWk + 4, done: false, date: "", planned: "" }); return pr; });
                log("Milestone added: " + newMs.trim()); setNewMs(""); notify("Milestone added");
              }
            }} />
          <button onClick={() => {
            if (!newMs.trim()) return;
            const maxWk = Math.max(...milestones.map(m => m.wk || 0), 0);
            up(pr => { (pr[msKey] || pr.milestones).push({ name: newMs.trim(), wk: maxWk + 4, done: false, date: "", planned: "" }); return pr; });
            log("Milestone added: " + newMs.trim()); setNewMs(""); notify("Milestone added");
          }} style={btnPrimary}>Add</button>
        </div>
      </>}
    </Section>
  );
}
