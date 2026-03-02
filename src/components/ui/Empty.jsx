import _ from "../../theme/tokens.js";
import Button from "./Button.jsx";
import { ArrowRight } from "lucide-react";

export default function Empty({ icon: Ic, title, text, action, actionText, children }) {
  return (
    <div style={{
      textAlign: "center",
      padding: `${_.s9}px ${_.s7}px`,
      borderRadius: _.r,
      border: `1.5px dashed ${_.line2}`,
      background: `linear-gradient(180deg, ${_.surface} 0%, ${_.bg2} 100%)`,
    }}>
      {Ic && (
        <div style={{ marginBottom: _.s4, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: _.acSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic size={24} strokeWidth={1.7} color={_.ac} />
          </div>
        </div>
      )}
      {title && <div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s2 }}>{title}</div>}
      <div style={{ fontSize: _.fontSize.md, color: _.muted, lineHeight: _.lineHeight.body }}>{text}</div>
      {action && (
        <div style={{ marginTop: _.s5 }}>
          <Button onClick={action} icon={ArrowRight}>{actionText}</Button>
        </div>
      )}
      {children}
    </div>
  );
}
