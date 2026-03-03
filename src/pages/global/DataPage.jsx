import { useState, useEffect } from "react";
import _ from "../../theme/tokens.js";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

export default function DataPage() {
  const { mobile, api, projects, clients, tradesHook } = useApp();
  const [serverCounts, setServerCounts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const localCounts = {
    projects: (projects || []).length,
    clients: (clients || []).length,
    trades: (tradesHook?.trades || []).length,
  };

  const fetchServerData = async () => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const [sProjects, sClients, sTrades] = await Promise.all([
        api.get("/projects"),
        api.get("/clients"),
        api.get("/trades"),
      ]);
      setServerCounts({
        projects: Array.isArray(sProjects) ? sProjects.length : 0,
        clients: Array.isArray(sClients) ? sClients.length : 0,
        trades: Array.isArray(sTrades) ? sTrades.length : 0,
      });
    } catch (err) {
      setError(err.message);
      setServerCounts(null);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchServerData(); }, []);

  const CountCard = ({ label, local, server }) => {
    const match = server != null && local === server;
    return (
      <div style={{ padding: _.s4, background: _.surface, borderRadius: _.rSm, border: `1px solid ${_.line}`, textAlign: "center" }}>
        <div style={{ fontSize: _.fontSize.xs, color: _.muted, textTransform: "uppercase", letterSpacing: _.letterSpacing.wide, marginBottom: _.s2 }}>{label}</div>
        <div style={{ fontSize: _.fontSize["3xl"], fontWeight: _.fontWeight.bold, color: _.ink }}>{local}</div>
        <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: _.s1 }}>localStorage</div>
        {server != null && (
          <div style={{ marginTop: _.s2, paddingTop: _.s2, borderTop: `1px solid ${_.line}` }}>
            <div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.semi, color: match ? _.green : _.amber }}>{server}</div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted }}>server</div>
            <div style={{ marginTop: _.s1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: _.fontSize.xs, color: match ? _.green : _.amber }}>
              {match ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
              {match ? "In sync" : "Out of sync"}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Data Admin</h1>
          <div style={{ fontSize: _.fontSize.md, color: _.muted }}>Database health & audit trail</div>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={fetchServerData} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <div style={{ padding: _.s4, background: `${_.red}10`, borderRadius: _.rSm, border: `1px solid ${_.red}30`, color: _.red, marginBottom: 24, fontSize: _.fontSize.sm }}>
          Server unavailable: {error}
        </div>
      )}

      <Card title="Record Counts" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: _.s4 }}>
          <CountCard label="Projects" local={localCounts.projects} server={serverCounts?.projects} />
          <CountCard label="Clients" local={localCounts.clients} server={serverCounts?.clients} />
          <CountCard label="Trades" local={localCounts.trades} server={serverCounts?.trades} />
        </div>
      </Card>

      <Card title="Storage" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: _.s4 }}>
          <div style={{ padding: _.s3, background: _.well, borderRadius: _.rSm }}>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: _.s1 }}>localStorage Usage</div>
            <div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.semi, color: _.ink }}>
              {(() => {
                let total = 0;
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key.startsWith("ib_")) total += (localStorage.getItem(key) || "").length;
                }
                return total < 1024 ? `${total} B` : total < 1024 * 1024 ? `${(total / 1024).toFixed(1)} KB` : `${(total / (1024 * 1024)).toFixed(1)} MB`;
              })()}
            </div>
          </div>
          <div style={{ padding: _.s3, background: _.well, borderRadius: _.rSm }}>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: _.s1 }}>Keys</div>
            <div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.semi, color: _.ink }}>
              {(() => {
                let count = 0;
                for (let i = 0; i < localStorage.length; i++) {
                  if (localStorage.key(i).startsWith("ib_")) count++;
                }
                return count;
              })()}
            </div>
          </div>
        </div>
      </Card>
    </Section>
  );
}
