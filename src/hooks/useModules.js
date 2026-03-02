import { useEffect, useMemo } from "react";
import { useStore } from "./useStore.js";
import { uid } from "../theme/styles.js";

const STORAGE_KEY = "ib_modules";

function nowIso() {
  return new Date().toISOString();
}

function mkModule({ type, projectId = null, title = "", links = {}, status = "active" }) {
  return {
    id: uid(),
    type,
    title: title || `${type[0].toUpperCase()}${type.slice(1)} module`,
    projectId,
    links: {
      sourceOfTruth: links.sourceOfTruth || null,
      derivedFrom: links.derivedFrom || null,
      relatedTo: Array.isArray(links.relatedTo) ? links.relatedTo : [],
    },
    status,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function hasProjectData(project, type) {
  if (!project) return false;
  if (type === "quote") return !!(project.scope && Object.keys(project.scope).length > 0);
  if (type === "schedule") return Array.isArray(project.schedule) && project.schedule.length > 0;
  if (type === "costs") {
    return (Array.isArray(project.budget) && project.budget.length > 0)
      || (Array.isArray(project.commitments) && project.commitments.length > 0)
      || (Array.isArray(project.actuals) && project.actuals.length > 0);
  }
  if (type === "invoices") return Array.isArray(project.invoices) && project.invoices.length > 0;
  return false;
}

function migrateFromProjects(existingModules, projects) {
  const next = Array.isArray(existingModules) ? [...existingModules] : [];
  const byProjectType = new Set(next.filter(m => m.projectId && m.type).map(m => `${m.projectId}:${m.type}`));

  (projects || []).forEach(project => {
    ["quote", "schedule", "costs", "invoices"].forEach(type => {
      if (!hasProjectData(project, type)) return;
      const key = `${project.id}:${type}`;
      if (byProjectType.has(key)) return;
      next.push(mkModule({
        type,
        projectId: project.id,
        title: `${project.name || project.client || "Project"} · ${type}`,
      }));
      byProjectType.add(key);
    });
  });

  // Auto-link modules per project (quote as source of truth).
  const byProject = {};
  next.forEach(m => {
    if (!m.projectId) return;
    if (!byProject[m.projectId]) byProject[m.projectId] = {};
    byProject[m.projectId][m.type] = m;
  });
  Object.values(byProject).forEach(group => {
    const quote = group.quote;
    if (!quote) return;
    ["schedule", "costs", "invoices"].forEach(type => {
      const m = group[type];
      if (!m) return;
      if (!m.links) m.links = { sourceOfTruth: null, derivedFrom: null, relatedTo: [] };
      if (!m.links.derivedFrom) m.links.derivedFrom = quote.id;
      if (!m.links.sourceOfTruth) m.links.sourceOfTruth = quote.id;
      if (!Array.isArray(m.links.relatedTo)) m.links.relatedTo = [];
      if (!m.links.relatedTo.includes(quote.id)) m.links.relatedTo.push(quote.id);
    });
  });

  return next;
}

export function useModules(projects) {
  const [modules, setModules] = useStore(STORAGE_KEY, []);

  useEffect(() => {
    const migrated = migrateFromProjects(modules, projects);
    if (JSON.stringify(migrated) !== JSON.stringify(modules)) {
      setModules(migrated);
    }
  }, [modules, projects, setModules]);

  const modulesByProject = useMemo(() => {
    const map = {};
    (modules || []).forEach(m => {
      if (!m.projectId) return;
      if (!map[m.projectId]) map[m.projectId] = [];
      map[m.projectId].push(m);
    });
    return map;
  }, [modules]);

  return {
    modules: modules || [],
    modulesByProject,
    find: (id) => (modules || []).find(m => m.id === id) || null,
    forProject: (projectId) => modulesByProject[projectId] || [],
    create: (payload) => {
      const m = mkModule(payload || {});
      setModules(prev => [...(prev || []), m]);
      return m;
    },
    update: (id, fn) => {
      setModules(prev => (prev || []).map(m => {
        if (m.id !== id) return m;
        const copy = JSON.parse(JSON.stringify(m));
        const result = fn(copy);
        const out = result || copy;
        out.updatedAt = nowIso();
        return out;
      }));
    },
    remove: (id) => setModules(prev => (prev || []).filter(m => m.id !== id)),
    setModules,
  };
}

