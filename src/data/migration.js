import { store } from "./store.js";
import { RATES } from "./defaults.js";
import { uid } from "../theme/styles.js";
import { mkClient, mkContact, mkRateCategory, mkRateItem } from "./models.js";

/**
 * runMigration — checks ib_meta.v and migrates to v2 if needed.
 *
 * v1 -> v2:
 * - Extract client strings from projects -> Client entities
 * - Extract trade objects from projects -> Trade entities
 * - Rename status -> stage, "Quote" -> "Quoted"
 * - Rename margin -> marginPct, contingency -> contingencyPct
 * - Rename milestones -> schedule
 * - Seed rate library from RATES
 * - Write all new keys, set ib_meta.v = 2
 */
export function runMigration() {
  const meta = store.get("ib_meta") || {};
  if (meta.v >= 2) return;

  // Load old projects data
  const raw = store.get("ib_projects");
  let projects = [];
  if (raw && raw.v === 1 && Array.isArray(raw.projects)) {
    projects = raw.projects;
  } else if (Array.isArray(raw)) {
    projects = raw;
  }

  if (projects.length === 0 && !raw) {
    // Fresh install — just seed rate library and set meta
    seedRateLibrary();
    store.set("ib_meta", { v: 2 });
    return;
  }

  // --- Extract clients ---
  const clients = [];
  const clientMap = {}; // old client name -> new client id

  projects.forEach(pr => {
    const name = pr.client || "";
    if (!name) return;
    const key = name.trim().toLowerCase();
    if (!clientMap[key]) {
      const c = mkClient({
        displayName: name.trim(),
        contacts: [],
      });
      // Add contact from project data
      if (pr.email || pr.phone) {
        c.contacts.push(mkContact({
          name: name.trim(),
          email: pr.email || "",
          phone: pr.phone || "",
          role: "Primary",
        }));
      }
      clients.push(c);
      clientMap[key] = c.id;
    }
  });

  // --- Extract trades ---
  const trades = [];
  const tradeMap = {};

  projects.forEach(pr => {
    (pr.trades || []).forEach(tr => {
      const key = (tr.trade || tr.businessName || "").trim().toLowerCase() + "|" + (tr.company || "").trim().toLowerCase();
      if (!key || key === "|") return;
      if (!tradeMap[key]) {
        const t = {
          id: uid(),
          businessName: (tr.company || tr.trade || "").trim(),
          category: (tr.trade || "").trim(),
          status: "active",
          contacts: [],
          licenceInfo: "",
          insuranceInfo: "",
          notes: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (tr.contact || tr.phone) {
          t.contacts.push(mkContact({
            name: tr.contact || "",
            phone: tr.phone || "",
          }));
        }
        trades.push(t);
        tradeMap[key] = t.id;
      }
    });
  });

  // --- Migrate projects ---
  const migratedProjects = projects.map(pr => {
    const clientKey = (pr.client || "").trim().toLowerCase();
    const assignedTradeIds = (pr.trades || []).map(tr => {
      const key = (tr.trade || tr.businessName || "").trim().toLowerCase() + "|" + (tr.company || "").trim().toLowerCase();
      return tradeMap[key];
    }).filter(Boolean);

    return {
      ...pr,
      // New fields
      clientId: clientMap[clientKey] || "",
      clientContactId: "",
      stage: mapStage(pr.status || pr.stage || "Lead"),
      // Rename percentages
      marginPct: pr.marginPct ?? pr.margin ?? 18,
      contingencyPct: pr.contingencyPct ?? pr.contingency ?? 5,
      // Rename fields
      buildType: pr.buildType || pr.type || "New Build",
      storeys: pr.storeys || pr.stories || "Single Storey",
      floorArea: pr.floorArea || pr.area || "",
      // Schedule (keep milestones too for compat)
      schedule: pr.schedule || pr.milestones || [],
      assignedTradeIds,
      // Ensure all arrays exist
      variations: pr.variations || [],
      invoices: pr.invoices || [],
      proposals: pr.proposals || [],
      diary: pr.diary || [],
      defects: pr.defects || [],
      activity: pr.activity || [],
      createdAt: pr.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // --- Seed rate library ---
  seedRateLibrary();

  // --- Write ---
  store.set("ib_projects", migratedProjects);
  store.set("ib_clients", clients);
  store.set("ib_trades", trades);
  store.set("ib_meta", { v: 2 });
}

function mapStage(status) {
  if (status === "Quote") return "Quoted";
  return status;
}

function seedRateLibrary() {
  const existing = store.get("ib_rate_library");
  if (existing && existing.categories && existing.categories.length > 0) return;

  const categories = [];
  const items = [];

  Object.entries(RATES).forEach(([catName, catItems]) => {
    const cat = mkRateCategory({ name: catName });
    categories.push(cat);
    catItems.forEach(ri => {
      items.push(mkRateItem({
        categoryId: cat.id,
        name: ri.item,
        unit: ri.unit,
        unitRate: ri.rate,
        defaultQty: ri.qty,
      }));
    });
  });

  store.set("ib_rate_library", { categories, items });
}
