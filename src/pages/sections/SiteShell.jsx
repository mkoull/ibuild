import { NavLink, Outlet } from "react-router-dom";
import _ from "../../theme/tokens.js";

function SubNavLink({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        padding: `${_.s2}px ${_.s3}px`,
        borderRadius: _.rSm,
        border: `1px solid ${isActive ? _.ac : _.line}`,
        background: isActive ? `${_.ac}12` : _.surface,
        color: isActive ? _.ac : _.ink,
        fontSize: _.fontSize.sm,
        fontWeight: _.fontWeight.medium,
        textDecoration: "none",
      })}
    >
      {label}
    </NavLink>
  );
}

export default function SiteShell() {
  return (
    <div>
      <div style={{ display: "flex", gap: _.s2, marginBottom: _.s4, flexWrap: "wrap" }}>
        <SubNavLink to="documents" label="Documents" />
        <SubNavLink to="diary" label="Diary" />
        <SubNavLink to="defects" label="Defects" />
      </div>
      <Outlet />
    </div>
  );
}
