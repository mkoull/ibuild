import Section from "../../components/ui/Section.jsx";
import Button from "../../components/ui/Button.jsx";
import _ from "../../theme/tokens.js";
import { useNavigate } from "react-router-dom";

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  return (
    <Section>
      <h1 style={{ fontSize: _.fontSize["3xl"], fontWeight: _.fontWeight.bold, marginBottom: _.s2 }}>Purchase Orders</h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s5 }}>
        PO workflow is available from Cost Tracker commitments.
      </div>
      <Button onClick={() => navigate("../costs")}>Open Cost Tracker</Button>
    </Section>
  );
}
