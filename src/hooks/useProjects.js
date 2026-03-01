import { useStore } from "./useStore.js";
import { uid } from "../theme/styles.js";
import { mkProject } from "../data/models.js";
import { findById, upsert, removeById } from "../data/store.js";

export function useProjects() {
  const [projects, setProjects, saveStatus] = useStore("ib_projects", []);

  // Ensure scope items have _ids (hydrate)
  const hydrated = projects.map(pr => {
    if (!pr.scope) return pr;
    let changed = false;
    Object.values(pr.scope).forEach(items =>
      items.forEach(item => { if (!item._id) { item._id = uid(); changed = true; } })
    );
    return changed ? { ...pr } : pr;
  });

  return {
    projects: hydrated,
    saveStatus,
    find: (id) => findById(hydrated, id),
    create: (overrides) => {
      const p = mkProject(overrides);
      setProjects(prev => [...prev, p]);
      return p;
    },
    update: (id, fn) => {
      setProjects(prev => prev.map(p => {
        if (p.id !== id) return p;
        const copy = JSON.parse(JSON.stringify(p));
        const result = fn(copy);
        return result || copy;
      }));
    },
    upsert: (project) => setProjects(prev => upsert(prev, project)),
    remove: (id) => setProjects(prev => removeById(prev, id)),
    setProjects,
  };
}
