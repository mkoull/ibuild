import Button from "../ui/Button.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { isQuote, isJobOnlyModule } from "../../lib/lifecycle.js";
import _ from "../../theme/tokens.js";

export default function JobModuleGate({ children, modulePath }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { project } = useProject();

  const stage = project?.stage || project?.status || "Lead";
  const currentModule = (modulePath || location.pathname.split("/").pop() || "").trim();
  const needsConversion = isQuote(stage) && isJobOnlyModule(currentModule);

  if (!needsConversion) return children;

  const target = encodeURIComponent(currentModule);
  return (
    <div style={{
      border: `1px solid ${_.line}`,
      borderRadius: _.r,
      background: _.surface,
      padding: _.s6,
      maxWidth: 560,
      margin: "32px auto",
    }}>
      <h2 style={{ margin: 0, fontSize: _.fontSize.xl, color: _.ink }}>Convert to Job to continue</h2>
      <p style={{ margin: `${_.s3}px 0 ${_.s5}px`, color: _.body, lineHeight: _.lineHeight.body }}>
        This module unlocks after quote-to-job conversion. You can import a costs baseline from the quote during conversion.
      </p>
      <Button onClick={() => navigate(`../overview?action=convert&return=${target}`)}>
        Convert & Import Budget
      </Button>
    </div>
  );
}
