import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { btnPrimary, badge, fmt } from "../../theme/styles.js";
import { selectCalc as calc } from "../../lib/selectors.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { Plus, Users } from "lucide-react";

export default function ClientsListPage() {
  const { clients, clientsHook, projects, mobile, notify } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleNew = () => {
    const c = clientsHook.create({ displayName: "New Client" });
    navigate(`/clients/${c.id}`);
    notify("Client created");
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
        <button onClick={handleNew} style={btnPrimary}><Plus size={14} /> New Client</button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." style={{ marginBottom: 24, maxWidth: 320 }} />

      {filtered.length === 0 && <Empty icon={Users} text={search ? "No matching clients" : "No clients yet"} action={!search ? handleNew : undefined} actionText="Add Client" />}

      {filtered.map(cl => {
        const clientProjects = projects.filter(p => p.clientId === cl.id || (p.client && p.client.trim().toLowerCase() === cl.displayName.trim().toLowerCase()));
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
            <span style={badge(cl.status === "active" ? _.green : _.muted)}>{cl.status}</span>
          </div>
        );
      })}
    </Section>
  );
}
