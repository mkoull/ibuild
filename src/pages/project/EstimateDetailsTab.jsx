import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { ds } from "../../theme/styles.js";
import { displayStage } from "../../config/workspaceTabs.js";
import { Pencil, MapPin } from "lucide-react";

const CARD = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 8,
  padding: 20,
};

const CARD_HEADER = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  marginBottom: 16,
};

const CARD_TITLE = {
  fontSize: 15, fontWeight: 500, color: _.body, margin: 0,
};

const EDIT_BTN = {
  background: "none", border: "none", cursor: "pointer",
  color: _.ac, padding: 4, borderRadius: 4, display: "flex",
  alignItems: "center", justifyContent: "center",
};

const ROW = {
  display: "flex", gap: 12, padding: "6px 0",
};

const LBL = {
  fontSize: 13, color: _.muted, minWidth: 100, flexShrink: 0,
};

const VAL = {
  fontSize: 14, color: _.ink,
};

function InfoRow({ label, value }) {
  return (
    <div style={ROW}>
      <span style={LBL}>{label}</span>
      <span style={VAL}>{value || "—"}</span>
    </div>
  );
}

export default function EstimateDetailsTab() {
  const { project: p, update: up, client } = useProject();
  const { mobile, notify } = useApp();
  const navigate = useNavigate();
  const [notes, setNotes] = useState(p.notes || "");

  const stage = p.stage || p.status || "Lead";
  const contact = client?.contacts?.[0];

  const handleSaveNotes = () => {
    up(pr => { pr.notes = notes; return pr; });
    notify("Notes saved");
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: mobile ? "1fr" : "7fr 5fr",
      gap: 20,
      maxWidth: 1100,
      animation: "fadeUp 0.2s ease",
    }}>
      {/* ─── Left column ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Estimate Details */}
        <div style={CARD}>
          <div style={CARD_HEADER}>
            <h3 style={CARD_TITLE}>Estimate Details</h3>
            <button style={EDIT_BTN} title="Edit" onClick={() => navigate("../quote?step=details")}>
              <Pencil size={14} />
            </button>
          </div>
          <InfoRow label="Number" value={p.estimateNumber} />
          <InfoRow label="Name" value={p.name} />
          <InfoRow label="Status" value={displayStage(stage)} />
          <InfoRow label="Created" value={p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : ds()} />
          <InfoRow label="Build Type" value={p.buildType || p.type} />
          <InfoRow label="Floor Area" value={p.floorArea ? `${p.floorArea}m²` : null} />
          <InfoRow label="Storeys" value={p.storeys} />
          <InfoRow label="Margin %" value={p.marginPct != null ? `${p.marginPct}%` : null} />
          <InfoRow label="Contingency %" value={p.contingencyPct != null ? `${p.contingencyPct}%` : null} />
          <InfoRow label="Valid Days" value={p.validDays} />
        </div>

        {/* Customer Details */}
        <div style={CARD}>
          <div style={CARD_HEADER}>
            <h3 style={CARD_TITLE}>Customer Details</h3>
            <button style={EDIT_BTN} title="Edit" onClick={() => navigate("../quote?step=details")}>
              <Pencil size={14} />
            </button>
          </div>
          <InfoRow label="Name" value={client?.displayName || p.client} />
          <InfoRow label="Address" value={[p.address, p.suburb].filter(Boolean).join(", ")} />
          <InfoRow label="Phone" value={contact?.phone || p.phone} />
          <InfoRow label="Email" value={contact?.email || p.email} />
        </div>

        {/* Lead Details */}
        <div style={CARD}>
          <div style={CARD_HEADER}>
            <h3 style={CARD_TITLE}>Lead Details</h3>
          </div>
          <div style={{ fontSize: 13, color: _.muted, lineHeight: 1.5 }}>
            No lead linked to this estimate.
          </div>
        </div>
      </div>

      {/* ─── Right column ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Work Location */}
        <div style={CARD}>
          <div style={CARD_HEADER}>
            <h3 style={CARD_TITLE}>Work Location</h3>
          </div>
          {(p.address || p.suburb) ? (
            <div style={{ fontSize: 14, color: _.ac, marginBottom: 12 }}>
              {[p.address, p.suburb].filter(Boolean).join(", ")}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: _.muted, marginBottom: 12 }}>No address set</div>
          )}
          <div style={{
            height: 280, background: _.well, borderRadius: 6,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 8,
          }}>
            <MapPin size={24} color={_.muted} />
            <span style={{ fontSize: 13, color: _.muted }}>
              {p.address || p.suburb || "Map preview"}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div style={CARD}>
          <div style={CARD_HEADER}>
            <h3 style={CARD_TITLE}>Notes</h3>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes about this estimate..."
            rows={5}
            style={{
              width: "100%", padding: 10, border: `1px solid ${_.line}`,
              borderRadius: 6, fontSize: 14, color: _.ink, fontFamily: "inherit",
              resize: "vertical", background: _.well, outline: "none",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button
              onClick={handleSaveNotes}
              style={{
                padding: "7px 16px", borderRadius: 6, border: "none",
                background: _.green, color: "#fff", fontSize: 13,
                fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
