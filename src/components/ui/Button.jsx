import _ from "../../theme/tokens.js";

const base = {
  padding: "9px 18px", border: "none", borderRadius: _.rSm,
  fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, cursor: "pointer", transition: `all ${_.tr}`,
  display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit",
  outline: "none", lineHeight: _.lineHeight.snug,
};

const variants = {
  primary: { ...base, background: _.ac, color: "#fff" },
  secondary: { ...base, background: _.surface, color: _.body, border: `1.5px solid ${_.line}` },
  ghost: { ...base, background: "transparent", color: _.body, padding: "9px 12px" },
  danger: { ...base, background: _.red, color: "#fff" },
};

const sizes = {
  sm: { padding: "6px 12px", fontSize: _.fontSize.sm },
  md: {},
};

export default function Button({ variant = "primary", size = "md", icon: Icon, disabled, onClick, children, style, ...rest }) {
  const s = { ...variants[variant] || variants.primary, ...sizes[size], ...(disabled ? { opacity: 0.4, cursor: "default", pointerEvents: "none" } : {}), ...style };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={s}
      onMouseEnter={e => {
        if (disabled) return;
        if (variant === "primary") e.currentTarget.style.background = _.acDark;
        if (variant === "secondary") e.currentTarget.style.background = _.well;
      }}
      onMouseLeave={e => {
        if (disabled) return;
        if (variant === "primary") e.currentTarget.style.background = _.ac;
        if (variant === "secondary") e.currentTarget.style.background = _.surface;
      }}
      onFocus={e => { e.currentTarget.style.boxShadow = _.focusRing; }}
      onBlur={e => { e.currentTarget.style.boxShadow = "none"; }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = "translateY(1px)"; }}
      onMouseUp={e => { if (!disabled) e.currentTarget.style.transform = "translateY(0)"; }}
      {...rest}
    >
      {Icon && <Icon size={size === "sm" ? 12 : 14} />}
      {children}
    </button>
  );
}
