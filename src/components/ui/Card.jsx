import _ from "../../theme/tokens.js";

export default function Card({ title, children, style, headerRight, ...rest }) {
  return (
    <div style={{
      background: _.surface, border: `1px solid ${_.line}`, borderRadius: _.r,
      padding: 24, ...style,
    }} {...rest}>
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: _.ink }}>{title}</div>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}
