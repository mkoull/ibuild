import { useNavigate } from "react-router-dom";
import { Hammer } from "lucide-react";
import _ from "../../theme/tokens.js";
import { useProject } from "../../context/ProjectContext.jsx";
import Empty from "./Empty.jsx";

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
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 420,
      padding: 24,
    }}>
      <div style={{ width: "min(560px, 100%)" }}>
        <Empty
          icon={Hammer}
          title="Convert to Job to unlock this area"
          text="This area becomes available once the project is converted into an active job so delivery workflows can run against an active lifecycle."
          action={onConvert}
          actionText="Convert to Job"
        />
      </div>
    </div>
  );
}
