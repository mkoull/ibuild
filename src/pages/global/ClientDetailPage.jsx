import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { input, label, btnPrimary, btnSecondary, btnGhost, fmt, pName } from "../../theme/styles.js";
import { mkContact } from "../../data/models.js";
import { calc } from "../../lib/calc.js";
import Section from "../../components/ui/Section.jsx";
import { ArrowLeft, Plus, X } from "lucide-react";

export default function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clientsHook, projects, clients, mobile, notify } = useApp();

  const client = clientsHook.find(clientId);
  if (!client) return <Section><div style={{ color: _.muted }}>Client not found</div></Section>;

  const up = (fn) => clientsHook.update(clientId, fn);

  const linkedProjects = projects.filter(p => p.clientId === clientId);

  return (
    <Section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
        <button onClick={() => navigate("/clients")} style={btnGhost}><ArrowLeft size={14} /> Clients</button>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", flex: 1 }}>{client.displayName || "Unnamed Client"}</h1>
      </div>

      {/* Details form */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: _.ink, marginBottom: 16 }}>Details</div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: `${_.s3}px ${_.s4}px` }}>
          <div><label style={label}>Display Name</label><input style={input} value={client.displayName} onChange={e => up(c => { c.displayName = e.target.value; })} /></div>
          <div><label style={label}>Company Name</label><input style={input} value={client.companyName} onChange={e => up(c => { c.companyName = e.target.value; })} /></div>
          <div>
            <label style={label}>Status</label>
            <select style={{ ...input, cursor: "pointer" }} value={client.status} onChange={e => up(c => { c.status = e.target.value; })}>
              {["active", "inactive", "archived"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: _.s3 }}>
          <label style={label}>Notes</label>
          <textarea style={{ ...input, minHeight: 56, resize: "vertical" }} value={client.notes} onChange={e => up(c => { c.notes = e.target.value; })} placeholder="Notes about this client..." />
        </div>
      </div>

      {/* Contacts */}
      <div style={{ marginBottom: 32, paddingTop: 24, borderTop: `1px solid ${_.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: _.ink }}>Contacts</div>
          <button onClick={() => up(c => { c.contacts.push(mkContact()); })} style={btnSecondary}><Plus size={13} /> Add Contact</button>
        </div>
        {client.contacts.length === 0 && <div style={{ fontSize: 13, color: _.muted }}>No contacts</div>}
        {client.contacts.map((ct, i) => (
          <div key={ct.id} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr auto", gap: _.s3, marginBottom: _.s3, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}` }}>
            <div><label style={label}>Name</label><input style={input} value={ct.name} onChange={e => up(c => { c.contacts[i].name = e.target.value; })} /></div>
            <div><label style={label}>Email</label><input style={input} value={ct.email} onChange={e => up(c => { c.contacts[i].email = e.target.value; })} /></div>
            <div><label style={label}>Phone</label><input style={input} value={ct.phone} onChange={e => up(c => { c.contacts[i].phone = e.target.value; })} /></div>
            <div><label style={label}>Role</label><input style={input} value={ct.role} onChange={e => up(c => { c.contacts[i].role = e.target.value; })} /></div>
            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
              <div onClick={() => up(c => { c.contacts.splice(i, 1); })} style={{ cursor: "pointer", color: _.faint, padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = _.red}
                onMouseLeave={e => e.currentTarget.style.color = _.faint}
              ><X size={14} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Linked projects */}
      <div style={{ paddingTop: 24, borderTop: `1px solid ${_.line}` }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: _.ink, marginBottom: 16 }}>Linked Projects</div>
        {linkedProjects.length === 0 && <div style={{ fontSize: 13, color: _.muted }}>No projects linked to this client</div>}
        {linkedProjects.map(pr => (
          <div key={pr.id} onClick={() => navigate(`/projects/${pr.id}/overview`)} style={{
            padding: "10px 0", borderBottom: `1px solid ${_.line}`, cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{pName(pr, clients)}</span>
            <span style={{ fontSize: 13, color: _.muted }}>{fmt(calc(pr).curr)}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
