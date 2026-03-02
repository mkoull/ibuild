import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import _ from "../../theme/tokens.js";
import { useProject } from "../../context/ProjectContext.jsx";
import { fmt } from "../../theme/styles.js";

export default function PaymentsPage() {
  const { T } = useProject();
  return (
    <Section>
      <h1 style={{ fontSize: _.fontSize["3xl"], fontWeight: _.fontWeight.bold, marginBottom: _.s2 }}>Payments</h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s5 }}>
        Payment tracking from invoicing and receipts.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: _.s3 }}>
        <Card style={{ padding: _.s3 }}>
          <div style={{ fontSize: _.fontSize.xs, color: _.muted, textTransform: "uppercase", letterSpacing: _.letterSpacing.wide, fontWeight: _.fontWeight.semi }}>Contract</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold }}>{fmt(T.curr)}</div>
        </Card>
        <Card style={{ padding: _.s3 }}>
          <div style={{ fontSize: _.fontSize.xs, color: _.muted, textTransform: "uppercase", letterSpacing: _.letterSpacing.wide, fontWeight: _.fontWeight.semi }}>Invoiced</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold }}>{fmt(T.inv)}</div>
        </Card>
        <Card style={{ padding: _.s3 }}>
          <div style={{ fontSize: _.fontSize.xs, color: _.muted, textTransform: "uppercase", letterSpacing: _.letterSpacing.wide, fontWeight: _.fontWeight.semi }}>Paid</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, color: _.green }}>{fmt(T.paid)}</div>
        </Card>
        <Card style={{ padding: _.s3 }}>
          <div style={{ fontSize: _.fontSize.xs, color: _.muted, textTransform: "uppercase", letterSpacing: _.letterSpacing.wide, fontWeight: _.fontWeight.semi }}>Outstanding</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, color: _.red }}>{fmt(T.outstanding)}</div>
        </Card>
      </div>
    </Section>
  );
}
