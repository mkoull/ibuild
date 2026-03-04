import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { uid } from "../../theme/styles.js";
import { ESTIMATE_TEMPLATE_OPTIONS, buildEstimateTemplate } from "../../lib/estimateTemplates.js";
import { calculateTotals, normalizeCategories } from "../../lib/costEngine.js";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";

const STEPS = ["client", "basics", "template", "confirm"];

function toScopeFromCategories(categories) {
  const scope = {};
  (categories || []).forEach((cat) => {
    scope[cat.name] = [];
  });
  return scope;
}

export default function CreateEstimateWizardPage() {
  const { clients, clientsHook, create, update, notify, settings } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState("client");
  const [clientMode, setClientMode] = useState("existing");
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [newClient, setNewClient] = useState({ name: "", phone: "", email: "" });
  const [projectBasics, setProjectBasics] = useState({
    name: "",
    buildType: "New Build",
    address: "",
  });
  const [templateId, setTemplateId] = useState("basic_residential");

  const clientOptions = useMemo(
    () => clients.map((c) => ({ id: c.id, label: c.displayName || c.companyName || "Unnamed client", client: c })),
    [clients],
  );
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId],
  );
  const templateLabel = ESTIMATE_TEMPLATE_OPTIONS.find((t) => t.id === templateId)?.label || "Custom (blank)";

  const goNext = () => {
    if (step === "client") {
      if (clientMode === "existing" && !selectedClientId) {
        notify("Select an existing client or create a new one.", "error");
        return;
      }
      if (clientMode === "new" && !newClient.name.trim()) {
        notify("Client name is required.", "error");
        return;
      }
    }
    if (step === "basics" && !projectBasics.name.trim()) {
      notify("Project name is required.", "error");
      return;
    }
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const createFromWizard = () => {
    const p = create({
      name: projectBasics.name.trim(),
      buildType: projectBasics.buildType,
      type: projectBasics.buildType,
      address: projectBasics.address.trim(),
      marginPct: settings.defaultMargin ?? 18,
      contingencyPct: settings.defaultContingency ?? 5,
      validDays: settings.defaultValidDays ?? 30,
    });

    update(p.id, (pr) => {
      let clientRef = selectedClient;
      if (clientMode === "new") {
        const created = clientsHook.create({
          displayName: newClient.name.trim(),
          contacts: [{
            id: uid(),
            name: newClient.name.trim(),
            phone: newClient.phone.trim(),
            email: newClient.email.trim(),
            role: "",
            address: "",
            suburb: "",
            state: "",
            postcode: "",
          }],
        });
        clientRef = created;
      }
      if (clientRef) {
        const contact = clientRef.contacts?.[0];
        pr.clientId = clientRef.id;
        pr.client = clientRef.displayName || clientRef.companyName || "";
        pr.phone = (clientMode === "new" ? newClient.phone : (contact?.phone || "")).trim();
        pr.email = (clientMode === "new" ? newClient.email : (contact?.email || "")).trim();
      }
      const categories = templateId === "custom" ? [] : buildEstimateTemplate(templateId);
      pr.costCategories = categories;
      pr.estimateTemplate = templateId;
      pr.estimate = {
        categories: normalizeCategories(categories),
        totals: calculateTotals(categories),
      };
      pr.scope = {
        ...toScopeFromCategories(categories),
      };
      return pr;
    });

    notify("Estimate created");
    navigate(`/estimates/${p.id}/quote?step=scope`);
  };

  const skipWizard = () => {
    const p = create({
      marginPct: settings.defaultMargin ?? 18,
      contingencyPct: settings.defaultContingency ?? 5,
      validDays: settings.defaultValidDays ?? 30,
    });
    navigate(`/estimates/${p.id}/quote?step=scope`);
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 16 }}>
      <Card title="Create Estimate Wizard" subtitle="Fast setup with sensible defaults.">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STEPS.map((s, i) => (
              <div
                key={s}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "6px 10px",
                  borderRadius: 99,
                  border: `1px solid ${step === s ? _.ac : _.line}`,
                  color: step === s ? _.ac : _.muted,
                  background: step === s ? `${_.ac}12` : _.surface,
                }}
              >
                {`Step ${i + 1}: ${s[0].toUpperCase()}${s.slice(1)}`}
              </div>
            ))}
          </div>
          <button type="button" onClick={skipWizard} style={{ border: "none", background: "transparent", color: _.ac, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            Skip wizard (advanced)
          </button>
        </div>
      </Card>

      {step === "client" && (
        <Card title="Step 1: Client">
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Button size="sm" variant={clientMode === "existing" ? "primary" : "secondary"} onClick={() => setClientMode("existing")}>Select Existing</Button>
            <Button size="sm" variant={clientMode === "new" ? "primary" : "secondary"} onClick={() => setClientMode("new")}>Create New</Button>
          </div>
          {clientMode === "existing" ? (
            <select
              style={{ width: "100%", height: 40, border: `1px solid ${_.line}`, borderRadius: 8, background: _.well, padding: "0 10px", fontFamily: "inherit" }}
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">Select client...</option>
              {clientOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <input style={wizardInput} placeholder="Client name *" value={newClient.name} onChange={(e) => setNewClient((v) => ({ ...v, name: e.target.value }))} />
              <input style={wizardInput} placeholder="Phone" value={newClient.phone} onChange={(e) => setNewClient((v) => ({ ...v, phone: e.target.value }))} />
              <input style={wizardInput} placeholder="Email" value={newClient.email} onChange={(e) => setNewClient((v) => ({ ...v, email: e.target.value }))} />
            </div>
          )}
        </Card>
      )}

      {step === "basics" && (
        <Card title="Step 2: Project Basics">
          <div style={{ display: "grid", gap: 10 }}>
            <input style={wizardInput} placeholder="Project name *" value={projectBasics.name} onChange={(e) => setProjectBasics((v) => ({ ...v, name: e.target.value }))} />
            <select style={wizardInput} value={projectBasics.buildType} onChange={(e) => setProjectBasics((v) => ({ ...v, buildType: e.target.value }))}>
              <option>New Build</option>
              <option>Renovation</option>
            </select>
            <input style={wizardInput} placeholder="Site address" value={projectBasics.address} onChange={(e) => setProjectBasics((v) => ({ ...v, address: e.target.value }))} />
          </div>
        </Card>
      )}

      {step === "template" && (
        <Card title="Step 3: Template">
          <div style={{ display: "grid", gap: 10 }}>
            <button type="button" onClick={() => setTemplateId("basic_residential")} style={templateId === "basic_residential" ? templateActive : templateIdle}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Basic Residential</div>
              <div style={{ fontSize: 12, color: _.muted }}>Pre-populates common categories and gets you quoting fast.</div>
            </button>
            <button type="button" onClick={() => setTemplateId("custom")} style={templateId === "custom" ? templateActive : templateIdle}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Blank</div>
              <div style={{ fontSize: 12, color: _.muted }}>Start from scratch.</div>
            </button>
          </div>
        </Card>
      )}

      {step === "confirm" && (
        <Card title="Step 4: Confirm">
          <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
            <div><strong>Client:</strong> {clientMode === "existing" ? (selectedClient?.displayName || selectedClient?.companyName || "—") : newClient.name || "—"}</div>
            <div><strong>Project:</strong> {projectBasics.name || "—"}</div>
            <div><strong>Build Type:</strong> {projectBasics.buildType}</div>
            <div><strong>Address:</strong> {projectBasics.address || "—"}</div>
            <div><strong>Template:</strong> {templateLabel}</div>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button variant="ghost" onClick={goBack} disabled={step === "client"}>Back</Button>
        {step === "confirm" ? (
          <Button onClick={createFromWizard}>Create Estimate</Button>
        ) : (
          <Button onClick={goNext}>Continue</Button>
        )}
      </div>
    </div>
  );
}

const wizardInput = {
  width: "100%",
  height: 40,
  border: `1px solid ${_.line}`,
  borderRadius: 8,
  background: _.well,
  padding: "0 10px",
  fontFamily: "inherit",
  fontSize: 14,
};

const templateIdle = {
  textAlign: "left",
  border: `1px solid ${_.line}`,
  borderRadius: 10,
  background: _.surface,
  padding: 12,
  cursor: "pointer",
};

const templateActive = {
  ...templateIdle,
  border: `1px solid ${_.ac}`,
  background: `${_.ac}10`,
};
