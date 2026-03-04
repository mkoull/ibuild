import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";

export default function AuthGate({ children }) {
  const { auth } = useApp();
  const location = useLocation();
  if (!auth?.isAuthenticated) {
    const target = encodeURIComponent(`${location.pathname}${location.search || ""}`);
    return <Navigate to={`/login?next=${target}`} replace />;
  }
  return children;
}
