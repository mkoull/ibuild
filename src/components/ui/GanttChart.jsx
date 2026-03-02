import { useRef, useState, useCallback, useMemo } from "react";
import _ from "../../theme/tokens.js";
import { daysBetween } from "../../lib/scheduleEngine.js";

const ZOOM_PRESETS = {
  day:   { weekPx: 154, label: "Day" },
  week:  { weekPx: 44,  label: "Week" },
  month: { weekPx: 11,  label: "Month" },
};
const DEFAULT_ZOOM = "week";
const WEEK_PX_MOBILE = 26;
const ROW_H = 38;
const LABEL_W = 200;
const LABEL_W_MOBILE = 130;
const BAR_H = 24;
const HANDLE_W = 8;

const STATUS_BG = {
  not_started: _.well,
  in_progress: _.ac,
  complete: _.green,
};

function isOverdue(m) {
  if (m.status === "complete") return false;
  if (!m.plannedFinish) return false;
  return m.plannedFinish < new Date().toISOString().split("T")[0];
}

export default function GanttChart({ milestones, startDate, readOnly, mobile, onShift, onResize, onSelect, conflicts }) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [showDeps, setShowDeps] = useState(true);
  const weekPx = mobile ? WEEK_PX_MOBILE : ZOOM_PRESETS[zoom].weekPx;
  const labelW = mobile ? LABEL_W_MOBILE : LABEL_W;
  const scrollRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const maxOffset = useMemo(() => {
    let max = 0;
    milestones.forEach(m => {
      const end = (m.offsetDays || 0) + (m.durationDays || 7);
      if (end > max) max = end;
    });
    return Math.ceil(max / 7) + 6;
  }, [milestones]);

  const totalWeeks = Math.max(maxOffset, 40);
  const timelineW = totalWeeks * weekPx;

  const todayOffset = useMemo(() => {
    if (!startDate) return -1;
    const days = daysBetween(startDate, new Date().toISOString().split("T")[0]);
    return days >= 0 ? (days / 7) * weekPx : -1;
  }, [startDate, weekPx]);

  const currentWeek = useMemo(() => {
    if (!startDate) return -1;
    const days = daysBetween(startDate, new Date().toISOString().split("T")[0]);
    return days >= 0 ? Math.floor(days / 7) : -1;
  }, [startDate]);

  // Index milestones by ID for dep line drawing
  const idxById = useMemo(() => {
    const map = {};
    milestones.forEach((m, i) => { map[m.id] = i; });
    return map;
  }, [milestones]);

  // Conflict set for highlighting
  const conflictSet = useMemo(() => {
    const s = new Set();
    (conflicts || []).forEach(c => { s.add(c.taskId); });
    return s;
  }, [conflicts]);

  // Drag handlers
  const handleMouseDown = useCallback((e, idx, type) => {
    if (readOnly || mobile) return;
    e.preventDefault();
    e.stopPropagation();
    const m = milestones[idx];
    setDragging({ idx, type, startX: e.clientX, origOffset: m.offsetDays || 0, origDuration: m.durationDays || 7 });
  }, [readOnly, mobile, milestones]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const deltaDays = Math.round(dx / (weekPx / 7));
    if (dragging.type === "move" && onShift) {
      onShift(dragging.idx, Math.max(0, dragging.origOffset + deltaDays));
    } else if (dragging.type === "resize" && onResize) {
      onResize(dragging.idx, Math.max(1, dragging.origDuration + deltaDays));
    }
  }, [dragging, weekPx, onShift, onResize]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  // Compute dependency lines (SVG)
  const depLines = useMemo(() => {
    const lines = [];
    milestones.forEach((m, toIdx) => {
      if (!m.dependsOn) return;
      m.dependsOn.forEach(depId => {
        const fromIdx = idxById[depId];
        if (fromIdx === undefined) return;
        const from = milestones[fromIdx];
        const fromRight = ((from.offsetDays || 0) + (from.durationDays || 7)) / 7 * weekPx;
        const fromY = ROW_H + fromIdx * ROW_H + ROW_H / 2;
        const toLeft = ((m.offsetDays || 0) / 7) * weekPx;
        const toY = ROW_H + toIdx * ROW_H + ROW_H / 2;
        lines.push({ fromRight, fromY, toLeft, toY, conflict: conflictSet.has(m.id) });
      });
    });
    return lines;
  }, [milestones, idxById, weekPx, conflictSet]);

  // Week header label helper
  const weekLabel = useCallback((w) => {
    if (zoom === "month") {
      // Show month name at month boundaries
      if (!startDate) return w % 4 === 0 ? `W${w}` : "";
      const d = new Date(startDate + "T00:00:00");
      d.setDate(d.getDate() + w * 7);
      const prevD = new Date(startDate + "T00:00:00");
      prevD.setDate(prevD.getDate() + (w - 1) * 7);
      if (w === 0 || d.getMonth() !== prevD.getMonth()) {
        return d.toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
      }
      return "";
    }
    if (zoom === "day") {
      if (!startDate) return `W${w}`;
      const d = new Date(startDate + "T00:00:00");
      d.setDate(d.getDate() + w * 7);
      return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
    }
    // week zoom
    return w % (mobile ? 4 : 2) === 0 ? `W${w}` : "";
  }, [zoom, startDate, mobile]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: _.s2 }}>
      {/* ── Gantt toolbar ── */}
      {!mobile && (
        <div className="schedule-print-hide" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: `${_.s2}px 0`,
        }}>
          {/* Zoom */}
          <div style={{ display: "flex", alignItems: "center", gap: _.s1 }}>
            <span style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginRight: _.s1 }}>Zoom</span>
            {Object.entries(ZOOM_PRESETS).map(([key, preset]) => (
              <div key={key} onClick={() => setZoom(key)} style={{
                padding: `3px ${_.s2}px`, borderRadius: _.rXs, cursor: "pointer",
                fontSize: _.fontSize.sm, fontWeight: zoom === key ? _.fontWeight.semi : _.fontWeight.normal,
                background: zoom === key ? `${_.ac}14` : "transparent",
                color: zoom === key ? _.ac : _.muted,
                border: `1px solid ${zoom === key ? `${_.ac}30` : "transparent"}`,
                transition: `all ${_.tr}`,
              }}>
                {preset.label}
              </div>
            ))}
          </div>
          {/* Dep lines toggle */}
          <div onClick={() => setShowDeps(v => !v)} style={{
            display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none",
          }}>
            <span style={{ fontSize: _.fontSize.sm, color: showDeps ? _.ac : _.muted, fontWeight: showDeps ? _.fontWeight.semi : _.fontWeight.normal }}>
              Dep lines
            </span>
            <div style={{ width: 28, height: 16, borderRadius: 8, background: showDeps ? _.ac : _.line2, transition: `background ${_.tr}`, position: "relative" }}>
              <div style={{ position: "absolute", top: 2, left: showDeps ? 14 : 2, width: 12, height: 12, borderRadius: 6, background: "#fff", transition: `left ${_.tr}`, boxShadow: _.sh1 }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Gantt chart ── */}
      <div
        className="gantt-print-container"
        style={{ display: "flex", border: `1px solid ${_.line}`, borderRadius: _.r, overflow: "hidden", background: _.surface }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
      {/* Fixed label column */}
      <div style={{ width: labelW, flexShrink: 0, borderRight: `1px solid ${_.line}`, background: _.bg }}>
        <div style={{
          height: ROW_H, display: "flex", alignItems: "center", padding: `0 ${_.s3}px`,
          borderBottom: `2px solid ${_.line}`, fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi,
          color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
        }}>
          Milestone
        </div>
        {milestones.map((m, i) => (
          <div key={m.id || i} onClick={() => onSelect && onSelect(i)} title={m.name} style={{
            height: ROW_H, display: "flex", alignItems: "center", padding: `0 ${_.s3}px`,
            borderBottom: `1px solid ${_.line}`, cursor: onSelect ? "pointer" : "default",
            fontSize: _.fontSize.sm, color: _.ink, fontWeight: _.fontWeight.medium,
            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
            transition: `background ${_.tr}`,
          }}
            onMouseEnter={e => e.currentTarget.style.background = _.well}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{
              width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginRight: 8,
              background: m.status === "complete" ? _.green : m.status === "in_progress" ? _.ac : _.line2,
            }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</span>
            {m.manuallyPinned && <span style={{ marginLeft: 4, fontSize: 9, color: _.amber }} title="Pinned">📌</span>}
          </div>
        ))}
      </div>

      {/* Scrollable timeline */}
      <div ref={scrollRef} style={{ flex: 1, overflowX: "auto", overflowY: "hidden" }}>
        <div style={{ width: timelineW, position: "relative" }}>
          {/* Week headers */}
          <div style={{ height: ROW_H, display: "flex", borderBottom: `2px solid ${_.line}` }}>
            {Array.from({ length: totalWeeks }, (_, w) => {
              const lbl = weekLabel(w);
              return (
                <div key={w} style={{
                  width: weekPx, height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: _.fontSize.xs, color: _.faint, borderRight: `1px solid ${_.line}08`,
                  background: w === currentWeek ? `${_.ac}08` : "transparent",
                  overflow: "hidden", whiteSpace: "nowrap",
                }}>
                  {lbl}
                </div>
              );
            })}
          </div>

          {/* Bars */}
          {milestones.map((m, i) => {
            const left = ((m.offsetDays || 0) / 7) * weekPx;
            const width = Math.max(weekPx * 0.5, ((m.durationDays || 7) / 7) * weekPx);
            const bg = STATUS_BG[m.status] || _.well;
            const overdue = isOverdue(m);
            const pctFill = m.percentComplete || 0;
            const hasConflict = conflictSet.has(m.id);

            return (
              <div key={m.id || i} style={{ height: ROW_H, position: "relative", borderBottom: `1px solid ${_.line}` }}>
                {currentWeek >= 0 && (
                  <div style={{ position: "absolute", left: currentWeek * weekPx, top: 0, bottom: 0, width: weekPx, background: `${_.ac}05`, pointerEvents: "none" }} />
                )}
                <div
                  onMouseDown={e => handleMouseDown(e, i, "move")}
                  title={`${m.name}\n${m.plannedStart || "?"} → ${m.plannedFinish || "?"}\n${m.durationDays || 7}d`}
                  style={{
                    position: "absolute", left, top: (ROW_H - BAR_H) / 2, width, height: BAR_H,
                    background: bg, borderRadius: _.rXs,
                    border: hasConflict ? `2px solid ${_.amber}` : overdue ? `1.5px solid ${_.red}` : `1px solid ${m.status === "not_started" ? _.line2 : "transparent"}`,
                    cursor: readOnly || mobile ? "default" : "grab",
                    overflow: "hidden", transition: dragging ? "none" : `all ${_.tr}`,
                    display: "flex", alignItems: "center",
                  }}
                >
                  {pctFill > 0 && pctFill < 100 && (
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pctFill}%`, background: m.status === "in_progress" ? _.acDark : `${_.green}40`, borderRadius: _.rXs }} />
                  )}
                  {width > 60 && (
                    <span style={{ position: "relative", zIndex: 1, padding: `0 ${_.s2}px`, fontSize: _.fontSize.xs, fontWeight: _.fontWeight.medium, color: m.status === "in_progress" || m.status === "complete" ? "#fff" : _.body, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {m.name}
                    </span>
                  )}
                  {!readOnly && !mobile && (
                    <div onMouseDown={e => handleMouseDown(e, i, "resize")} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: HANDLE_W, cursor: "ew-resize" }} />
                  )}
                </div>
              </div>
            );
          })}

          {/* Dependency lines (SVG overlay) */}
          {showDeps && depLines.length > 0 && (
            <svg style={{ position: "absolute", top: 0, left: 0, width: timelineW, height: ROW_H + milestones.length * ROW_H, pointerEvents: "none", overflow: "visible" }}>
              <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                  <polygon points="0 0, 6 2, 0 4" fill={_.muted} />
                </marker>
                <marker id="arrowhead-warn" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                  <polygon points="0 0, 6 2, 0 4" fill={_.amber} />
                </marker>
              </defs>
              {depLines.map((l, i) => {
                const midX = l.fromRight + (l.toLeft - l.fromRight) / 2;
                return (
                  <path key={i}
                    d={`M${l.fromRight},${l.fromY} C${midX},${l.fromY} ${midX},${l.toY} ${l.toLeft},${l.toY}`}
                    fill="none"
                    stroke={l.conflict ? _.amber : _.muted}
                    strokeWidth={l.conflict ? 1.5 : 1}
                    strokeDasharray={l.conflict ? "4,3" : "none"}
                    opacity={0.5}
                    markerEnd={l.conflict ? "url(#arrowhead-warn)" : "url(#arrowhead)"}
                  />
                );
              })}
            </svg>
          )}

          {/* Today line */}
          {todayOffset >= 0 && (
            <div style={{ position: "absolute", left: todayOffset, top: ROW_H, bottom: 0, width: 2, background: _.red, pointerEvents: "none", zIndex: 10, opacity: 0.7 }}>
              <div style={{ position: "absolute", top: -ROW_H, left: -14, width: 30, height: 16, borderRadius: _.rXs, background: _.red, color: "#fff", fontSize: 9, fontWeight: _.fontWeight.bold, display: "flex", alignItems: "center", justifyContent: "center" }}>
                Today
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
