import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { btnPrimary, badge, fmt } from "../../theme/styles.js";
import { calc } from "../../lib/calc.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import { Plus, Users } from "lucide-react";

export default function ClientsListPage() {
  const { clients, clientsHook, projects, mobile, notify } = useApp();
  const navigate = useNavigate();

  const handleNew = () => {
    const c = clientsHook.create({ displayName: "New Client" });
    navigate(`/clients/${c.id}`);
    notify("Client created");
  };

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: mobile ? 28 : 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Clients</h1>
        <button onClick={handleNew} style={btnPrimary}><Plus size={14} /> New Client</button>
      </div>

      {clients.length === 0 && <Empty icon={Users} text="No clients yet" action={handleNew} actionText="Add Client" />}

      {clients.map(cl => {
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
              <div style={{ fontSize: 14, fontWeight: 500 }}>{cl.displayName || "Unnamed"}</div>
              <div style={{ fontSize: 12, color: _.muted, marginTop: 1 }}>
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
