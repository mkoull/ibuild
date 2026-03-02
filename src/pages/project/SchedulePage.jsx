import { useState, useMemo, useCallback, useEffect } from "react";
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
  calculateSchedule, shiftProject, cascadeDependents, syncLegacyFields,
  updateMilestoneStatus, getScheduleMetrics, addDays, daysBetween,
  hasCircularDep, getDependencyConflicts, regenerateSchedule,
} from "../../lib/scheduleEngine.js";
import {
  Check, ChevronRight, X, Printer, Share2, RefreshCw, Copy,
  Calendar, Link2, AlertTriangle, Pin,
} from "lucide-react";

const STATUS_OPTS = [
  { value: "not_started", label: "Not Started", color: _.muted },
  { value: "in_progress", label: "In Progress", color: _.ac },
  { value: "complete", label: "Complete", color: _.green },
];

// ── Resizable column widths (localStorage persisted) ─────────────────────────

const COL_KEY = "ib_schedule_cols";
const DEFAULT_COLS = { name: 180, dur: 60, start: 120, finish: 120, trade: 140, status: 100, pct: 56, deps: 140, actions: 72 };

function loadColWidths() {
  try { const s = localStorage.getItem(COL_KEY); return s ? { ...DEFAULT_COLS, ...JSON.parse(s) } : { ...DEFAULT_COLS }; }
  catch { return { ...DEFAULT_COLS }; }
}

function saveColWidths(w) {
  try { localStorage.setItem(COL_KEY, JSON.stringify(w)); } catch {}
}

// ── Print CSS (injected once) ────────────────────────────────────────────────

const PRINT_CSS_ID = "ib-schedule-print-css";
function ensurePrintCSS() {
  if (document.getElementById(PRINT_CSS_ID)) return;
  const style = document.createElement("style");
  style.id = PRINT_CSS_ID;
  style.textContent = `
    @media print {
      body > *:not(#root) { display: none !important; }
      nav, [data-sidebar], [data-toast] { display: none !important; }
      .schedule-print-hide { display: none !important; }
      .gantt-print-container { break-inside: avoid; }
      .client-timeline-card { break-inside: avoid; }
      @page { size: A4 landscape; margin: 10mm; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
    }
  `;
  document.head.appendChild(style);
}

export default function SchedulePage() {
  const { project: p, update: up, log } = useProject();
  const { clients, trades: globalTrades, tradesHook, mobile, notify, settings } = useApp();
  const [searchParams] = useSearchParams();
  const milestones = p.schedule || [];

  const [tab, setTab] = useState(searchParams.get("view") === "client" ? "Client" : "List");
  const [newMs, setNewMs] = useState("");
  const [editMsIdx, setEditMsIdx] = useState(null);
  const [editMsName, setEditMsName] = useState("");
  const [shiftVal, setShiftVal] = useState("");
  const [shiftUnit, setShiftUnit] = useState("weeks");
  const [shareModal, setShareModal] = useState(false);
  const [regenModal, setRegenModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [depsModal, setDepsModal] = useState(null);
  const [dragMs, setDragMs] = useState(null);
  const [dragOverMs, setDragOverMs] = useState(null);
  const [tradePrompt, setTradePrompt] = useState(null); // { idx, name }
  const [colWidths, setColWidths] = useState(loadColWidths);
  const [resizing, setResizing] = useState(null); // { col, startX, startW }

  const startDate = p.startDate || "";
  const autoCascade = p.autoCascade || false;

  useEffect(() => { ensurePrintCSS(); }, []);

  // Computed schedule
  const computed = useMemo(
    () => startDate ? calculateSchedule(milestones, startDate) : milestones.map(m => syncLegacyFields(m)),
    [milestones, startDate],
  );

  const metrics = useMemo(() => getScheduleMetrics(computed), [computed]);
  const conflicts = useMemo(() => getDependencyConflicts(computed), [computed]);

  // All trades (global directory)
  const allTrades = globalTrades || [];

  // ── Column resize handlers ──

  const handleResizeStart = useCallback((e, col) => {
    e.preventDefault();
    setResizing({ col, startX: e.clientX, startW: colWidths[col] });
  }, [colWidths]);

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e) => {
      const delta = e.clientX - resizing.startX;
      const newW = Math.max(40, resizing.startW + delta);
      setColWidths(prev => {
        const next = { ...prev, [resizing.col]: newW };
        saveColWidths(next);
        return next;
      });
    };
    const onUp = () => setResizing(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [resizing]);

  const gridCols = `28px ${colWidths.name}px ${colWidths.dur}px ${colWidths.start}px ${colWidths.finish}px ${colWidths.trade}px ${colWidths.status}px ${colWidths.pct}px ${colWidths.deps}px ${colWidths.actions}px`;

  // ── Handlers ──

  const toggleAutoCascade = () => {
    up(pr => { pr.autoCascade = !pr.autoCascade; return pr; });
  };

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

  const doRegenerate = (overridePinned = false) => {
    if (!startDate) { notify("Set a project start date first", "error"); setRegenModal(false); return; }
    up(pr => {
      pr.schedule = regenerateSchedule(pr.schedule, startDate, { pinnedOverride: overridePinned });
      return pr;
    });
    log("Schedule dates regenerated from " + startDate);
    notify("Dates regenerated");
    setRegenModal(false);
  };

  // Update a single milestone field — NO cascade, just that one row
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
      if (clamped === 0 && m.status !== "not_started") pr.schedule[idx] = updateMilestoneStatus(m, "not_started");
      else if (clamped === 100 && m.status !== "complete") pr.schedule[idx] = updateMilestoneStatus(m, "complete");
      else if (clamped > 0 && clamped < 100 && m.status === "not_started") pr.schedule[idx] = updateMilestoneStatus(m, "in_progress");
      else pr.schedule[idx] = syncLegacyFields(m);
      if (startDate) pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
  };

  // Duration change — only cascades if autoCascade ON and task has dependents
  const setMsDuration = (idx, newDur) => {
    up(pr => {
      const m = pr.schedule[idx];
      const oldDur = m.durationDays || 7;
      const delta = newDur - oldDur;
      m.durationDays = newDur;
      pr.schedule[idx] = syncLegacyFields(m);

      if (autoCascade && delta !== 0) {
        pr.schedule = cascadeDependents(pr.schedule, m.id, delta, startDate);
      } else if (startDate) {
        pr.schedule = calculateSchedule(pr.schedule, startDate);
      }
      return pr;
    });
  };

  // Start date change — ONLY updates this one task. No global cascade.
  const setMsStartDate = (idx, newDate) => {
    up(pr => {
      const m = pr.schedule[idx];
      if (startDate) {
        const newOffset = Math.max(0, daysBetween(startDate, newDate));
        const oldOffset = m.offsetDays || 0;
        const delta = newOffset - oldOffset;
        m.offsetDays = newOffset;
        m.manuallyPinned = true; // User explicitly set this date

        if (autoCascade && delta !== 0) {
          pr.schedule[idx] = syncLegacyFields(m);
          pr.schedule = cascadeDependents(pr.schedule, m.id, delta, startDate);
        } else {
          pr.schedule[idx] = syncLegacyFields(m);
          pr.schedule = calculateSchedule(pr.schedule, startDate);
        }
      } else {
        // No project start date — store as plannedStart directly
        m.plannedStart = newDate;
        m.plannedFinish = addDays(newDate, m.durationDays || 7);
        pr.schedule[idx] = syncLegacyFields(m);
      }
      return pr;
    });
  };

  // Finish date change — recomputes duration
  const setMsFinishDate = (idx, newDate) => {
    up(pr => {
      const m = pr.schedule[idx];
      const pStart = m.plannedStart || (startDate ? addDays(startDate, m.offsetDays || 0) : "");
      if (!pStart) return pr;
      const newDur = Math.max(1, daysBetween(pStart, newDate));
      const delta = newDur - (m.durationDays || 7);
      m.durationDays = newDur;
      pr.schedule[idx] = syncLegacyFields(m);

      if (autoCascade && delta !== 0) {
        pr.schedule = cascadeDependents(pr.schedule, m.id, delta, startDate);
      } else if (startDate) {
        pr.schedule = calculateSchedule(pr.schedule, startDate);
      }
      return pr;
    });
  };

  const setMsDeps = (idx, depIds) => {
    // Check for circular deps before applying
    if (hasCircularDep(milestones, milestones[idx].id, depIds)) {
      notify("Circular dependency detected — cannot add this link", "error");
      return;
    }
    up(pr => {
      pr.schedule[idx].dependsOn = depIds;
      if (startDate) pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
  };

  const togglePin = (idx) => {
    up(pr => {
      pr.schedule[idx].manuallyPinned = !pr.schedule[idx].manuallyPinned;
      pr.schedule[idx] = syncLegacyFields(pr.schedule[idx]);
      if (startDate) pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
  };

  // ── Trade input with "add to directory" prompt ──

  const handleTradeChange = (idx, value) => {
    // Check if it's an existing trade ID
    const existingTrade = allTrades.find(t => t.id === value);
    if (existingTrade || !value) {
      updateMs(idx, { tradeId: value || null, freeTextTrade: "" });
      return;
    }
    // It's a free-text trade name typed by user
    updateMs(idx, { tradeId: null, freeTextTrade: value });
    setTradePrompt({ idx, name: value });
  };

  const confirmAddTrade = () => {
    if (!tradePrompt) return;
    if (tradesHook && tradesHook.create) {
      const newTrade = tradesHook.create({ businessName: tradePrompt.name });
      updateMs(tradePrompt.idx, { tradeId: newTrade.id, freeTextTrade: "" });
    }
    notify(`"${tradePrompt.name}" added to trade directory`);
    setTradePrompt(null);
  };

  const declineAddTrade = () => {
    // Keep as free text
    setTradePrompt(null);
  };

  const addMilestone = (name) => {
    if (!name.trim()) return;
    const maxOffset = Math.max(...milestones.map(m => (m.offsetDays || (m.wk || 0) * 7)), 0);
    up(pr => {
      const newM = syncLegacyFields({
        id: uid(), name: name.trim(), durationDays: 28,
        offsetDays: maxOffset + 28, dependsOn: [], tradeId: null, freeTextTrade: "",
        constraintMode: "finish-to-start", manuallyPinned: false,
        status: "not_started", percentComplete: 0,
        plannedStart: "", plannedFinish: "", actualStart: "", actualFinish: "",
        order: pr.schedule.length, wk: Math.round((maxOffset + 28) / 7),
        done: false, date: "", planned: "",
      });
      pr.schedule.push(newM);
      if (startDate) pr.schedule = calculateSchedule(pr.schedule, startDate);
      return pr;
    });
    log("Milestone added: " + name.trim());
    notify("Milestone added");
  };

  // Gantt handlers — update single task only
  const handleGanttShift = (idx, newOffset) => {
    up(pr => {
      pr.schedule[idx].offsetDays = newOffset;
      pr.schedule[idx].manuallyPinned = true;
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
    if (prev !== "Client") setTab("Client");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.print();
      if (prev !== "Client") setTab(prev);
    }));
  };

  const undoneCount = useMemo(() => milestones.filter(m => m.status ? m.status !== "complete" : !m.done).length, [milestones]);
  const pinnedCount = useMemo(() => milestones.filter(m => m.manuallyPinned).length, [milestones]);

  // ── Resize handle component ──
  const ResizeHandle = ({ col }) => (
    <div
      onMouseDown={e => handleResizeStart(e, col)}
      onMouseEnter={e => { e.currentTarget.firstChild.style.background = _.ac; }}
      onMouseLeave={e => { if (!resizing) e.currentTarget.firstChild.style.background = _.line2; }}
      style={{
        position: "absolute", right: -3, top: 2, bottom: 2, width: 7,
        cursor: "col-resize", zIndex: 2,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        width: 1.5, height: "60%", borderRadius: 1, background: _.line2,
        transition: `background ${_.tr}`,
      }} />
    </div>
  );

  // Helper: get trade display name for a milestone
  const tradeName = (ms) => {
    if (ms.tradeId) {
      const t = allTrades.find(tr => tr.id === ms.tradeId);
      return t ? t.businessName : "?";
    }
    return ms.freeTextTrade || "";
  };

  return (
    <Section>
      {/* Header */}
      <div className="schedule-print-hide" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s5, flexWrap: "wrap", gap: _.s3 }}>
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
      <div className="schedule-print-hide">
        <Tabs tabs={["List", "Gantt", "Client"]} active={tab} onChange={setTab} style={{ marginBottom: _.s5 }} />
      </div>

      {/* Controls bar (List + Gantt only) */}
      {tab !== "Client" && (
        <div className="schedule-print-hide" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: _.s5, paddingBottom: _.s4, borderBottom: `1px solid ${_.line}`, flexWrap: "wrap", gap: _.s4 }}>
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
            {/* Auto-cascade toggle */}
            <div onClick={toggleAutoCascade} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
              <span style={{ fontSize: _.fontSize.sm, color: autoCascade ? _.ac : _.muted, fontWeight: autoCascade ? _.fontWeight.semi : _.fontWeight.normal }}>
                Auto-cascade dependents
              </span>
              <div style={{ width: 32, height: 18, borderRadius: 9, background: autoCascade ? _.ac : _.line2, transition: `background ${_.tr}`, position: "relative" }}>
                <div style={{ position: "absolute", top: 2, left: autoCascade ? 16 : 2, width: 14, height: 14, borderRadius: 7, background: "#fff", transition: `left ${_.tr}`, boxShadow: _.sh1 }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dependency conflict warnings */}
      {tab !== "Client" && conflicts.length > 0 && (
        <div className="schedule-print-hide" style={{ padding: `${_.s3}px ${_.s4}px`, background: `${_.amber}10`, border: `1px solid ${_.amber}30`, borderRadius: _.rSm, marginBottom: _.s4, display: "flex", alignItems: "flex-start", gap: _.s2, fontSize: _.fontSize.sm, color: _.amber }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>{conflicts.length} dependency conflict{conflicts.length !== 1 ? "s" : ""}:</strong>
            {conflicts.slice(0, 3).map((c, i) => (
              <span key={i}>{i > 0 ? "," : ""} {c.taskName} starts before {c.depName} finishes</span>
            ))}
            {conflicts.length > 3 && <span> +{conflicts.length - 3} more</span>}
            {autoCascade && <span style={{ marginLeft: _.s2, color: _.body }}>(Turn on auto-cascade to resolve)</span>}
          </div>
        </div>
      )}

      {/* ═══ LIST VIEW ═══ */}
      {tab === "List" && (
        <div style={{ overflowX: "auto" }}>
          {/* Column headers with resize handles */}
          {!mobile ? (
            <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 4, padding: "6px 0", borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", minWidth: 900 }}>
              <span></span>
              <span style={{ position: "relative" }}>Milestone<ResizeHandle col="name" /></span>
              <span style={{ position: "relative", textAlign: "center" }}>Dur.<ResizeHandle col="dur" /></span>
              <span style={{ position: "relative" }}>Start<ResizeHandle col="start" /></span>
              <span style={{ position: "relative" }}>Finish<ResizeHandle col="finish" /></span>
              <span style={{ position: "relative" }}>Trade<ResizeHandle col="trade" /></span>
              <span style={{ position: "relative" }}>Status<ResizeHandle col="status" /></span>
              <span style={{ position: "relative", textAlign: "center" }}>%<ResizeHandle col="pct" /></span>
              <span style={{ position: "relative" }}>Depends On<ResizeHandle col="deps" /></span>
              <span></span>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "28px 1fr auto 60px", gap: 6, padding: "6px 0", borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
              <span></span><span>Milestone</span><span>Status</span><span></span>
            </div>
          )}

          {/* Rows */}
          {computed.map((ms, i) => {
            const isNext = i === computed.findIndex(m => m.status ? m.status !== "complete" : !m.done) && (ms.status ? ms.status !== "complete" : !ms.done);
            const isEditing = editMsIdx === i;
            const overdue = ms.status !== "complete" && ms.plannedFinish && ms.plannedFinish < new Date().toISOString().split("T")[0];
            const statusOpt = STATUS_OPTS.find(s => s.value === ms.status) || STATUS_OPTS[0];
            const hasConflict = conflicts.some(c => c.taskId === ms.id);
            const tradeDisplay = tradeName(ms);

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
                  display: "grid", gridTemplateColumns: gridCols, gap: 4, padding: "7px 0",
                  borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: _.fontSize.base,
                  background: hasConflict ? `${_.amber}08` : dragOverMs === i && dragMs !== null && dragMs !== i ? `${_.ac}08` : isNext ? `${_.ac}06` : "transparent",
                  cursor: isEditing ? "default" : "grab", transition: `background ${_.tr}`, minWidth: 900,
                } : {
                  display: "grid", gridTemplateColumns: "28px 1fr auto 60px", gap: 6, padding: "8px 0",
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

                {/* Name — full text, wraps if wide enough, tooltip always */}
                {isEditing ? (
                  <input autoFocus style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium, color: _.ink, border: "none", borderBottom: `1px solid ${_.ac}`, outline: "none", padding: "2px 0", background: "transparent", fontFamily: "inherit", width: "100%" }}
                    value={editMsName} onChange={e => setEditMsName(e.target.value)}
                    onBlur={() => { if (editMsName.trim()) updateMs(i, { name: editMsName.trim() }); setEditMsIdx(null); }}
                    onKeyDown={e => { if (e.key === "Enter") { if (editMsName.trim()) updateMs(i, { name: editMsName.trim() }); setEditMsIdx(null); } if (e.key === "Escape") setEditMsIdx(null); }} />
                ) : (
                  <div onClick={() => { setEditMsIdx(i); setEditMsName(ms.name); }} title={ms.name} style={{ cursor: "text", display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                    {ms.manuallyPinned && <Pin size={10} color={_.amber} style={{ flexShrink: 0 }} />}
                    <span style={{
                      fontWeight: ms.status === "complete" ? _.fontWeight.medium : isNext ? _.fontWeight.semi : _.fontWeight.normal,
                      color: ms.status === "complete" ? _.muted : overdue ? _.red : _.ink,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{ms.name}</span>
                    {isNext && <span style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.ac, flexShrink: 0 }}>NEXT</span>}
                    {hasConflict && <AlertTriangle size={10} color={_.amber} style={{ flexShrink: 0 }} />}
                  </div>
                )}

                {!mobile && (
                  <>
                    {/* Duration */}
                    <input type="number" min="1" style={{ width: "100%", padding: "4px 6px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.sm, textAlign: "center", outline: "none", fontWeight: _.fontWeight.semi, fontFamily: "inherit" }}
                      value={ms.durationDays || ""} onChange={e => setMsDuration(i, Math.max(1, parseInt(e.target.value) || 1))} />

                    {/* Start date */}
                    <input type="date" value={ms.plannedStart || ""} onChange={e => setMsStartDate(i, e.target.value)}
                      style={{ width: "100%", padding: "4px 4px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: overdue ? _.red : _.ink, fontSize: _.fontSize.sm, outline: "none", cursor: "pointer", fontFamily: "inherit" }} />

                    {/* Finish date */}
                    <input type="date" value={ms.plannedFinish || ""} onChange={e => setMsFinishDate(i, e.target.value)}
                      style={{ width: "100%", padding: "4px 4px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: overdue ? _.red : _.ink, fontSize: _.fontSize.sm, outline: "none", cursor: "pointer", fontFamily: "inherit" }} />

                    {/* Trade — combo: select + type */}
                    <div style={{ position: "relative" }}>
                      <input
                        list={`trades-${ms.id}`}
                        value={tradeDisplay}
                        placeholder="Type or select…"
                        onChange={e => {
                          const val = e.target.value;
                          const match = allTrades.find(t => t.businessName === val);
                          if (match) {
                            handleTradeChange(i, match.id);
                          } else {
                            updateMs(i, { tradeId: null, freeTextTrade: val });
                          }
                        }}
                        onBlur={e => {
                          const val = e.target.value.trim();
                          if (!val) { updateMs(i, { tradeId: null, freeTextTrade: "" }); return; }
                          const match = allTrades.find(t => t.businessName === val);
                          if (!match && val) {
                            setTradePrompt({ idx: i, name: val });
                          }
                        }}
                        style={{ width: "100%", padding: "4px 6px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.sm, outline: "none", fontFamily: "inherit" }}
                      />
                      <datalist id={`trades-${ms.id}`}>
                        {allTrades.map(t => <option key={t.id} value={t.businessName} />)}
                      </datalist>
                    </div>

                    {/* Status */}
                    <select value={ms.status || "not_started"} onChange={e => setMsStatus(i, e.target.value)}
                      style={{ width: "100%", padding: "4px 4px", background: `${statusOpt.color}14`, border: `1px solid ${statusOpt.color}30`, borderRadius: _.rXs, color: statusOpt.color, fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>

                    {/* % */}
                    <input type="number" min="0" max="100" style={{ width: "100%", padding: "4px 4px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.sm, textAlign: "center", outline: "none", fontWeight: _.fontWeight.semi, fontFamily: "inherit" }}
                      value={ms.percentComplete || 0} onChange={e => setMsPercent(i, parseInt(e.target.value) || 0)} />

                    {/* Depends On */}
                    <div onClick={() => setDepsModal(i)} title={(ms.dependsOn || []).map(dId => milestones.find(m => m.id === dId)?.name || "?").join(", ") || "None"} style={{
                      padding: "4px 6px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs,
                      fontSize: _.fontSize.sm, color: (ms.dependsOn || []).length > 0 ? _.ac : _.faint, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                    }}>
                      <Link2 size={10} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {(ms.dependsOn || []).length > 0
                          ? (ms.dependsOn || []).map(dId => milestones.find(m => m.id === dId)?.name || "?").join(", ")
                          : "None"
                        }
                      </span>
                    </div>
                  </>
                )}

                {/* Mobile: status badge */}
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
                  {!mobile && (
                    <div onClick={() => togglePin(i)} title={ms.manuallyPinned ? "Unpin (allow cascade)" : "Pin (prevent cascade)"} style={{ cursor: "pointer", color: ms.manuallyPinned ? _.amber : _.faint, padding: 2, display: "flex" }}
                      onMouseEnter={e => { if (!ms.manuallyPinned) e.currentTarget.style.color = _.amber; }}
                      onMouseLeave={e => { if (!ms.manuallyPinned) e.currentTarget.style.color = _.faint; }}
                    ><Pin size={11} /></div>
                  )}
                  {!mobile && i > 0 && <div onClick={() => up(pr => { const arr = pr.schedule; const tmp = arr[i]; arr[i] = arr[i - 1]; arr[i - 1] = tmp; arr.forEach((m, j) => m.order = j); return pr; })} style={{ cursor: "pointer", color: _.faint, padding: 2, display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = _.ink} onMouseLeave={e => e.currentTarget.style.color = _.faint}><ChevronRight size={11} style={{ transform: "rotate(-90deg)" }} /></div>}
                  {!mobile && i < milestones.length - 1 && <div onClick={() => up(pr => { const arr = pr.schedule; const tmp = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = tmp; arr.forEach((m, j) => m.order = j); return pr; })} style={{ cursor: "pointer", color: _.faint, padding: 2, display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = _.ink} onMouseLeave={e => e.currentTarget.style.color = _.faint}><ChevronRight size={11} style={{ transform: "rotate(90deg)" }} /></div>}
                  <div onClick={() => { if (milestones.length <= 1) return; up(pr => { pr.schedule.splice(i, 1); pr.schedule.forEach((m, j) => m.order = j); return pr; }); notify("Removed"); }} style={{ cursor: "pointer", color: _.faint, padding: 2, display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={11} /></div>
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
        </div>
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
          conflicts={conflicts}
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
            <div style={{ maxWidth: 400, margin: `${_.s4}px auto 0`, height: 8, background: _.well, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${metrics.percentComplete}%`, background: _.green, borderRadius: 4, transition: "width 0.6s ease" }} />
            </div>
          </div>

          {/* Vertical timeline */}
          {computed.map((ms, i) => {
            const statusColor = ms.status === "complete" ? _.green : ms.status === "in_progress" ? _.ac : _.line2;
            const statusLabel = ms.status === "complete" ? "Complete" : ms.status === "in_progress" ? "In Progress" : "Pending";
            return (
              <div key={ms.id || i} className="client-timeline-card" style={{ display: "flex", gap: _.s4, marginBottom: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 6, background: statusColor, border: ms.status === "not_started" ? `2px solid ${_.line2}` : "none", flexShrink: 0 }} />
                  {i < computed.length - 1 && <div style={{ width: 2, flex: 1, background: ms.status === "complete" ? _.green : _.line, minHeight: 40 }} />}
                </div>
                <div style={{ flex: 1, padding: _.s4, marginBottom: _.s3, background: _.surface, border: `1px solid ${_.line}`, borderRadius: _.r, boxShadow: ms.status === "in_progress" ? _.sh2 : _.sh1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s2 }}>
                    <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>{ms.name}</span>
                    <span style={badge(statusColor)}>{statusLabel}</span>
                  </div>
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>
                    {ms.plannedStart && ms.plannedFinish ? `${ms.plannedStart} → ${ms.plannedFinish}` : ms.planned ? `Planned: ${ms.planned}` : `Week ${ms.wk || 0}`}
                    {ms.durationDays && <span> · {ms.durationDays} days</span>}
                  </div>
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

      {/* ─── Trade Add Prompt ─── */}
      <Modal open={!!tradePrompt} onClose={declineAddTrade} title="Add Trade to Directory?" width={400}>
        {tradePrompt && (
          <>
            <div style={{ fontSize: _.fontSize.md, color: _.body, lineHeight: _.lineHeight.body, marginBottom: _.s5 }}>
              <strong>"{tradePrompt.name}"</strong> is not in your trade directory. Would you like to add it?
            </div>
            <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={declineAddTrade}>No, keep as text</Button>
              <Button onClick={confirmAddTrade}>Yes, add to directory</Button>
            </div>
          </>
        )}
      </Modal>

      {/* ─── Dependencies Modal ─── */}
      <Modal open={depsModal !== null} onClose={() => setDepsModal(null)} title="Dependencies" width={440}>
        {depsModal !== null && (() => {
          const ms = milestones[depsModal];
          if (!ms) return null;
          const currentDeps = ms.dependsOn || [];
          const others = milestones.filter((m, j) => j !== depsModal && m.id);
          return (
            <>
              <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginBottom: _.s4 }}>
                Select milestones that must complete before <strong>{ms.name}</strong> can start (finish-to-start).
              </div>
              {others.length === 0 ? (
                <div style={{ fontSize: _.fontSize.base, color: _.faint, padding: `${_.s3}px 0` }}>No other milestones available.</div>
              ) : others.map(pm => {
                const isSelected = currentDeps.includes(pm.id);
                const wouldCircle = !isSelected && hasCircularDep(milestones, ms.id, [...currentDeps, pm.id]);
                return (
                  <div key={pm.id} onClick={() => {
                    if (wouldCircle) { notify("Would create circular dependency", "error"); return; }
                    const newDeps = isSelected ? currentDeps.filter(d => d !== pm.id) : [...currentDeps, pm.id];
                    setMsDeps(depsModal, newDeps);
                  }} style={{
                    display: "flex", alignItems: "center", gap: _.s3, padding: `${_.s3}px ${_.s2}px`,
                    cursor: wouldCircle ? "not-allowed" : "pointer", borderRadius: _.rSm, transition: `background ${_.tr}`,
                    opacity: wouldCircle ? 0.5 : 1,
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
                    {wouldCircle && <span style={{ fontSize: _.fontSize.xs, color: _.red }}>circular</span>}
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
          Regenerating will update planned dates for <strong>{undoneCount} incomplete</strong> milestone{undoneCount !== 1 ? "s" : ""} based on the project start date, offsets, and dependency rules.
        </div>
        {pinnedCount > 0 && (
          <div style={{ padding: _.s3, background: `${_.amber}10`, border: `1px solid ${_.amber}30`, borderRadius: _.rSm, fontSize: _.fontSize.base, color: _.amber, marginBottom: _.s4, display: "flex", alignItems: "center", gap: _.s2 }}>
            <Pin size={14} /> {pinnedCount} pinned milestone{pinnedCount !== 1 ? "s" : ""} will keep their dates unless you override.
          </div>
        )}
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
          {pinnedCount > 0 && (
            <Button variant="secondary" onClick={() => doRegenerate(true)} disabled={!startDate}>Override pinned</Button>
          )}
          <Button onClick={() => doRegenerate(false)} disabled={!startDate} icon={RefreshCw}>Regenerate</Button>
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
            This link opens the schedule in a clean client-facing view. Future: server-based share tokens will enable external sharing.
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${_.line}`, paddingTop: _.s4, marginBottom: _.s4 }}>
          <div style={{ fontSize: _.fontSize.sm, color: _.muted, fontWeight: _.fontWeight.semi, marginBottom: _.s2, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>Print / Download</div>
          <div style={{ fontSize: _.fontSize.base, color: _.body, marginBottom: _.s3 }}>
            Print switches to the Client view and opens your browser's print dialog.
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
