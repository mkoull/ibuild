import { useState } from "react";
import _ from "../../../theme/tokens.js";
import { fmt } from "../../../theme/styles.js";
import Card from "../../../components/ui/Card.jsx";
import Button from "../../../components/ui/Button.jsx";
import { ArrowRight, ChevronDown } from "lucide-react";

export default function QuoteSummaryCard({ T, margin, contingency, mobile, onReview }) {
  const [expanded, setExpanded] = useState(false);

  if (mobile) {
    return (
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          background: _.surface, border: `1px solid ${_.line}`, borderRadius: _.r,
          padding: "12px 16px", marginBottom: _.s3, cursor: "pointer",
          boxShadow: _.sh1,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, textTransform: "uppercase", letterSpacing: _.letterSpacing.wide }}>Quote Total</div>
            <div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.curr > 0 ? _.ink : _.faint }}>{fmt(T.curr)}</div>
          </div>
          <ChevronDown size={16} color={_.muted} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: `transform ${_.tr}` }} />
        </div>
        {expanded && (
          <div style={{ borderTop: `1px solid ${_.line}`, paddingTop: _.s3, marginTop: _.s3 }}>
            {[
              ["Items", T.items],
              ["Subtotal", fmt(T.sub)],
              [`Margin ${margin}%`, fmt(T.mar)],
              [`Contingency ${contingency}%`, fmt(T.con)],
              ["GST", fmt(T.gst)],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: _.fontSize.base, color: _.body }}>
                <span>{l}</span><span style={{ fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums" }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "sticky", top: 0 }}>
      <Card style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: 6 }}>Quote Summary</div>
          <div style={{ fontSize: _.fontSize["3xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, fontVariantNumeric: "tabular-nums", color: T.curr > 0 ? _.ink : _.faint, lineHeight: 1 }}>
            {fmt(T.curr)}
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${_.line}`, paddingTop: 10 }}>
          {[
            ["Items", T.items],
            ["Subtotal", fmt(T.sub)],
            [`Margin ${margin}%`, fmt(T.mar)],
            [`Contingency ${contingency}%`, fmt(T.con)],
            ["GST", fmt(T.gst)],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: _.fontSize.base, color: _.body }}>
              <span>{l}</span><span style={{ fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums" }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold, color: _.ink, borderTop: `1px solid ${_.line}`, marginTop: 8 }}>
            <span>Total</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</span>
          </div>
        </div>
        {onReview && (
          <Button onClick={onReview} style={{ width: "100%", marginTop: _.s3, justifyContent: "center" }} icon={ArrowRight}>
            Review Quote
          </Button>
        )}
      </Card>
    </div>
  );
}
