import { useState } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { input, label, btnPrimary, btnGhost, badge } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import { Wrench, X, Plus, Check, Pencil } from "lucide-react";

export default function ProjectTradesPage() {
  const { project: p, update: up, log } = useProject();
  const { trades, mobile, notify } = useApp();
  const [trForm, setTrForm] = useState({ trade: "", company: "", contact: "", phone: "" });
  const [editTradeIdx, setEditTradeIdx] = useState(null);
  const [editTrade, setEditTrade] = useState({});

  // Legacy trades stored on project directly
  const projectTrades = p.trades || [];
  const assignedTradeIds = p.assignedTradeIds || [];

  // Global trades not yet assigned
  const unassigned = trades.filter(t => !assignedTradeIds.includes(t.id));

  return (
    <Section>
      <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: _.s7 }}>Trades</h1>

      {/* Assign from global trades */}
      {trades.length > 0 && (
        <div style={{ marginBottom: _.s7, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
          <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: _.s4 }}>Assign from Trade Directory</div>
          {unassigned.length === 0 && <div style={{ fontSize: 13, color: _.muted }}>All trades assigned</div>}
          {unassigned.map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${_.line}` }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{t.businessName}</span>
                <span style={{ fontSize: 12, color: _.muted, marginLeft: 8 }}>{t.category}</span>
              </div>
              <button onClick={() => {
                up(pr => { if (!pr.assignedTradeIds) pr.assignedTradeIds = []; pr.assignedTradeIds.push(t.id); return pr; });
                log("Trade assigned: " + t.businessName); notify("Assigned");
              }} style={{ padding: "4px 12px", background: _.well, border: "none", borderRadius: _.rSm, fontSize: 12, fontWeight: 600, cursor: "pointer", color: _.ac }}><Plus size={12} /> Assign</button>
            </div>
          ))}
        </div>
      )}

      {/* Assigned global trades */}
      {assignedTradeIds.length > 0 && (
        <div style={{ marginBottom: _.s7, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
          <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: _.s4 }}>Assigned Trades</div>
          {assignedTradeIds.map(tid => {
            const t = trades.find(tr => tr.id === tid);
            if (!t) return null;
            const contact = t.contacts?.[0];
            return (
              <div key={tid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${_.s4}px 0`, borderBottom: `1px solid ${_.line}` }}>
                <div>
                  <span style={badge(_.ink)}>{t.category}</span>
                  <div style={{ fontSize: 14, fontWeight: 500, marginTop: 6 }}>{t.businessName}</div>
                  {contact && <div style={{ fontSize: 12, color: _.muted, marginTop: 1 }}>{contact.name}{contact.phone ? ` · ${contact.phone}` : ""}</div>}
                </div>
                <div onClick={() => { up(pr => { pr.assignedTradeIds = pr.assignedTradeIds.filter(id => id !== tid); return pr; }); notify("Removed"); }}
                  style={{ cursor: "pointer", color: _.faint }}
                  onMouseEnter={e => e.currentTarget.style.color = _.red}
                  onMouseLeave={e => e.currentTarget.style.color = _.faint}
                ><X size={14} /></div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legacy inline trades */}
      <div style={{ marginBottom: _.s7, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
        <div style={{ fontSize: 11, color: _.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: _.s4 }}>Quick Add</div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: _.s4 }}>
          {[["Trade", "trade", "Electrician"], ["Company", "company", "Spark Bros"], ["Contact", "contact", "Dave"], ["Phone", "phone", "0412..."]].map(([l, k, ph]) => (
            <div key={k}><label style={label}>{l}</label><input style={input} value={trForm[k]} onChange={e => setTrForm({ ...trForm, [k]: e.target.value })} placeholder={ph} /></div>
          ))}
        </div>
        <button onClick={() => {
          if (!trForm.trade) { notify("Enter trade", "error"); return; }
          up(pr => { if (!pr.trades) pr.trades = []; pr.trades.push({ ...trForm }); return pr; });
          log("Trade added: " + trForm.trade); setTrForm({ trade: "", company: "", contact: "", phone: "" }); notify("Added");
        }} style={{ ...btnPrimary, marginTop: _.s3 }}>Add trade</button>
      </div>

      {projectTrades.length === 0 && assignedTradeIds.length === 0 && <Empty icon={Wrench} text="No trades assigned" />}
      {projectTrades.map((tr, i) => (
        <div key={i} style={{ padding: `${_.s4}px 0`, borderBottom: `1px solid ${_.line}` }}>
          {editTradeIdx === i ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: _.s3, marginBottom: _.s2 }}>
                {[["Trade", "trade"], ["Company", "company"], ["Contact", "contact"], ["Phone", "phone"]].map(([l, k]) => (
                  <div key={k}><label style={label}>{l}</label><input style={input} value={editTrade[k]} onChange={e => setEditTrade({ ...editTrade, [k]: e.target.value })} /></div>
                ))}
              </div>
              <div style={{ display: "flex", gap: _.s2 }}>
                <button onClick={() => { up(pr => { pr.trades[i] = { ...editTrade }; return pr; }); setEditTradeIdx(null); notify("Updated"); }} style={btnPrimary}>Save</button>
                <button onClick={() => setEditTradeIdx(null)} style={btnGhost}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={badge(_.ink)}>{tr.trade}</span>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 6 }}>{tr.company}</div>
                {tr.contact && <div style={{ fontSize: 12, color: _.muted, marginTop: 1 }}>{tr.contact}</div>}
              </div>
              <div style={{ display: "flex", gap: _.s2, alignItems: "center" }}>
                {tr.phone && <a href={`tel:${tr.phone}`} style={{ fontSize: 13, color: _.ac, textDecoration: "none", fontWeight: 500 }}>{tr.phone}</a>}
                <div onClick={() => { setEditTradeIdx(i); setEditTrade({ trade: tr.trade || "", company: tr.company || "", contact: tr.contact || "", phone: tr.phone || "" }); }}
                  style={{ cursor: "pointer", color: _.faint, transition: "color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = _.ac}
                  onMouseLeave={e => e.currentTarget.style.color = _.faint}
                ><Pencil size={13} /></div>
                <div onClick={() => { up(pr => { pr.trades.splice(i, 1); return pr; }); notify("Removed"); }}
                  style={{ cursor: "pointer", color: _.faint, transition: "color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = _.red}
                  onMouseLeave={e => e.currentTarget.style.color = _.faint}
                ><X size={14} /></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </Section>
  );
}
