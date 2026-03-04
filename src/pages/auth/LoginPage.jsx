import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import _ from "../../theme/tokens.js";
import Button from "../../components/ui/Button.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { isSubcontractor } from "../../lib/permissions.js";

export default function LoginPage() {
  const { auth, notify } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@ibuild.local");
  const [password, setPassword] = useState("admin123");

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    const raw = params.get("next");
    return raw ? decodeURIComponent(raw) : "";
  }, [location.search]);

  const onSubmit = (e) => {
    e.preventDefault();
    const result = auth.login(email, password);
    if (!result.ok) {
      notify(result.message, "error");
      return;
    }
    const user = result.user;
    notify(`Welcome, ${user.name}`);
    if (nextPath) {
      navigate(nextPath, { replace: true });
      return;
    }
    navigate(isSubcontractor(user) ? "/portal" : "/dashboard", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: _.bg,
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: "100%",
          maxWidth: 420,
          background: _.surface,
          border: `1px solid ${_.line}`,
          borderRadius: 12,
          padding: 20,
          display: "grid",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, color: _.ink }}>iBuild Login</h1>
        <div style={{ fontSize: 13, color: _.muted }}>
          Use `admin@ibuild.local` / `admin123` or `subby@ibuild.local` / `subby123`.
        </div>
        <label style={{ fontSize: 12, color: _.muted }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={fieldStyle}
            required
          />
        </label>
        <label style={{ fontSize: 12, color: _.muted }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={fieldStyle}
            required
          />
        </label>
        <Button type="submit">Login</Button>
      </form>
    </div>
  );
}

const fieldStyle = {
  marginTop: 6,
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
};
