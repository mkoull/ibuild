import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import LockedState from "./LockedState.jsx";

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
    <LockedState onConvert={onConvert} />
  );
}
