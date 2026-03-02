import _ from "../../theme/tokens.js";

export default function PageHero({ title, subtitle, actions, icon: Icon, style }) {
  return (
    <div style={{
      marginBottom: _.s7,
      padding: `${_.s5}px ${_.s5}px`,
      borderRadius: _.r,
      border: `1px solid ${_.line}`,
      background: `linear-gradient(180deg, ${_.surface} 0%, ${_.bg2} 100%)`,
      boxShadow: _.sh1,
      ...style,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: _.s4, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: _.s2, marginBottom: _.s2 }}>
            {Icon && (
              <div style={{
                width: 24, height: 24, borderRadius: _.rSm,
                background: _.acSoft, color: _.ac,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={14} />
              </div>
            )}
            <h1 style={{ margin: 0, fontSize: _.fontSize["3xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, color: _.ink }}>
              {title}
            </h1>
          </div>
          {subtitle && <div style={{ fontSize: _.fontSize.base, color: _.muted }}>{subtitle}</div>}
        </div>
        {actions && <div style={{ display: "flex", gap: _.s2, flexWrap: "wrap" }}>{actions}</div>}
      </div>
    </div>
  );
}

