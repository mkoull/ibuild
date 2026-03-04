import { Navigate, useParams, useLocation } from "react-router-dom";
import { useProjectsCtx } from "../../context/AppContext.jsx";
import { isQuote } from "../../lib/lifecycle.js";

export default function ProjectRedirect() {
  const { id, "*": rest } = useParams();
  const location = useLocation();
  const { find } = useProjectsCtx();

  const project = find(id);
  if (!project) return <Navigate to="/estimates" replace />;

  const stage = project.stage || project.status || "Lead";
  const base = isQuote(stage) ? `/estimates/${id}` : `/projects/${id}`;
  const sub = rest || "";
  const target = sub ? `${base}/${sub}` : base;

  return <Navigate to={target + location.search} replace />;
}
