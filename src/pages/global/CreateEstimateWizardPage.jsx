import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { uid } from "../../theme/styles.js";
import { ESTIMATE_TEMPLATE_OPTIONS, buildEstimateTemplate } from "../../lib/estimateTemplates.js";
import { calculateTotals, normalizeCategories } from "../../lib/costEngine.js";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { ArrowLeft, ArrowRight, Zap } from "lucide-react";

const STEPS = ["client_site", "template", "pricing"];
const STEP_LABELS = { client_site: "Client & Site", template: "Template", pricing: "Pricing" };
const BUILD_TYPES = ["New Build", "Extension", "Renovation", "Knockdown Rebuild", "Townhouse", "Duplex"];

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
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retryTick, setRetryTick] = useState(0);
  const [step, setStep] = useState("client_site");

  // Step 1: Client + Site
  const [clientMode, setClientMode] = useState("existing");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newClient, setNewClient] = useState({ name: "", phone: "", email: "" });
  const [projectName, setProjectName] = useState("");
  const [buildType, setBuildType] = useState("New Build");
  const [address, setAddress] = useState("");

  // Step 2: Template
  const [templateId, setTemplateId] = useState("basic_residential");

  // Step 3: Pricing prefs
  const safeSettings = useMemo(() => ((settings && typeof settings === "object") ? settings : {}), [settings]);
  const [marginPct, setMarginPct] = useState(() => safeSettings.defaultMargin ?? 18);
  const [contingencyPct, setContingencyPct] = useState(() => safeSettings.defaultContingency ?? 5);
  const [depositPct, setDepositPct] = useState(() => safeSettings.defaultDeposit ?? 5);
  const [validDays, setValidDays] = useState(() => safeSettings.defaultValidDays ?? 30);

  const safeClients = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const safeTemplateOptions = useMemo(
    () => (Array.isArray(ESTIMATE_TEMPLATE_OPTIONS) ? ESTIMATE_TEMPLATE_OPTIONS : []),
    [],
  );

  // Sync pricing defaults when settings load
  useEffect(() => {
    if (safeSettings.defaultMargin != null) setMarginPct(safeSettings.defaultMargin);
    if (safeSettings.defaultContingency != null) setContingencyPct(safeSettings.defaultContingency);
    if (safeSettings.defaultDeposit != null) setDepositPct(safeSettings.defaultDeposit);
    if (safeSettings.defaultValidDays != null) setValidDays(safeSettings.defaultValidDays);
  }, [safeSettings]);

  useEffect(() => {
    let alive = true;
    const loadWizardData = async () => {
      setLoading(true);
      setLoadError("");
      try {
        await Promise.resolve();
        if (!Array.isArray(clients)) {
          console.error("CreateEstimate failed:", new Error("clients is not an array"));
        }
        if (!safeTemplateOptions.length) {
          throw new Error("No estimate templates are available");
        }
        if (alive) {
          setSelectedClientId((prev) => (prev ? prev : safeClients[0]?.id || ""));
          setLoading(false);
        }
      } catch (err) {
        console.error("CreateEstimate failed:", err);
        if (alive) {
          setLoadError("Unable to load estimate setup. Please try again.");
          setLoading(false);
        }
      }
    };
    loadWizardData();
    return () => { alive = false; };
  }, [retryTick, clients, safeClients, safeTemplateOptions]);

  const clientOptions = useMemo(
    () => safeClients.map((c) => ({ id: c.id, label: c.displayName || c.companyName || "Unnamed client", client: c })),
    [safeClients],
  );
  const selectedClient = useMemo(
    () => safeClients.find((c) => c.id === selectedClientId) || null,
    [safeClients, selectedClientId],
  );

  const pricingRoute = (projectId) => {
    if (!projectId) return "/estimates";
    return `/estimates/${projectId}/quote?step=pricing`;
  };

  const goNext = () => {
    if (step === "client_site") {
      if (clientMode === "existing" && !selectedClientId) {
        notify("Select an existing client or create a new one.", "error");
        return;
      }
      if (clientMode === "new" && !newClient.name.trim()) {
        notify("Client name is required.", "error");
        return;
      }
      if (!projectName.trim()) {
        notify("Project name is required.", "error");
        return;
      }
    }
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const createAndStartPricing = () => {
    try {
      const p = create({
        name: projectName.trim(),
        buildType,
        type: buildType,
        address: address.trim(),
        marginPct: parseFloat(marginPct) || 18,
        contingencyPct: parseFloat(contingencyPct) || 5,
        depositPct: parseFloat(depositPct) || 5,
        validDays: parseInt(validDays) || 30,
      });

      update(p.id, (pr) => {
        let clientRef = selectedClient;
        if (clientMode === "new" && clientsHook?.create) {
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
        pr.costCategories = Array.isArray(categories) ? categories : [];
        pr.estimateTemplate = templateId;
        pr.estimate = {
          categories: normalizeCategories(pr.costCategories),
          totals: calculateTotals(pr.costCategories),
        };
        pr.scope = {
          ...toScopeFromCategories(pr.costCategories),
        };
        return pr;
      });

      notify("Estimate created — start pricing");
      navigate(pricingRoute(p?.id));
    } catch (err) {
      console.error("CreateEstimate failed:", err);
      notify("Could not create estimate. Please retry.", "error");
    }
  };

  const skipWizard = () => {
    try {
      const p = create({
        marginPct: parseFloat(marginPct) || 18,
        contingencyPct: parseFloat(contingencyPct) || 5,
        depositPct: parseFloat(depositPct) || 5,
        validDays: parseInt(validDays) || 30,
      });
      navigate(pricingRoute(p?.id));
    } catch (err) {
      console.error("CreateEstimate failed:", err);
      notify("Could not create estimate. Please retry.", "error");
    }
  };

  if (loading) {
    return (
      <Card title="New Quote" subtitle="Loading setup...">
        <div style={{ fontSize: 14, color: _.muted }}>Preparing estimate setup.</div>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card title="New Quote" subtitle="Something went wrong while loading setup.">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 14, color: _.red }}>{loadError}</div>
          <div>
            <Button onClick={() => setRetryTick((v) => v + 1)}>Retry</Button>
          </div>
        </div>
      </Card>
    );
  }

  const stepIdx = STEPS.indexOf(step);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gap: 16 }}>
      {/* Header with step indicators */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {STEPS.map((s, i) => {
            const done = i < stepIdx;
            const active = s === step;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div
                  onClick={() => { if (i < stepIdx) setStep(s); }}
                  style={{
                    fontSize: 13, fontWeight: 600,
                    padding: "6px 14px", borderRadius: 99,
                    border: `1.5px solid ${active ? _.ac : done ? _.green : _.line}`,
                    color: active ? _.ac : done ? _.green : _.muted,
                    background: active ? `${_.ac}0A` : done ? `${_.green}0A` : "transparent",
                    cursor: done ? "pointer" : "default",
                    transition: `all ${_.tr}`,
                  }}
                >
                  {done ? "\u2713" : i + 1}. {STEP_LABELS[s]}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 20, height: 1.5, background: done ? _.green : _.line, margin: "0 2px" }} />
                )}
              </div>
            );
          })}
        </div>
        <button type="button" onClick={skipWizard} style={{ border: "none", background: "transparent", color: _.ac, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          Skip wizard
        </button>
      </div>

      {/* ─── Step 1: Client + Site ─── */}
      {step === "client_site" && (
        <Card title="Client & Site Details" subtitle="Who's the quote for and where's the job?">
          <div style={{ display: "grid", gap: 14 }}>
            {/* Client */}
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <Button size="sm" variant={clientMode === "existing" ? "primary" : "secondary"} onClick={() => setClientMode("existing")}>Existing Client</Button>
                <Button size="sm" variant={clientMode === "new" ? "primary" : "secondary"} onClick={() => setClientMode("new")}>New Client</Button>
              </div>
              {clientMode === "existing" ? (
                <select
                  style={wizardInput}
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Select client...</option>
                  {clientOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  <input style={wizardInput} placeholder="Client name *" value={newClient.name} onChange={(e) => setNewClient((v) => ({ ...v, name: e.target.value }))} autoFocus />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input style={wizardInput} placeholder="Phone" value={newClient.phone} onChange={(e) => setNewClient((v) => ({ ...v, phone: e.target.value }))} />
                    <input style={wizardInput} placeholder="Email" value={newClient.email} onChange={(e) => setNewClient((v) => ({ ...v, email: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ borderTop: `1px solid ${_.line}`, margin: "2px 0" }} />

            {/* Site info */}
            <div style={{ display: "grid", gap: 8 }}>
              <input style={wizardInput} placeholder="Project name *" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <select style={wizardInput} value={buildType} onChange={(e) => setBuildType(e.target.value)}>
                  {BUILD_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
                <input style={wizardInput} placeholder="Site address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── Step 2: Template ─── */}
      {step === "template" && (
        <Card title="Estimate Template" subtitle="Pre-populate categories or start blank.">
          <div style={{ display: "grid", gap: 10 }}>
            {safeTemplateOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTemplateId(opt.id)}
                style={templateId === opt.id ? templateActive : templateIdle}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: _.ink }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: _.muted, marginTop: 2 }}>
                  {opt.id === "custom" ? "Start from scratch with an empty scope." : `Pre-populates ${opt.label.toLowerCase()} categories.`}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ─── Step 3: Pricing Preferences ─── */}
      {step === "pricing" && (
        <Card title="Pricing Preferences" subtitle="Set your default margins and terms. You can change these later.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={wizardLabel}>Margin %</label>
              <input type="number" style={{ ...wizardInput, textAlign: "center", fontWeight: 600 }} value={marginPct} onChange={(e) => setMarginPct(e.target.value)} />
            </div>
            <div>
              <label style={wizardLabel}>Contingency %</label>
              <input type="number" style={{ ...wizardInput, textAlign: "center", fontWeight: 600 }} value={contingencyPct} onChange={(e) => setContingencyPct(e.target.value)} />
            </div>
            <div>
              <label style={wizardLabel}>Deposit %</label>
              <input type="number" style={{ ...wizardInput, textAlign: "center", fontWeight: 600 }} value={depositPct} onChange={(e) => setDepositPct(e.target.value)} />
            </div>
            <div>
              <label style={wizardLabel}>Quote valid (days)</label>
              <input type="number" style={{ ...wizardInput, textAlign: "center", fontWeight: 600 }} value={validDays} onChange={(e) => setValidDays(e.target.value)} />
            </div>
          </div>

          {/* Summary preview */}
          <div style={{ marginTop: 16, padding: "12px 14px", background: _.well, borderRadius: _.rSm }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: _.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Summary</div>
            <div style={{ display: "grid", gap: 4, fontSize: 14 }}>
              <div><strong>Client:</strong> {clientMode === "existing" ? (selectedClient?.displayName || selectedClient?.companyName || "\u2014") : newClient.name || "\u2014"}</div>
              <div><strong>Project:</strong> {projectName || "\u2014"}</div>
              <div><strong>Type:</strong> {buildType} {address ? `\u00b7 ${address}` : ""}</div>
              <div><strong>Template:</strong> {safeTemplateOptions.find((t) => t.id === templateId)?.label || "Custom"}</div>
              <div><strong>Margin:</strong> {marginPct}% <strong style={{ marginLeft: 12 }}>Contingency:</strong> {contingencyPct}%</div>
            </div>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button variant="ghost" onClick={goBack} disabled={step === "client_site"} icon={ArrowLeft}>Back</Button>
        {step === "pricing" ? (
          <Button onClick={createAndStartPricing} icon={Zap}>Start Pricing</Button>
        ) : (
          <Button onClick={goNext} icon={ArrowRight}>Continue</Button>
        )}
      </div>
    </div>
  );
}

const wizardInput = {
  width: "100%",
  height: 44,
  border: `1px solid ${_.line}`,
  borderRadius: 8,
  background: _.well,
  padding: "0 12px",
  fontFamily: "inherit",
  fontSize: 14,
};

const wizardLabel = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: _.muted,
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const templateIdle = {
  textAlign: "left",
  border: `1.5px solid ${_.line}`,
  borderRadius: 10,
  background: _.surface,
  padding: "12px 14px",
  cursor: "pointer",
  transition: `all ${_.tr}`,
};

const templateActive = {
  ...templateIdle,
  border: `1.5px solid ${_.ac}`,
  background: `${_.ac}08`,
};
