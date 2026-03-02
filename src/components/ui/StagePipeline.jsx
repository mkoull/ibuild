import _ from "../../theme/tokens.js";
import { STAGES } from "../../data/defaults.js";

export default function StagePipeline({ currentStage }) {
  const sIdx = STAGES.indexOf(currentStage);
  return (
    <div style={{ paddingTop: _.s6, paddingBottom: _.s2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {STAGES.map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: i <= sIdx ? _.ink : _.line2,
              flexShrink: 0, zIndex: 1, transition: `background 0.2s`,
            }} />
            {i < STAGES.length - 1 && (
              <div style={{
                flex: 1, height: 0.5,
                background: i < sIdx ? _.ink : _.line,
                transition: `background 0.2s`,
              }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: _.s2 }}>
        {STAGES.map((s, i) => (
          <span key={s} style={{
            fontSize: _.fontSize.xs,
            color: i <= sIdx ? _.ink : _.faint,
            fontWeight: i === sIdx ? _.fontWeight.bold : _.fontWeight.normal,
            letterSpacing: "0.02em",
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
}
