import {
  LayoutDashboard, TrendingUp, FolderKanban, Landmark, HardHat, Settings,
} from "lucide-react";

/**
 * Global sidebar — 6 flat items, no groups or nesting.
 */
export const NAV_STRUCTURE = {
  global: [
    { id: "dashboard",  label: "Dashboard",  Ic: LayoutDashboard, to: "/dashboard" },
    { id: "pipeline",   label: "Pipeline",   Ic: TrendingUp,      to: "/pipeline" },
    { id: "projects",   label: "Projects",   Ic: FolderKanban,    to: "/projects" },
    { id: "finance",    label: "Finance",    Ic: Landmark,        to: "/finance" },
    { id: "site",       label: "Site",       Ic: HardHat,         to: "/site" },
    { id: "settings",   label: "Settings",    Ic: Settings,        to: "/settings" },
  ],

  /**
   * Mapping: sidebar item id → routes that should highlight it.
   */
  activeMap: {
    dashboard:  ["/dashboard"],
    pipeline:   ["/pipeline", "/clients", "/leads", "/quotes"],
    projects:   ["/projects", "/estimates", "/jobs"],
    finance:    ["/finance", "/invoices", "/bills", "/payments"],
    site:       ["/site", "/documents", "/site-diary", "/defects"],
    settings:   ["/settings", "/rate-library", "/trades"],
  },
};
