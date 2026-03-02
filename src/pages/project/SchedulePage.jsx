import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { input, badge, ds, pName, uid } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import GanttChart from "../../components/ui/GanttChart.jsx";
import {
  calculateSchedule, shiftProject, shiftDownstream, syncLegacyFields,
  updateMilestoneStatus, getScheduleMetrics, addDays,
} from "../../lib/scheduleEngine.js";
import { MILESTONES } from "../../data/defaults.js";
import {
  Check, ChevronRight, X, Printer, Share2, RefreshCw, Copy,
  Calendar, Link2,
} from "lucide-react";

const STATUS_OPTS = [
  { value: "not_started", label: "Not Started", color: _.muted },
  { value: "in_progress", label: "In Progress", color: _.ac },
  { value: "complete", label: "Complete", color: _.green },
];

export default function SchedulePage() {
  const { project: p, update: up, log } = useProject();
  const { clients, trades: globalTrades, mobile, notify, settings } = useApp();
  const [searchParams] = useSearchParams();
  const milestones = p.schedule || [];

  const [tab, setTab] = useState(searchParams.get("view") === "client" ? "Client" : "List");
  const [newMs, setNewMs] = useState("");
  const [editMsIdx, setEditMsIdx] = useState(null);
  const [editMsName, setEditMsName] = useState("");
  const [shiftVal, setShiftVal] = useState("");
  const [shiftUnit, setShiftUnit] = useState("weeks");
  const [keepOffsets, setKeepOffsets] = useState(true);
  const [shareModal, setShareModal] = useState(false);
  const [regenModal, setRegenModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [depsModal, setDepsModal] = useState(null); // milestone index
  const [dragMs, setDragMs] = useState(null);
  const [dragOverMs, setDragOverMs] = useState(null);

  const startDate = p.startDate || "";

  // Computed schedule with engine
  const computed = useMemo(
    () => startDate ? calculateSchedule(milestones, startDate) : milestones,
    [milestones, startDate],
  );

  const metrics = useMemo(() => getScheduleMetrics(computed), [computed]);

  // Assigned trades for this project
  const projectTrades = useMemo(() => {
    if (!globalTrades || !p.assignedTradeIds) return [];
    return p.assignedTradeIds
      .map(id => (globalTrades || []).find(t => t.id === id))
      .filter(Boolean);
  }, [globalTrades, p.assignedTradeIds]);

  // ── Handlers ──

  const doShift = () => {
    const raw = parseInt(shiftVal);
    if (!raw) return;
    const days = shiftUnit === "weeks" ? raw * 7 : raw;
    up(pr => {
      pr.schedule = shiftProject(pr.schedule, days, { onlyIncomplete: true });
      if (startDate) pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
    log(`Schedule shifted ${raw > 0 ? "+" : ""}${raw} ${shiftUnit}`);
    setShiftVal("");
    notify(`Shifted ${raw > 0 ? "+" : ""}${raw} ${shiftUnit}`);
  };

  const doRegenerate = () => {
    if (!startDate) { notify("Set a project start date first", "error"); setRegenModal(false); return; }
    up(pr => {
      pr.schedule = pr.schedule.map(m => {
        if (m.status === "complete" || m.done) return m;
        const updated = {
          ...m,
          plannedStart: addDays(startDate, m.offsetDays || (m.wk || 0) * 7),
          plannedFinish: addDays(startDate, (m.offsetDays || (m.wk || 0) * 7) + (m.durationDays || 28)),
        };
        return syncLegacyFields(updated);
      });
      return pr;
    });
    log("Schedule dates regenerated from " + startDate);
    notify("Dates regenerated");
    setRegenModal(false);
  };

  const updateMs = (idx, changes) => {
    up(pr => {
      pr.schedule[idx] = syncLegacyFields({ ...pr.schedule[idx], ...changes });
      if (startDate) pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
  };

  const setMsStatus = (idx, newStatus) => {
    up(pr => {
      pr.schedule[idx] = updateMilestoneStatus(pr.schedule[idx], newStatus);
      if (startDate) pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
    if (newStatus === "complete") log("Milestone: " + milestones[idx].name);
  };

  const setMsPercent = (idx, pct) => {
    const clamped = Math.max(0, Math.min(100, pct));
    up(pr => {
      const m = pr.schedule[idx];
      m.percentComplete = clamped;
      if (clamped === 0 && m.status !== "not_started") {
        pr.schedule[idx] = updateMilestoneStatus(m, "not_started");
      } else if (clamped === 100 && m.status !== "complete") {
        pr.schedule[idx] = updateMilestoneStatus(m, "complete");
      } else if (clamped > 0 && clamped < 100 && m.status === "not_started") {
        pr.schedule[idx] = updateMilestoneStatus(m, "in_progress");
      } else {
        pr.schedule[idx] = syncLegacyFields(m);
      }
      if (startDate) pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
  };

  const setMsDuration = (idx, newDur) => {
    const m = milestones[idx];
    const oldDur = m.durationDays || 7;
    const delta = (newDur - oldDur);
    up(pr => {
      pr.schedule[idx].durationDays = newDur;
      if (keepOffsets && delta !== 0) {
        pr.schedule = shiftDownstream(pr.schedule, pr.schedule[idx].id, delta);
      }
      pr.schedule[idx] = syncLegacyFields(pr.schedule[idx]);
      if (startDate) pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
  };

  const setMsStartDate = (idx, newDate) => {
    if (!startDate) return;
    up(pr => {
      const offsetDays = Math.max(0, Math.round((new Date(newDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
      const m = pr.schedule[idx];
      const oldOffset = m.offsetDays || 0;
      const delta = offsetDays - oldOffset;
      m.offsetDays = offsetDays;
      if (keepOffsets && delta !== 0) {
        pr.schedule = shiftDownstream(pr.schedule, m.id, delta);
      }
      pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
  };

  const setMsFinishDate = (idx, newDate) => {
    if (!startDate) return;
    up(pr => {
      const m = pr.schedule[idx];
      const pStart = m.plannedStart || addDays(startDate, m.offsetDays || 0);
      const newDur = Math.max(1, Math.round((new Date(newDate) - new Date(pStart)) / (1000 * 60 * 60 * 24)));
      const delta = newDur - (m.durationDays || 7);
      m.durationDays = newDur;
      if (keepOffsets && delta !== 0) {
        pr.schedule = shiftDownstream(pr.schedule, m.id, delta);
      }
      pr.schedule[idx] = syncLegacyFields(m);
      pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
  };

  const setMsDeps = (idx, depIds) => {
    up(pr => {
      pr.schedule[idx].dependsOn = depIds;
      if (startDate) pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
  };

  const addMilestone = (name) => {
    if (!name.trim()) return;
    const maxOffset = Math.max(...milestones.map(m => (m.offsetDays || (m.wk || 0) * 7)), 0);
    up(pr => {
      const newM = syncLegacyFields({
        id: uid(),
        name: name.trim(),
        durationDays: 28,
        offsetDays: maxOffset + 28,
        dependsOn: [],
        tradeId: null,
        status: "not_started",
        percentComplete: 0,
        plannedStart: "",
        plannedFinish: "",
        actualStart: "",
        actualFinish: "",
        order: pr.schedule.length,
        wk: Math.round((maxOffset + 28) / 7),
        done: false,
        date: "",
        planned: "",
      });
      pr.schedule.push(newM);
      if (startDate) pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
    log("Milestone added: " + name.trim());
    notify("Milestone added");
  };

  // Gantt handlers
  const handleGanttShift = (idx, newOffset) => {
    up(pr => {
      pr.schedule[idx].offsetDays = newOffset;
      pr.schedule[idx] = syncLegacyFields(pr.schedule[idx]);
      if (startDate) pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
  };

  const handleGanttResize = (idx, newDuration) => {
    up(pr => {
      pr.schedule[idx].durationDays = newDuration;
      pr.schedule[idx] = syncLegacyFields(pr.schedule[idx]);
      if (startDate) pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
  };

  // Share & print
  const clientViewUrl = useMemo(() => window.location.origin + window.location.pathname + "?view=client", []);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(clientViewUrl);
      setLinkCopied(true); notify("Link copied");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { notify("Copy failed", "error"); }
  };
  const printSchedule = () => {
    const prev = tab;
    setTab("Client");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.print();
      setTab(prev);
    }));
  };

  const undoneCount = useMemo(() => milestones.filter(m => m.status ? m.status !== "complete" : !m.done).length, [milestones]);

  // ── Render ──

  return (
    <Section>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s5, flexWrap: "wrap", gap: _.s3 }}>
        <div>
          <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Schedule</h1>
          <div style={{ fontSize: _.fontSize.md, color: _.muted }}>
            {metrics.completedCount} of {metrics.totalCount} milestones · {metrics.percentComplete}%
            {metrics.estimatedFinish && <span> · Est. finish: {metrics.estimatedFinish}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: _.s2, flexWrap: "wrap" }}>
          <Button variant="secondary" size="sm" icon={Printer} onClick={printSchedule}>Print</Button>
          <Button variant="secondary" size="sm" icon={Share2} onClick={() => setShareModal(true)}>Share</Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={["List", "Gantt", "Client"]} active={tab} onChange={setTab} style={{ marginBottom: _.s5 }} />

      {/* Controls bar (List + Gantt only) */}
      {tab !== "Client" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: _.s5, paddingBottom: _.s4, borderBottom: `1px solid ${_.line}`, flexWrap: "wrap", gap: _.s4 }}>
          <div>
            <div style={{ fontSize: _.fontSize.caption, color: _.body, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: 8 }}>Build Progress</div>
            <div style={{ fontSize: _.fontSize.stat, fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: _.ink }}>
              {metrics.percentComplete}<span style={{ fontSize: _.fontSize.unit, color: _.muted }}>%</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: _.s3, alignItems: "flex-end" }}>
            {/* Start date + regenerate */}
            <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
              <Calendar size={13} color={_.muted} />
              <span style={{ fontSize: _.fontSize.sm, color: _.muted }}>Start date</span>
              <input type="date" value={startDate} onChange={e => { up(pr => { pr.startDate = e.target.value; return pr; }); }}
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

      {/* ═══ LIST VIEW ═══ */}
      {tab === "List" && (
        <>
          {/* Column headers */}
          {!mobile ? (
            <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 70px 110px 110px 120px 90px 60px 130px 72px", gap: 6, padding: "6px 0", borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
              <span></span><span>Milestone</span><span style={{ textAlign: "center" }}>Dur.</span><span>Start</span><span>Finish</span><span>Trade</span><span>Status</span><span style={{ textAlign: "center" }}>%</span><span>Depends On</span><span></span>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "28px 1fr auto 72px", gap: 6, padding: "6px 0", borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
              <span></span><span>Milestone</span><span>Status</span><span></span>
            </div>
          )}

          {/* Rows */}
          {computed.map((ms, i) => {
            const isNext = i === computed.findIndex(m => m.status ? m.status !== "complete" : !m.done) && (ms.status ? ms.status !== "complete" : !ms.done);
            const isEditing = editMsIdx === i;
            const overdue = ms.status !== "complete" && ms.plannedFinish && ms.plannedFinish < new Date().toISOString().split("T")[0];
            const statusOpt = STATUS_OPTS.find(s => s.value === ms.status) || STATUS_OPTS[0];

            return (
              <div key={ms.id || i}
                draggable={!isEditing && !mobile}
                onDragStart={e => { setDragMs(i); e.dataTransfer.effectAllowed = "move"; e.currentTarget.style.opacity = "0.4"; }}
                onDragEnd={e => {
                  e.currentTarget.style.opacity = "1";
                  if (dragMs !== null && dragOverMs !== null && dragMs !== dragOverMs) {
                    up(pr => { const arr = pr.schedule; const item = arr.splice(dragMs, 1)[0]; arr.splice(dragOverMs, 0, item); arr.forEach((m, j) => m.order = j); return pr; });
                  }
                  setDragMs(null); setDragOverMs(null);
                }}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverMs(i); }}
                onDragEnter={e => e.preventDefault()}
                style={!mobile ? {
                  display: "grid", gridTemplateColumns: "28px 1fr 70px 110px 110px 120px 90px 60px 130px 72px", gap: 6, padding: "8px 0",
                  borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: _.fontSize.base,
                  background: dragOverMs === i && dragMs !== null && dragMs !== i ? `${_.ac}08` : isNext ? `${_.ac}06` : "transparent",
                  cursor: isEditing ? "default" : "grab", transition: `background ${_.tr}`,
                } : {
                  display: "grid", gridTemplateColumns: "28px 1fr auto 72px", gap: 6, padding: "8px 0",
                  borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: _.fontSize.base,
                  background: isNext ? `${_.ac}06` : "transparent",
                }}
              >
                {/* Status toggle */}
                <div onClick={() => {
                  const next = ms.status === "not_started" ? "in_progress" : ms.status === "in_progress" ? "complete" : "not_started";
                  setMsStatus(i, next);
                }} style={{
                  width: 18, height: 18, borderRadius: 9,
                  border: ms.status === "complete" ? "none" : `1.5px solid ${ms.status === "in_progress" ? _.ac : isNext ? _.ac : _.line2}`,
                  background: ms.status === "complete" ? _.green : ms.status === "in_progress" ? `${_.ac}20` : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}>
                  {ms.status === "complete" && <Check size={10} strokeWidth={3} color="#fff" />}
                  {ms.status === "in_progress" && <div style={{ width: 8, height: 8, borderRadius: 4, background: _.ac }} />}
                </div>

                {/* Name */}
                {isEditing ? (
                  <input autoFocus style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium, color: _.ink, border: "none", borderBottom: `1px solid ${_.ac}`, outline: "none", padding: "2px 0", background: "transparent", fontFamily: "inherit" }}
                    value={editMsName} onChange={e => setEditMsName(e.target.value)}
                    onBlur={() => { if (editMsName.trim()) updateMs(i, { name: editMsName.trim() }); setEditMsIdx(null); }}
                    onKeyDown={e => { if (e.key === "Enter") { if (editMsName.trim()) updateMs(i, { name: editMsName.trim() }); setEditMsIdx(null); } if (e.key === "Escape") setEditMsIdx(null); }} />
                ) : (
                  <div onClick={() => { setEditMsIdx(i); setEditMsName(ms.name); }} style={{ cursor: "text", display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <span style={{
                      fontWeight: ms.status === "complete" ? _.fontWeight.medium : isNext ? _.fontWeight.semi : _.fontWeight.normal,
                      color: ms.status === "complete" ? _.muted : overdue ? _.red : _.ink,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{ms.name}</span>
                    {isNext && <span style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.ac, flexShrink: 0 }}>NEXT</span>}
                  </div>
                )}

                {!mobile && (
                  <>
                    {/* Duration */}
                    <input type="number" min="1" style={{ width: 54, padding: "3px 4px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.sm, textAlign: "center", outline: "none", fontWeight: _.fontWeight.semi, fontFamily: "inherit" }}
                      value={ms.durationDays || ""} onChange={e => setMsDuration(i, Math.max(1, parseInt(e.target.value) || 1))} />

                    {/* Start date */}
                    <input type="date" value={ms.plannedStart || ""} onChange={e => setMsStartDate(i, e.target.value)}
                      style={{ padding: "3px 4px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: overdue ? _.red : _.ink, fontSize: _.fontSize.caption, outline: "none", cursor: "pointer", fontFamily: "inherit" }} />

                    {/* Finish date */}
                    <input type="date" value={ms.plannedFinish || ""} onChange={e => setMsFinishDate(i, e.target.value)}
                      style={{ padding: "3px 4px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: overdue ? _.red : _.ink, fontSize: _.fontSize.caption, outline: "none", cursor: "pointer", fontFamily: "inherit" }} />

                    {/* Trade */}
                    <select value={ms.tradeId || ""} onChange={e => updateMs(i, { tradeId: e.target.value || null })}
                      style={{ padding: "3px 4px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.caption, outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      <option value="">—</option>
                      {projectTrades.map(t => <option key={t.id} value={t.id}>{t.businessName}</option>)}
                    </select>

                    {/* Status dropdown */}
                    <select value={ms.status || "not_started"} onChange={e => setMsStatus(i, e.target.value)}
                      style={{ padding: "3px 4px", background: `${statusOpt.color}14`, border: `1px solid ${statusOpt.color}30`, borderRadius: _.rXs, color: statusOpt.color, fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>

                    {/* % Complete */}
                    <input type="number" min="0" max="100" style={{ width: 48, padding: "3px 4px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.sm, textAlign: "center", outline: "none", fontWeight: _.fontWeight.semi, fontFamily: "inherit" }}
                      value={ms.percentComplete || 0} onChange={e => setMsPercent(i, parseInt(e.target.value) || 0)} />

                    {/* Depends On */}
                    <div onClick={() => setDepsModal(i)} style={{
                      padding: "3px 6px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs,
                      fontSize: _.fontSize.caption, color: (ms.dependsOn || []).length > 0 ? _.ac : _.faint, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4, overflow: "hidden", whiteSpace: "nowrap",
                    }}>
                      <Link2 size={10} />
                      {(ms.dependsOn || []).length > 0
                        ? (ms.dependsOn || []).map(dId => milestones.find(m => m.id === dId)?.name || "?").join(", ")
                        : "None"
                      }
                    </div>
                  </>
                )}

                {/* Mobile: status badge + % bar */}
                {mobile && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                    <span style={badge(statusOpt.color)}>{statusOpt.label}</span>
                    {ms.percentComplete > 0 && ms.percentComplete < 100 && (
                      <div style={{ width: 48, height: 4, background: _.well, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${ms.percentComplete}%`, background: _.ac, borderRadius: 2 }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {!mobile && i > 0 && <div onClick={() => up(pr => { const arr = pr.schedule; const tmp = arr[i]; arr[i] = arr[i - 1]; arr[i - 1] = tmp; arr.forEach((m, j) => m.order = j); return pr; })} style={{ cursor: "pointer", color: _.faint, padding: 2, display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = _.ink} onMouseLeave={e => e.currentTarget.style.color = _.faint}><ChevronRight size={12} style={{ transform: "rotate(-90deg)" }} /></div>}
                  {!mobile && i < milestones.length - 1 && <div onClick={() => up(pr => { const arr = pr.schedule; const tmp = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = tmp; arr.forEach((m, j) => m.order = j); return pr; })} style={{ cursor: "pointer", color: _.faint, padding: 2, display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = _.ink} onMouseLeave={e => e.currentTarget.style.color = _.faint}><ChevronRight size={12} style={{ transform: "rotate(90deg)" }} /></div>}
                  <div onClick={() => { if (milestones.length <= 1) return; up(pr => { pr.schedule.splice(i, 1); pr.schedule.forEach((m, j) => m.order = j); return pr; }); notify("Removed"); }} style={{ cursor: "pointer", color: _.faint, padding: 2, display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={12} /></div>
                </div>
              </div>
            );
          })}

          {/* Add milestone */}
          <div style={{ display: "flex", gap: _.s2, marginTop: _.s4, paddingTop: _.s4, borderTop: `1px solid ${_.line}` }}>
            <input style={{ ...input, flex: 1 }} placeholder="Add milestone…" value={newMs} onChange={e => setNewMs(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { addMilestone(newMs); setNewMs(""); } }} />
            <Button onClick={() => { addMilestone(newMs); setNewMs(""); }}>Add</Button>
          </div>
        </>
      )}

      {/* ═══ GANTT VIEW ═══ */}
      {tab === "Gantt" && (
        <GanttChart
          milestones={computed}
          startDate={startDate}
          readOnly={false}
          mobile={mobile}
          onShift={handleGanttShift}
          onResize={handleGanttResize}
          onSelect={(idx) => { setTab("List"); setEditMsIdx(idx); setEditMsName(computed[idx].name); }}
        />
      )}

      {/* ═══ CLIENT VIEW ═══ */}
      {tab === "Client" && (
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: _.s8, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
            <div style={{ fontSize: _.fontSize.lg, color: _.muted, fontWeight: _.fontWeight.medium, marginBottom: _.s2 }}>{pName(p, clients)}</div>
            <div style={{ fontSize: _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, color: _.ink, marginBottom: _.s3 }}>
              {metrics.percentComplete}%
            </div>
            <div style={{ fontSize: _.fontSize.md, color: _.muted }}>
              {metrics.completedCount} of {metrics.totalCount} milestones complete
              {metrics.estimatedFinish && <span> · Estimated finish: {metrics.estimatedFinish}</span>}
            </div>
            {/* Overall progress bar */}
            <div style={{ maxWidth: 400, margin: `${_.s4}px auto 0`, height: 8, background: _.well, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${metrics.percentComplete}%`, background: _.green, borderRadius: 4, transition: "width 0.6s ease" }} />
            </div>
          </div>

          {/* Vertical timeline */}
          {computed.map((ms, i) => {
            const statusColor = ms.status === "complete" ? _.green : ms.status === "in_progress" ? _.ac : _.line2;
            const statusLabel = ms.status === "complete" ? "Complete" : ms.status === "in_progress" ? "In Progress" : "Pending";
            return (
              <div key={ms.id || i} style={{ display: "flex", gap: _.s4, marginBottom: 0 }}>
                {/* Timeline connector */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: 6, background: statusColor,
                    border: ms.status === "not_started" ? `2px solid ${_.line2}` : "none",
                    flexShrink: 0,
                  }} />
                  {i < computed.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: ms.status === "complete" ? _.green : _.line, minHeight: 40 }} />
                  )}
                </div>

                {/* Card */}
                <div style={{
                  flex: 1, padding: _.s4, marginBottom: _.s3,
                  background: _.surface, border: `1px solid ${_.line}`, borderRadius: _.r,
                  boxShadow: ms.status === "in_progress" ? _.sh2 : _.sh1,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s2 }}>
                    <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>{ms.name}</span>
                    <span style={badge(statusColor)}>{statusLabel}</span>
                  </div>
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>
                    {ms.plannedStart && ms.plannedFinish
                      ? `${ms.plannedStart} → ${ms.plannedFinish}`
                      : ms.planned ? `Planned: ${ms.planned}` : `Week ${ms.wk || 0}`
                    }
                    {ms.durationDays && <span> · {ms.durationDays} days</span>}
                  </div>
                  {/* Progress bar for in-progress */}
                  {ms.status === "in_progress" && ms.percentComplete > 0 && (
                    <div style={{ marginTop: _.s2, height: 6, background: _.well, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${ms.percentComplete}%`, background: _.ac, borderRadius: 3, transition: "width 0.4s ease" }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: _.s8, paddingTop: _.s5, borderTop: `1px solid ${_.line}`, fontSize: _.fontSize.sm, color: _.faint }}>
            <div>{settings?.companyName || "iBuild"}{settings?.address ? ` · ${settings.address}` : ""}</div>
            <div style={{ marginTop: _.s1 }}>Generated {ds()} · Powered by iBuild</div>
          </div>
        </div>
      )}

      {/* ─── Dependencies Modal ─── */}
      <Modal open={depsModal !== null} onClose={() => setDepsModal(null)} title="Dependencies" width={400}>
        {depsModal !== null && (() => {
          const ms = milestones[depsModal];
          if (!ms) return null;
          const currentDeps = ms.dependsOn || [];
          // Only show milestones that come before this one
          const preceding = milestones.filter((m, j) => j < depsModal && m.id);
          return (
            <>
              <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginBottom: _.s4 }}>
                Select milestones that must complete before <strong>{ms.name}</strong> can start.
              </div>
              {preceding.length === 0 ? (
                <div style={{ fontSize: _.fontSize.base, color: _.faint, padding: `${_.s3}px 0` }}>No preceding milestones available.</div>
              ) : preceding.map(pm => {
                const isSelected = currentDeps.includes(pm.id);
                return (
                  <div key={pm.id} onClick={() => {
                    const newDeps = isSelected ? currentDeps.filter(d => d !== pm.id) : [...currentDeps, pm.id];
                    setMsDeps(depsModal, newDeps);
                  }} style={{
                    display: "flex", alignItems: "center", gap: _.s3, padding: `${_.s3}px ${_.s2}px`,
                    cursor: "pointer", borderRadius: _.rSm, transition: `background ${_.tr}`,
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = _.well}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: _.rXs, border: `1.5px solid ${isSelected ? _.ac : _.line2}`,
                      background: isSelected ? _.ac : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isSelected && <Check size={11} strokeWidth={3} color="#fff" />}
                    </div>
                    <span style={{ fontSize: _.fontSize.base, color: _.ink }}>{pm.name}</span>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: _.s5 }}>
                <Button variant="ghost" onClick={() => setDepsModal(null)}>Done</Button>
              </div>
            </>
          );
        })()}
      </Modal>

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
            This link opens the schedule in a clean client-facing view.
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${_.line}`, paddingTop: _.s4, marginBottom: _.s4 }}>
          <div style={{ fontSize: _.fontSize.sm, color: _.muted, fontWeight: _.fontWeight.semi, marginBottom: _.s2, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>Print / Download</div>
          <div style={{ fontSize: _.fontSize.base, color: _.body, marginBottom: _.s3 }}>
            Switch to Client view and use your browser's print dialog to save as PDF.
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
