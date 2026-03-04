import { useMemo, useState } from "react";
import { loadVersioned, saveVersioned } from "../data/store.js";
import { uid } from "../theme/styles.js";
import { USER_ROLES } from "../lib/permissions.js";

const USERS_KEY = "ib_users";
const SESSION_KEY = "ib_session";
const USERS_VERSION = 1;
const SESSION_VERSION = 1;

function defaultUsers() {
  return [
    {
      id: `U-${uid()}`,
      name: "Admin User",
      email: "admin@ibuild.local",
      password: "admin123",
      role: USER_ROLES.ADMIN,
      assignedProjectIds: [],
      assignedTradeNames: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: `U-${uid()}`,
      name: "Subcontractor Demo",
      email: "subby@ibuild.local",
      password: "subby123",
      role: USER_ROLES.SUBCONTRACTOR,
      assignedProjectIds: [],
      assignedTradeNames: ["Electrical", "Plumbing"],
      createdAt: new Date().toISOString(),
    },
  ];
}

function migrateUsers(data) {
  const rows = Array.isArray(data) ? data : [];
  return rows.map((user) => ({
    id: user.id || `U-${uid()}`,
    name: user.name || user.email || "User",
    email: String(user.email || "").toLowerCase(),
    password: String(user.password || ""),
    role: user.role || USER_ROLES.ADMIN,
    assignedProjectIds: Array.isArray(user.assignedProjectIds) ? user.assignedProjectIds : [],
    assignedTradeNames: Array.isArray(user.assignedTradeNames) ? user.assignedTradeNames : [],
    createdAt: user.createdAt || new Date().toISOString(),
  }));
}

export function useAuth() {
  const [users] = useState(() => {
    const loaded = loadVersioned(USERS_KEY, {
      fallback: defaultUsers,
      version: USERS_VERSION,
      migrate: migrateUsers,
    }).data;
    const finalUsers = Array.isArray(loaded) && loaded.length > 0 ? loaded : defaultUsers();
    saveVersioned(USERS_KEY, finalUsers, USERS_VERSION);
    return finalUsers;
  });

  const [session, setSession] = useState(() => {
    const loaded = loadVersioned(SESSION_KEY, {
      fallback: null,
      version: SESSION_VERSION,
      migrate: (d) => d || null,
    }).data;
    return loaded || null;
  });

  const currentUser = useMemo(() => {
    if (!session?.userId) return null;
    return users.find((u) => u.id === session.userId) || null;
  }, [session, users]);

  const login = (email, password) => {
    const user = users.find(
      (u) => String(u.email || "").toLowerCase() === String(email || "").trim().toLowerCase(),
    );
    if (!user) return { ok: false, message: "Invalid email or password" };
    if (String(user.password) !== String(password || "")) {
      return { ok: false, message: "Invalid email or password" };
    }
    const nextSession = {
      userId: user.id,
      role: user.role,
      loggedInAt: new Date().toISOString(),
    };
    setSession(nextSession);
    saveVersioned(SESSION_KEY, nextSession, SESSION_VERSION);
    return { ok: true, user };
  };

  const logout = () => {
    setSession(null);
    saveVersioned(SESSION_KEY, null, SESSION_VERSION);
  };

  return {
    users,
    session,
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    logout,
  };
}
