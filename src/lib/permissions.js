export const USER_ROLES = {
  ADMIN: "Admin",
  SUBCONTRACTOR: "Subcontractor",
};

export function isSubcontractor(user) {
  return String(user?.role || "") === USER_ROLES.SUBCONTRACTOR;
}

export function hasProjectAccess(user, project) {
  if (!user || !project) return false;
  if (!isSubcontractor(user)) return true;
  const assignedProjects = Array.isArray(user.assignedProjectIds) ? user.assignedProjectIds : [];
  if (assignedProjects.includes(project.id)) return true;
  const assignedTrades = new Set((user.assignedTradeNames || []).map((x) => String(x || "").toLowerCase()));
  const projectTrades = Array.isArray(project.assignedTradeIds) ? project.assignedTradeIds : [];
  if (projectTrades.length === 0 || assignedTrades.size === 0) return false;
  return projectTrades.some((tradeId) => assignedTrades.has(String(tradeId || "").toLowerCase()));
}

export function canViewFinance(user) {
  return !isSubcontractor(user);
}

export function canViewCosts(user) {
  return !isSubcontractor(user);
}

export function canViewInvoices(user) {
  return !isSubcontractor(user);
}
