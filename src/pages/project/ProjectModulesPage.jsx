import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import Section from "../../components/ui/Section.jsx";
import Button from "../../components/ui/Button.jsx";
import Empty from "../../components/ui/Empty.jsx";
import PageHero from "../../components/ui/PageHero.jsx";
import _ from "../../theme/tokens.js";
import { Puzzle, ArrowRight, Plus } from "lucide-react";

const MODULE_TYPES = ["quote", "schedule", "costs", "invoices"];

export default function ProjectModulesPage() {
  const { project } = useProject();
  const { modulesHook, notify } = useApp();
  const navigate = useNavigate();

  const modules = modulesHook.forProject(project.id);

  const createModule = (type) => {
    const quoteModule = modules.find(m => m.type === "quote") || null;
    const m = modulesHook.create({
      type,
      projectId: project.id,
      title: `${project.name || project.client || "Project"} · ${type}`,
      links: quoteModule && type !== "quote"
        ? { sourceOfTruth: quoteModule.id, derivedFrom: quoteModule.id, relatedTo: [quoteModule.id] }
        : undefined,
    });
    notify(`${type} module created`);
    navigate(`/modules/${m.id}`);
  };

  return (
    <Section>
      <PageHero
        icon={Puzzle}
        title="Modules"
        subtitle="Project-linked module instances"
      />

      {modules.length === 0 && (
        <Empty icon={Puzzle} title="No modules yet" text="Start by creating a quote, schedule, costs, or invoices module for this project.">
          <div style={{ display: "flex", gap: _.s2, marginTop: _.s3, flexWrap: "wrap" }}>
            {MODULE_TYPES.map(type => (
              <Button key={type} variant="secondary" size="sm" icon={Plus} onClick={() => createModule(type)}>
                Add {type}
              </Button>
            ))}
          </div>
        </Empty>
      )}

      {modules.length > 0 && (
        <>
          <div style={{ display: "flex", gap: _.s2, marginBottom: _.s4, flexWrap: "wrap" }}>
            {MODULE_TYPES.map(type => (
              <Button key={type} variant="secondary" size="sm" icon={Plus} onClick={() => createModule(type)}>
                Add {type}
              </Button>
            ))}
          </div>
          <div>
            {modules.map(m => (
              <div key={m.id} onClick={() => navigate(`/modules/${m.id}`)} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`,
                cursor: "pointer",
              }}>
                <div>
                  <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>{m.title}</div>
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{m.type} · {m.status || "active"}</div>
                </div>
                <ArrowRight size={14} color={_.faint} />
              </div>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}

