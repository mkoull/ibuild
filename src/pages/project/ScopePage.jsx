import { Navigate } from "react-router-dom";

export default function ScopePage() {
  return <Navigate to="../quote?step=scope" replace />;
}
