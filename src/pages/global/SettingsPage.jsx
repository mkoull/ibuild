import { useState, useRef } from "react";
import _ from "../../theme/tokens.js";
import { input, label } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { resetAll } from "../../data/store.js";
import { Save, Upload, X, ArrowUpFromLine, ArrowDownToLine, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { mobile, notify, settingsHook, featureFlags, api } = useApp();
  const [settings, setLocal] = useState(() => ({ ...settingsHook.settings }));
  const fileRef = useRef(null);
  const [syncing, setSyncing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const flags = featureFlags?.flags || {};
  const setFlag = featureFlags?.setFlag;

  const set = (k, v) => setLocal(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    settingsHook.save(settings);
    notify("Settings saved");
  };

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) { notify("Logo must be under 500KB", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => set("logo", ev.target.result);
    reader.readAsDataURL(file);
  };

  const exportToServer = async () => {
    if (!api) return;
    setSyncing(true);
    try {
      // Push all localStorage data to backend
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("ib_")) {
          try { data[key] = JSON.parse(localStorage.getItem(key)); } catch { /* ignore */ }
        }
      }

      // Push projects
      const projects = data.ib_projects?.byId || {};
      for (const p of Object.values(projects)) {
        try {
          await api.put(`/projects/${p.id}`, { name: p.name, stage: p.stage, clientId: p.clientId, data: p });
        } catch {
          try { await api.post("/projects", { id: p.id, name: p.name, stage: p.stage, clientId: p.clientId, data: p }); } catch { /* ignore */ }
        }
      }

      // Push clients
      const clients = data.ib_clients || [];
      for (const c of clients) {
        try {
          await api.put(`/clients/${c.id}`, { ...c, data: c });
        } catch {
          try { await api.post("/clients", { ...c, data: c }); } catch { /* ignore */ }
        }
      }

      // Push trades
      const trades = data.ib_trades || [];
      for (const t of trades) {
        try {
          await api.put(`/trades/${t.id}`, { ...t, data: t });
        } catch {
          try { await api.post("/trades", { ...t, data: t }); } catch { /* ignore */ }
        }
      }

      // Push settings
      if (data.ib_settings) {
        try { await api.put("/settings", data.ib_settings); } catch { /* ignore */ }
      }

      notify("Data exported to server");
    } catch (err) {
      notify("Export failed: " + err.message, "error");
    } finally {
      setSyncing(false);
    }
  };

  const importFromServer = async () => {
    if (!api) return;
    setSyncing(true);
    try {
      // Pull projects
      const projects = await api.get("/projects");
      if (Array.isArray(projects) && projects.length > 0) {
        // Fetch full data for each project
        const byId = {};
        const allIds = [];
        for (const summary of projects) {
          try {
            const full = await api.get(`/projects/${summary.id}`);
            if (full && full.data) {
              byId[summary.id] = full.data;
              allIds.push(summary.id);
            }
          } catch { /* ignore */ }
        }
        if (allIds.length > 0) {
          localStorage.setItem("ib_projects", JSON.stringify({ version: 11, data: { byId, allIds } }));
        }
      }

      // Pull clients
      const clients = await api.get("/clients");
      if (Array.isArray(clients)) {
        const clientData = clients.map(c => c.data || c);
        localStorage.setItem("ib_clients", JSON.stringify(clientData));
      }

      // Pull trades
      const trades = await api.get("/trades");
      if (Array.isArray(trades)) {
        const tradeData = trades.map(t => t.data || t);
        localStorage.setItem("ib_trades", JSON.stringify(tradeData));
      }

      // Pull settings
      const serverSettings = await api.get("/settings");
      if (serverSettings && typeof serverSettings === "object") {
        localStorage.setItem("ib_settings", JSON.stringify(serverSettings));
        settingsHook.refresh();
      }

      notify("Data imported from server — refresh to see changes");
    } catch (err) {
      notify("Import failed: " + err.message, "error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Settings</h1>
          <div style={{ fontSize: _.fontSize.md, color: _.muted }}>Company configuration</div>
        </div>
        <Button icon={Save} onClick={handleSave}>Save</Button>
      </div>

      <Card title="Company Details" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: `${_.s3}px ${_.s4}px`, marginBottom: _.s4 }}>
          <div>
            <label style={label}>Company Name</label>
            <input style={input} value={settings.companyName} onChange={e => set("companyName", e.target.value)} placeholder="Your Building Co." />
          </div>
          <div>
            <label style={label}>ABN</label>
            <input style={input} value={settings.abn} onChange={e => set("abn", e.target.value)} placeholder="12 345 678 901" />
          </div>
          <div>
            <label style={label}>Contact Email</label>
            <input style={input} value={settings.contactEmail} onChange={e => set("contactEmail", e.target.value)} placeholder="info@company.com" type="email" />
          </div>
          <div>
            <label style={label}>Contact Phone</label>
            <input style={input} value={settings.contactPhone} onChange={e => set("contactPhone", e.target.value)} placeholder="03 1234 5678" />
          </div>
          <div style={{ gridColumn: mobile ? "1" : "1 / -1" }}>
            <label style={label}>Address</label>
            <input style={input} value={settings.address || ""} onChange={e => set("address", e.target.value)} placeholder="123 Builder St, Melbourne VIC 3000" />
          </div>
        </div>
        <div>
          <label style={label}>Logo</label>
          <div style={{ display: "flex", alignItems: "center", gap: _.s3 }}>
            {settings.logo ? (
              <div style={{ position: "relative" }}>
                <img src={settings.logo} alt="Logo" style={{ maxHeight: 48, maxWidth: 160, borderRadius: _.rXs, border: `1px solid ${_.line}` }} />
                <div onClick={() => set("logo", "")} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, background: _.red, color: "#fff", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10 }}><X size={10} /></div>
              </div>
            ) : (
              <Button variant="secondary" size="sm" icon={Upload} onClick={() => fileRef.current?.click()}>Upload logo</Button>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
          </div>
        </div>
      </Card>

      <Card title="Default Values" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginBottom: 16 }}>These defaults apply to newly created projects and documents.</div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr 1fr", gap: _.s4 }}>
          <div>
            <label style={label}>Default Margin %</label>
            <input type="number" style={{ ...input, textAlign: "center", fontWeight: _.fontWeight.semi, fontSize: _.fontSize.unit }} value={settings.defaultMargin} onChange={e => set("defaultMargin", parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={label}>Default Contingency %</label>
            <input type="number" style={{ ...input, textAlign: "center", fontWeight: _.fontWeight.semi, fontSize: _.fontSize.unit }} value={settings.defaultContingency} onChange={e => set("defaultContingency", parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={label}>Quote Validity (days)</label>
            <input type="number" style={{ ...input, textAlign: "center", fontWeight: _.fontWeight.semi, fontSize: _.fontSize.unit }} value={settings.defaultValidDays} onChange={e => set("defaultValidDays", parseInt(e.target.value) || 30)} />
          </div>
          <div>
            <label style={label}>Payment Terms (days)</label>
            <input type="number" style={{ ...input, textAlign: "center", fontWeight: _.fontWeight.semi, fontSize: _.fontSize.unit }} value={settings.defaultPaymentTermsDays || 14} onChange={e => set("defaultPaymentTermsDays", parseInt(e.target.value) || 14)} />
          </div>
        </div>
      </Card>

      <Card title="Data & Sync" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: _.fontSize.base, color: _.body, marginBottom: 16 }}>
          Manage how data is stored and synchronised between browser and server.
        </div>

        {/* Feature flag toggles */}
        {setFlag && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: _.s3, marginBottom: _.s3 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: _.fontSize.base }}>
                <input type="checkbox" checked={flags.shadow_write_enabled || false} onChange={e => setFlag("shadow_write_enabled", e.target.checked)} />
                Shadow write to server
              </label>
              <span style={{ fontSize: _.fontSize.xs, color: _.muted }}>Writes data to Postgres in background (fire-and-forget)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: _.s3 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: _.fontSize.base }}>
                <input type="checkbox" checked={flags.backend_source_of_truth || false} onChange={e => setFlag("backend_source_of_truth", e.target.checked)} />
                Backend as source of truth
              </label>
              <span style={{ fontSize: _.fontSize.xs, color: _.muted }}>Read from server instead of localStorage</span>
            </div>
          </div>
        )}

        {/* Sync buttons */}
        <div style={{ display: "flex", gap: _.s3, marginBottom: 16 }}>
          <Button variant="secondary" size="sm" icon={ArrowUpFromLine} onClick={exportToServer} disabled={syncing}>
            {syncing ? "Syncing..." : "Export to Server"}
          </Button>
          <Button variant="secondary" size="sm" icon={ArrowDownToLine} onClick={importFromServer} disabled={syncing}>
            {syncing ? "Syncing..." : "Import from Server"}
          </Button>
        </div>

        <div style={{ borderTop: `1px solid ${_.line}`, paddingTop: 16, display: "flex", gap: _.s3 }}>
          <Button variant="secondary" size="sm" onClick={() => {
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key.startsWith("ib_")) data[key] = JSON.parse(localStorage.getItem(key));
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `ibuild-backup-${new Date().toISOString().split("T")[0]}.json`;
            a.click();
            notify("Backup exported");
          }}>Export Backup (JSON)</Button>
          <Button variant="secondary" size="sm" onClick={() => {
            const inp = document.createElement("input");
            inp.type = "file";
            inp.accept = ".json";
            inp.onchange = e => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => {
                try {
                  const data = JSON.parse(ev.target.result);
                  Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
                  settingsHook.refresh();
                  notify("Backup restored — refresh to see changes");
                } catch { notify("Invalid backup file", "error"); }
              };
              reader.readAsText(file);
            };
            inp.click();
          }}>Import Backup (JSON)</Button>
        </div>
      </Card>
      <Card title="Danger Zone" style={{ marginBottom: 24, borderLeft: `3px solid ${_.red}` }}>
        <div style={{ fontSize: _.fontSize.base, color: _.body, marginBottom: 16 }}>
          Permanently delete all local data. This cannot be undone.
        </div>
        <Button variant="danger" size="sm" icon={Trash2} onClick={() => setShowResetConfirm(true)}>
          Reset Local Data
        </Button>
      </Card>

      {import.meta.env.DEV && (
        <Card title="Dev Tools" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginBottom: 12 }}>Development-only utilities for testing.</div>
          <div style={{ display: "flex", gap: _.s3 }}>
            <Button variant="secondary" size="sm" disabled={seeding} onClick={async () => {
              setSeeding(true);
              try {
                const { seedProjects } = await import("../../dev/seedProjects.js");
                const n = seedProjects(10);
                notify(`Seeded ${n} projects — refresh to see them`);
              } catch (err) { notify("Seed failed: " + err.message, "error"); }
              finally { setSeeding(false); }
            }}>
              {seeding ? "Seeding..." : "Seed 10 Projects"}
            </Button>
            <Button variant="secondary" size="sm" disabled={seeding} onClick={async () => {
              setSeeding(true);
              try {
                const { seedProjects } = await import("../../dev/seedProjects.js");
                const n = seedProjects(100);
                notify(`Seeded ${n} projects — refresh to see them`);
              } catch (err) { notify("Seed failed: " + err.message, "error"); }
              finally { setSeeding(false); }
            }}>
              {seeding ? "Seeding..." : "Seed 100 Projects"}
            </Button>
          </div>
        </Card>
      )}

      {showResetConfirm && (
        <Modal title="Reset All Local Data?" onClose={() => setShowResetConfirm(false)}>
          <p style={{ fontSize: _.fontSize.base, color: _.body, marginBottom: _.s5 }}>
            This will permanently delete all projects, clients, trades, settings, and other data stored in your browser. This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: _.s3, justifyContent: "flex-end" }}>
            <Button variant="secondary" size="sm" onClick={() => setShowResetConfirm(false)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={() => {
              resetAll();
              window.location.reload();
            }}>Delete Everything</Button>
          </div>
        </Modal>
      )}
    </Section>
  );
}
