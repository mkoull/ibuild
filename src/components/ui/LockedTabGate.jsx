import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import _ from "../../theme/tokens.js";
import Button from "./Button.jsx";
import { useProject } from "../../context/ProjectContext.jsx";

export default function LockedTabGate({ children }) {
  const navigate = useNavigate();
  const { project, update } = useProject();
  const unlocked = String(project?.stage || project?.status || "").toLowerCase() === "active";
  if (unlocked) return children || null;

  const onConvert = () => {
    update((pr) => {
      pr.stage = "Active";
      pr.status = "Active";
      pr.updatedAt = new Date().toISOString();
      if (!Array.isArray(pr.activity)) pr.activity = [];
      pr.activity.unshift({
        action: "Converted to Job",
        date: new Date().toLocaleDateString("en-AU"),
        time: new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }),
      });
      if (pr.activity.length > 30) pr.activity = pr.activity.slice(0, 30);
      return pr;
    });
    navigate("../overview");
  };

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
        Convert to Job to unlock
      </div>
      <div style={{ fontSize: 14, color: _.muted, maxWidth: 380, lineHeight: 1.5, marginBottom: 24 }}>
        This area becomes available once the project is converted into an active job.
      </div>
      <Button onClick={onConvert}>Convert to Job</Button>
    </div>
  );
}
