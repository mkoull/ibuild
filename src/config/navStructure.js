import {
  LayoutDashboard, TrendingUp, FileText, HardHat, Landmark, Settings,
} from "lucide-react";

/**
 * Global sidebar — 6 flat items, no groups or nesting.
 */
export const NAV_STRUCTURE = {
  global: [
    { id: "dashboard",  label: "Dashboard",  Ic: LayoutDashboard, to: "/dashboard" },
    { id: "pipeline",   label: "Pipeline",   Ic: TrendingUp,      to: "/clients" },
    { id: "estimates",  label: "Estimates",   Ic: FileText,        to: "/estimates" },
    { id: "jobs",       label: "Jobs",        Ic: HardHat,         to: "/jobs" },
    { id: "finance",    label: "Finance",     Ic: Landmark,        to: "/invoices" },
    { id: "settings",   label: "Settings",    Ic: Settings,        to: "/settings" },
  ],

  /**
   * Mapping: sidebar item id → routes that should highlight it.
   */
  activeMap: {
    dashboard:  ["/dashboard"],
    pipeline:   ["/clients", "/leads"],
    estimates:  ["/estimates", "/quotes"],
    jobs:       ["/jobs"],
    finance:    ["/invoices", "/bills", "/payments"],
    settings:   ["/settings", "/rate-library", "/trades", "/documents", "/site-diary", "/defects"],
  },
};
