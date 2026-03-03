import {
  LayoutDashboard, Users, ClipboardList, FileText, BriefcaseBusiness,
  CalendarClock, Landmark, GitCompareArrows, ShoppingCart, Wrench, ReceiptText,
  HandCoins, FolderOpen, NotebookText, Bug, HardHat, Database, FileQuestion,
  Settings, Library, TrendingUp,
} from "lucide-react";

/**
 * Global sidebar: 5 top-level items.
 * type "link"  → direct nav link
 * type "group" → expandable accordion with children[]
 */
export const NAV_STRUCTURE = {
  global: [
    { id: "dashboard", label: "Dashboard", type: "link", Ic: LayoutDashboard, to: "/dashboard", match: "/dashboard" },
    {
      id: "pipeline", label: "Pipeline", type: "group", Ic: TrendingUp,
      children: [
        { id: "clients", label: "Clients", to: "/clients", match: "/clients" },
        { id: "quotes", label: "Quotes", to: "/quotes", match: "/quotes" },
        { id: "jobs", label: "Jobs", to: "/jobs", match: "/jobs" },
      ],
    },
    { id: "projects", label: "Projects", type: "link", Ic: FolderOpen, to: "/projects", match: "/projects" },
    { id: "trades", label: "Trades", type: "link", Ic: HardHat, to: "/trades", match: "/trades" },
    {
      id: "admin", label: "Admin", type: "group", Ic: Settings,
      children: [
        { id: "rate-library", label: "Rate Library", to: "/rate-library", match: "/rate-library" },
        { id: "settings", label: "Settings", to: "/settings", match: "/settings" },
        { id: "data", label: "Data", to: "/settings/data", match: "/settings/data" },
      ],
    },
  ],

  /**
   * Project-level navigation consumed by ProjectShell tab bar.
   */
  project: {
    tabs: [
      { label: "Details", path: "overview" },
      { label: "Scope", path: "scope" },
      { label: "Quote", path: "quote" },
      { label: "Schedule", path: "schedule" },
      { label: "Costs", path: "costs" },
      { label: "Variations", path: "variations" },
    ],
    procurement: {
      label: "Procurement",
      children: [
        { label: "RFQ", path: "rfq" },
        { label: "Purchase Orders", path: "purchase-orders" },
        { label: "Work Orders", path: "work-orders" },
      ],
    },
    moreTabs: [
      { label: "Invoices", path: "invoices" },
      { label: "Bills", path: "bills" },
      { label: "Payments", path: "payments" },
      { label: "Proposals", path: "proposals" },
      { label: "Documents", path: "documents" },
      { label: "Site Diary", path: "site-diary" },
      { label: "Defects", path: "defects" },
      { label: "Trades", path: "trades" },
    ],
  },
};
