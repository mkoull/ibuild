import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { input, label, badge, uid } from "../../theme/styles.js";
import { exportPrintPdf } from "../../lib/pdfExport.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Card from "../../components/ui/Card.jsx";
import { Search, CheckCircle2, Pencil, Plus, KanbanSquare, List } from "lucide-react";

const PRIORITIES = ["Low", "Medium", "High"];
const STATUSES = ["Open", "In Progress", "Completed"];
const STATUS_COLORS = { Open: _.red, "In Progress": _.amber, Completed: _.green };
const PRIORITY_COLORS = { Low: _.blue, Medium: _.amber, High: _.red };

function toIsoDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeStatus(raw, done) {
  const s = String(raw || "").toLowerCase();
  if (done || s === "resolved" || s === "complete" || s === "completed") return "Completed";
  if (s === "in progress" || s === "in_progress" || s === "progress") return "In Progress";
  return "Open";
}

function normalizeDefect(d, idx) {
  const status = normalizeStatus(d.status, d.done);
  return {
    id: d.id || uid(),
    number: d.number || `DEF-${String(idx + 1).padStart(3, "0")}`,
    title: d.title || d.desc || "Untitled defect",
    description: d.description || d.desc || d.title || "",
    location: d.location || "",
    trade: d.trade || d.assignee || "",
    priority: PRIORITIES.includes(d.priority) ? d.priority : "Medium",
    status,
    dueDate: d.dueDate || "",
    photos: Array.isArray(d.photos) ? d.photos.filter(Boolean) : [],
    createdAt: d.createdAt || d.date || new Date().toISOString(),
    completedAt: status === "Completed" ? (d.completedAt || "") : "",
  };
}

function emptyForm() {
  return {
    title: "",
    description: "",
    location: "",
    trade: "",
    priority: "Medium",
    dueDate: "",
    photos: [],
  };
}

async function filesToDataUrls(fileList) {
  const files = Array.from(fileList || []);
  const urls = await Promise.all(files.map((file) => (
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })
  )));
  return urls.filter(Boolean);
}

export default function DefectsPage() {
  const { project: p, update: up, log } = useProject();
  const { mobile, notify, trades, settings, addNotification } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [viewMode, setViewMode] = useState("table");

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreateOpen(true);
    }
  }, [searchParams]);

  const defects = useMemo(() => {
    return (p.defects || []).map((d, idx) => normalizeDefect(d, idx));
  }, [p.defects]);

  const summary = useMemo(() => {
    const open = defects.filter((d) => d.status === "Open").length;
    const inProgress = defects.filter((d) => d.status === "In Progress").length;
    const completed = defects.filter((d) => d.status === "Completed").length;
    const overdue = defects.filter((d) => (
      d.status !== "Completed" &&
      d.dueDate &&
      new Date(`${d.dueDate}T23:59:59`).getTime() < Date.now()
    )).length;
    return { open, inProgress, completed, overdue };
  }, [defects]);

  const defectsByStatus = useMemo(() => ({
    Open: defects.filter((d) => d.status === "Open"),
    "In Progress": defects.filter((d) => d.status === "In Progress"),
    Completed: defects.filter((d) => d.status === "Completed"),
  }), [defects]);

  const resetForm = () => setForm(emptyForm());

  const handleCreate = () => {
    if (!form.title.trim()) {
      notify("Title is required", "error");
      return;
    }
    up((pr) => {
      if (!Array.isArray(pr.defects)) pr.defects = [];
      const number = `DEF-${String(pr.defects.length + 1).padStart(3, "0")}`;
      pr.defects.push({
        id: uid(),
        number,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        trade: form.trade.trim(),
        priority: form.priority,
        status: "Open",
        dueDate: form.dueDate || "",
        photos: form.photos || [],
        createdAt: new Date().toISOString(),
        completedAt: "",
      });
      return pr;
    });
    log(`Defect created: ${form.title.trim()}`);
    if (form.trade.trim()) {
      addNotification({
        message: `Defect assigned: ${form.title.trim()} → ${form.trade.trim()}`,
        type: "defect_assigned",
        link: `/projects/${p.id}/defects`,
      });
    }
    notify("Defect created");
    resetForm();
    setCreateOpen(false);
  };

  const openEdit = (defect) => {
    setEditingId(defect.id);
    setForm({
      title: defect.title || "",
      description: defect.description || "",
      location: defect.location || "",
      trade: defect.trade || "",
      priority: defect.priority || "Medium",
      dueDate: defect.dueDate || "",
      photos: Array.isArray(defect.photos) ? defect.photos : [],
    });
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (!form.title.trim()) {
      notify("Title is required", "error");
      return;
    }
    up((pr) => {
      const idx = (pr.defects || []).findIndex((d) => d.id === editingId);
      if (idx < 0) return pr;
      const existing = normalizeDefect(pr.defects[idx], idx);
      pr.defects[idx] = {
        ...pr.defects[idx],
        ...existing,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        trade: form.trade.trim(),
        priority: form.priority,
        dueDate: form.dueDate || "",
        photos: form.photos || [],
      };
      return pr;
    });
    notify("Defect updated");
    if (form.trade.trim()) {
      addNotification({
        message: `Defect assigned: ${form.title.trim()} → ${form.trade.trim()}`,
        type: "defect_assigned",
        link: `/projects/${p.id}/defects`,
      });
    }
    setEditOpen(false);
    setEditingId("");
    resetForm();
  };

  const setStatus = (defectId, status) => {
    up((pr) => {
      const idx = (pr.defects || []).findIndex((d) => d.id === defectId);
      if (idx < 0) return pr;
      const d = normalizeDefect(pr.defects[idx], idx);
      const next = {
        ...pr.defects[idx],
        ...d,
        status,
        done: status === "Completed",
        completedAt: status === "Completed" ? (d.completedAt || new Date().toISOString()) : "",
      };
      pr.defects[idx] = next;
      return pr;
    });
    if (status === "Completed") {
      log(`Defect completed: ${defectId}`);
    }
    notify(`Defect marked ${status}`);
  };

  const removeDefect = (defectId) => {
    up((pr) => {
      pr.defects = (pr.defects || []).filter((d) => d.id !== defectId);
      return pr;
    });
    notify("Defect deleted");
  };

  const exportDefectsPdf = () => {
    const ok = exportPrintPdf({
      title: "Defect List",
      companyName: settings?.companyName || "",
      projectName: p.name || "Project",
      clientName: p.client || "",
      dateLabel: toIsoDate(),
      sections: [
        {
          title: "Defects",
          type: "table",
          headers: ["Defect #", "Title", "Location", "Trade", "Priority", "Status", "Due Date"],
          rows: defects.map((d) => ([
            d.number,
            d.title,
            d.location || "—",
            d.trade || "—",
            d.priority,
            d.status,
            d.dueDate || "—",
          ])),
        },
      ],
    });
    if (!ok) notify("Pop-up blocked — please allow pop-ups for this site", "error");
  };

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>
        Defects / Punch List
      </h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s5 }}>
        Track close-out defects, assign trades, and complete quality checks before handover.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: _.s3, marginBottom: _.s4 }}>
        <Card style={{ padding: _.s3 }}>
          <div style={label}>Open</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, color: _.red }}>{summary.open}</div>
        </Card>
        <Card style={{ padding: _.s3 }}>
          <div style={label}>In Progress</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, color: _.amber }}>{summary.inProgress}</div>
        </Card>
        <Card style={{ padding: _.s3 }}>
          <div style={label}>Completed</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, color: _.green }}>{summary.completed}</div>
        </Card>
        <Card style={{ padding: _.s3 }}>
          <div style={label}>Overdue</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, color: summary.overdue > 0 ? _.red : _.ink }}>
            {summary.overdue}
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s3, gap: _.s2, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: _.s2 }}>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            icon={List}
            onClick={() => setViewMode("table")}
          >
            Table
          </Button>
          <Button
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            size="sm"
            icon={KanbanSquare}
            onClick={() => setViewMode("kanban")}
          >
            Kanban
          </Button>
        </div>
        <div style={{ display: "flex", gap: _.s2, flexWrap: "wrap" }}>
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>Create Defect</Button>
          <Button variant="secondary" onClick={exportDefectsPdf} disabled={defects.length === 0}>Export Defect List PDF</Button>
        </div>
      </div>

      {defects.length === 0 ? (
        <Empty icon={Search} title="No defects yet" text="Create your first defect to start your punch list." action={() => setCreateOpen(true)} actionText="Create Defect" />
      ) : viewMode === "table" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "90px 1.3fr 1fr 1fr 100px 120px 120px 260px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
            <span>Defect #</span>
            <span>Title</span>
            {!mobile && <span>Location</span>}
            {!mobile && <span>Trade</span>}
            {!mobile && <span style={{ textAlign: "center" }}>Priority</span>}
            <span style={{ textAlign: "center" }}>Status</span>
            {!mobile && <span>Due Date</span>}
            {!mobile && <span style={{ textAlign: "right" }}>Actions</span>}
          </div>
          {defects.map((d) => (
            <div key={d.id} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "90px 1.3fr 1fr 1fr 100px 120px 120px 260px", gap: _.s2, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center" }}>
              <div style={{ fontWeight: _.fontWeight.semi }}>{d.number}</div>
              <div>
                <div style={{ fontWeight: _.fontWeight.medium }}>{d.title}</div>
                {mobile && (
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 2 }}>
                    {[d.location, d.trade].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
              {!mobile && <div style={{ color: _.body }}>{d.location || "—"}</div>}
              {!mobile && <div style={{ color: _.body }}>{d.trade || "—"}</div>}
              {!mobile && (
                <div style={{ textAlign: "center" }}>
                  <span style={badge(PRIORITY_COLORS[d.priority] || _.muted)}>{d.priority}</span>
                </div>
              )}
              <div style={{ textAlign: "center" }}>
                <span style={badge(STATUS_COLORS[d.status] || _.muted)}>{d.status}</span>
              </div>
              {!mobile && <div style={{ color: _.muted }}>{d.dueDate || "—"}</div>}
              {!mobile && (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2 }}>
                  <Button size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(d)}>
                    Edit
                  </Button>
                  {d.status !== "In Progress" && d.status !== "Completed" && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(d.id, "In Progress")}>
                      Start
                    </Button>
                  )}
                  {d.status !== "Completed" && (
                    <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={() => setStatus(d.id, "Completed")}>
                      Mark Complete
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: _.s3 }}>
          {STATUSES.map((status) => (
            <Card key={status} style={{ padding: _.s3 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s2 }}>
                <div style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, color: _.ink }}>{status}</div>
                <span style={badge(STATUS_COLORS[status])}>{defectsByStatus[status].length}</span>
              </div>
              <div style={{ display: "grid", gap: _.s2 }}>
                {defectsByStatus[status].length === 0 ? (
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>No defects</div>
                ) : defectsByStatus[status].map((d) => (
                  <div key={d.id} style={{ border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: _.s2 }}>
                    <div style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi }}>{d.title}</div>
                    <div style={{ fontSize: _.fontSize.caption, color: _.muted, marginTop: 2 }}>
                      {[d.number, d.location, d.trade].filter(Boolean).join(" · ")}
                    </div>
                    <div style={{ display: "flex", gap: _.s1, marginTop: _.s2, flexWrap: "wrap" }}>
                      <span style={badge(PRIORITY_COLORS[d.priority] || _.muted)}>{d.priority}</span>
                      {d.dueDate && <span style={badge(_.faint)}>Due {d.dueDate}</span>}
                    </div>
                    <div style={{ display: "flex", gap: _.s1, marginTop: _.s2 }}>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(d)}>Edit</Button>
                      {status !== "Completed" && (
                        <Button size="sm" variant="secondary" onClick={() => setStatus(d.id, "Completed")}>Complete</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); resetForm(); }} title="Create Defect" width={560}>
        <div style={{ display: "grid", gap: _.s3 }}>
          <div>
            <label style={label}>Title *</label>
            <input style={input} value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} placeholder="Paint touch-up to hallway wall" />
          </div>
          <div>
            <label style={label}>Description</label>
            <textarea style={{ ...input, minHeight: 90, resize: "vertical" }} value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} placeholder="Describe the defect and required fix." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: _.s3 }}>
            <div>
              <label style={label}>Location</label>
              <input style={input} value={form.location} onChange={(e) => setForm((v) => ({ ...v, location: e.target.value }))} placeholder="Kitchen island" />
            </div>
            <div>
              <label style={label}>Trade</label>
              <input list="trade-options" style={input} value={form.trade} onChange={(e) => setForm((v) => ({ ...v, trade: e.target.value }))} placeholder="Carpentry" />
              <datalist id="trade-options">
                {(trades || []).map((t) => (
                  <option key={t.id} value={t.businessName || t.name || ""} />
                ))}
              </datalist>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: _.s3 }}>
            <div>
              <label style={label}>Priority</label>
              <select style={input} value={form.priority} onChange={(e) => setForm((v) => ({ ...v, priority: e.target.value }))}>
                {PRIORITIES.map((p1) => <option key={p1} value={p1}>{p1}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Due Date</label>
              <input type="date" style={input} value={form.dueDate} onChange={(e) => setForm((v) => ({ ...v, dueDate: e.target.value }))} min={toIsoDate()} />
            </div>
          </div>
          <div>
            <label style={label}>Photo Upload (optional)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                try {
                  const urls = await filesToDataUrls(e.target.files);
                  if (!urls.length) return;
                  setForm((v) => ({ ...v, photos: [...(v.photos || []), ...urls] }));
                } catch {
                  notify("Unable to read selected photo", "error");
                }
              }}
            />
            {(form.photos || []).length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: _.s2, marginTop: _.s2 }}>
                {form.photos.map((img, idx) => (
                  <img key={`${img.slice(0, 24)}-${idx}`} src={img} alt="" style={{ width: "100%", height: 60, objectFit: "cover", borderRadius: _.rSm, border: `1px solid ${_.line}` }} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2, marginTop: _.s4 }}>
          <Button variant="ghost" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
          <Button onClick={handleCreate}>Create Defect</Button>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditingId(""); resetForm(); }} title="Edit Defect" width={560}>
        <div style={{ display: "grid", gap: _.s3 }}>
          <div>
            <label style={label}>Title *</label>
            <input style={input} value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
          </div>
          <div>
            <label style={label}>Description</label>
            <textarea style={{ ...input, minHeight: 90, resize: "vertical" }} value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: _.s3 }}>
            <div>
              <label style={label}>Location</label>
              <input style={input} value={form.location} onChange={(e) => setForm((v) => ({ ...v, location: e.target.value }))} />
            </div>
            <div>
              <label style={label}>Trade</label>
              <input style={input} value={form.trade} onChange={(e) => setForm((v) => ({ ...v, trade: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: _.s3 }}>
            <div>
              <label style={label}>Priority</label>
              <select style={input} value={form.priority} onChange={(e) => setForm((v) => ({ ...v, priority: e.target.value }))}>
                {PRIORITIES.map((p1) => <option key={p1} value={p1}>{p1}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Due Date</label>
              <input type="date" style={input} value={form.dueDate} onChange={(e) => setForm((v) => ({ ...v, dueDate: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: _.s2, flexWrap: "wrap" }}>
            <Button size="sm" variant="ghost" onClick={() => setStatus(editingId, "Open")}>Set Open</Button>
            <Button size="sm" variant="ghost" onClick={() => setStatus(editingId, "In Progress")}>Set In Progress</Button>
            <Button size="sm" variant="secondary" onClick={() => setStatus(editingId, "Completed")}>Set Completed</Button>
            <Button size="sm" variant="danger" onClick={() => { removeDefect(editingId); setEditOpen(false); setEditingId(""); resetForm(); }}>
              Delete
            </Button>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2, marginTop: _.s4 }}>
          <Button variant="ghost" onClick={() => { setEditOpen(false); setEditingId(""); resetForm(); }}>Cancel</Button>
          <Button onClick={saveEdit}>Save Changes</Button>
        </div>
      </Modal>
    </Section>
  );
}
