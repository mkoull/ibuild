import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { input, label, btnSecondary, btnGhost } from "../../theme/styles.js";
import { mkContact } from "../../data/models.js";
import Section from "../../components/ui/Section.jsx";
import { ArrowLeft, Plus, X } from "lucide-react";

export default function TradeDetailPage() {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const { tradesHook, rateLibrary, mobile } = useApp();

  const trade = tradesHook.find(tradeId);
  if (!trade) return <Section><div style={{ color: _.muted }}>Trade not found</div></Section>;

  const up = (fn) => tradesHook.update(tradeId, fn);

  // Ensure arrays exist for backwards compat
  const regions = trade.regions || [];
  const tags = trade.tags || [];
  const defaultRateIds = trade.defaultRateIds || [];

  return (
    <Section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
        <button onClick={() => navigate("/trades")} style={btnGhost}><ArrowLeft size={14} /> Trades</button>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", flex: 1 }}>{trade.businessName || "Unnamed Trade"}</h1>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: _.ink, marginBottom: 16 }}>Details</div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: `${_.s3}px ${_.s4}px` }}>
          <div><label style={label}>Business Name</label><input style={input} value={trade.businessName} onChange={e => up(t => { t.businessName = e.target.value; })} /></div>
          <div><label style={label}>Category</label><input style={input} value={trade.category} onChange={e => up(t => { t.category = e.target.value; })} placeholder="Electrician, Plumber, etc." /></div>
          <div>
            <label style={label}>Status</label>
            <select style={{ ...input, cursor: "pointer" }} value={trade.status} onChange={e => up(t => { t.status = e.target.value; })}>
              {["active", "inactive", "archived"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label style={label}>Licence Info</label><input style={input} value={trade.licenceInfo} onChange={e => up(t => { t.licenceInfo = e.target.value; })} placeholder="Licence number" /></div>
          <div><label style={label}>Insurance Info</label><input style={input} value={trade.insuranceInfo} onChange={e => up(t => { t.insuranceInfo = e.target.value; })} placeholder="Insurance details" /></div>
          <div>
            <label style={label}>Regions</label>
            <input style={input} value={regions.join(", ")} onChange={e => up(t => { t.regions = e.target.value.split(",").map(s => s.trim()).filter(Boolean); })} placeholder="Melbourne, Geelong, Ballarat" />
          </div>
          <div style={{ gridColumn: mobile ? "1" : "1 / -1" }}>
            <label style={label}>Tags</label>
            <input style={input} value={tags.join(", ")} onChange={e => up(t => { t.tags = e.target.value.split(",").map(s => s.trim()).filter(Boolean); })} placeholder="Residential, Commercial, Heritage" />
          </div>
        </div>
        <div style={{ marginTop: _.s3 }}>
          <label style={label}>Notes</label>
          <textarea style={{ ...input, minHeight: 56, resize: "vertical" }} value={trade.notes} onChange={e => up(t => { t.notes = e.target.value; })} />
        </div>
      </div>

      {/* Default Rates */}
      <div style={{ paddingTop: 24, borderTop: `1px solid ${_.line}`, marginBottom: 32 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: _.ink, marginBottom: 8 }}>Default Rates</div>
        <div style={{ fontSize: 12, color: _.muted, marginBottom: 16 }}>Link rate library items this trade commonly supplies.</div>
        {rateLibrary.items.length === 0 ? (
          <div style={{ fontSize: 13, color: _.faint }}>No rate library items yet. <span onClick={() => navigate("/rate-library")} style={{ color: _.ac, cursor: "pointer" }}>Add some</span>.</div>
        ) : (
          <>
            {defaultRateIds.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {defaultRateIds.map(rId => {
                  const item = rateLibrary.items.find(i => i.id === rId);
                  if (!item) return null;
                  return (
                    <div key={rId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${_.line}` }}>
                      <span style={{ fontSize: 13, color: _.ink }}>{item.name} — {item.unit} @ ${item.unitRate}</span>
                      <div onClick={() => up(t => { t.defaultRateIds = (t.defaultRateIds || []).filter(id => id !== rId); })}
                        style={{ cursor: "pointer", color: _.faint, padding: 2 }}
                        onMouseEnter={e => e.currentTarget.style.color = _.red}
                        onMouseLeave={e => e.currentTarget.style.color = _.faint}
                      ><X size={12} /></div>
                    </div>
                  );
                })}
              </div>
            )}
            <select style={{ ...input, cursor: "pointer", maxWidth: 300 }} value="" onChange={e => {
              if (e.target.value) up(t => { t.defaultRateIds = [...(t.defaultRateIds || []), e.target.value]; });
            }}>
              <option value="">Add rate item...</option>
              {rateLibrary.items.filter(i => !defaultRateIds.includes(i.id)).map(i => (
                <option key={i.id} value={i.id}>{i.name} — {i.unit} @ ${i.unitRate}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Contacts */}
      <div style={{ paddingTop: 24, borderTop: `1px solid ${_.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: _.ink }}>Contacts</div>
          <button onClick={() => up(t => { t.contacts.push(mkContact()); })} style={btnSecondary}><Plus size={13} /> Add Contact</button>
        </div>
        {trade.contacts.length === 0 && <div style={{ fontSize: 13, color: _.muted }}>No contacts</div>}
        {trade.contacts.map((ct, i) => (
          <div key={ct.id} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr auto", gap: _.s3, marginBottom: _.s3, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}` }}>
            <div><label style={label}>Name</label><input style={input} value={ct.name} onChange={e => up(t => { t.contacts[i].name = e.target.value; })} /></div>
            <div><label style={label}>Email</label><input style={input} value={ct.email} onChange={e => up(t => { t.contacts[i].email = e.target.value; })} /></div>
            <div><label style={label}>Phone</label><input style={input} value={ct.phone} onChange={e => up(t => { t.contacts[i].phone = e.target.value; })} /></div>
            <div><label style={label}>Role</label><input style={input} value={ct.role} onChange={e => up(t => { t.contacts[i].role = e.target.value; })} /></div>
            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
              <div onClick={() => up(t => { t.contacts.splice(i, 1); })} style={{ cursor: "pointer", color: _.faint, padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = _.red}
                onMouseLeave={e => e.currentTarget.style.color = _.faint}
              ><X size={14} /></div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
