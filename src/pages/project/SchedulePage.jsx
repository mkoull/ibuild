import { useMemo, useState } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { uid, input, label } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { Plus, CalendarRange, Pencil, Trash2 } from "lucide-react";
import { addDays } from "../../lib/scheduleEngine.js";
import {
  computeTaskEndDate,
  getDemoScheduleTasks,
  readScheduleTasks,
  recalcScheduleFromDependencies,
  writeScheduleTasks,
} from "../../lib/scheduleStore.js";

const EMPTY_FORM = {
  id: null,
  name: "",
  trade: "",
  startDate: "",
  durationDays: 1,
  dependencyTaskId: "",
};

function getTimelineWindow(tasks) {
  const today = new Date().toISOString().split("T")[0];
  const starts = tasks.map((t) => t.startDate).filter(Boolean).sort();
  const start = starts[0] && starts[0] < today ? starts[0] : today;
  const end = addDays(start, 84); // 12 weeks
  return { start, end, spanDays: 84 };
}

export default function SchedulePage() {
  const { project: p, update: up } = useProject();
  const { mobile, notify } = useApp();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const tasks = useMemo(() => readScheduleTasks(p), [p]);
  const timeline = useMemo(() => getTimelineWindow(tasks), [tasks]);

  const saveTasks = (nextTasks) => {
    up((pr) => {
      return writeScheduleTasks(pr, nextTasks);
    });
  };

  const openCreateModal = () => {
    setEditingTaskId(null);
    setForm({ ...EMPTY_FORM, id: uid() });
    setErrors({});
    setShowTaskModal(true);
  };

  const openEditModal = (task) => {
    setEditingTaskId(task.id);
    setForm({
      id: task.id,
      name: task.name || "",
      trade: task.trade || "",
      startDate: task.startDate || "",
      durationDays: Number(task.durationDays) || 1,
      dependencyTaskId: task.dependencyTaskId || "",
    });
    setErrors({});
    setShowTaskModal(true);
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Task name is required";
    if (!form.startDate) nextErrors.startDate = "Start date is required";
    if (!Number.isFinite(Number(form.durationDays)) || Number(form.durationDays) < 1) {
      nextErrors.durationDays = "Duration must be at least 1 day";
    }
    if (form.dependencyTaskId && form.dependencyTaskId === form.id) {
      nextErrors.dependencyTaskId = "Task cannot depend on itself";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitTask = () => {
    if (!validateForm()) return;
    const payload = {
      id: form.id || uid(),
      name: form.name.trim(),
      trade: form.trade.trim(),
      startDate: form.startDate,
      durationDays: Math.max(1, Number(form.durationDays) || 1),
      dependencyTaskId: form.dependencyTaskId || null,
      endDate: computeTaskEndDate(form.startDate, form.durationDays),
    };
    const next = editingTaskId
      ? tasks.map((task) => (task.id === editingTaskId ? payload : task))
      : [...tasks, payload];
    saveTasks(next);
    setShowTaskModal(false);
    setForm(EMPTY_FORM);
    setErrors({});
    notify(editingTaskId ? "Task updated" : "Task created");
  };

  const deleteTask = (taskId) => {
    saveTasks(tasks.filter((t) => t.id !== taskId).map((t) => ({
      ...t,
      dependencyTaskId: t.dependencyTaskId === taskId ? null : t.dependencyTaskId,
    })));
    notify("Task deleted");
  };

  const recalculateDependencies = () => {
    saveTasks(recalcScheduleFromDependencies(tasks));
    notify("Schedule recalculated from dependencies");
  };

  const seedDemoTasks = () => {
    saveTasks(getDemoScheduleTasks());
    notify("Added demo schedule tasks");
  };

  const barStyle = (task) => {
    if (!task.startDate || !task.endDate || !timeline.start) return { left: "0%", width: "0%" };
    const startMs = new Date(`${timeline.start}T00:00:00`).getTime();
    const taskStartMs = new Date(`${task.startDate}T00:00:00`).getTime();
    const taskEndMs = new Date(`${task.endDate}T00:00:00`).getTime();
    const offset = Math.max(0, Math.round((taskStartMs - startMs) / 86400000));
    const length = Math.max(1, Math.round((taskEndMs - taskStartMs) / 86400000));
    const leftPct = Math.max(0, Math.min(100, (offset / timeline.spanDays) * 100));
    const widthPct = Math.max(0.5, Math.min(100 - leftPct, (length / timeline.spanDays) * 100));
    return {
      left: `${leftPct}%`,
      width: `${widthPct}%`,
    };
  };

  const todayOffsetPct = useMemo(() => {
    if (!timeline.start) return 0;
    const startMs = new Date(`${timeline.start}T00:00:00`).getTime();
    const todayMs = new Date(`${new Date().toISOString().split("T")[0]}T00:00:00`).getTime();
    const diff = Math.round((todayMs - startMs) / 86400000);
    return Math.max(0, Math.min(100, (diff / timeline.spanDays) * 100));
  }, [timeline.start, timeline.spanDays]);

  const weekLabels = useMemo(
    () => Array.from({ length: 12 }, (_, idx) => addDays(timeline.start, idx * 7)),
    [timeline.start],
  );

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: _.s3, marginBottom: _.s5, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Schedule</h1>
          <div style={{ fontSize: _.fontSize.md, color: _.muted }}>Tasks, durations, dependencies, and timeline</div>
        </div>
        <div style={{ display: "flex", gap: _.s2, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={recalculateDependencies}>Recalculate from dependencies</Button>
          <Button icon={Plus} onClick={openCreateModal}>Add Task</Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <Empty
          icon={CalendarRange}
          title="No tasks yet"
          text="Create tasks to build your project schedule, or add demo tasks to get started."
          action={seedDemoTasks}
          actionText="Add demo tasks"
        >
          <div style={{ marginTop: _.s2 }}>
            <Button variant="ghost" onClick={openCreateModal}>Add Task</Button>
          </div>
        </Empty>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.4fr 1fr", gap: _.s4 }}>
          <div style={{ border: `1px solid ${_.line}`, borderRadius: _.rSm, background: _.surface, overflowX: "auto" }}>
            <div style={{ minWidth: 860 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.4fr auto", gap: _.s2, padding: `${_.s2}px ${_.s3}px`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
                <span>Task</span>
                <span>Trade</span>
                <span>Start</span>
                <span>Duration</span>
                <span>End</span>
                <span>Depends On</span>
                <span>Actions</span>
              </div>
              {tasks.map((task) => {
                const dependsOn = tasks.find((t) => t.id === task.dependencyTaskId);
                return (
                  <div key={task.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.4fr auto", gap: _.s2, padding: `${_.s3}px ${_.s3}px`, borderBottom: `1px solid ${_.line}`, alignItems: "center" }}>
                    <span style={{ fontWeight: _.fontWeight.medium, color: _.ink }}>{task.name || "—"}</span>
                    <span style={{ color: _.body }}>{task.trade || "—"}</span>
                    <span style={{ color: _.body }}>{task.startDate || "—"}</span>
                    <span style={{ color: _.body }}>{task.durationDays || 1}d</span>
                    <span style={{ color: _.body }}>{task.endDate || "—"}</span>
                    <span style={{ color: _.muted }}>{dependsOn?.name || "—"}</span>
                    <div style={{ display: "flex", gap: _.s1 }}>
                      <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEditModal(task)}>Edit</Button>
                      <Button variant="ghost" size="sm" icon={Trash2} onClick={() => deleteTask(task.id)}>Delete</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ border: `1px solid ${_.line}`, borderRadius: _.rSm, background: _.surface, padding: _.s3 }}>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s2 }}>
              Timeline (12 weeks)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 0, marginBottom: _.s2 }}>
              {weekLabels.map((wk) => (
                <div key={wk} style={{ fontSize: _.fontSize.xs, color: _.muted, borderLeft: `1px solid ${_.line}`, paddingLeft: 4 }}>
                  {wk.slice(5)}
                </div>
              ))}
            </div>
            <div style={{ position: "relative", borderTop: `1px solid ${_.line}` }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, left: `${todayOffsetPct}%`, width: 2, background: `${_.red}88`, zIndex: 2 }} />
              {tasks.map((task) => {
                const bar = barStyle(task);
                return (
                  <div key={`${task.id}-bar`} style={{ position: "relative", height: 28, borderBottom: `1px solid ${_.line}` }}>
                    <div style={{ position: "absolute", top: 6, left: 0, fontSize: _.fontSize.xs, color: _.muted, maxWidth: "45%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {task.name}
                    </div>
                    <div style={{ position: "absolute", top: 6, bottom: 6, borderRadius: _.rXs, background: _.ac, ...bar }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title={editingTaskId ? "Edit Task" : "Add Task"} width={520}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s3 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Name *</label>
            <input style={input} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            {errors.name && <div style={{ marginTop: 4, fontSize: _.fontSize.sm, color: _.red }}>{errors.name}</div>}
          </div>
          <div>
            <label style={label}>Trade</label>
            <input style={input} value={form.trade} onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value }))} />
          </div>
          <div>
            <label style={label}>Duration (days)</label>
            <input type="number" min="1" style={input} value={form.durationDays} onChange={(e) => setForm((f) => ({ ...f, durationDays: Math.max(1, Number(e.target.value) || 1) }))} />
            {errors.durationDays && <div style={{ marginTop: 4, fontSize: _.fontSize.sm, color: _.red }}>{errors.durationDays}</div>}
          </div>
          <div>
            <label style={label}>Start Date *</label>
            <input type="date" style={input} value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            {errors.startDate && <div style={{ marginTop: 4, fontSize: _.fontSize.sm, color: _.red }}>{errors.startDate}</div>}
          </div>
          <div>
            <label style={label}>Dependency (optional)</label>
            <select style={{ ...input, cursor: "pointer" }} value={form.dependencyTaskId} onChange={(e) => setForm((f) => ({ ...f, dependencyTaskId: e.target.value }))}>
              <option value="">— None —</option>
              {tasks.map((t) => (
                t.id !== form.id ? (
                <option key={t.id} value={t.id}>{t.name}</option>
                ) : null
              ))}
            </select>
            {errors.dependencyTaskId && <div style={{ marginTop: 4, fontSize: _.fontSize.sm, color: _.red }}>{errors.dependencyTaskId}</div>}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2, marginTop: _.s5 }}>
          <Button variant="ghost" onClick={() => setShowTaskModal(false)}>Cancel</Button>
          <Button onClick={submitTask}>{editingTaskId ? "Save Task" : "Create Task"}</Button>
        </div>
      </Modal>
    </Section>
  );
}
