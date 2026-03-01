import _ from "../../theme/tokens.js";
import Section from "../../components/ui/Section.jsx";
import { FolderOpen } from "lucide-react";

export default function DocumentsPage() {
  return (
    <Section>
      <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Documents</h1>
      <div style={{ padding: 32, textAlign: "center", color: _.muted, fontSize: 14, border: `1.5px dashed ${_.line2}`, borderRadius: _.r }}>
        Document management coming soon.
      </div>
    </Section>
  );
}
