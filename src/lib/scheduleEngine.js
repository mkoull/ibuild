/**
 * scheduleEngine.js — Pure function library for construction schedule calculations.
 * Follows the calc.js pattern: stateless, no side effects, returns new objects.
 */

// ── Date helpers ────────────────────────────────────────────────────────────

export function addDays(dateStr, days) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function daysBetween(a, b) {
  if (!a || !b) return 0;
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

function toDateStr(d) {
  return d.toISOString().split("T")[0];
}

function todayStr() {
  return toDateStr(new Date());
}

// ── Legacy field sync ───────────────────────────────────────────────────────

export function syncLegacyFields(m) {
  return {
    ...m,
    wk: Math.round((m.offsetDays || 0) / 7),
    done: m.status === "complete",
    date: m.actualFinish || m.actualStart || m.date || "",
    planned: m.plannedStart || m.planned || "",
  };
}

// ── Status transitions ─────────────────────────────────────────────────────

export function updateMilestoneStatus(m, newStatus) {
  const today = todayStr();
  const updated = { ...m, status: newStatus };

  if (newStatus === "in_progress") {
    updated.percentComplete = updated.percentComplete || 1;
    if (!updated.actualStart) updated.actualStart = today;
  } else if (newStatus === "complete") {
    updated.percentComplete = 100;
    if (!updated.actualStart) updated.actualStart = today;
    updated.actualFinish = today;
  } else if (newStatus === "not_started") {
    updated.percentComplete = 0;
    updated.actualStart = "";
    updated.actualFinish = "";
  }

  return syncLegacyFields(updated);
}

// ── Core schedule calculation ───────────────────────────────────────────────

export function calculateSchedule(milestones, startDate) {
  if (!startDate || !milestones.length) return milestones.map(m => syncLegacyFields(m));

  const sorted = [...milestones].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const byId = {};

  // First pass: compute dates
  const computed = sorted.map(m => {
    const copy = { ...m };

    if (copy.dependsOn && copy.dependsOn.length > 0) {
      // Dependency-driven start: max of all dep finish dates
      let maxFinish = null;
      for (const depId of copy.dependsOn) {
        const dep = byId[depId];
        if (dep && dep.plannedFinish) {
          if (!maxFinish || dep.plannedFinish > maxFinish) {
            maxFinish = dep.plannedFinish;
          }
        }
      }
      if (maxFinish) {
        copy.plannedStart = maxFinish;
      } else {
        copy.plannedStart = addDays(startDate, copy.offsetDays || 0);
      }
    } else {
      copy.plannedStart = addDays(startDate, copy.offsetDays || 0);
    }

    copy.plannedFinish = addDays(copy.plannedStart, copy.durationDays || 7);

    byId[copy.id] = copy;
    return syncLegacyFields(copy);
  });

  return computed;
}

// ── Shift operations ────────────────────────────────────────────────────────

export function shiftProject(milestones, shiftDays, { onlyIncomplete = false } = {}) {
  return milestones.map(m => {
    if (onlyIncomplete && m.status === "complete") return m;
    return syncLegacyFields({
      ...m,
      offsetDays: Math.max(0, (m.offsetDays || 0) + shiftDays),
    });
  });
}

export function shiftDownstream(milestones, changedId, deltaDays) {
  const idx = milestones.findIndex(m => m.id === changedId);
  if (idx < 0 || deltaDays === 0) return milestones;

  return milestones.map((m, i) => {
    if (i <= idx) return m;
    // Shift milestones that come after the changed one
    const hasDep = m.dependsOn && m.dependsOn.includes(changedId);
    const isDownstream = i > idx;
    if (hasDep || isDownstream) {
      return syncLegacyFields({
        ...m,
        offsetDays: Math.max(0, (m.offsetDays || 0) + deltaDays),
      });
    }
    return m;
  });
}

// ── Regenerate from template ────────────────────────────────────────────────

export function regenerateFromTemplate(template, startDate) {
  return template.map((t, i) => ({
    ...t,
    offsetDays: (t.wk || 0) * 7,
    durationDays: t.durationDays || 28,
    order: i,
    plannedStart: startDate ? addDays(startDate, (t.wk || 0) * 7) : "",
    plannedFinish: startDate ? addDays(startDate, (t.wk || 0) * 7 + (t.durationDays || 28)) : "",
    planned: startDate ? addDays(startDate, (t.wk || 0) * 7) : "",
  }));
}

// ── Metrics ─────────────────────────────────────────────────────────────────

export function getScheduleMetrics(milestones) {
  if (!milestones.length) return { totalDuration: 0, percentComplete: 0, estimatedFinish: "" };

  const total = milestones.length;
  const complete = milestones.filter(m => m.status === "complete" || m.done).length;
  const percentComplete = total > 0 ? Math.round((complete / total) * 100) : 0;

  // Total duration from first start to last finish
  const starts = milestones.map(m => m.plannedStart).filter(Boolean).sort();
  const finishes = milestones.map(m => m.plannedFinish).filter(Boolean).sort();
  const firstStart = starts[0] || "";
  const lastFinish = finishes[finishes.length - 1] || "";
  const totalDuration = firstStart && lastFinish ? daysBetween(firstStart, lastFinish) : 0;

  return {
    totalDuration,
    percentComplete,
    estimatedFinish: lastFinish,
    firstStart,
    completedCount: complete,
    totalCount: total,
  };
}
