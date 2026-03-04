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

export default function FinancialSectionPage() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, color: _.ink }}>Financial</h2>
        <p style={{ margin: "6px 0 0", color: _.muted, fontSize: 14 }}>
          Track budget vs actual performance and manage claims/invoices.
        </p>
      </div>
      <div className="layout-grid-12">
        <Link className="col-6" to="../costs" style={LINK_CARD}>
          <div style={{ fontSize: 16, fontWeight: 600, color: _.ink }}>Budget vs Actual</div>
          <div style={{ fontSize: 14, color: _.muted, marginTop: 6 }}>Cost control, trade/cost code views, and variance.</div>
        </Link>
        <Link className="col-6" to="../invoices" style={LINK_CARD}>
          <div style={{ fontSize: 16, fontWeight: 600, color: _.ink }}>Invoices</div>
          <div style={{ fontSize: 14, color: _.muted, marginTop: 6 }}>Create invoices, track paid/unpaid status, and receivables.</div>
        </Link>
      </div>
    </div>
  );
}
