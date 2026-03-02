import { useParams, Outlet, Navigate } from "react-router-dom";
import { useProjectsCtx } from "../../context/AppContext.jsx";
import { ProjectProvider } from "../../context/ProjectContext.jsx";

export default function ProjectShell() {
  const { id } = useParams();
  const { find } = useProjectsCtx();

  const project = find(id);

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <ProjectProvider project={project}>
      <Outlet />
    </ProjectProvider>
  );
}
