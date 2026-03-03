import {
  Users, ClipboardList, ListChecks, FileCheck, FileText, BriefcaseBusiness,
  CalendarClock, Landmark, GitCompareArrows, ShoppingCart, Wrench, ReceiptText,
  HandCoins, FolderOpen, NotebookText, Bug, HardHat, Database, FileQuestion,
} from "lucide-react";

export const NAV_STRUCTURE = {
  global: [
    {
      id: "leads-clients",
      group: "LEADS & CLIENTS",
      items: [
        { id: "clients", label: "Clients", Ic: Users, to: "/clients", match: "/clients" },
        { id: "leads", label: "Leads", Ic: ClipboardList, to: "/leads", match: "/leads" },
      ],
    },
    {
      id: "pre-construction",
      group: "PRE-CONSTRUCTION",
      items: [
        { id: "scope", label: "Scope", Ic: ListChecks, to: "/projects", match: "/projects" },
        { id: "proposal", label: "Proposal", Ic: FileCheck, to: "/quotes#proposal", match: "/quotes" },
        { id: "quote", label: "Quote", Ic: FileText, to: "/quotes#quote", match: "/quotes" },
      ],
    },
    {
      id: "job",
      group: "JOB",
      items: [
        { id: "job-details", label: "Job Details", Ic: BriefcaseBusiness, to: "/jobs#details", match: "/jobs" },
        { id: "schedule", label: "Schedule", Ic: CalendarClock, to: "/jobs#schedule", match: "/jobs" },
        { id: "cost-tracker", label: "Cost Tracker", Ic: Landmark, to: "/jobs#costs", match: "/jobs" },
        { id: "variations", label: "Variations", Ic: GitCompareArrows, to: "/jobs#variations", match: "/jobs" },
        { id: "purchase-orders", label: "Purchase Orders", Ic: ShoppingCart, to: "/jobs#purchase-orders", match: "/jobs" },
        { id: "work-orders", label: "Work Orders", Ic: Wrench, to: "/jobs#work-orders", match: "/jobs" },
        { id: "rfq", label: "RFQ", Ic: FileQuestion, to: "/jobs#rfq", match: "/jobs" },
      ],
    },
    {
      id: "financials",
      group: "FINANCIALS",
      items: [
        { id: "invoices", label: "Invoices", Ic: ReceiptText, to: "/jobs#invoices", match: "/jobs" },
        { id: "bills", label: "Bills", Ic: FileText, to: "/jobs#bills", match: "/jobs" },
        { id: "payments", label: "Payments", Ic: HandCoins, to: "/jobs#payments", match: "/jobs" },
      ],
    },
    {
      id: "site",
      group: "SITE",
      items: [
        { id: "documents", label: "Documents", Ic: FolderOpen, to: "/jobs#documents", match: "/jobs" },
        { id: "site-diary", label: "Site Diary", Ic: NotebookText, to: "/jobs#site-diary", match: "/jobs" },
        { id: "defects", label: "Defects", Ic: Bug, to: "/jobs#defects", match: "/jobs" },
        { id: "trades", label: "Trades", Ic: HardHat, to: "/trades", match: "/trades" },
        { id: "data", label: "Data", Ic: Database, to: "/settings/data", match: "/settings/data" },
      ],
    },
  ],
  project: [
    {
      id: "leads-clients",
      group: "LEADS & CLIENTS",
      items: [
        { id: "clients", label: "Clients", Ic: Users, to: "/clients", match: "/clients" },
        { id: "leads", label: "Leads", Ic: ClipboardList, to: "/leads", match: "/leads" },
      ],
    },
    {
      id: "pre-construction",
      group: "PRE-CONSTRUCTION",
      items: [
        { id: "scope", label: "Scope", Ic: ListChecks, to: "scope", match: "scope" },
        { id: "proposal", label: "Proposal", Ic: FileCheck, to: "proposals", match: "proposals" },
        { id: "quote", label: "Quote", Ic: FileText, to: "quote", match: "quote" },
      ],
    },
    {
      id: "job",
      group: "JOB",
      items: [
        { id: "job-details", label: "Job Details", Ic: BriefcaseBusiness, to: "overview", match: "overview" },
        { id: "schedule", label: "Schedule", Ic: CalendarClock, to: "schedule", match: "schedule" },
        { id: "cost-tracker", label: "Cost Tracker", Ic: Landmark, to: "costs", match: "costs" },
        { id: "variations", label: "Variations", Ic: GitCompareArrows, to: "variations", match: "variations" },
        { id: "purchase-orders", label: "Purchase Orders", Ic: ShoppingCart, to: "purchase-orders", match: "purchase-orders" },
        { id: "work-orders", label: "Work Orders", Ic: Wrench, to: "work-orders", match: "work-orders" },
        { id: "rfq", label: "RFQ", Ic: FileQuestion, to: "rfq", match: "rfq" },
      ],
    },
    {
      id: "financials",
      group: "FINANCIALS",
      items: [
        { id: "invoices", label: "Invoices", Ic: ReceiptText, to: "invoices", match: "invoices" },
        { id: "bills", label: "Bills", Ic: FileText, to: "bills", match: "bills" },
        { id: "payments", label: "Payments", Ic: HandCoins, to: "payments", match: "payments" },
      ],
    },
    {
      id: "site",
      group: "SITE",
      items: [
        { id: "documents", label: "Documents", Ic: FolderOpen, to: "documents", match: "documents" },
        { id: "site-diary", label: "Site Diary", Ic: NotebookText, to: "site-diary", match: "site-diary" },
        { id: "defects", label: "Defects", Ic: Bug, to: "defects", match: "defects" },
        { id: "trades", label: "Trades", Ic: HardHat, to: "trades", match: "trades" },
      ],
    },
  ],
};
