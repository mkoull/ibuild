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

export default function PipelineShell() {
  return (
    <div>
      <div style={{ display: "flex", gap: _.s2, marginBottom: _.s4, flexWrap: "wrap" }}>
        <SubNavLink to="clients" label="Clients" />
        <SubNavLink to="leads" label="Leads" />
        <SubNavLink to="quotes" label="Quotes" />
      </div>
      <Outlet />
    </div>
  );
}
