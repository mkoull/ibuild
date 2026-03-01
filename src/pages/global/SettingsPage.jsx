import _ from "../../theme/tokens.js";
import Section from "../../components/ui/Section.jsx";

export default function SettingsPage() {
  return (
    <Section>
      <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Settings</h1>
      <div style={{ fontSize: 14, color: _.muted, marginBottom: 32 }}>Company configuration</div>
      <div style={{ padding: 32, textAlign: "center", color: _.muted, fontSize: 14, border: `1.5px dashed ${_.line2}`, borderRadius: _.r }}>
        Settings page — company name, default margin/contingency, role selector. Coming soon.
      </div>
    </Section>
  );
}
