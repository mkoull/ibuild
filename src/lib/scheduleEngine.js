/**
 * scheduleEngine.js — Pure function library for construction schedule calculations.
 *
 * Design decisions:
 * - finishDate = startDate + durationDays (primary rule)
 * - If user edits finishDate directly, durationDays is recomputed
 * - Tasks can overlap by default — no auto-cascade unless explicitly enabled
 * - Auto-cascade only shifts tasks with DIRECT or TRANSITIVE dependencies
 * - manuallyPinned tasks are never moved by cascade (unless user forces regenerate)
 * - Circular dependencies are detected and blocked
 */

// ── Date helpers ────────────────────────────────────────────────────────────

export function addDays(dateStr, days) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function daysBetween(a, b) {
  if (!a || !b) return 0;
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
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

// ── Circular dependency detection ───────────────────────────────────────────

export function hasCircularDep(milestones, taskId, proposedDeps) {
  // BFS from each proposed dep's own deps to see if we reach taskId
  const byId = {};
  milestones.forEach(m => { byId[m.id] = m; });

  const visited = new Set();
  const queue = [...proposedDeps];

  while (queue.length > 0) {
    const id = queue.shift();
    if (id === taskId) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    const m = byId[id];
    if (m && m.dependsOn) {
      queue.push(...m.dependsOn);
    }
  }
  return false;
}

// ── Get all transitive dependents of a task ─────────────────────────────────

function getTransitiveDependents(milestones, sourceId) {
  // Returns Set of milestone IDs that depend on sourceId (directly or transitively)
  const dependents = new Set();
  const queue = [sourceId];

  while (queue.length > 0) {
    const id = queue.shift();
    milestones.forEach(m => {
      if (m.dependsOn && m.dependsOn.includes(id) && !dependents.has(m.id)) {
        dependents.add(m.id);
        queue.push(m.id);
      }
    });
  }
  return dependents;
}

// ── Dependency conflict detection ───────────────────────────────────────────

export function getDependencyConflicts(milestones) {
  // Returns array of { taskId, taskName, depId, depName } where task starts before dep finishes
  const byId = {};
  milestones.forEach(m => { byId[m.id] = m; });

  const conflicts = [];
  milestones.forEach(m => {
    if (!m.dependsOn || !m.plannedStart) return;
    m.dependsOn.forEach(depId => {
      const dep = byId[depId];
      if (dep && dep.plannedFinish && m.plannedStart < dep.plannedFinish) {
        conflicts.push({ taskId: m.id, taskName: m.name, depId, depName: dep.name });
      }
    });
  });
  return conflicts;
}

// ── Core: compute dates for a single milestone ──────────────────────────────

function computeDates(m, startDate) {
  const copy = { ...m };
  copy.plannedStart = addDays(startDate, copy.offsetDays || 0);
  copy.plannedFinish = addDays(copy.plannedStart, copy.durationDays || 7);
  return copy;
}

// ── Core schedule calculation ───────────────────────────────────────────────
// ONLY applies dependency-driven dates. Does NOT cascade or shift anything.
// This is used for display purposes — it computes dates from offsets + deps.

export function calculateSchedule(milestones, startDate) {
  if (!startDate || !milestones.length) return milestones.map(m => syncLegacyFields(m));

  const sorted = [...milestones].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const byId = {};

  return sorted.map(m => {
    const copy = { ...m };

    // Only override start from dependencies if NOT manually pinned
    if (!copy.manuallyPinned && copy.dependsOn && copy.dependsOn.length > 0) {
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
        // Only push later, never earlier (finish-to-start constraint)
        const offsetStart = addDays(startDate, copy.offsetDays || 0);
        copy.plannedStart = maxFinish > offsetStart ? maxFinish : offsetStart;
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
}

// ── Auto-cascade: shift ONLY dependent tasks ────────────────────────────────
// Called when autoCascade is ON and a task changes.
// Only shifts tasks that have a dependency (direct or transitive) on changedId.
// Respects manuallyPinned — pinned tasks are skipped.

export function cascadeDependents(milestones, changedId, deltaDays, startDate) {
  if (deltaDays === 0) return milestones;

  const dependents = getTransitiveDependents(milestones, changedId);
  if (dependents.size === 0) return milestones;

  const updated = milestones.map(m => {
    if (!dependents.has(m.id)) return m;
    if (m.manuallyPinned) return m; // Never move pinned tasks
    return syncLegacyFields({
      ...m,
      offsetDays: Math.max(0, (m.offsetDays || 0) + deltaDays),
    });
  });

  // Recalculate with new offsets
  return startDate ? calculateSchedule(updated, startDate) : updated;
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

// ── Regenerate from project start date ──────────────────────────────────────
// Rebuilds dates from offsetDays + dependency rules.
// pinnedOverride: if true, also recalculates pinned tasks (clears pinned flag).

export function regenerateSchedule(milestones, startDate, { pinnedOverride = false } = {}) {
  if (!startDate) return milestones;

  const prepared = milestones.map(m => {
    if (m.status === "complete") return m; // Never touch completed tasks
    const copy = { ...m };
    if (pinnedOverride) copy.manuallyPinned = false;
    return copy;
  });

  return calculateSchedule(prepared, startDate);
}

// ── Metrics ─────────────────────────────────────────────────────────────────

export function getScheduleMetrics(milestones) {
  if (!milestones.length) return { totalDuration: 0, percentComplete: 0, estimatedFinish: "", firstStart: "", completedCount: 0, totalCount: 0 };

  const total = milestones.length;
  const complete = milestones.filter(m => m.status === "complete" || m.done).length;
  const percentComplete = total > 0 ? Math.round((complete / total) * 100) : 0;

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
