import _ from "../../theme/tokens.js";
import Button from "./Button.jsx";
import { ArrowRight } from "lucide-react";

export default function Empty({ icon: Ic, text, action, actionText }) {
  return (
    <div style={{ textAlign: "center", padding: `${_.s9}px ${_.s7}px`, borderRadius: _.r, border: `1.5px dashed ${_.line2}` }}>
      {Ic && <div style={{ marginBottom: _.s4, display: "flex", justifyContent: "center" }}><Ic size={28} strokeWidth={1.5} color={_.faint} /></div>}
      <div style={{ fontSize: _.fontSize.md, color: _.muted, lineHeight: _.lineHeight.body }}>{text}</div>
      {action && (
        <div style={{ marginTop: _.s5 }}>
          <Button onClick={action} icon={ArrowRight}>{actionText}</Button>
        </div>
      )}
    </div>
  );
}
