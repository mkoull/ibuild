import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { input, label, btnPrimary, btnSecondary, btnGhost, fmt, pName } from "../../theme/styles.js";
import { mkContact } from "../../data/models.js";
import { selectCalc as calc } from "../../lib/selectors.js";
import Section from "../../components/ui/Section.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import { ArrowLeft, Plus, X } from "lucide-react";

export default function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clientsHook, projects, clients, update, mobile, notify } = useApp();
  const [showDelete, setShowDelete] = useState(false);

  const client = clientsHook.find(clientId);
  if (!client) return <Section><div style={{ color: _.muted }}>Client not found</div></Section>;

  const up = (fn) => clientsHook.update(clientId, fn);
  const ensurePrimary = () => {
    if (Array.isArray(client.contacts) && client.contacts.length > 0) return;
    up(c => {
      if (!Array.isArray(c.contacts)) c.contacts = [];
      if (c.contacts.length === 0) c.contacts.push(mkContact({ role: "Primary" }));
      return c;
    });
  };
  const primary = (client.contacts || [])[0];

  const linkedProjects = projects.filter(p => p.clientId === clientId);
  const deleteClient = () => {
    linkedProjects.forEach(pr => {
      update(pr.id, p => {
        p.clientId = "";
        if ((p.client || "").trim().toLowerCase() === (client.displayName || "").trim().toLowerCase()) {
          p.client = "";
        }
        return p;
      });
    });
    clientsHook.remove(clientId);
    notify("Client deleted");
    navigate("/clients");
  };

  return (
    <Section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
        <button onClick={() => navigate("/clients")} style={btnGhost}><ArrowLeft size={14} /> Clients</button>
        <h1 style={{ fontSize: _.fontSize["3xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, flex: 1 }}>{client.displayName || "Unnamed Client"}</h1>
        <button onClick={() => setShowDelete(true)} style={{ ...btnGhost, color: _.red }}>Delete Client</button>
      </div>

      {/* Details form */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: 16 }}>Details</div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: `${_.s3}px ${_.s4}px` }}>
          <div><label style={label}>Display Name</label><input style={input} value={client.displayName} onChange={e => up(c => { c.displayName = e.target.value; })} /></div>
          <div><label style={label}>Company Name</label><input style={input} value={client.companyName} onChange={e => up(c => { c.companyName = e.target.value; })} /></div>
        </div>
        <div style={{ marginTop: _.s3 }}>
          <label style={label}>Notes</label>
          <textarea style={{ ...input, minHeight: 56, resize: "vertical" }} value={client.notes} onChange={e => up(c => { c.notes = e.target.value; })} placeholder="Notes about this client..." />
        </div>
      </div>

      {/* Primary contact */}
      <div style={{ marginBottom: 32, paddingTop: 24, borderTop: `1px solid ${_.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, color: _.ink }}>Primary Contact</div>
          {!primary && <button onClick={ensurePrimary} style={btnSecondary}><Plus size={13} /> Add Primary</button>}
        </div>
        {primary ? (
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr 1fr", gap: _.s3 }}>
            <div><label style={label}>Name</label><input style={input} value={primary.name || ""} onChange={e => up(c => { c.contacts[0].name = e.target.value; })} /></div>
            <div><label style={label}>Email</label><input style={input} value={primary.email || ""} onChange={e => up(c => { c.contacts[0].email = e.target.value; })} /></div>
            <div><label style={label}>Phone</label><input style={input} value={primary.phone || ""} onChange={e => up(c => { c.contacts[0].phone = e.target.value; })} /></div>
            <div><label style={label}>Role</label><input style={input} value={primary.role || ""} onChange={e => up(c => { c.contacts[0].role = e.target.value; })} /></div>
            <div style={{ gridColumn: mobile ? "auto" : "1 / span 2" }}>
              <label style={label}>Address</label>
              <input style={input} value={primary.address || ""} onChange={e => up(c => { c.contacts[0].address = e.target.value; })} placeholder="Street address" />
            </div>
            <div>
              <label style={label}>Suburb</label>
              <input style={input} value={primary.suburb || ""} onChange={e => up(c => { c.contacts[0].suburb = e.target.value; })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s2 }}>
              <div>
                <label style={label}>State</label>
                <input style={input} value={primary.state || ""} onChange={e => up(c => { c.contacts[0].state = e.target.value; })} />
              </div>
              <div>
                <label style={label}>Postcode</label>
                <input style={input} value={primary.postcode || ""} onChange={e => up(c => { c.contacts[0].postcode = e.target.value; })} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: _.fontSize.base, color: _.muted }}>No primary contact yet</div>
        )}
      </div>

      {/* Additional contacts */}
      <div style={{ marginBottom: 32, paddingTop: 24, borderTop: `1px solid ${_.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, color: _.ink }}>Additional Contacts</div>
          <button onClick={() => up(c => { c.contacts.push(mkContact()); })} style={btnSecondary}><Plus size={13} /> Add Contact</button>
        </div>
        {(client.contacts || []).length <= 1 && <div style={{ fontSize: _.fontSize.base, color: _.muted }}>No additional contacts</div>}
        {(client.contacts || []).slice(1).map((ct, i) => {
          const idx = i + 1;
          return (
          <div key={ct.id} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr auto", gap: _.s3, marginBottom: _.s3, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}` }}>
            <div><label style={label}>Name</label><input style={input} value={ct.name} onChange={e => up(c => { c.contacts[idx].name = e.target.value; })} /></div>
            <div><label style={label}>Email</label><input style={input} value={ct.email} onChange={e => up(c => { c.contacts[idx].email = e.target.value; })} /></div>
            <div><label style={label}>Phone</label><input style={input} value={ct.phone} onChange={e => up(c => { c.contacts[idx].phone = e.target.value; })} /></div>
            <div><label style={label}>Role</label><input style={input} value={ct.role} onChange={e => up(c => { c.contacts[idx].role = e.target.value; })} /></div>
            <div style={{ gridColumn: mobile ? "1 / -1" : "1 / span 2" }}>
              <label style={label}>Address</label>
              <input style={input} value={ct.address || ""} onChange={e => up(c => { c.contacts[idx].address = e.target.value; })} placeholder="Street address" />
            </div>
            <div>
              <label style={label}>Suburb</label>
              <input style={input} value={ct.suburb || ""} onChange={e => up(c => { c.contacts[idx].suburb = e.target.value; })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s2 }}>
              <div>
                <label style={label}>State</label>
                <input style={input} value={ct.state || ""} onChange={e => up(c => { c.contacts[idx].state = e.target.value; })} />
              </div>
              <div>
                <label style={label}>Postcode</label>
                <input style={input} value={ct.postcode || ""} onChange={e => up(c => { c.contacts[idx].postcode = e.target.value; })} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
              <div onClick={() => up(c => { c.contacts.splice(idx, 1); })} style={{ cursor: "pointer", color: _.faint, padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = _.red}
                onMouseLeave={e => e.currentTarget.style.color = _.faint}
              ><X size={14} /></div>
            </div>
          </div>
        );})}
      </div>

      {/* Linked projects */}
      <div style={{ paddingTop: 24, borderTop: `1px solid ${_.line}` }}>
        <div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: 16 }}>Linked Projects</div>
        {linkedProjects.length === 0 && <div style={{ fontSize: _.fontSize.base, color: _.muted }}>No projects linked to this client</div>}
        {linkedProjects.map(pr => (
          <div key={pr.id} onClick={() => navigate(`/projects/${pr.id}/overview`)} style={{
            padding: "10px 0", borderBottom: `1px solid ${_.line}`, cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium }}>{pName(pr, clients)}</span>
            <span style={{ fontSize: _.fontSize.base, color: _.muted }}>{fmt(calc(pr).curr)}</span>
          </div>
        ))}
      </div>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Client" width={420}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, lineHeight: _.lineHeight.body, marginBottom: _.s5 }}>
          Delete <strong>{client.displayName || "this client"}</strong>?
          {linkedProjects.length > 0 && (
            <div style={{ marginTop: _.s2 }}>
              This will unlink {linkedProjects.length} project{linkedProjects.length !== 1 ? "s" : ""} from this client.
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2 }}>
          <Button variant="ghost" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={deleteClient}>Delete</Button>
        </div>
      </Modal>
    </Section>
  );
}
