import { useParams, Outlet, Navigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import { ProjectProvider } from "../../context/ProjectContext.jsx";

export default function ProjectShell() {
  const { id } = useParams();
  const { projects } = useApp();

  const project = projects.find(p => p.id === id);

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <ProjectProvider project={project}>
      <Outlet />
    </ProjectProvider>
  );
}
