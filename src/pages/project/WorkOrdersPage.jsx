import Section from "../../components/ui/Section.jsx";
import Button from "../../components/ui/Button.jsx";
import _ from "../../theme/tokens.js";
import { useNavigate } from "react-router-dom";

export default function WorkOrdersPage() {
  const navigate = useNavigate();
  return (
    <Section>
      <h1 style={{ fontSize: _.fontSize["3xl"], fontWeight: _.fontWeight.bold, marginBottom: _.s2 }}>Work Orders</h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s5 }}>
        Work order tooling is staged in the site workflow. Use Schedule and Trades to coordinate assignments.
      </div>
      <div style={{ display: "flex", gap: _.s2, flexWrap: "wrap" }}>
        <Button variant="secondary" onClick={() => navigate("../schedule")}>Open Schedule</Button>
        <Button onClick={() => navigate("../trades")}>Open Trades</Button>
      </div>
    </Section>
  );
}
