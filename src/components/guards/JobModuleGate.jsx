import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { isQuote, normaliseStage } from "../../lib/lifecycle.js";
import { snapshotFromQuote, importSectionLevel } from "../../lib/budgetEngine.js";
import _ from "../../theme/tokens.js";
import Button from "../ui/Button.jsx";
import { Lock, ArrowRight } from "lucide-react";

export default function JobModuleGate({ moduleName, children }) {
  const { project, update: up, convertToJob } = useProject();
  const { notify } = useApp();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const stage = normaliseStage(project.stage || project.status);

  if (!isQuote(stage)) return children;

  const isLead = stage === "Lead";
  const hasScope = Object.keys(project.scope || {}).length > 0;

  const doConvert = () => {
    convertToJob();
    if (hasScope) {
      up(pr => {
        pr.quoteSnapshotBudget = snapshotFromQuote(pr);
        pr.budget = importSectionLevel(pr);
        return pr;
      });
    }
    notify("Converted to Job — budget imported");
    setShowConfirm(false);
  };

  return (
    <div style={{ animation: "fadeUp 0.2s ease", maxWidth: 1200 }}>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: `${_.s10}px ${_.s7}px`, textAlign: "center",
        border: `1.5px dashed ${_.line2}`, borderRadius: _.r, marginTop: _.s8,
      }}>
        <Lock size={32} strokeWidth={1.5} color={_.faint} />
        <div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.semi, color: _.ink, marginTop: _.s5 }}>
          {isLead
            ? `${moduleName} unlocks when this project becomes a Job`
            : `${moduleName} is available for Jobs`
          }
        </div>
        <div style={{ fontSize: _.fontSize.md, color: _.muted, marginTop: _.s2, maxWidth: 440, lineHeight: _.lineHeight.body }}>
          {isLead
            ? "This project is still a Lead. Build the quote first, then convert to a Job to unlock Invoices, Costs, Variations, Schedule, Site Diary, Defects and Trades."
            : "This is a Quote. Convert to a Job to unlock Invoices, Costs, Variations, Schedule, Site Diary, Defects and Trades."
          }
        </div>

        {!showConfirm ? (
          <div style={{ marginTop: _.s6, display: "flex", gap: _.s3 }}>
            {isLead ? (
              <Button onClick={() => navigate("../quote?step=scope")} icon={ArrowRight}>Go to Quote</Button>
            ) : (
              <Button onClick={() => setShowConfirm(true)} icon={ArrowRight}>Convert to Job</Button>
            )}
            <Button variant="ghost" onClick={() => navigate("../overview")}>Overview</Button>
          </div>
        ) : (
          <div style={{
            marginTop: _.s6, padding: `${_.s4}px ${_.s5}px`, background: _.well,
            borderRadius: _.rSm, maxWidth: 380, textAlign: "center",
          }}>
            <div style={{ fontSize: _.fontSize.md, color: _.body, lineHeight: _.lineHeight.body, marginBottom: _.s4 }}>
              Convert this project to a Job?{hasScope ? " Budget will be imported from the quote." : ""}
            </div>
            <div style={{ display: "flex", gap: _.s2, justifyContent: "center" }}>
              <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button onClick={doConvert}>Convert</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
