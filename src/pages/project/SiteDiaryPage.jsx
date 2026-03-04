import { useMemo, useState } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { input, label, badge, ds, uid } from "../../theme/styles.js";
import { WEATHER } from "../../data/defaults.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Card from "../../components/ui/Card.jsx";
import { BookOpen, X, Plus, Pencil, Camera } from "lucide-react";

function toDateValue(dateLabel) {
  if (!dateLabel) return "";
  const parsed = new Date(dateLabel);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  return "";
}

function toDisplayDate(rawDate) {
  if (!rawDate) return ds();
  const parsed = new Date(rawDate);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  }
  return rawDate;
}

async function filesToDataUrls(fileList) {
  const files = Array.from(fileList || []);
  const tasks = files.map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  }));
  const results = await Promise.all(tasks);
  return results.filter(Boolean);
}

function makeEmptyForm() {
  return {
    date: "",
    weather: "Clear",
    tradeIds: [],
    notes: "",
    issues: "",
    photos: [],
  };
}

function normaliseEntry(entry, index, trades) {
  const tradeById = new Map((trades || []).map((t) => [t.id, t.businessName || t.name || t.id]));
  const tradeIds = Array.isArray(entry.tradeIds) ? entry.tradeIds : [];
  const legacyTrades = String(entry.trades || "").split(",").map((s) => s.trim()).filter(Boolean);
  const tradeNames = tradeIds.length > 0
    ? tradeIds.map((id) => tradeById.get(id) || id)
    : (Array.isArray(entry.tradeNames) && entry.tradeNames.length > 0 ? entry.tradeNames : legacyTrades);

  const photos = Array.isArray(entry.photos) ? entry.photos.filter(Boolean) : [];
  return {
    id: entry.id || `DIARY-${index}`,
    date: entry.date || ds(),
    weather: entry.weather || "Clear",
    tradeIds,
    tradeNames,
    notes: entry.notes || "",
    issues: entry.issues || "",
    photos,
    createdAt: entry.createdAt || "",
  };
}

export default function SiteDiaryPage() {
  const { project: p, update: up, log } = useProject();
  const { mobile, notify, trades, addNotification } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [createForm, setCreateForm] = useState(makeEmptyForm);
  const [editForm, setEditForm] = useState(makeEmptyForm);
  const [editEntryId, setEditEntryId] = useState("");

  const normalisedEntries = useMemo(() => {
    const list = Array.isArray(p.diary) ? p.diary : [];
    return list
      .map((entry, idx) => normaliseEntry(entry, idx, trades))
      .sort((a, b) => {
        const da = new Date(a.date);
        const db = new Date(b.date);
        const ta = Number.isNaN(da.getTime()) ? 0 : da.getTime();
        const tb = Number.isNaN(db.getTime()) ? 0 : db.getTime();
        return tb - ta;
      });
  }, [p.diary, trades]);

  const summary = useMemo(() => {
    const totalEntries = normalisedEntries.length;
    const issuesLogged = normalisedEntries.filter((e) => String(e.issues || "").trim().length > 0).length;
    const photosUploaded = normalisedEntries.reduce((sum, e) => sum + (Array.isArray(e.photos) ? e.photos.length : 0), 0);
    return { totalEntries, issuesLogged, photosUploaded };
  }, [normalisedEntries]);

  const tradeNameById = useMemo(
    () => new Map((trades || []).map((t) => [t.id, t.businessName || t.name || t.id])),
    [trades],
  );

  const openEdit = (entry) => {
    setEditEntryId(entry.id);
    setEditForm({
      date: toDateValue(entry.date),
      weather: entry.weather || "Clear",
      tradeIds: Array.isArray(entry.tradeIds) ? [...entry.tradeIds] : [],
      notes: entry.notes || "",
      issues: entry.issues || "",
      photos: Array.isArray(entry.photos) ? [...entry.photos] : [],
    });
    setShowEdit(true);
  };

  const submitCreate = () => {
    if (!createForm.notes.trim() && !createForm.issues.trim() && createForm.tradeIds.length === 0) {
      notify("Add notes, issues, or at least one trade", "error");
      return;
    }
    const entryDate = createForm.date ? toDisplayDate(createForm.date) : ds();
    up((pr) => {
      if (!Array.isArray(pr.diary)) pr.diary = [];
      const tradeNames = createForm.tradeIds.map((id) => tradeNameById.get(id) || id);
      pr.diary.unshift({
        id: uid(),
        date: entryDate,
        weather: createForm.weather,
        tradeIds: [...createForm.tradeIds],
        tradeNames,
        trades: tradeNames.join(", "),
        notes: createForm.notes.trim(),
        issues: createForm.issues.trim(),
        photos: [...createForm.photos],
        createdAt: new Date().toISOString(),
      });
      return pr;
    });
    log(`Diary entry added (${createForm.weather})`);
    addNotification({
      message: `Site diary entry added: ${entryDate}`,
      type: "site_diary_added",
      link: `/projects/${p.id}/site-diary`,
    });
    notify("Diary entry saved");
    setCreateForm(makeEmptyForm());
    setShowCreate(false);
  };

  const submitEdit = () => {
    if (!editEntryId) return;
    up((pr) => {
      if (!Array.isArray(pr.diary)) return pr;
      const idx = pr.diary.findIndex((d, i) => (d.id || `DIARY-${i}`) === editEntryId);
      if (idx < 0) return pr;
      const tradeNames = editForm.tradeIds.map((id) => tradeNameById.get(id) || id);
      const target = pr.diary[idx];
      target.date = editForm.date ? toDisplayDate(editForm.date) : (target.date || ds());
      target.weather = editForm.weather || "Clear";
      target.tradeIds = [...editForm.tradeIds];
      target.tradeNames = tradeNames;
      target.trades = tradeNames.join(", ");
      target.notes = editForm.notes.trim();
      target.issues = editForm.issues.trim();
      target.photos = [...editForm.photos];
      return pr;
    });
    notify("Diary entry updated");
    setShowEdit(false);
    setEditEntryId("");
    setEditForm(makeEmptyForm());
  };

  const removeEntry = (entryId) => {
    up((pr) => {
      if (!Array.isArray(pr.diary)) return pr;
      const idx = pr.diary.findIndex((d, i) => (d.id || `DIARY-${i}`) === entryId);
      if (idx >= 0) pr.diary.splice(idx, 1);
      return pr;
    });
    notify("Entry removed");
  };

  const toggleTrade = (setFormState, tradeId) => {
    setFormState((f) => {
      const has = f.tradeIds.includes(tradeId);
      return {
        ...f,
        tradeIds: has ? f.tradeIds.filter((id) => id !== tradeId) : [...f.tradeIds, tradeId],
      };
    });
  };

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: _.s3, marginBottom: _.s6, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, margin: 0 }}>
          Site Diary
        </h1>
        <Button icon={Plus} onClick={() => setShowCreate(true)}>New Diary Entry</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: _.s3, marginBottom: _.s6 }}>
        <Card style={{ padding: _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>
            Total Entries
          </div>
          <div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold }}>{summary.totalEntries}</div>
        </Card>
        <Card style={{ padding: _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>
            Issues Logged
          </div>
          <div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: summary.issuesLogged > 0 ? _.amber : _.faint }}>
            {summary.issuesLogged}
          </div>
        </Card>
        <Card style={{ padding: _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>
            Photos Uploaded
          </div>
          <div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: summary.photosUploaded > 0 ? _.ac : _.faint }}>
            {summary.photosUploaded}
          </div>
        </Card>
      </div>

      {normalisedEntries.length === 0 && (
        <Empty
          icon={BookOpen}
          title="No diary entries yet"
          text="Start recording daily activity, site issues, and photos."
          action={() => setShowCreate(true)}
          actionText="New Diary Entry"
        />
      )}

      {normalisedEntries.map((entry) => (
        <div key={entry.id} style={{ position: "relative", marginBottom: _.s4 }}>
          <div style={{ position: "absolute", left: 8, top: 12, bottom: -16, width: 2, background: _.line }} />
          <Card style={{ padding: _.s4, marginLeft: _.s5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s2, gap: _.s2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: _.s2, flexWrap: "wrap" }}>
                <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi }}>{entry.date}</span>
                <span style={badge(_.muted)}>{entry.weather}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                <Button size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(entry)}>Edit</Button>
                <div
                  onClick={() => removeEntry(entry.id)}
                  style={{ cursor: "pointer", color: _.faint, transition: "color 0.15s", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => { e.currentTarget.style.color = _.red; }}
                  onMouseLeave={e => { e.currentTarget.style.color = _.faint; }}
                >
                  <X size={14} />
                </div>
              </div>
            </div>

            {entry.tradeNames.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: _.s1, marginBottom: _.s2 }}>
                {entry.tradeNames.map((name) => (
                  <span key={`${entry.id}-${name}`} style={badge(_.ac)}>{name}</span>
                ))}
              </div>
            )}

            {entry.notes && (
              <div style={{ fontSize: _.fontSize.base, color: _.body, lineHeight: 1.6, marginBottom: _.s2 }}>
                {entry.notes}
              </div>
            )}

            {entry.issues && (
              <div style={{ marginBottom: _.s2 }}>
                <div style={{ fontSize: _.fontSize.xs, color: _.muted, textTransform: "uppercase", letterSpacing: _.letterSpacing.wide, marginBottom: 2 }}>
                  Issues
                </div>
                <div style={{ fontSize: _.fontSize.base, color: _.amber, lineHeight: 1.5 }}>{entry.issues}</div>
              </div>
            )}

            {entry.photos.length > 0 && (
              <div>
                <div style={{ fontSize: _.fontSize.xs, color: _.muted, textTransform: "uppercase", letterSpacing: _.letterSpacing.wide, marginBottom: _.s1 }}>
                  Photos
                </div>
                <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: _.s2 }}>
                  {entry.photos.map((src, idx) => (
                    <img
                      key={`${entry.id}-photo-${idx}`}
                      src={src}
                      alt={`Diary entry ${entry.date} photo ${idx + 1}`}
                      style={{ width: "100%", height: 112, objectFit: "cover", borderRadius: _.rSm, border: `1px solid ${_.line}` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      ))}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Diary Entry" width={680}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: _.s3 }}>
          <div>
            <label style={label}>Date</label>
            <input type="date" style={{ ...input, cursor: "pointer" }} value={createForm.date} onChange={e => setCreateForm({ ...createForm, date: e.target.value })} />
          </div>
          <div>
            <label style={label}>Weather</label>
            <select style={{ ...input, cursor: "pointer" }} value={createForm.weather} onChange={e => setCreateForm({ ...createForm, weather: e.target.value })}>
              {WEATHER.map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Trades on Site</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: _.s2 }}>
              {(trades || []).map((t) => {
                const tName = t.businessName || t.name || t.id;
                const active = createForm.tradeIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTrade(setCreateForm, t.id)}
                    style={{
                      border: `1px solid ${active ? _.ac : _.line}`,
                      background: active ? `${_.ac}14` : _.surface,
                      color: active ? _.ac : _.body,
                      borderRadius: _.rFull,
                      padding: "4px 10px",
                      fontSize: _.fontSize.sm,
                      cursor: "pointer",
                    }}
                  >
                    {tName}
                  </button>
                );
              })}
              {(trades || []).length === 0 && <span style={{ fontSize: _.fontSize.sm, color: _.muted }}>No trades found</span>}
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Notes</label>
            <textarea style={{ ...input, minHeight: 84, resize: "vertical" }} value={createForm.notes} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Issues</label>
            <textarea style={{ ...input, minHeight: 64, resize: "vertical" }} value={createForm.issues} onChange={e => setCreateForm({ ...createForm, issues: e.target.value })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Photo upload (optional)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              style={input}
              onChange={async (e) => {
                const urls = await filesToDataUrls(e.target.files);
                setCreateForm((f) => ({ ...f, photos: [...f.photos, ...urls] }));
              }}
            />
            {createForm.photos.length > 0 && (
              <div style={{ marginTop: _.s2, display: "grid", gridTemplateColumns: mobile ? "repeat(3, 1fr)" : "repeat(5, 1fr)", gap: _.s2 }}>
                {createForm.photos.map((src, idx) => (
                  <div key={`new-photo-${idx}`} style={{ position: "relative" }}>
                    <img src={src} alt={`Upload preview ${idx + 1}`} style={{ width: "100%", height: 72, objectFit: "cover", borderRadius: _.rSm, border: `1px solid ${_.line}` }} />
                    <div
                      onClick={() => setCreateForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }))}
                      style={{ position: "absolute", right: 4, top: 4, cursor: "pointer", background: "#0009", color: "#fff", borderRadius: _.rFull, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={11} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2, marginTop: _.s4 }}>
          <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button icon={Camera} onClick={submitCreate}>Save Entry</Button>
        </div>
      </Modal>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Diary Entry" width={680}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: _.s3 }}>
          <div>
            <label style={label}>Date</label>
            <input type="date" style={{ ...input, cursor: "pointer" }} value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
          </div>
          <div>
            <label style={label}>Weather</label>
            <select style={{ ...input, cursor: "pointer" }} value={editForm.weather} onChange={e => setEditForm({ ...editForm, weather: e.target.value })}>
              {WEATHER.map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Trades on Site</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: _.s2 }}>
              {(trades || []).map((t) => {
                const tName = t.businessName || t.name || t.id;
                const active = editForm.tradeIds.includes(t.id);
                return (
                  <button
                    key={`edit-${t.id}`}
                    type="button"
                    onClick={() => toggleTrade(setEditForm, t.id)}
                    style={{
                      border: `1px solid ${active ? _.ac : _.line}`,
                      background: active ? `${_.ac}14` : _.surface,
                      color: active ? _.ac : _.body,
                      borderRadius: _.rFull,
                      padding: "4px 10px",
                      fontSize: _.fontSize.sm,
                      cursor: "pointer",
                    }}
                  >
                    {tName}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Notes</label>
            <textarea style={{ ...input, minHeight: 84, resize: "vertical" }} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Issues</label>
            <textarea style={{ ...input, minHeight: 64, resize: "vertical" }} value={editForm.issues} onChange={e => setEditForm({ ...editForm, issues: e.target.value })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Photos</label>
            <input
              type="file"
              accept="image/*"
              multiple
              style={input}
              onChange={async (e) => {
                const urls = await filesToDataUrls(e.target.files);
                setEditForm((f) => ({ ...f, photos: [...f.photos, ...urls] }));
              }}
            />
            {editForm.photos.length > 0 && (
              <div style={{ marginTop: _.s2, display: "grid", gridTemplateColumns: mobile ? "repeat(3, 1fr)" : "repeat(5, 1fr)", gap: _.s2 }}>
                {editForm.photos.map((src, idx) => (
                  <div key={`edit-photo-${idx}`} style={{ position: "relative" }}>
                    <img src={src} alt={`Edit preview ${idx + 1}`} style={{ width: "100%", height: 72, objectFit: "cover", borderRadius: _.rSm, border: `1px solid ${_.line}` }} />
                    <div
                      onClick={() => setEditForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }))}
                      style={{ position: "absolute", right: 4, top: 4, cursor: "pointer", background: "#0009", color: "#fff", borderRadius: _.rFull, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={11} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2, marginTop: _.s4 }}>
          <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button onClick={submitEdit}>Save Changes</Button>
        </div>
      </Modal>
    </Section>
  );
}
