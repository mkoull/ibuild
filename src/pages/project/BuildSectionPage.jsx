import { Link } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import _ from "../../theme/tokens.js";
import { displayStage } from "../../config/workspaceTabs.js";

const LINK_CARD = {
  border: `1px solid ${_.line}`,
  borderRadius: 10,
  background: _.surface,
  padding: 16,
  textDecoration: "none",
  display: "block",
};

export default function BuildSectionPage() {
  const { project } = useProject();
  const stage = String(project?.stage || project?.status || "");
  const isActive = stage.toLowerCase() === "active";

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, color: _.ink }}>Build</h2>
        <p style={{ margin: "6px 0 0", color: _.muted, fontSize: 14 }}>
          Schedule delivery, manage procurement, variations, and site diaries.
        </p>
      </div>
      {!isActive && (
        <div style={{ border: `1px solid ${_.line}`, borderRadius: 10, background: _.surface, padding: 14, color: _.muted, fontSize: 13 }}>
          Build modules unlock when the project becomes an active job. Current status: {displayStage(stage)}.
        </div>
      )}
      <div className="layout-grid-12">
        <Link className="col-6" to="../schedule" style={LINK_CARD}>
          <div style={{ fontSize: 16, fontWeight: 600, color: _.ink }}>Schedule</div>
          <div style={{ fontSize: 14, color: _.muted, marginTop: 6 }}>Task sequencing and project timeline.</div>
        </Link>
        <Link className="col-6" to="../procurement" style={LINK_CARD}>
          <div style={{ fontSize: 16, fontWeight: 600, color: _.ink }}>Procurement</div>
          <div style={{ fontSize: 14, color: _.muted, marginTop: 6 }}>Purchase orders, suppliers, and bill capture.</div>
        </Link>
        <Link className="col-6" to="../variations" style={LINK_CARD}>
          <div style={{ fontSize: 16, fontWeight: 600, color: _.ink }}>Variations</div>
          <div style={{ fontSize: 14, color: _.muted, marginTop: 6 }}>Change orders and contract adjustments.</div>
        </Link>
        <Link className="col-6" to="../site-diary" style={LINK_CARD}>
          <div style={{ fontSize: 16, fontWeight: 600, color: _.ink }}>Site Diary</div>
          <div style={{ fontSize: 14, color: _.muted, marginTop: 6 }}>Daily logs, weather, trades, and photos.</div>
        </Link>
      </div>
    </div>
  );
}
