import { Lock } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import Empty from "../ui/Empty.jsx";
import { isSubcontractor } from "../../lib/permissions.js";

export default function SubcontractorRestricted({ children, message = "This area is restricted." }) {
  const { currentUser } = useApp();
  if (isSubcontractor(currentUser)) {
    return <Empty icon={Lock} title="Restricted access" text={message} />;
  }
  return children;
}
