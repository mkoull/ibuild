import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { uid, ds } from "../theme/styles.js";
import { mkProject } from "../data/models.js";
import { loadVersioned, saveVersioned } from "../data/store.js";
import { shadowWriter } from "../lib/shadowWrite.js";
import { getNextEstimateNumber } from "../config/workspaceTabs.js";

const STORAGE_KEY = "ib_projects";
const STORE_VERSION = 20;
const SAVE_DEBOUNCE_MS = 300;

function hydrateProject(pr) {
  if (!pr.scope) return pr;
  let changed = false;
  Object.values(pr.scope).forEach(items =>
    items.forEach(item => {
      if (!item._id) { item._id = uid(); changed = true; }
    })
  );
  return changed ? { ...pr } : pr;
}

function migrateProjects(data, fromVersion) {
  if (fromVersion <= 1) {
    const arr = Array.isArray(data) ? data : [];
    const byId = {};
    const allIds = [];
    arr.forEach(p => {
      const h = hydrateProject(p);
      byId[h.id] = h;
      allIds.push(h.id);
    });
    data = { byId, allIds };
  }
  if (fromVersion <= 2) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach(p => {
      const milestones = p.schedule || [];
      milestones.forEach((m, i) => {
        if (!m.id) m.id = uid();
        if (m.durationDays == null) {
          // Derive duration from gap to next milestone
          const nextMs = milestones[i + 1];
          m.durationDays = nextMs ? Math.max(7, ((nextMs.wk || 0) - (m.wk || 0)) * 7) : 7;
        }
        if (m.offsetDays == null) m.offsetDays = (m.wk || 0) * 7;
        if (!m.dependsOn) m.dependsOn = [];
        if (m.tradeId === undefined) m.tradeId = null;
        if (!m.status) m.status = m.done ? "complete" : "not_started";
        if (m.percentComplete == null) m.percentComplete = m.done ? 100 : 0;
        if (m.plannedStart === undefined) m.plannedStart = "";
        if (m.plannedFinish === undefined) m.plannedFinish = "";
        if (m.actualStart === undefined) m.actualStart = m.done && m.date ? m.date : "";
        if (m.actualFinish === undefined) m.actualFinish = m.done && m.date ? m.date : "";
        if (m.order == null) m.order = i;
      });
      // Add milestoneId to payment schedule entries
      if (p.paymentSchedule) {
        p.paymentSchedule.forEach(c => {
          if (c.milestoneIdx != null && !c.milestoneId && milestones[c.milestoneIdx]) {
            c.milestoneId = milestones[c.milestoneIdx].id;
          }
        });
      }
    });
    data = norm;
  }
  if (fromVersion <= 3) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach(p => {
      if (p.autoCascade === undefined) p.autoCascade = false;
      (p.schedule || []).forEach(m => {
        if (m.freeTextTrade === undefined) m.freeTextTrade = "";
        if (m.constraintMode === undefined) m.constraintMode = "finish-to-start";
        if (m.manuallyPinned === undefined) m.manuallyPinned = false;
      });
    });
    data = norm;
  }
  if (fromVersion <= 4) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach(p => {
      if (p.quoteSnapshotBudget === undefined) p.quoteSnapshotBudget = null;
      if (!Array.isArray(p.variationLedger)) p.variationLedger = [];
    });
    data = norm;
  }
  if (fromVersion <= 5) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach(p => {
      if (!Array.isArray(p.exclusions)) p.exclusions = [];
      if (!Array.isArray(p.allowances)) p.allowances = [];
      if (!Array.isArray(p.pcItems)) p.pcItems = [];
      if (!Array.isArray(p.qualifications)) p.qualifications = [];
    });
    data = norm;
  }
  if (fromVersion <= 6) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach(p => {
      if (!Array.isArray(p.terms)) p.terms = [];
      if (p.depositPct === undefined) p.depositPct = 5;
      if (p.paymentDays === undefined) p.paymentDays = 14;
      if (p.defectsWeeks === undefined) p.defectsWeeks = 13;
    });
    data = norm;
  }
  if (fromVersion <= 7) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    const JOB_STAGES = new Set(["Approved", "Active", "Invoiced", "Complete"]);
    Object.values(norm.byId).forEach(p => {
      if (!p.costAllowances) {
        const isJob = JOB_STAGES.has(p.stage);
        p.costAllowances = {
          margin: { pct: isJob ? (p.marginPct ?? 0) : 0, amount: 0, locked: false },
          contingency: { pct: isJob ? (p.contingencyPct ?? 0) : 0, amount: 0, locked: false },
          siteOverhead: { pct: 0, amount: 0, locked: false },
          officeOverhead: { pct: 0, amount: 0, locked: false },
        };
        // Recalc amounts from budget subtotal for job-stage projects
        if (isJob && Array.isArray(p.budget)) {
          const budgetSub = p.budget.reduce((t, b) => t + (b.budgetAmount || 0), 0);
          for (const key of Object.keys(p.costAllowances)) {
            const a = p.costAllowances[key];
            if (a.pct > 0 && !a.locked) a.amount = Math.round(budgetSub * (a.pct / 100) * 100) / 100;
          }
        }
      }
      // Add allocations to existing budget lines
      if (Array.isArray(p.budget)) {
        p.budget.forEach(b => { if (!Array.isArray(b.allocations)) b.allocations = []; });
      }
    });
    data = norm;
  }
  if (fromVersion <= 8) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach(p => {
      // Add budgetBaseline field
      if (p.budgetBaseline === undefined) p.budgetBaseline = null;
      // Backfill sellPrice and costAllowance on existing budget lines
      const marginPct = p.marginPct ?? 0;
      if (Array.isArray(p.budget)) {
        p.budget.forEach(b => {
          if (b.sellPrice === undefined) {
            // For quote_import lines, derive sellPrice from budgetAmount (reverse the cost derivation)
            if (b.source === "quote_import" && marginPct > 0) {
              b.sellPrice = Math.round(b.budgetAmount / (1 - marginPct / 100) * 100) / 100;
            } else {
              b.sellPrice = b.budgetAmount || 0;
            }
          }
          if (b.costAllowance === undefined) {
            b.costAllowance = b.budgetAmount || 0;
          }
        });
      }
      // Add linkedBudgetLineId to commitments and actuals
      if (Array.isArray(p.commitments)) {
        p.commitments.forEach(c => { if (c.linkedBudgetLineId === undefined) c.linkedBudgetLineId = null; });
      }
      if (Array.isArray(p.actuals)) {
        p.actuals.forEach(a => { if (a.linkedBudgetLineId === undefined) a.linkedBudgetLineId = null; });
      }
    });
    data = norm;
  }
  if (fromVersion <= 9) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach(p => {
      // Costs: introduce workingBudget while keeping p.budget as alias.
      if (!Array.isArray(p.workingBudget) && Array.isArray(p.budget)) {
        p.workingBudget = p.budget;
      } else if (Array.isArray(p.workingBudget) && !Array.isArray(p.budget)) {
        p.budget = p.workingBudget;
      } else if (Array.isArray(p.workingBudget) && Array.isArray(p.budget) && p.workingBudget.length !== p.budget.length) {
        // workingBudget is canonical; keep budget as compatibility alias.
        p.budget = p.workingBudget;
      }
      if (!Array.isArray(p.workingBudget)) p.workingBudget = [];
      if (!Array.isArray(p.budget)) p.budget = p.workingBudget;

      // Schedule: preserve pinned dates.
      if (Array.isArray(p.schedule)) {
        p.schedule.forEach(m => {
          if (m.pinnedStart === undefined) m.pinnedStart = m.plannedStart || "";
          if (m.pinnedFinish === undefined) m.pinnedFinish = m.plannedFinish || "";
        });
      }

      // Invoices: normalize schema for detail rendering consistency.
      if (Array.isArray(p.invoices)) {
        p.invoices.forEach(inv => {
          if (!inv.title) inv.title = inv.desc || "Invoice";
          if (!inv.issuedAt) inv.issuedAt = inv.date || ds();
          if (!Array.isArray(inv.lineItems)) inv.lineItems = [];
        });
      }
    });
    data = norm;
  }
  if (fromVersion <= 10) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach(p => {
      if (!Array.isArray(p.purchaseOrders)) p.purchaseOrders = [];
      if (!Array.isArray(p.workOrders)) p.workOrders = [];
      if (!Array.isArray(p.rfqs)) p.rfqs = [];
      if (!Array.isArray(p.documents)) p.documents = [];
    });
    data = norm;
  }
  if (fromVersion <= 11) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach(p => {
      // Convert defect done:boolean → status string
      if (Array.isArray(p.defects)) {
        p.defects.forEach(d => {
          if (d.status === undefined || d.status === null) {
            d.status = d.done ? "resolved" : "open";
          }
        });
      }
    });
    data = norm;
  }
  if (fromVersion <= 12) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    const JOB_STAGES = new Set(["Approved", "Active", "Invoiced", "Complete"]);
    // Sort by creation order to assign sequential numbers
    const sorted = norm.allIds
      .map(id => norm.byId[id])
      .filter(Boolean)
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    let estNum = 1000;
    let jobNum = 1000;
    sorted.forEach(p => {
      if (!p.estimateNumber) {
        estNum++;
        p.estimateNumber = `Q${estNum}`;
      }
      if (!p.jobNumber && JOB_STAGES.has(p.stage)) {
        jobNum++;
        p.jobNumber = `J${jobNum}`;
      }
    });
    data = norm;
  }
  if (fromVersion <= 13) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach((p) => {
      if (p.jobId === undefined) p.jobId = null;
      if (p.status === undefined || p.status === null || p.status === "") {
        p.status = p.stage || "Lead";
      }
      if (p.convertedAt === undefined) p.convertedAt = null;
      if (!p.jobConversion && p.jobId) {
        p.jobConversion = { jobId: p.jobId, convertedAt: p.convertedAt || Date.now() };
      }
    });
    data = norm;
  }
  if (fromVersion <= 14) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach((p) => {
      if (!Array.isArray(p.costCategories)) p.costCategories = [];
      p.costCategories.forEach((cat) => {
        if (!cat.id) cat.id = uid();
        if (typeof cat.name !== "string") cat.name = "Category";
        if (!Array.isArray(cat.items)) cat.items = [];
        cat.items.forEach((item) => {
          if (!item.id) item.id = uid();
          if (item.description === undefined) item.description = "";
          if (item.quantity === undefined) item.quantity = 0;
          if (item.unit === undefined) item.unit = "ea";
          if (item.unitRate === undefined) item.unitRate = 0;
          if (item.marginPercent === undefined) item.marginPercent = 0;
          const costTotal = (Number(item.quantity) || 0) * (Number(item.unitRate) || 0);
          const sellTotal = costTotal + (costTotal * ((Number(item.marginPercent) || 0) / 100));
          item.costTotal = Math.round(costTotal * 100) / 100;
          item.sellTotal = Math.round(sellTotal * 100) / 100;
        });
      });
    });
    data = norm;
  }
  if (fromVersion <= 15) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach((p) => {
      if (p.convertedAt === undefined) p.convertedAt = null;
      if (!p.estimate || typeof p.estimate !== "object") {
        p.estimate = { categories: [], totals: { totalCost: 0, totalSell: 0, marginValue: 0, marginPercent: 0 } };
      }
      if (!Array.isArray(p.estimate.categories)) p.estimate.categories = Array.isArray(p.costCategories) ? p.costCategories : [];
      if (!p.estimate.totals || typeof p.estimate.totals !== "object") {
        p.estimate.totals = { totalCost: 0, totalSell: 0, marginValue: 0, marginPercent: 0 };
      }
      if (p.job === undefined) p.job = null;
      if (p.job && !p.job.contract) {
        const base = Number(p.job?.baseline?.totals?.totalSell) || 0;
        p.job.contract = { baseContractValue: base, approvedVariationsValue: 0, currentContractValue: base };
      }
    });
    data = norm;
  }
  if (fromVersion <= 16) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach((p) => {
      if (!Array.isArray(p.variations)) p.variations = [];
      p.variations = p.variations.map((v, idx) => ({
        id: v.id || uid(),
        number: v.number || `VO-${String(idx + 1).padStart(3, "0")}`,
        title: v.title || v.description || "Variation",
        description: v.description || "",
        costImpact: v.costImpact !== undefined ? Number(v.costImpact) || 0 : (Number(v.amount) || 0),
        sellImpact: v.sellImpact !== undefined ? Number(v.sellImpact) || 0 : (Number(v.amount) || 0),
        status: normalizeVariationStatus(v.status),
        createdAt: v.createdAt || v.date || new Date().toISOString(),
        ...v,
      }));
    });
    data = norm;
  }
  if (fromVersion <= 17) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach((p) => {
      if (!p.procurement || typeof p.procurement !== "object") {
        p.procurement = { purchaseOrders: [], bills: [] };
      }
      if (!Array.isArray(p.procurement.purchaseOrders)) p.procurement.purchaseOrders = [];
      if (!Array.isArray(p.procurement.bills)) p.procurement.bills = [];
      if (Array.isArray(p.purchaseOrders) && p.purchaseOrders.length > 0 && p.procurement.purchaseOrders.length === 0) {
        p.procurement.purchaseOrders = p.purchaseOrders.map((po) => ({
          id: po.id || uid(),
          number: po.number || `PO-${String(Date.now()).slice(-6)}`,
          supplier: po.supplier || po.vendorName || "",
          budgetItemId: po.budgetItemId || po.linkedBudgetLineId || "",
          description: po.description || po.notes || "",
          amount: Number(po.amount ?? po.totalAmount) || 0,
          status: normalizeProcurementPoStatus(po.status),
          createdAt: po.createdAt || new Date().toISOString(),
        }));
      }
      const budgetLines = Array.isArray(p.workingBudget) ? p.workingBudget : (Array.isArray(p.budget) ? p.budget : []);
      budgetLines.forEach((line) => {
        const budgetCost = Number(line.budgetCost ?? line.budgetAmount) || 0;
        const actualCost = Number(line.actualCost ?? line.actualAmount) || 0;
        line.budgetCost = budgetCost;
        line.actualCost = actualCost;
        line.variance = Number(line.variance ?? (actualCost - budgetCost)) || 0;
        line.budgetAmount = Number(line.budgetAmount ?? budgetCost) || 0;
        line.actualAmount = Number(line.actualAmount ?? actualCost) || 0;
      });
      p.workingBudget = budgetLines;
      p.budget = budgetLines;
      if (p.job?.budget?.categories) {
        p.job.budget.categories.forEach((cat) => {
          (cat.items || []).forEach((item) => {
            const budgetCost = Number(item.budgetCost ?? item.costTotal) || 0;
            const actualCost = Number(item.actualCost) || 0;
            item.budgetCost = budgetCost;
            item.actualCost = actualCost;
            item.variance = Number(item.variance ?? (actualCost - budgetCost)) || 0;
          });
        });
      }
    });
    data = norm;
  }
  if (fromVersion <= 18) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach((p) => {
      if (!Array.isArray(p.claims)) p.claims = [];
      p.claims = p.claims.map((c, idx) => ({
        id: c.id || uid(),
        number: c.number || `CLM-${String(idx + 1).padStart(3, "0")}`,
        title: c.title || c.label || `Claim ${idx + 1}`,
        amount: Number(c.amount) || 0,
        status: normalizeClaimStatus(c.status),
        createdAt: c.createdAt || new Date().toISOString(),
      }));
      if (!Array.isArray(p.invoices)) p.invoices = [];
      p.invoices = p.invoices.map((inv, idx) => ({
        ...inv,
        id: inv.id || uid(),
        claimId: inv.claimId || inv.claimStageId || null,
        number: inv.number || inv.id || `INV-${String(idx + 1).padStart(3, "0")}`,
        amount: Number(inv.amount) || 0,
        issuedDate: inv.issuedDate || inv.issuedAt || inv.date || ds(),
        paidDate: inv.paidDate || inv.paidAt || "",
        status: normalizeInvoiceStatus(inv.status),
      }));
    });
    data = norm;
  }
  if (fromVersion <= 19) {
    const norm = data && data.byId ? data : { byId: {}, allIds: [] };
    Object.values(norm.byId).forEach((p) => {
      if (p.schedule && typeof p.schedule === "object" && !Array.isArray(p.schedule) && Array.isArray(p.schedule.tasks)) {
        p.schedule.tasks = p.schedule.tasks.map((task, idx) => ({
          id: task.id || uid(),
          name: task.name || "",
          trade: task.trade || task.freeTextTrade || "",
          startDate: task.startDate || task.plannedStart || "",
          durationDays: Math.max(1, Number(task.durationDays) || 1),
          endDate: task.endDate || task.plannedFinish || "",
          dependencyTaskId: task.dependencyTaskId || (Array.isArray(task.dependsOn) ? task.dependsOn[0] || null : null),
          order: Number.isFinite(Number(task.order)) ? Number(task.order) : idx,
        }));
      } else if (Array.isArray(p.schedule)) {
        p.schedule = {
          tasks: p.schedule.map((task, idx) => ({
            id: task.id || uid(),
            name: task.name || "",
            trade: task.trade || task.freeTextTrade || "",
            startDate: task.startDate || task.plannedStart || "",
            durationDays: Math.max(1, Number(task.durationDays) || 1),
            endDate: task.endDate || task.plannedFinish || "",
            dependencyTaskId: task.dependencyTaskId || (Array.isArray(task.dependsOn) ? task.dependsOn[0] || null : null),
            order: Number.isFinite(Number(task.order)) ? Number(task.order) : idx,
          })),
        };
      } else {
        p.schedule = { tasks: [] };
      }
    });
    data = norm;
  }
  return data;
}

function normalizeProcurementPoStatus(status) {
  const s = String(status || "Draft").toLowerCase();
  if (s === "issued" || s === "sent") return "Issued";
  if (s === "received" || s === "accepted") return "Received";
  if (s === "billed") return "Billed";
  return "Draft";
}

function normalizeClaimStatus(status) {
  const s = String(status || "Draft").toLowerCase();
  if (s === "issued" || s === "invoiced") return "Issued";
  if (s === "paid") return "Paid";
  return "Draft";
}

function normalizeInvoiceStatus(status) {
  const s = String(status || "Unpaid").toLowerCase();
  if (s === "paid") return "Paid";
  if (s === "void") return "Void";
  return "Unpaid";
}

function normalizeVariationStatus(status) {
  const s = String(status || "Draft").toLowerCase();
  if (s === "pending" || s === "sent") return "Pending";
  if (s === "approved") return "Approved";
  if (s === "rejected") return "Rejected";
  return "Draft";
}

function loadNormalized() {
  const { data } = loadVersioned(STORAGE_KEY, {
    fallback: { byId: {}, allIds: [] },
    version: STORE_VERSION,
    migrate: migrateProjects,
  });
  if (!data || typeof data !== "object") return { byId: {}, allIds: [] };
  const byId = data.byId || {};
  const allIds = data.allIds || Object.keys(byId);
  const hydrated = {};
  for (const id of allIds) {
    if (byId[id]) {
      try {
        hydrated[id] = hydrateProject(byId[id]);
      } catch (err) {
        if (import.meta.env.DEV) console.warn(`[useProjects] skipping corrupt project ${id}`, err);
      }
    }
  }
  return { byId: hydrated, allIds: allIds.filter(id => hydrated[id]) };
}

export function useProjects() {
  const [state, setState] = useState(loadNormalized);
  const [saveStatus, setSaveStatus] = useState(null);
  const timer = useRef(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (timer.current) clearTimeout(timer.current);
    setSaveStatus("saving");
    timer.current = setTimeout(() => {
      saveVersioned(STORAGE_KEY, state, STORE_VERSION);
      // Shadow write each project to backend
      Object.values(state.byId).forEach(p => shadowWriter.onProjectSave(p));
      setSaveStatus(new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }));
    }, SAVE_DEBOUNCE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [state]);

  const projects = useMemo(
    () => state.allIds.map(id => state.byId[id]).filter(Boolean),
    [state.byId, state.allIds]
  );

  const find = useCallback(
    (id) => state.byId[id] || null,
    [state.byId]
  );

  const create = useCallback((overrides) => {
    const p = mkProject(overrides);
    // Auto-assign estimate number from existing projects
    setState(prev => {
      const allProjects = prev.allIds.map(id => prev.byId[id]).filter(Boolean);
      if (!p.estimateNumber) {
        p.estimateNumber = getNextEstimateNumber(allProjects);
      }
      return {
        byId: { ...prev.byId, [p.id]: p },
        allIds: [...prev.allIds, p.id],
      };
    });
    return p;
  }, []);

  const update = useCallback((id, fn) => {
    setState(prev => {
      const existing = prev.byId[id];
      if (!existing) return prev;
      const copy = JSON.parse(JSON.stringify(existing));
      const result = fn(copy);
      const updated = result || copy;
      if (Array.isArray(updated.workingBudget)) {
        updated.budget = updated.workingBudget;
      } else if (Array.isArray(updated.budget)) {
        updated.workingBudget = updated.budget;
      } else {
        updated.workingBudget = [];
        updated.budget = updated.workingBudget;
      }
      return {
        ...prev,
        byId: { ...prev.byId, [id]: updated },
      };
    });
  }, []);

  const remove = useCallback((id) => {
    setState(prev => {
      const { [id]: _, ...rest } = prev.byId;
      return {
        byId: rest,
        allIds: prev.allIds.filter(x => x !== id),
      };
    });
  }, []);

  const upsert = useCallback((project) => {
    setState(prev => {
      const exists = !!prev.byId[project.id];
      return {
        byId: { ...prev.byId, [project.id]: project },
        allIds: exists ? prev.allIds : [...prev.allIds, project.id],
      };
    });
  }, []);

  return { projects, saveStatus, find, create, update, upsert, remove };
}
