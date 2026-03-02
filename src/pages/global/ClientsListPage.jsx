import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { btnPrimary, badge, fmt, input, label } from "../../theme/styles.js";
import { selectCalc as calc } from "../../lib/selectors.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import { Plus, Users, PenLine, Trash2 } from "lucide-react";

export default function ClientsListPage() {
  const { clients, clientsHook, projects, update, mobile, notify } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newForm, setNewForm] = useState({
    displayName: "",
    companyName: "",
    status: "active",
    notes: "",
  });

  const handleNew = () => {
    const name = newForm.displayName.trim();
    if (!name) {
      notify("Client name is required", "error");
      return;
    }
    const c = clientsHook.create({
      displayName: name,
      companyName: newForm.companyName.trim(),
      status: newForm.status || "active",
      notes: newForm.notes.trim(),
    });
    setShowNewModal(false);
    setNewForm({ displayName: "", companyName: "", status: "active", notes: "" });
    navigate(`/clients/${c.id}`);
    notify("Client created");
  };

  const removeClient = () => {
    if (!deleteTarget) return;
    const linked = projects.filter(p => p.clientId === deleteTarget.id);
    linked.forEach(pr => {
      update(pr.id, p => {
        p.clientId = "";
        if ((p.client || "").trim().toLowerCase() === (deleteTarget.displayName || "").trim().toLowerCase()) {
          p.client = "";
        }
        return p;
      });
    });
    clientsHook.remove(deleteTarget.id);
    notify("Client deleted");
    setDeleteTarget(null);
  };

  const filtered = clients.filter(cl => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (cl.displayName || "").toLowerCase().includes(q) || (cl.companyName || "").toLowerCase().includes(q);
  });

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight }}>Clients</h1>
        <button onClick={() => setShowNewModal(true)} style={btnPrimary}><Plus size={14} /> New Client</button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." style={{ marginBottom: 24, maxWidth: 320 }} />

      {filtered.length === 0 && <Empty icon={Users} text={search ? "No matching clients" : "No clients yet"} action={!search ? () => setShowNewModal(true) : undefined} actionText="Add Client" />}

      {filtered.map(cl => {
        const clientProjects = projects.filter(p => p.clientId === cl.id || (p.client && p.client.trim().toLowerCase() === (cl.displayName || "").trim().toLowerCase()));
        const lifetime = clientProjects.reduce((t, p) => t + calc(p).curr, 0);

        return (
          <div key={cl.id} onClick={() => navigate(`/clients/${cl.id}`)} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: `${_.s4}px 0`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
            transition: "padding-left 0.12s",
          }}
          onMouseEnter={e => e.currentTarget.style.paddingLeft = "4px"}
          onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium }}>{cl.displayName || "Unnamed"}</div>
              <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 1 }}>
                {cl.companyName ? `${cl.companyName} · ` : ""}{clientProjects.length} project{clientProjects.length !== 1 ? "s" : ""}
                {lifetime > 0 ? ` · ${fmt(lifetime)}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
              <span style={badge(cl.status === "active" ? _.green : _.muted)}>{cl.status}</span>
              <div
                onClick={(e) => { e.stopPropagation(); navigate(`/clients/${cl.id}`); }}
                title="Edit client"
                style={{ width: 26, height: 26, borderRadius: _.rSm, border: `1px solid ${_.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: _.muted, cursor: "pointer", background: _.surface }}
              >
                <PenLine size={13} />
              </div>
              <div
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(cl); }}
                title="Delete client"
                style={{ width: 26, height: 26, borderRadius: _.rSm, border: `1px solid ${_.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: _.red, cursor: "pointer", background: _.surface }}
              >
                <Trash2 size={13} />
              </div>
            </div>
          </div>
        );
      })}

      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="New Client" width={460}>
        <div style={{ display: "grid", gap: _.s3 }}>
          <div>
            <label style={label}>Client name *</label>
            <input style={input} value={newForm.displayName} onChange={(e) => setNewForm(f => ({ ...f, displayName: e.target.value }))} placeholder="e.g. John Smith" />
          </div>
          <div>
            <label style={label}>Company name</label>
            <input style={input} value={newForm.companyName} onChange={(e) => setNewForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Optional" />
          </div>
          <div>
            <label style={label}>Status</label>
            <select style={{ ...input, cursor: "pointer" }} value={newForm.status} onChange={(e) => setNewForm(f => ({ ...f, status: e.target.value }))}>
              {["active", "inactive", "archived"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Notes</label>
            <textarea style={{ ...input, minHeight: 64, resize: "vertical" }} value={newForm.notes} onChange={(e) => setNewForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2, marginTop: _.s4 }}>
          <Button variant="ghost" onClick={() => setShowNewModal(false)}>Cancel</Button>
          <Button onClick={handleNew}>Create & Edit</Button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Client" width={420}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, lineHeight: _.lineHeight.body, marginBottom: _.s5 }}>
          Delete <strong>{deleteTarget?.displayName || "this client"}</strong>?
          {deleteTarget && (
            <div style={{ marginTop: _.s2 }}>
              This will unlink any projects currently assigned to this client.
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2 }}>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={removeClient}>Delete</Button>
        </div>
      </Modal>
    </Section>
  );
}
