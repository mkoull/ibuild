import { useNavigate, useParams } from "react-router-dom";
import _ from "../../theme/tokens.js";
import { useApp } from "../../context/AppContext.jsx";
import { pName } from "../../theme/styles.js";
import { ArrowLeft, Search } from "lucide-react";

export default function MobileHeader() {
  const navigate = useNavigate();
  const params = useParams();
  const { projects, clients, saveStatus } = useApp();
  const isProject = !!params.id;
  const project = isProject ? projects.find(p => p.id === params.id) : null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      background: _.surface, borderBottom: "1px solid rgba(0,0,0,0.06)",
      padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {isProject && (
          <div onClick={() => navigate("/projects")} style={{ cursor: "pointer", display: "flex", padding: 4 }}>
            <ArrowLeft size={18} color={_.body} />
          </div>
        )}
        <div onClick={() => navigate("/dashboard")} style={{
          width: 28, height: 28, background: "#1a1f2e", borderRadius: 7,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: "#dbeafe", cursor: "pointer",
        }}>i</div>
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: _.ink }}>
            {project ? pName(project, clients) : "iBuild"}
          </span>
          {saveStatus && <div style={{ fontSize: 9, color: _.faint, fontWeight: 500 }}>
            {saveStatus === "saving" ? "Saving\u2026" : `Saved ${saveStatus}`}
          </div>}
        </div>
      </div>

      {/* Search trigger */}
      <div onClick={() => window.dispatchEvent(new CustomEvent("open-command-bar"))} style={{
        width: 32, height: 32, borderRadius: 8, display: "flex",
        alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: _.muted,
      }}>
        <Search size={18} />
      </div>
    </div>
  );
}
