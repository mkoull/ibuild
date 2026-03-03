import {
  LayoutDashboard, FolderOpen, TrendingUp, Landmark, HardHat, Settings,
} from "lucide-react";

/**
 * Global sidebar — 6 flat items, no groups or nesting.
 */
export const NAV_STRUCTURE = {
  global: [
    { id: "dashboard", label: "Dashboard", Ic: LayoutDashboard, to: "/dashboard" },
    { id: "pipeline",  label: "Pipeline",  Ic: TrendingUp,      to: "/clients" },
    { id: "projects",  label: "Projects",  Ic: FolderOpen,      to: "/projects" },
    { id: "finance",   label: "Finance",   Ic: Landmark,        to: "/invoices" },
    { id: "site",      label: "Site",      Ic: HardHat,         to: "/documents" },
    { id: "settings",  label: "Settings",  Ic: Settings,        to: "/settings" },
  ],

  /**
   * Mapping: sidebar item id → routes that should highlight it.
   */
  activeMap: {
    dashboard: ["/dashboard"],
    pipeline:  ["/clients", "/quotes", "/jobs", "/leads"],
    projects:  ["/projects"],
    finance:   ["/invoices", "/bills", "/payments"],
    site:      ["/documents", "/site-diary", "/defects", "/trades"],
    settings:  ["/settings", "/rate-library"],
  },

  /**
   * Project-level horizontal tab bar — flat, no dropdowns.
   */
  project: {
    tabs: [
      { label: "Overview",     path: "overview" },
      { label: "Quote",        path: "quote" },
      { label: "Scope",        path: "scope" },
      { label: "Schedule",     path: "schedule" },
      { label: "Cost",         path: "costs" },
      { label: "Variations",   path: "variations" },
      { label: "Procurement",  path: "purchase-orders" },
      { label: "Invoices",     path: "invoices" },
      { label: "Documents",    path: "documents" },
      { label: "Diary",        path: "site-diary" },
      { label: "Defects",      path: "defects" },
    ],
  },
};
