import { useMemo, useState } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { uid, input, label } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { Plus, CalendarRange } from "lucide-react";
import { addDays } from "../../lib/scheduleEngine.js";

function toTask(m) {
  return {
    id: m.id || uid(),
    name: m.name || "",
    durationDays: Number(m.durationDays) || 1,
    startDate: m.startDate || m.plannedStart || "",
    endDate: m.endDate || m.plannedFinish || "",
    dependencyTaskId: m.dependencyTaskId || (Array.isArray(m.dependsOn) ? m.dependsOn[0] || "" : ""),
    trade: m.trade || m.freeTextTrade || "",
  };
}

function toStoredTask(t, idx) {
  const durationDays = Math.max(1, Number(t.durationDays) || 1);
  const startDate = t.startDate || "";
  const endDate = startDate ? addDays(startDate, durationDays) : (t.endDate || "");
  return {
    id: t.id || uid(),
    name: t.name || "",
    durationDays,
    startDate,
    endDate,
    dependencyTaskId: t.dependencyTaskId || "",
    trade: t.trade || "",
    plannedStart: startDate,
    plannedFinish: endDate,
    freeTextTrade: t.trade || "",
    dependsOn: t.dependencyTaskId ? [t.dependencyTaskId] : [],
    order: idx,
    status: "not_started",
    percentComplete: 0,
  };
}

function recalcTasks(tasks) {
  const byId = Object.fromEntries(tasks.map((t) => [t.id, t]));
  const next = tasks.map((t) => ({ ...t }));
  for (let i = 0; i < next.length; i += 1) {
    const t = next[i];
    const durationDays = Math.max(1, Number(t.durationDays) || 1);
    const dep = t.dependencyTaskId ? byId[t.dependencyTaskId] : null;
    const startDate = dep?.endDate || t.startDate || "";
    t.durationDays = durationDays;
    t.startDate = startDate;
    t.endDate = startDate ? addDays(startDate, durationDays) : "";
    byId[t.id] = t;
  }
  return next;
}

export default function SchedulePage() {
  const { project: p, update: up } = useProject();
  const { mobile, notify } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", trade: "", durationDays: 1, startDate: "", dependencyTaskId: "" });

  const tasks = useMemo(() => {
    if (p?.schedule && typeof p.schedule === "object" && Array.isArray(p.schedule.tasks)) {
      return p.schedule.tasks.map(toTask);
    }
    if (Array.isArray(p.schedule)) {
      return p.schedule.map(toTask);
    }
    return [];
  }, [p.schedule]);

  const saveTasks = (nextTasks) => {
    up((pr) => {
      const stored = recalcTasks(nextTasks).map((t, idx) => toStoredTask(t, idx));
      if (pr.schedule && typeof pr.schedule === "object" && !Array.isArray(pr.schedule)) {
        pr.schedule.tasks = stored;
      } else {
        pr.schedule = stored;
      }
      return pr;
    });
  };

  const createTask = () => {
    if (!form.name.trim() || !form.startDate) {
      notify("Task name and start date are required", "error");
      return;
    }
    const next = [
      ...tasks,
      {
        id: uid(),
        name: form.name.trim(),
        trade: form.trade.trim(),
        durationDays: Math.max(1, Number(form.durationDays) || 1),
        startDate: form.startDate,
        dependencyTaskId: form.dependencyTaskId || "",
        endDate: "",
      },
    ];
    saveTasks(next);
    setForm({ name: "", trade: "", durationDays: 1, startDate: "", dependencyTaskId: "" });
    setShowCreate(false);
    notify("Task created");
  };

  const updateTask = (taskId, patch) => {
    const next = tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t));
    saveTasks(next);
  };

  const timeline = useMemo(() => {
    if (tasks.length === 0) return { start: "", end: "", span: 1 };
    const starts = tasks.map((t) => t.startDate).filter(Boolean).sort();
    const ends = tasks.map((t) => t.endDate || (t.startDate ? addDays(t.startDate, Number(t.durationDays) || 1) : "")).filter(Boolean).sort();
    const start = starts[0] || "";
    const end = ends[ends.length - 1] || start;
    const startMs = start ? new Date(`${start}T00:00:00`).getTime() : 0;
    const endMs = end ? new Date(`${end}T00:00:00`).getTime() : startMs;
    const span = Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);
    return { start, end, span };
  }, [tasks]);

  const barStyle = (task) => {
    if (!task.startDate || !task.endDate || !timeline.start) return { left: "0%", width: "0%" };
    const startMs = new Date(`${timeline.start}T00:00:00`).getTime();
    const taskStartMs = new Date(`${task.startDate}T00:00:00`).getTime();
    const taskEndMs = new Date(`${task.endDate}T00:00:00`).getTime();
    const offset = Math.max(0, Math.round((taskStartMs - startMs) / 86400000));
    const length = Math.max(1, Math.round((taskEndMs - taskStartMs) / 86400000));
    return {
      left: `${(offset / timeline.span) * 100}%`,
      width: `${(length / timeline.span) * 100}%`,
    };
  };

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: _.s3, marginBottom: _.s5, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Schedule</h1>
          <div style={{ fontSize: _.fontSize.md, color: _.muted }}>Tasks, durations, dependencies, and timeline</div>
        </div>
        <Button icon={Plus} onClick={() => setShowCreate(true)}>Create Task</Button>
      </div>

      {tasks.length === 0 ? (
        <Empty icon={CalendarRange} title="No tasks yet" text="Create tasks to build your project schedule." action={() => setShowCreate(true)} actionText="Create Task" />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1.3fr 1fr 150px 120px 150px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
            <span>Task</span>
            {!mobile && <span>Trade</span>}
            {!mobile && <span>Start Date</span>}
            {!mobile && <span>Duration (days)</span>}
            {!mobile && <span>End Date</span>}
            {mobile && <span style={{ textAlign: "right" }}>End</span>}
          </div>
          {tasks.map((task) => {
            const endDate = task.endDate || (task.startDate ? addDays(task.startDate, Number(task.durationDays) || 1) : "");
            return (
              <div key={task.id} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1.3fr 1fr 150px 120px 150px", gap: _.s2, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: _.fontWeight.medium, color: _.ink }}>{task.name}</div>
                  {task.dependencyTaskId && (
                    <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>
                      Depends on: {tasks.find((t) => t.id === task.dependencyTaskId)?.name || "Task"}
                    </div>
                  )}
                </div>
                {!mobile && (
                  <input
                    style={input}
                    value={task.trade || ""}
                    onChange={(e) => updateTask(task.id, { trade: e.target.value })}
                    placeholder="Trade"
                  />
                )}
                {!mobile && (
                  <input
                    type="date"
                    style={input}
                    value={task.startDate || ""}
                    disabled={!!task.dependencyTaskId}
                    onChange={(e) => updateTask(task.id, { startDate: e.target.value })}
                  />
                )}
                {!mobile && (
                  <input
                    type="number"
                    min="1"
                    style={input}
                    value={task.durationDays || 1}
                    onChange={(e) => updateTask(task.id, { durationDays: Math.max(1, Number(e.target.value) || 1) })}
                  />
                )}
                {!mobile && <span style={{ color: _.body }}>{endDate || "—"}</span>}
                {mobile && <span style={{ textAlign: "right", color: _.body }}>{endDate || "—"}</span>}
              </div>
            );
          })}

          <div style={{ marginTop: _.s6 }}>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s2 }}>Timeline</div>
            <div style={{ border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: _.s3, background: _.surface }}>
              {tasks.map((task) => {
                const endDate = task.endDate || (task.startDate ? addDays(task.startDate, Number(task.durationDays) || 1) : "");
                const bar = barStyle({ ...task, endDate });
                return (
                  <div key={`${task.id}-bar`} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "180px 1fr", gap: _.s2, alignItems: "center", marginBottom: _.s2 }}>
                    {!mobile && <div style={{ fontSize: _.fontSize.sm, color: _.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.name}</div>}
                    <div style={{ position: "relative", height: 18, background: _.well, borderRadius: _.rXs, overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 2, bottom: 2, borderRadius: _.rXs, background: _.ac, ...bar }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Task" width={520}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s3 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Name *</label>
            <input style={input} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={label}>Trade</label>
            <input style={input} value={form.trade} onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value }))} />
          </div>
          <div>
            <label style={label}>Duration (days)</label>
            <input type="number" min="1" style={input} value={form.durationDays} onChange={(e) => setForm((f) => ({ ...f, durationDays: Math.max(1, Number(e.target.value) || 1) }))} />
          </div>
          <div>
            <label style={label}>Start Date *</label>
            <input type="date" style={input} value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <label style={label}>Dependency (optional)</label>
            <select style={{ ...input, cursor: "pointer" }} value={form.dependencyTaskId} onChange={(e) => setForm((f) => ({ ...f, dependencyTaskId: e.target.value }))}>
              <option value="">— None —</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2, marginTop: _.s5 }}>
          <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button onClick={createTask}>Create Task</Button>
        </div>
      </Modal>
    </Section>
  );
}
