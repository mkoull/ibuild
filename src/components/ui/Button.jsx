import _ from "../../theme/tokens.js";

const base = {
  padding: "8px 16px", border: `1px solid transparent`, borderRadius: _.rSm,
  fontSize: 14, fontWeight: _.fontWeight.semi, cursor: "pointer", transition: `all ${_.tr}`,
  display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "inherit",
  outline: "none", lineHeight: _.lineHeight.snug,
};

const variants = {
  primary: { ...base, background: _.ac, color: "#fff" },
  secondary: { ...base, background: _.surface, color: _.body, border: `1px solid ${_.line}` },
  success: { ...base, background: _.green, color: "#fff" },
  ghost: { ...base, background: "transparent", color: _.body, padding: "8px 12px" },
  danger: { ...base, background: _.red, color: "#fff" },
};

const sizes = {
  sm: { padding: "6px 10px", fontSize: _.fontSize.sm },
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
        if (variant === "success") e.currentTarget.style.filter = "brightness(0.95)";
        if (variant === "danger") e.currentTarget.style.filter = "brightness(0.95)";
      }}
      onMouseLeave={e => {
        if (disabled) return;
        if (variant === "primary") e.currentTarget.style.background = _.ac;
        if (variant === "secondary") e.currentTarget.style.background = _.surface;
        if (variant === "success" || variant === "danger") e.currentTarget.style.filter = "none";
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
