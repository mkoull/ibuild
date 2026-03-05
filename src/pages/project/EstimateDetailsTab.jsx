import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { ds, fmt } from "../../theme/styles.js";
import { displayStage } from "../../config/workspaceTabs.js";
import { ArrowRight, MapPin } from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import { calculateTotals, normalizeCategories } from "../../lib/costEngine.js";
import { isRequiredText } from "../../lib/validation.js";

const CARD = { background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: 20 };
const CARD_HEADER = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 };
const CARD_TITLE = { fontSize: 15, fontWeight: 500, color: _.body, margin: 0 };
const LBL = { fontSize: 12, color: _.muted, display: "block", marginBottom: 6 };

const STEPS = [
  { id: "project", label: "Step 1: Project Details" },
  { id: "client", label: "Step 2: Client Details" },
  { id: "pricing", label: "Step 3: Start Pricing" },
];

function safeText(value) {
  if (value === null || value === undefined) return "—";
  const t = String(value).trim();
  return t ? t : "—";
}

const inputStyle = {
  width: "100%",
  border: `1px solid ${_.line}`,
  borderRadius: 6,
  padding: "8px 10px",
  background: _.well,
  fontSize: 14,
  color: _.ink,
  fontFamily: "inherit",
  outline: "none",
  minHeight: 40,
};

export default function EstimateDetailsTab() {
  const { project: p, update: up, client } = useProject();
  const { mobile, notify } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState(p.notes || "");

  const stage = p.stage || p.status || "Lead";
  const contact = client?.contacts?.[0];
  const createdAt = p.createdAt
    ? new Date(p.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
    : ds();
  const customerName = client?.displayName || p.client || "";
  const customerPhone = contact?.phone || p.phone || "";
  const customerEmail = contact?.email || p.email || "";
  const address = [p.address, p.suburb, p.state, p.postcode].filter(Boolean).join(", ");
  const mapsHref = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : "";
  const categories = normalizeCategories(p?.estimate?.categories || p.costCategories || []);
  const totals = useMemo(() => calculateTotals(categories), [categories]);
  const activeStep = STEPS.some((s) => s.id === searchParams.get("step")) ? searchParams.get("step") : "project";
  const stepIndex = STEPS.findIndex((s) => s.id === activeStep);
  const nextStep = STEPS[stepIndex + 1];

  const gotoWorkflowStep = (step) => {
    if (!STEPS.some((s) => s.id === step)) return;
    const params = new URLSearchParams(searchParams);
    params.set("step", step);
    setSearchParams(params, { replace: true });
  };

  const handleSaveNotes = () => {
    up((pr) => { pr.notes = notes; return pr; });
    notify("Notes saved");
  };

  const goNext = () => {
    if (activeStep === "project" && !isRequiredText(p.name)) {
      notify("Project name is required", "error");
      return;
    }
    if (!nextStep) return;
    gotoWorkflowStep(nextStep.id);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 24, animation: "fadeUp 0.2s ease" }}>
      <div style={{ ...CARD, padding: 12 }}>
        <div style={{ fontSize: 11, color: _.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          Estimate Workflow
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STEPS.map((step, idx) => {
            const active = step.id === activeStep;
            const done = idx < stepIndex;
            return (
              <button
                type="button"
                key={step.id}
                onClick={() => gotoWorkflowStep(step.id)}
                style={{
                  border: `1px solid ${active ? `${_.ac}55` : _.line}`,
                  borderRadius: 6,
                  background: active ? `${_.ac}10` : _.surface,
                  color: done ? _.green : active ? _.ac : _.body,
                  cursor: "pointer",
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                }}
              >
                {done ? "\u2713 " : ""}{step.label}
              </button>
            );
          })}
        </div>
        {nextStep && (
          <div style={{ marginTop: 8, fontSize: 12, color: _.muted }}>
            Next: <strong style={{ color: _.ink }}>{nextStep.label}</strong>
          </div>
        )}
      </div>

      {activeStep === "project" && (
        <div className="layout-grid-12">
          <div className="col-8" style={CARD}>
            <div style={CARD_HEADER}>
              <h3 style={CARD_TITLE}>Project Details</h3>
              <span style={{ fontSize: 12, color: _.muted }}>{displayStage(stage)}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div>
                <label style={LBL}>Project Name</label>
                <input style={inputStyle} value={p.name || ""} onChange={(e) => up((pr) => { pr.name = e.target.value; return pr; })} />
              </div>
              <div>
                <label style={LBL}>Build Type</label>
                <input style={inputStyle} value={p.buildType || p.type || ""} onChange={(e) => up((pr) => { pr.buildType = e.target.value; pr.type = e.target.value; return pr; })} />
              </div>
              <div>
                <label style={LBL}>Created</label>
                <input readOnly style={{ ...inputStyle, color: _.muted }} value={createdAt} />
              </div>
              <div>
                <label style={LBL}>Estimate #</label>
                <input readOnly style={{ ...inputStyle, color: _.muted }} value={safeText(p.estimateNumber)} />
              </div>
            </div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={goNext} icon={ArrowRight}>Next Step</Button>
            </div>
          </div>
          <div className="col-4" style={CARD}>
            <h3 style={{ ...CARD_TITLE, marginBottom: 8 }}>Work Location</h3>
            <div style={{ fontSize: 14, color: _.ink, marginBottom: 8 }}>{safeText(address)}</div>
            {mapsHref ? (
              <a href={mapsHref} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: _.ac, textDecoration: "none", display: "inline-block", marginBottom: 10 }}>
                Open in Maps
              </a>
            ) : (
              <div style={{ fontSize: 13, color: _.muted, marginBottom: 10 }}>Open in Maps</div>
            )}
            <div style={{ height: 180, background: _.well, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <MapPin size={20} color={_.muted} />
              <span style={{ fontSize: 13, color: _.muted }}>{address || "Map preview"}</span>
            </div>
          </div>
        </div>
      )}

      {activeStep === "client" && (
        <div style={CARD}>
          <div style={CARD_HEADER}>
            <h3 style={CARD_TITLE}>Client Details</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div>
              <label style={LBL}>Name</label>
              <input style={inputStyle} value={customerName} onChange={(e) => up((pr) => { pr.client = e.target.value; return pr; })} />
            </div>
            <div>
              <label style={LBL}>Phone</label>
              <input style={inputStyle} value={customerPhone} onChange={(e) => up((pr) => { pr.phone = e.target.value; return pr; })} />
            </div>
            <div>
              <label style={LBL}>Email</label>
              <input style={inputStyle} value={customerEmail} onChange={(e) => up((pr) => { pr.email = e.target.value; return pr; })} />
            </div>
            <div>
              <label style={LBL}>Address</label>
              <input style={inputStyle} value={p.address || ""} onChange={(e) => up((pr) => { pr.address = e.target.value; return pr; })} />
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={goNext} icon={ArrowRight}>Next Step</Button>
          </div>
        </div>
      )}

      {activeStep === "pricing" && (
        <div style={CARD}>
          <h3 style={{ ...CARD_TITLE, marginBottom: 10 }}>Start Pricing</h3>
          <div style={{ fontSize: 13, color: _.muted, marginBottom: 12 }}>
            Your project and client details are set. Open the Costings workspace to build your quote.
          </div>
          {totals.totalSell > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
              <Metric label="Total Cost" value={fmt(totals.totalCost)} />
              <Metric label="Total Sell" value={fmt(totals.totalSell)} />
              <Metric label="Margin %" value={`${Number(totals.marginPercent || 0).toFixed(2)}%`} />
              <Metric label="Margin $" value={fmt(totals.marginValue)} />
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Button onClick={() => navigate("../quote?step=pricing")} icon={ArrowRight}>Go to Costings</Button>
          </div>
        </div>
      )}

      <div style={{ ...CARD }}>
        <h3 style={{ ...CARD_TITLE, marginBottom: 8 }}>Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add estimate notes..."
            rows={6}
            style={{ width: "100%", padding: 10, border: `1px solid ${_.line}`, borderRadius: 6, fontSize: 14, color: _.ink, fontFamily: "inherit", resize: "vertical", background: _.well, outline: "none" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <Button variant="secondary" onClick={handleSaveNotes}>Save Notes</Button>
          </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ background: _.bg, border: `1px solid ${_.line}`, borderRadius: 6, padding: 10 }}>
      <div style={{ fontSize: 11, color: _.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: _.ink, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}
