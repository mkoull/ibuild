import _ from "../../theme/tokens.js";
import { STAGES } from "../../data/defaults.js";

export default function StagePipeline({ currentStage }) {
  const sIdx = STAGES.indexOf(currentStage);
  return (
    <div style={{ paddingTop: 24, paddingBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {STAGES.map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: i <= sIdx ? "#0a0f1a" : _.line2,
              flexShrink: 0, zIndex: 1, transition: "background 0.2s",
            }} />
            {i < STAGES.length - 1 && (
              <div style={{
                flex: 1, height: 0.5,
                background: i < sIdx ? "#0a0f1a" : _.line,
                transition: "background 0.2s",
              }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {STAGES.map((s, i) => (
          <span key={s} style={{
            fontSize: 10,
            color: i <= sIdx ? "#0a0f1a" : _.faint,
            fontWeight: i === sIdx ? 700 : 400,
            letterSpacing: "0.02em",
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
}
