import { Navigate, useParams } from "react-router-dom";

export default function LegacyJobRedirect() {
  const { jobId, id } = useParams();
  const projectId = jobId || id;
  if (!projectId) return <Navigate to="/projects" replace />;
  return <Navigate to={`/projects/${projectId}/overview`} replace />;
}
