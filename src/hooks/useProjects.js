import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { uid } from "../theme/styles.js";
import { mkProject } from "../data/models.js";
import { loadVersioned, saveVersioned } from "../data/store.js";

const STORAGE_KEY = "ib_projects";
const STORE_VERSION = 4;
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
