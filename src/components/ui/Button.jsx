import _ from "../../theme/tokens.js";

const base = {
  padding: "9px 18px", border: "none", borderRadius: _.rSm,
  fontSize: 13, fontWeight: 600, cursor: "pointer", transition: `all ${_.tr}`,
  display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit",
  outline: "none", lineHeight: 1.3,
};

const variants = {
  primary: { ...base, background: _.ac, color: "#fff" },
  secondary: { ...base, background: _.surface, color: _.body, border: `1.5px solid ${_.line}` },
  ghost: { ...base, background: "transparent", color: _.body, padding: "9px 12px" },
  danger: { ...base, background: _.red, color: "#fff" },
};

const sizes = {
  sm: { padding: "6px 12px", fontSize: 12 },
  md: {},
};

export default function Button({ variant = "primary", size = "md", icon: Icon, disabled, onClick, children, style, ...rest }) {
  const s = { ...variants[variant] || variants.primary, ...sizes[size], ...(disabled ? { opacity: 0.4, cursor: "default", pointerEvents: "none" } : {}), ...style };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={s}
      onFocus={e => { e.currentTarget.style.boxShadow = _.focusRing; }}
      onBlur={e => { e.currentTarget.style.boxShadow = "none"; }}
      {...rest}
    >
      {Icon && <Icon size={size === "sm" ? 12 : 14} />}
      {children}
    </button>
  );
}
