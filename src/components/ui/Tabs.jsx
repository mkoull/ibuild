import _ from "../../theme/tokens.js";

export default function Tabs({ tabs, active, onChange, style }) {
  return (
    <div style={{ display: "flex", gap: _.s1, flexWrap: "wrap", ...style }}>
      {tabs.map(t => {
        const val = typeof t === "string" ? t : t.value;
        const lbl = typeof t === "string" ? t : t.label;
        const isActive = active === val;
        return (
          <div key={val} onClick={() => onChange(val)} style={{
            padding: `6px ${_.s4}px`, borderRadius: _.rFull, fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, cursor: "pointer",
            background: isActive ? _.ink : _.well, color: isActive ? "#fff" : _.muted,
            transition: `all ${_.tr}`,
          }}>
            {lbl}
          </div>
        );
      })}
    </div>
  );
}
