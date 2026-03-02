import _ from "../../theme/tokens.js";

export default function Card({ title, children, style, headerRight, ...rest }) {
  return (
    <div style={{
      background: _.surface, border: `1px solid ${_.line}`, borderRadius: _.r,
      boxShadow: _.sh1, padding: _.s6, ...style,
    }} {...rest}>
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s4 }}>
          <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>{title}</div>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}
