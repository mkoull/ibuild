import { useState } from "react";
import _ from "../../../theme/tokens.js";
import { fmt } from "../../../theme/styles.js";
import Card from "../../../components/ui/Card.jsx";
import Button from "../../../components/ui/Button.jsx";
import { ArrowRight, ChevronDown } from "lucide-react";

export default function QuoteSummaryCard({ T, margin, contingency, mobile, onReview, sticky = true }) {
  const [expanded, setExpanded] = useState(false);

  if (mobile) {
    return (
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          background: _.surface, border: `1px solid ${_.line}`, borderRadius: 10,
          padding: "14px 18px", marginBottom: _.s3, cursor: "pointer",
          boxShadow: _.sh2,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: _.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quote Total</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: T.curr > 0 ? _.ink : _.faint, letterSpacing: _.letterSpacing.tight }}>{fmt(T.curr)}</div>
          </div>
          <ChevronDown size={16} color={_.muted} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: `transform ${_.tr}` }} />
        </div>
        {expanded && (
          <div style={{ borderTop: `1px solid ${_.line}`, paddingTop: 12, marginTop: 12 }}>
            {ROWS(T, margin, contingency).map(([l, v]) => (
              <Row key={l} label={l} value={v} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={sticky ? { position: "sticky", top: 16 } : undefined}>
      <Card style={{ padding: 20 }}>
        {/* Big total */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: _.muted,
            letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6,
          }}>Quote Total</div>
          <div style={{
            fontSize: 32, fontWeight: 700, letterSpacing: _.letterSpacing.tight,
            fontVariantNumeric: "tabular-nums",
            color: T.curr > 0 ? _.ink : _.faint, lineHeight: 1,
          }}>
            {fmt(T.curr)}
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ borderTop: `1px solid ${_.line}`, paddingTop: 12 }}>
          {ROWS(T, margin, contingency).map(([l, v]) => (
            <Row key={l} label={l} value={v} />
          ))}
          <div style={{
            display: "flex", justifyContent: "space-between",
            padding: "10px 0 4px",
            fontSize: 15, fontWeight: 700, color: _.ink,
            borderTop: `2px solid ${_.ink}`, marginTop: 10,
          }}>
            <span>Total (inc. GST)</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</span>
          </div>
        </div>

        {/* CTA */}
        {onReview && (
          <Button onClick={onReview} style={{ width: "100%", marginTop: 16, justifyContent: "center" }} icon={ArrowRight}>
            Review Quote
          </Button>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "4px 0", fontSize: 13, color: _.body,
    }}>
      <span>{label}</span>
      <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

function ROWS(T, margin, contingency) {
  return [
    ["Items", T.items],
    ["Subtotal", fmt(T.sub)],
    [`Margin ${margin}%`, fmt(T.mar)],
    [`Contingency ${contingency}%`, fmt(T.con)],
    ["GST 10%", fmt(T.gst)],
  ];
}
