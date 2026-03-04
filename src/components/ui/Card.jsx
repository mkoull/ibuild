import _ from "../../theme/tokens.js";

export default function Card({ title, subtitle, icon: Icon, children, style, headerRight, accent = false, interactive = false, ...rest }) {
  return (
    <div style={{
      background: _.surface,
      border: `1px solid ${accent ? `${_.ac}30` : _.line}`,
      borderRadius: _.r,
      boxShadow: accent ? _.shadowElevated : _.sh1,
      padding: _.s4,
      transition: `transform ${_.tr}, box-shadow ${_.tr}, border-color ${_.tr}`,
      ...(interactive ? { cursor: "pointer" } : {}),
      ...style,
    }}
      onMouseEnter={interactive ? (e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = _.sh2; }) : undefined}
      onMouseLeave={interactive ? (e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = accent ? _.shadowElevated : _.sh1; }) : undefined}
      {...rest}
    >
      {(title || subtitle) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
            {Icon && (
              <div style={{
                width: 22, height: 22, borderRadius: _.rSm,
                background: _.acSoft, color: _.ac,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon size={13} />
              </div>
            )}
            <div>
              {title && <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>{title}</div>}
              {subtitle && <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 1 }}>{subtitle}</div>}
            </div>
          </div>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}
