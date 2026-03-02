import { useRef, useState, useCallback, useMemo } from "react";
import _ from "../../theme/tokens.js";
import { daysBetween } from "../../lib/scheduleEngine.js";

const WEEK_PX = 40;
const WEEK_PX_MOBILE = 24;
const ROW_H = 36;
const LABEL_W = 180;
const LABEL_W_MOBILE = 120;
const BAR_H = 22;
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

export default function GanttChart({ milestones, startDate, readOnly, mobile, onShift, onResize, onSelect }) {
  const weekPx = mobile ? WEEK_PX_MOBILE : WEEK_PX;
  const labelW = mobile ? LABEL_W_MOBILE : LABEL_W;
  const scrollRef = useRef(null);
  const [dragging, setDragging] = useState(null); // { idx, type: "move"|"resize", startX, origOffset, origDuration }

  // Calculate total weeks needed
  const maxOffset = useMemo(() => {
    let max = 0;
    milestones.forEach(m => {
      const end = (m.offsetDays || 0) + (m.durationDays || 7);
      if (end > max) max = end;
    });
    return Math.ceil(max / 7) + 4; // extra padding
  }, [milestones]);

  const totalWeeks = Math.max(maxOffset, 40);
  const timelineW = totalWeeks * weekPx;

  // Today position
  const todayOffset = useMemo(() => {
    if (!startDate) return -1;
    const days = daysBetween(startDate, new Date().toISOString().split("T")[0]);
    return days >= 0 ? (days / 7) * weekPx : -1;
  }, [startDate, weekPx]);

  // Current week index
  const currentWeek = useMemo(() => {
    if (!startDate) return -1;
    const days = daysBetween(startDate, new Date().toISOString().split("T")[0]);
    return days >= 0 ? Math.floor(days / 7) : -1;
  }, [startDate]);

  // ── Drag handlers (mouse events for smooth control) ──

  const handleMouseDown = useCallback((e, idx, type) => {
    if (readOnly || mobile) return;
    e.preventDefault();
    e.stopPropagation();
    const m = milestones[idx];
    setDragging({
      idx,
      type,
      startX: e.clientX,
      origOffset: m.offsetDays || 0,
      origDuration: m.durationDays || 7,
    });
  }, [readOnly, mobile, milestones]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const deltaDays = Math.round(dx / (weekPx / 7));

    if (dragging.type === "move" && onShift) {
      const newOffset = Math.max(0, dragging.origOffset + deltaDays);
      onShift(dragging.idx, newOffset);
    } else if (dragging.type === "resize" && onResize) {
      const newDuration = Math.max(1, dragging.origDuration + deltaDays);
      onResize(dragging.idx, newDuration);
    }
  }, [dragging, weekPx, onShift, onResize]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  return (
    <div
      style={{ display: "flex", border: `1px solid ${_.line}`, borderRadius: _.r, overflow: "hidden", background: _.surface }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Fixed label column */}
      <div style={{ width: labelW, flexShrink: 0, borderRight: `1px solid ${_.line}`, background: _.bg }}>
        {/* Header */}
        <div style={{
          height: ROW_H, display: "flex", alignItems: "center", padding: `0 ${_.s3}px`,
          borderBottom: `2px solid ${_.line}`, fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi,
          color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
        }}>
          Milestone
        </div>
        {/* Rows */}
        {milestones.map((m, i) => (
          <div key={m.id || i} onClick={() => onSelect && onSelect(i)} style={{
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
          </div>
        ))}
      </div>

      {/* Scrollable timeline */}
      <div ref={scrollRef} style={{ flex: 1, overflowX: "auto", overflowY: "hidden" }}>
        <div style={{ width: timelineW, position: "relative" }}>
          {/* Week headers */}
          <div style={{ height: ROW_H, display: "flex", borderBottom: `2px solid ${_.line}` }}>
            {Array.from({ length: totalWeeks }, (_, w) => (
              <div key={w} style={{
                width: weekPx, height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: _.fontSize.xs, color: _.faint, borderRight: `1px solid ${_.line}08`,
                background: w === currentWeek ? `${_.ac}08` : "transparent",
              }}>
                {w % (mobile ? 4 : 2) === 0 ? `W${w}` : ""}
              </div>
            ))}
          </div>

          {/* Bars area */}
          {milestones.map((m, i) => {
            const left = ((m.offsetDays || 0) / 7) * weekPx;
            const width = Math.max(weekPx * 0.5, ((m.durationDays || 7) / 7) * weekPx);
            const bg = STATUS_BG[m.status] || _.well;
            const overdue = isOverdue(m);
            const pctFill = m.percentComplete || 0;

            return (
              <div key={m.id || i} style={{
                height: ROW_H, position: "relative",
                borderBottom: `1px solid ${_.line}`,
                background: currentWeek >= 0 ? "transparent" : "transparent",
              }}>
                {/* Current week column highlight */}
                {currentWeek >= 0 && (
                  <div style={{
                    position: "absolute", left: currentWeek * weekPx, top: 0, bottom: 0,
                    width: weekPx, background: `${_.ac}05`, pointerEvents: "none",
                  }} />
                )}

                {/* Bar */}
                <div
                  onMouseDown={e => handleMouseDown(e, i, "move")}
                  style={{
                    position: "absolute",
                    left, top: (ROW_H - BAR_H) / 2,
                    width, height: BAR_H,
                    background: bg,
                    borderRadius: _.rXs,
                    border: overdue ? `1.5px solid ${_.red}` : `1px solid ${m.status === "not_started" ? _.line2 : "transparent"}`,
                    cursor: readOnly || mobile ? "default" : "grab",
                    overflow: "hidden",
                    transition: dragging ? "none" : `all ${_.tr}`,
                    display: "flex", alignItems: "center",
                  }}
                >
                  {/* Percent fill */}
                  {pctFill > 0 && pctFill < 100 && (
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0,
                      width: `${pctFill}%`,
                      background: m.status === "in_progress" ? `${_.acDark}` : `${_.green}40`,
                      borderRadius: _.rXs,
                    }} />
                  )}

                  {/* Bar label */}
                  {width > 50 && (
                    <span style={{
                      position: "relative", zIndex: 1,
                      padding: `0 ${_.s2}px`,
                      fontSize: _.fontSize.xs,
                      fontWeight: _.fontWeight.medium,
                      color: m.status === "in_progress" || m.status === "complete" ? "#fff" : _.body,
                      overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                    }}>
                      {m.name}
                    </span>
                  )}

                  {/* Resize handle (right edge) */}
                  {!readOnly && !mobile && (
                    <div
                      onMouseDown={e => handleMouseDown(e, i, "resize")}
                      style={{
                        position: "absolute", right: 0, top: 0, bottom: 0,
                        width: HANDLE_W, cursor: "ew-resize",
                        background: "transparent",
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Today line */}
          {todayOffset >= 0 && (
            <div style={{
              position: "absolute", left: todayOffset, top: ROW_H,
              bottom: 0, width: 2, background: _.red,
              pointerEvents: "none", zIndex: 10, opacity: 0.7,
            }}>
              <div style={{
                position: "absolute", top: -ROW_H, left: -12,
                width: 26, height: 16, borderRadius: _.rXs,
                background: _.red, color: "#fff",
                fontSize: 9, fontWeight: _.fontWeight.bold,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                Today
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
