import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import _ from "../../theme/tokens.js";
import Button from "./Button.jsx";
import { useProject } from "../../context/ProjectContext.jsx";

export default function LockedTabGate({ children }) {
  const navigate = useNavigate();
  const { project } = useProject();
  const unlocked = !!project?.jobId || String(project?.status || "").toLowerCase() === "converted";
  if (unlocked) return children || null;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: 400, textAlign: "center", padding: 40,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%", background: _.well,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        <Lock size={24} color={_.muted} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: _.ink, marginBottom: 8 }}>
        This feature is available for jobs
      </div>
      <div style={{ fontSize: 14, color: _.muted, maxWidth: 380, lineHeight: 1.5, marginBottom: 24 }}>
        Convert this quote to a job to unlock this area.
      </div>
      <Button onClick={() => navigate("../overview?action=convert")}>Convert to Job</Button>
    </div>
  );
}
