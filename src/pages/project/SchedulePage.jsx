import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { input, ds, pName } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { Check, ChevronRight, X, Printer, Share2, RefreshCw, Copy, Calendar } from "lucide-react";

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function SchedulePage() {
  const { project: p, update: up, log } = useProject();
  const { clients, mobile, notify } = useApp();
  const [searchParams] = useSearchParams();
  const milestones = p.schedule || p.milestones || [];

  const [newMs, setNewMs] = useState("");
  const [editMsIdx, setEditMsIdx] = useState(null);
  const [editMsName, setEditMsName] = useState("");
  const [shiftVal, setShiftVal] = useState("");
  const [shiftUnit, setShiftUnit] = useState("weeks");
  const [keepOffsets, setKeepOffsets] = useState(true);
  const [dragMs, setDragMs] = useState(null);
  const [dragOverMs, setDragOverMs] = useState(null);
  const [shareModal, setShareModal] = useState(false);
  const [regenModal, setRegenModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const urlClientView = searchParams.get("view") === "client";
  const [clientView, setClientView] = useState(urlClientView);

  const msKey = p.schedule ? "schedule" : "milestones";
  const startDate = p.startDate || "";

  const ganttMaxWk = Math.max(...milestones.map(m => m.wk || 0), 36);
  const ganttLastDoneIdx = [...milestones].reverse().findIndex(m => m.done);
  const ganttLastDone = ganttLastDoneIdx >= 0 ? milestones[milestones.length - 1 - ganttLastDoneIdx] : null;
  const ganttPct = ganttLastDone ? ((ganttLastDone.wk || 0) / ganttMaxWk) * 100 : 0;

  const doShift = () => {
    const raw = parseInt(shiftVal);
    if (!raw) return;
    const wks = shiftUnit === "days" ? Math.round(raw / 7) : raw;
    if (!wks) { notify("Shift too small — milestones track in weeks", "error"); return; }
    up(pr => {
      (pr[msKey] || pr.milestones).forEach(ms => {
        if (!ms.done) ms.wk = Math.max(0, (ms.wk || 0) + wks);
      });
      return pr;
    });
    log(`Schedule shifted ${raw > 0 ? "+" : ""}${raw} ${shiftUnit}`);
    setShiftVal("");
    notify(`Shifted ${raw > 0 ? "+" : ""}${raw} ${shiftUnit}`);
  };

  const doRegenerate = () => {
    if (!startDate) { notify("Set a project start date first", "error"); setRegenModal(false); return; }
    up(pr => {
      (pr[msKey] || pr.milestones).forEach(ms => {
        if (!ms.done) {
          ms.planned = addDays(startDate, (ms.wk || 0) * 7);
        }
      });
      return pr;
    });
    log("Schedule dates regenerated from " + startDate);
    notify("Dates regenerated");
    setRegenModal(false);
  };

  const undoneCount = useMemo(() => milestones.filter(m => !m.done).length, [milestones]);

  const clientViewUrl = useMemo(() => {
    const base = window.location.origin + window.location.pathname;
    return base + "?view=client";
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(clientViewUrl);
      setLinkCopied(true);
      notify("Link copied");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      notify("Copy failed — use the URL bar", "error");
    }
  };

  const printSchedule = () => {
    const prev = clientView;
    if (!prev) setClientView(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.print();
      if (!prev) setClientView(false);
    }));
  };

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s6, flexWrap: "wrap", gap: _.s3 }}>
        <div>
          <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Schedule</h1>
          <div style={{ fontSize: _.fontSize.md, color: _.muted }}>{milestones.filter(m => m.done).length} of {milestones.length} milestones · {milestones.length > 0 ? Math.round((milestones.filter(m => m.done).length / milestones.length) * 100) : 0}%</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: _.s2, flexWrap: "wrap" }}>
          <Button variant={clientView ? "primary" : "secondary"} size="sm" onClick={() => setClientView(v => !v)}>
            {clientView ? "Edit view" : "Client view"}
          </Button>
          <Button variant="secondary" size="sm" icon={Printer} onClick={printSchedule}>Print</Button>
          <Button variant="secondary" size="sm" icon={Share2} onClick={() => setShareModal(true)}>Share</Button>
        </div>
      </div>

      {/* Progress + controls (edit view only) */}
      {!clientView && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: _.s6, paddingBottom: _.s5, borderBottom: `1px solid ${_.line}`, flexWrap: "wrap", gap: _.s4 }}>
          <div>
            <div style={{ fontSize: _.fontSize.caption, color: _.body, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: 8 }}>Build Progress</div>
            <div style={{ fontSize: _.fontSize.stat, fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: _.ink }}>
              {milestones.length > 0 ? Math.round((milestones.filter(m => m.done).length / milestones.length) * 100) : 0}<span style={{ fontSize: _.fontSize.unit, color: _.muted }}>%</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: _.s3, alignItems: "flex-end" }}>
            {/* Start date + regenerate */}
            <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
              <Calendar size={13} color={_.muted} />
              <span style={{ fontSize: _.fontSize.sm, color: _.muted }}>Start date</span>
              <input type="date" value={startDate} onChange={e => up(pr => { pr.startDate = e.target.value; return pr; })}
                style={{ padding: "5px 8px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.sm, outline: "none", cursor: "pointer", fontFamily: "inherit" }} />
              <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => setRegenModal(true)}>Regenerate</Button>
            </div>
            {/* Bulk shift */}
            <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
              <span style={{ fontSize: _.fontSize.sm, color: _.muted }}>Shift undone by</span>
              <input type="number" style={{ width: 56, padding: "5px 8px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.base, textAlign: "center", outline: "none", fontWeight: _.fontWeight.semi }}
                value={shiftVal} onChange={e => setShiftVal(e.target.value)} placeholder="0" />
              <select value={shiftUnit} onChange={e => setShiftUnit(e.target.value)} style={{ padding: "5px 8px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.sm, outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
                <option value="weeks">wks</option>
                <option value="days">days</option>
              </select>
              <Button variant="secondary" size="sm" onClick={doShift}>Shift</Button>
            </div>
            <div onClick={() => setKeepOffsets(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
              <span style={{ fontSize: _.fontSize.sm, color: _.muted }}>Keep relative offsets</span>
              <div style={{ width: 32, height: 18, borderRadius: 9, background: keepOffsets ? _.ac : _.line2, transition: `background ${_.tr}`, position: "relative" }}>
                <div style={{ position: "absolute", top: 2, left: keepOffsets ? 16 : 2, width: 14, height: 14, borderRadius: 7, background: "#fff", transition: `left ${_.tr}`, boxShadow: _.sh1 }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gantt bar */}
      <div style={{ marginBottom: _.s6 }}>
        <div style={{ position: "relative", height: 20, background: _.well, borderRadius: _.rSm, marginBottom: _.s2, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${ganttPct}%`, background: _.ink, borderRadius: _.rSm, transition: "width 0.6s ease" }} />
          {milestones.map((ms, i) => {
            const left = ganttMaxWk ? ((ms.wk || 0) / ganttMaxWk) * 100 : 0;
            return (
              <div key={i} style={{ position: "absolute", left: `${left}%`, top: "50%", transform: "translate(-50%,-50%)", width: ms.done ? 7 : 5, height: ms.done ? 7 : 5, borderRadius: "50%", background: ms.done ? "#fff" : _.line2, border: ms.done ? "none" : `1.5px solid ${_.muted}`, zIndex: 1, transition: `all ${_.tr}` }} title={`${ms.name} — Wk ${ms.wk || 0}`} />
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.xs, color: _.faint }}>
          <span>Wk 0</span><span>Wk {ganttMaxWk}</span>
        </div>
      </div>

      {/* CLIENT VIEW */}
      {clientView && <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 100px", gap: 8, padding: "6px 0", borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
          <span>Milestone</span><span style={{ textAlign: "center" }}>Week</span><span>Target Date</span><span>Status</span>
        </div>
        {milestones.map((ms, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 100px", gap: 8, padding: "10px 0", borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: _.fontSize.base }}>
            <span style={{ fontWeight: _.fontWeight.medium, color: _.ink }}>{ms.name}</span>
            <span style={{ textAlign: "center", color: _.body, fontVariantNumeric: "tabular-nums" }}>Wk {ms.wk || 0}</span>
            <span style={{ color: _.body, fontSize: _.fontSize.sm }}>{ms.planned || "—"}</span>
            <span style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.medium, color: ms.done ? _.green : _.muted }}>{ms.done ? "Complete" : "Pending"}</span>
          </div>
        ))}
        <div style={{ marginTop: _.s6, fontSize: _.fontSize.sm, color: _.faint }}>{pName(p, clients)} · Generated {ds()}</div>
      </>}

      {/* EDIT VIEW */}
      {!clientView && <>
        <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 56px 110px 110px 72px", gap: 6, padding: "6px 0", borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
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
                display: "grid", gridTemplateColumns: "28px 1fr 56px 110px 110px 72px", gap: 6, padding: "8px 0",
                borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: _.fontSize.base,
                background: dragOverMs === i && dragMs !== null && dragMs !== i ? `${_.ac}08` : isNext ? `${_.ac}06` : "transparent",
                cursor: isEditing ? "default" : "grab", transition: `background ${_.tr}`,
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
                <input autoFocus style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium, color: _.ink, border: "none", borderBottom: `1px solid ${_.ac}`, outline: "none", padding: "2px 0", background: "transparent", fontFamily: "inherit" }}
                  value={editMsName} onChange={e => setEditMsName(e.target.value)}
                  onBlur={() => { if (editMsName.trim()) up(pr => { (pr[msKey] || pr.milestones)[i].name = editMsName.trim(); return pr; }); setEditMsIdx(null); }}
                  onKeyDown={e => { if (e.key === "Enter") { if (editMsName.trim()) up(pr => { (pr[msKey] || pr.milestones)[i].name = editMsName.trim(); return pr; }); setEditMsIdx(null); } if (e.key === "Escape") setEditMsIdx(null); }} />
              ) : (
                <div onClick={() => { setEditMsIdx(i); setEditMsName(ms.name); }} style={{ cursor: "text", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: ms.done ? _.fontWeight.medium : isNext ? _.fontWeight.semi : _.fontWeight.normal, color: ms.done ? _.muted : _.ink }}>{ms.name}</span>
                  {isNext && <span style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.ac }}>NEXT</span>}
                </div>
              )}

              {/* Week */}
              <input type="number" style={{ width: 44, padding: "3px 4px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.sm, textAlign: "center", outline: "none", fontWeight: _.fontWeight.semi, fontFamily: "inherit" }}
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
              }} style={{ padding: "3px 4px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.caption, outline: "none", cursor: "pointer", fontFamily: "inherit" }} />

              {/* Completed date */}
              <div style={{ fontSize: _.fontSize.sm, color: ms.done ? _.green : _.faint }}>{ms.done && ms.date ? ms.date : "—"}</div>

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
          <Button onClick={() => {
            if (!newMs.trim()) return;
            const maxWk = Math.max(...milestones.map(m => m.wk || 0), 0);
            up(pr => { (pr[msKey] || pr.milestones).push({ name: newMs.trim(), wk: maxWk + 4, done: false, date: "", planned: "" }); return pr; });
            log("Milestone added: " + newMs.trim()); setNewMs(""); notify("Milestone added");
          }}>Add</Button>
        </div>
      </>}

      {/* Regenerate confirmation modal */}
      <Modal open={regenModal} onClose={() => setRegenModal(false)} title="Regenerate Schedule Dates" width={440}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, lineHeight: _.lineHeight.body, marginBottom: _.s4 }}>
          Regenerating will update planned dates for <strong>{undoneCount} incomplete</strong> milestone{undoneCount !== 1 ? "s" : ""} based on the project start date and week offsets.
        </div>
        {!startDate && (
          <div style={{ padding: _.s3, background: `${_.amber}10`, border: `1px solid ${_.amber}30`, borderRadius: _.rSm, fontSize: _.fontSize.base, color: _.amber, marginBottom: _.s4, display: "flex", alignItems: "center", gap: _.s2 }}>
            <Calendar size={14} /> Set a project start date first.
          </div>
        )}
        <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginBottom: _.s5 }}>
          Completed milestones will keep their existing dates.
        </div>
        <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setRegenModal(false)}>Cancel</Button>
          <Button onClick={doRegenerate} disabled={!startDate} icon={RefreshCw}>Regenerate dates</Button>
        </div>
      </Modal>

      {/* Share modal */}
      <Modal open={shareModal} onClose={() => setShareModal(false)} title="Share Schedule" width={440}>
        <div style={{ marginBottom: _.s5 }}>
          <div style={{ fontSize: _.fontSize.sm, color: _.muted, fontWeight: _.fontWeight.semi, marginBottom: _.s2, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>Client view link</div>
          <div style={{ display: "flex", gap: _.s2, alignItems: "center" }}>
            <div style={{ flex: 1, padding: "8px 12px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rSm, fontSize: _.fontSize.sm, color: _.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
              {clientViewUrl}
            </div>
            <Button size="sm" variant={linkCopied ? "primary" : "secondary"} icon={linkCopied ? Check : Copy} onClick={copyLink}>
              {linkCopied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div style={{ fontSize: _.fontSize.sm, color: _.faint, marginTop: _.s2 }}>
            This link opens the schedule in a clean client-facing view without editing controls.
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${_.line}`, paddingTop: _.s4, marginBottom: _.s4 }}>
          <div style={{ fontSize: _.fontSize.sm, color: _.muted, fontWeight: _.fontWeight.semi, marginBottom: _.s2, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>Print / Download</div>
          <div style={{ fontSize: _.fontSize.base, color: _.body, marginBottom: _.s3 }}>
            Switch to Client view and use your browser's print dialog to save as PDF or send to a printer.
          </div>
          <Button variant="secondary" size="sm" icon={Printer} onClick={() => { setShareModal(false); printSchedule(); }}>Print client view</Button>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setShareModal(false)}>Close</Button>
        </div>
      </Modal>
    </Section>
  );
}
