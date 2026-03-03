import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { uid, ds } from "../theme/styles.js";
import { mkProject } from "../data/models.js";
import { loadVersioned, saveVersioned } from "../data/store.js";
import { shadowWriter } from "../lib/shadowWrite.js";

const STORAGE_KEY = "ib_projects";
const STORE_VERSION = 11;
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
  return data;
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
    if (byId[id]) hydrated[id] = hydrateProject(byId[id]);
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
    setState(prev => ({
      byId: { ...prev.byId, [p.id]: p },
      allIds: [...prev.allIds, p.id],
    }));
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
