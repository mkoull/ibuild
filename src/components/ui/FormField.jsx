import { label as labelStyle, input as inputStyle } from "../../theme/styles.js";

export default function FormField({ label, children, style: wrapStyle }) {
  return (
    <div style={wrapStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}
