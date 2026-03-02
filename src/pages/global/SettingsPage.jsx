import { useState, useRef } from "react";
import _ from "../../theme/tokens.js";
import { input, label } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { Save, Upload, X } from "lucide-react";

export default function SettingsPage() {
  const { mobile, notify, settingsHook } = useApp();
  const [settings, setLocal] = useState(() => ({ ...settingsHook.settings }));
  const fileRef = useRef(null);

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

      <Card title="Data" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: _.fontSize.base, color: _.body, marginBottom: 12 }}>All data is stored locally in your browser. No cloud sync.</div>
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
                  settingsHook.refresh();
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
