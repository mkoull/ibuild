import _ from "../../theme/tokens.js";
import { btnPrimary } from "../../theme/styles.js";
import { ArrowRight } from "lucide-react";

export default function Empty({ icon: Ic, text, action, actionText }) {
  return (
    <div style={{ textAlign: "center", padding: `${_.s9}px ${_.s7}px`, borderRadius: _.r, border: `1.5px dashed ${_.line2}` }}>
      {Ic && <div style={{ marginBottom: _.s4, display: "flex", justifyContent: "center" }}><Ic size={28} strokeWidth={1.5} color={_.faint} /></div>}
      <div style={{ fontSize: 14, color: _.muted, lineHeight: 1.5 }}>{text}</div>
      {action && <button onClick={action} style={{ ...btnPrimary, marginTop: _.s5 }}>{actionText} <ArrowRight size={14} /></button>}
    </div>
  );
}
