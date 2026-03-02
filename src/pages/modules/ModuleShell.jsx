import { Navigate, useParams } from "react-router-dom";
import Section from "../../components/ui/Section.jsx";
import { useApp, useProjectsCtx } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";

function ModuleUnlinkedState({ module }) {
  return (
    <Section>
      <div style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: _.fontSize["3xl"], fontWeight: _.fontWeight.bold, marginBottom: _.s2 }}>
          {module.title || "Module"}
        </h1>
        <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s6 }}>
          This module is not linked to a project yet.
        </div>
        <div style={{ padding: _.s5, border: `1px solid ${_.line}`, borderRadius: _.rSm, background: _.surface }}>
          <div style={{ fontSize: _.fontSize.base, color: _.body, marginBottom: _.s3 }}>
            Link it to a project to use live data, or keep it standalone as a planning placeholder.
          </div>
          <div style={{ fontSize: _.fontSize.sm, color: _.faint }}>
            Type: {module.type}
          </div>
        </div>
      </div>
    </Section>
  );
}

const MODULE_PATH = { quote: "quote", schedule: "schedule", costs: "costs", invoices: "invoices" };

export default function ModuleShell() {
  const { moduleId } = useParams();
  const { modulesHook } = useApp();
  const { find } = useProjectsCtx();
  const module = modulesHook.find(moduleId);

  if (!module) return <Navigate to="/projects" replace />;

  const project = module.projectId ? find(module.projectId) : null;
  if (!module.projectId || !project) {
    return <ModuleUnlinkedState module={module} />;
  }

  const modulePath = MODULE_PATH[module.type];
  if (!modulePath) return <ModuleUnlinkedState module={module} />;
  return <Navigate to={`/projects/${project.id}/${modulePath}?moduleId=${module.id}`} replace />;
}

