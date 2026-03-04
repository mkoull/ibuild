import { Link } from "react-router-dom";
import _ from "../../theme/tokens.js";

const LINK_CARD = {
  border: `1px solid ${_.line}`,
  borderRadius: 10,
  background: _.surface,
  padding: 16,
  textDecoration: "none",
  display: "block",
};

export default function CloseoutSectionPage() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, color: _.ink }}>Closeout</h2>
        <p style={{ margin: "6px 0 0", color: _.muted, fontSize: 14 }}>
          Final defects and completion handover items for project close.
        </p>
      </div>
      <div className="layout-grid-12">
        <Link className="col-6" to="../defects" style={LINK_CARD}>
          <div style={{ fontSize: 16, fontWeight: 600, color: _.ink }}>Defects</div>
          <div style={{ fontSize: 14, color: _.muted, marginTop: 6 }}>Track punch list items through completion.</div>
        </Link>
        <Link className="col-6" to="../documents" style={LINK_CARD}>
          <div style={{ fontSize: 16, fontWeight: 600, color: _.ink }}>Completion</div>
          <div style={{ fontSize: 14, color: _.muted, marginTop: 6 }}>Store completion records and handover documentation.</div>
        </Link>
      </div>
    </div>
  );
}
