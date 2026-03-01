import { useState, useEffect } from "react";
import _ from "../../theme/tokens.js";
import { input, label } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { Save } from "lucide-react";

const DEFAULTS = {
  companyName: "",
  abn: "",
  contactEmail: "",
  contactPhone: "",
  defaultMargin: 18,
  defaultContingency: 5,
  defaultValidDays: 30,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem("ib_settings");
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

function saveSettings(settings) {
  localStorage.setItem("ib_settings", JSON.stringify(settings));
}

export default function SettingsPage() {
  const { mobile, notify } = useApp();
  const [settings, setSettings] = useState(loadSettings);

  const set = (k, v) => setSettings(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    saveSettings(settings);
    notify("Settings saved");
  };

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: mobile ? 28 : 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 4 }}>Settings</h1>
          <div style={{ fontSize: 14, color: _.muted }}>Company configuration</div>
        </div>
        <Button icon={Save} onClick={handleSave}>Save</Button>
      </div>

      <Card title="Company Details" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: `${_.s3}px ${_.s4}px` }}>
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
        </div>
      </Card>

      <Card title="Default Values" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: _.muted, marginBottom: 16 }}>These defaults apply to newly created projects.</div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: _.s4 }}>
          <div>
            <label style={label}>Default Margin %</label>
            <input type="number" style={{ ...input, textAlign: "center", fontWeight: 600, fontSize: 18 }} value={settings.defaultMargin} onChange={e => set("defaultMargin", parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={label}>Default Contingency %</label>
            <input type="number" style={{ ...input, textAlign: "center", fontWeight: 600, fontSize: 18 }} value={settings.defaultContingency} onChange={e => set("defaultContingency", parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label style={label}>Quote Validity (days)</label>
            <input type="number" style={{ ...input, textAlign: "center", fontWeight: 600, fontSize: 18 }} value={settings.defaultValidDays} onChange={e => set("defaultValidDays", parseInt(e.target.value) || 30)} />
          </div>
        </div>
      </Card>

      <Card title="Data" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: _.body, marginBottom: 12 }}>All data is stored locally in your browser. No cloud sync.</div>
        <div style={{ display: "flex", gap: _.s3 }}>
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
          }}>Export Backup</Button>
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
                  notify("Backup restored — refresh to see changes");
                } catch { notify("Invalid backup file", "error"); }
              };
              reader.readAsText(file);
            };
            inp.click();
          }}>Import Backup</Button>
        </div>
      </Card>
    </Section>
  );
}
