import { uid } from "../theme/styles.js";
import { addDays } from "./scheduleEngine.js";

function toInt(value, fallback = 1) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : fallback;
}

export function computeTaskEndDate(startDate, durationDays) {
  if (!startDate) return "";
  return addDays(startDate, toInt(durationDays, 1));
}

export function normalizeScheduleTask(task, index = 0) {
  const startDate = task?.startDate || task?.plannedStart || "";
  const durationDays = toInt(task?.durationDays, 1);
  const endDate = task?.endDate || task?.plannedFinish || computeTaskEndDate(startDate, durationDays);
  return {
    id: task?.id || uid(),
    name: String(task?.name || "").trim(),
    trade: task?.trade || task?.freeTextTrade || "",
    startDate,
    durationDays,
    endDate,
    dependencyTaskId: task?.dependencyTaskId
      || (Array.isArray(task?.dependsOn) ? task.dependsOn[0] || null : null),
    order: Number.isFinite(Number(task?.order)) ? Number(task.order) : index,
  };
}

export function readScheduleTasks(project) {
  if (!project) return [];
  const raw = project.schedule;
  if (raw && typeof raw === "object" && !Array.isArray(raw) && Array.isArray(raw.tasks)) {
    return raw.tasks.map((t, idx) => normalizeScheduleTask(t, idx));
  }
  if (Array.isArray(raw)) {
    return raw.map((t, idx) => normalizeScheduleTask(t, idx));
  }
  return [];
}

export function recalcScheduleFromDependencies(tasks) {
  const normalized = tasks.map((t, idx) => normalizeScheduleTask(t, idx));
  const byId = Object.fromEntries(normalized.map((t) => [t.id, t]));

  for (let i = 0; i < normalized.length; i += 1) {
    const task = normalized[i];
    const dep = task.dependencyTaskId ? byId[task.dependencyTaskId] : null;
    let startDate = task.startDate;

    if (dep?.endDate) {
      const minStart = addDays(dep.endDate, 1);
      if (!startDate || startDate < minStart) {
        startDate = minStart;
      }
    }

    task.startDate = startDate;
    task.durationDays = toInt(task.durationDays, 1);
    task.endDate = computeTaskEndDate(task.startDate, task.durationDays);
    byId[task.id] = task;
  }

  return normalized;
}

export function writeScheduleTasks(project, tasks) {
  const normalized = recalcScheduleFromDependencies(tasks);
  project.schedule = { tasks: normalized };
  return project;
}

export function getDemoScheduleTasks() {
  const today = new Date().toISOString().split("T")[0];
  return recalcScheduleFromDependencies([
    {
      id: uid(),
      name: "Site setup",
      trade: "General",
      startDate: today,
      durationDays: 3,
      dependencyTaskId: null,
    },
    {
      id: uid(),
      name: "Framing",
      trade: "Carpentry",
      startDate: today,
      durationDays: 6,
      dependencyTaskId: null,
    },
    {
      id: uid(),
      name: "Rough-in services",
      trade: "Electrical",
      startDate: today,
      durationDays: 4,
      dependencyTaskId: null,
    },
  ]);
}

