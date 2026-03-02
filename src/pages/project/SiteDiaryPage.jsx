import { useState } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { input, label, badge, ds } from "../../theme/styles.js";
import { WEATHER } from "../../data/defaults.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import { BookOpen, X } from "lucide-react";

export default function SiteDiaryPage() {
  const { project: p, update: up, log } = useProject();
  const { mobile, notify } = useApp();
  const [diaryForm, setDiaryForm] = useState({ date: "", weather: "Clear", trades: "", notes: "" });
  const [editIdx, setEditIdx] = useState(null);
  const [editDiary, setEditDiary] = useState({});

  return (
    <Section>
      <h1 style={{ fontSize: _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: _.s7 }}>Site Diary</h1>
      <div style={{ marginBottom: _.s7, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: `${_.s3}px ${_.s4}px`, marginBottom: _.s3 }}>
          <div><label style={label}>Date</label><input type="date" style={{ ...input, cursor: "pointer" }} value={diaryForm.date} onChange={e => setDiaryForm({ ...diaryForm, date: e.target.value })} /></div>
          <div><label style={label}>Weather</label><select style={{ ...input, cursor: "pointer" }} value={diaryForm.weather} onChange={e => setDiaryForm({ ...diaryForm, weather: e.target.value })}>{WEATHER.map(w => <option key={w}>{w}</option>)}</select></div>
          <div><label style={label}>Trades on site</label><input style={input} value={diaryForm.trades} onChange={e => setDiaryForm({ ...diaryForm, trades: e.target.value })} placeholder="Plumber, Sparky" /></div>
        </div>
        <div><label style={label}>Notes</label><textarea style={{ ...input, minHeight: 64, resize: "vertical" }} value={diaryForm.notes} onChange={e => setDiaryForm({ ...diaryForm, notes: e.target.value })} placeholder="What happened on site today..." /></div>
        <div style={{ marginTop: _.s3 }}><Button onClick={() => {
          if (!diaryForm.notes && !diaryForm.trades) { notify("Add notes", "error"); return; }
          const entryDate = diaryForm.date ? new Date(diaryForm.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : ds();
          up(pr => { pr.diary.unshift({ date: entryDate, weather: diaryForm.weather, trades: diaryForm.trades, notes: diaryForm.notes }); return pr; });
          log("Diary: " + diaryForm.weather + (diaryForm.trades ? ", " + diaryForm.trades : ""));
          setDiaryForm({ date: "", weather: "Clear", trades: "", notes: "" }); notify("Logged");
        }}>Log entry</Button></div>
      </div>

      {p.diary.length === 0 && <Empty icon={BookOpen} text="No entries yet" />}
      {p.diary.map((d, i) => (
        <div key={i} style={{ padding: `${_.s4}px 0`, borderBottom: `1px solid ${_.line}` }}>
          {editIdx === i ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: `${_.s3}px ${_.s4}px`, marginBottom: _.s3 }}>
                <div><label style={label}>Weather</label><select style={{ ...input, cursor: "pointer" }} value={editDiary.weather} onChange={e => setEditDiary({ ...editDiary, weather: e.target.value })}>{WEATHER.map(w => <option key={w}>{w}</option>)}</select></div>
                <div><label style={label}>Trades on site</label><input style={input} value={editDiary.trades} onChange={e => setEditDiary({ ...editDiary, trades: e.target.value })} /></div>
              </div>
              <div><label style={label}>Notes</label><textarea style={{ ...input, minHeight: 64, resize: "vertical" }} value={editDiary.notes} onChange={e => setEditDiary({ ...editDiary, notes: e.target.value })} /></div>
              <div style={{ display: "flex", gap: _.s2, marginTop: _.s2 }}>
                <Button size="sm" onClick={() => { up(pr => { pr.diary[i] = { ...pr.diary[i], weather: editDiary.weather, trades: editDiary.trades, notes: editDiary.notes }; return pr; }); setEditIdx(null); notify("Updated"); }}>Save</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditIdx(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                  <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi }}>{d.date}</span>
                  <span style={badge(_.muted)}>{d.weather}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: _.s3 }}>
                  <span onClick={() => { setEditIdx(i); setEditDiary({ weather: d.weather, trades: d.trades || "", notes: d.notes || "" }); }} style={{ fontSize: _.fontSize.sm, color: _.ac, cursor: "pointer", fontWeight: _.fontWeight.medium }}>Edit</span>
                  <div onClick={() => { up(pr => { pr.diary.splice(i, 1); return pr; }); notify("Removed"); }}
                    style={{ cursor: "pointer", color: _.faint, transition: "color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = _.red}
                    onMouseLeave={e => e.currentTarget.style.color = _.faint}
                  ><X size={14} /></div>
                </div>
              </div>
              {d.trades && <div style={{ fontSize: _.fontSize.base, color: _.ac, fontWeight: _.fontWeight.medium, marginBottom: 2 }}>{d.trades}</div>}
              {d.notes && <div style={{ fontSize: _.fontSize.md, color: _.body, lineHeight: 1.6 }}>{d.notes}</div>}
            </>
          )}
        </div>
      ))}
    </Section>
  );
}
