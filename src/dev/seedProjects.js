/**
 * Dev-only utility to generate fake projects for performance testing.
 * Usage in browser console: window.__SEED_100_PROJECTS__()
 * Only available in development mode.
 */
import { mkProject } from "../data/models.js";
import { uid, ds } from "../theme/styles.js";
import { saveVersioned } from "../data/store.js";

const TYPES = ["New Build", "Extension", "Renovation", "Knockdown Rebuild", "Townhouse", "Duplex"];
const STAGES = ["Lead", "Quoted", "Approved", "Active", "Invoiced", "Complete"];
const SUBURBS = ["Richmond", "Hawthorn", "Brighton", "Malvern", "Fitzroy", "Carlton", "Toorak", "Prahran", "South Yarra", "Kew"];
const STREETS = ["Oak", "Elm", "Park", "Chapel", "Bridge", "High", "Church", "Station", "River", "King"];
const NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "Harris", "Martin"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateProject(index) {
  const stage = rand(STAGES);
  const type = rand(TYPES);
  const surname = rand(NAMES);
  const area = randInt(120, 450);
  const margin = randInt(12, 25);
  const contingency = randInt(3, 8);

  const p = mkProject({
    name: `${surname} ${type}`,
    client: `${["Alex", "Sam", "Jordan", "Chris", "Pat", "Morgan"][randInt(0, 5)]} ${surname}`,
    address: `${randInt(1, 250)} ${rand(STREETS)} Street`,
    suburb: rand(SUBURBS),
    buildType: type,
    storeys: rand(["Single Storey", "Double Storey", "Split Level"]),
    floorArea: String(area),
    marginPct: margin,
    contingencyPct: contingency,
    stage,
    status: stage,
  });

  const scopeKeys = Object.keys(p.scope);
  scopeKeys.forEach(cat => {
    p.scope[cat].forEach(item => {
      if (Math.random() > 0.5) {
        item.on = true;
        item.qty = randInt(1, Math.max(1, Math.floor(area / 10)));
        item.actual = Math.round(item.rate * item.qty * (0.7 + Math.random() * 0.6));
      }
    });
  });

  if (stage !== "Lead" && stage !== "Quoted") {
    const budgetCount = randInt(2, 8);
    p.budget = [];
    p.commitments = [];
    p.actuals = [];
    for (let i = 0; i < budgetCount; i++) {
      const amt = randInt(5000, 80000);
      p.budget.push({
        id: uid(), tradeId: "", costCode: `CC-${randInt(10, 99)}`,
        label: `Budget line ${i + 1}`, budgetAmount: amt, date: ds(),
      });
      if (Math.random() > 0.4) {
        p.commitments.push({
          id: uid(), tradeId: "", description: `PO-${randInt(100, 999)}`,
          vendorName: `${rand(NAMES)} ${rand(["Plumbing", "Electrical", "Concrete", "Roofing", "Carpentry"])}`,
          amount: Math.round(amt * (0.6 + Math.random() * 0.4)),
          status: "Committed", date: ds(),
        });
      }
      if (Math.random() > 0.3) {
        p.actuals.push({
          id: uid(), tradeId: "", costCode: `CC-${randInt(10, 99)}`,
          description: `Actual ${i + 1}`, amount: Math.round(amt * Math.random()),
          date: ds(), source: "Manual",
        });
      }
    }

    const invCount = randInt(0, 4);
    for (let i = 0; i < invCount; i++) {
      const invAmt = randInt(10000, 100000);
      p.invoices.push({
        id: `INV-${String(index).padStart(3, "0")}-${i + 1}`,
        title: `Progress claim ${i + 1}`,
        amount: invAmt,
        type: "Progress",
        status: rand(["draft", "sent", "paid"]),
        date: ds(),
        issuedAt: ds(),
        dueAt: ds(),
      });
    }
  }

  return p;
}

export function seedProjects(count = 100) {
  const projects = [];
  for (let i = 0; i < count; i++) {
    projects.push(generateProject(i));
  }

  const byId = {};
  const allIds = [];
  projects.forEach(p => {
    byId[p.id] = p;
    allIds.push(p.id);
  });

  saveVersioned("ib_projects", { byId, allIds }, 2);
  return projects.length;
}

if (import.meta.env.DEV) {
  window.__SEED_100_PROJECTS__ = () => {
    const n = seedProjects(100);
    console.log(`Seeded ${n} projects. Refresh to see them.`);
    return n;
  };
}
