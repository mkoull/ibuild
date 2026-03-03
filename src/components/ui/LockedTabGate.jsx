import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { applyConvertToJobBaseline } from "../../lib/costEngine.js";
import LockedState from "./LockedState.jsx";

export default function LockedTabGate({ children }) {
  const navigate = useNavigate();
  const { project, update } = useProject();
  const { notify } = useApp();
  const unlocked = String(project?.stage || project?.status || "").toLowerCase() === "active";
  if (unlocked) return children || null;

  const onConvert = () => {
    let converted = false;
    update((pr) => {
      converted = applyConvertToJobBaseline(pr);
      return pr;
    });
    if (!converted) {
      notify("Already converted to job.");
      return;
    }
    notify("Project converted to job");
    navigate("../overview");
  };

  return (
    <LockedState onConvert={onConvert} />
  );
}
