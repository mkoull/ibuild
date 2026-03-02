// ═══ localStorage wrapper ═══

const CURRENT_VERSION = 2;

export const store = {
  get(key) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? null : JSON.parse(v);
    } catch { return null; }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  },
};

/**
 * Load with versioning envelope + auto-migration.
 * Stored format: { __v: number, data: any }
 * Unversioned (legacy) data is treated as version 1.
 */
export function loadVersioned(key, { fallback, version = CURRENT_VERSION, migrate } = {}) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { version, data: typeof fallback === "function" ? fallback() : fallback };

    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && parsed.__v != null) {
      let data = parsed.data;
      let v = parsed.__v;
      if (migrate && v < version) {
        data = migrate(data, v);
      }
      return { version, data };
    }

    let data = parsed;
    if (migrate) {
      data = migrate(data, 1);
    }
    return { version, data };
  } catch (err) {
    if (import.meta.env.DEV) console.warn(`[store] corrupt data for "${key}", using fallback`, err);
    return { version, data: typeof fallback === "function" ? fallback() : fallback };
  }
}

export function saveVersioned(key, data, version = CURRENT_VERSION) {
  try {
    localStorage.setItem(key, JSON.stringify({ __v: version, data }));
    return true;
  } catch { return false; }
}

export function loadCollection(key, fallback = []) {
  const d = store.get(key);
  return Array.isArray(d) ? d : fallback;
}

export function saveCollection(key, data) {
  store.set(key, data);
}

export function findById(arr, id) {
  return arr.find(x => x.id === id) || null;
}

export function upsert(arr, item) {
  const idx = arr.findIndex(x => x.id === item.id);
  if (idx >= 0) {
    const next = [...arr];
    next[idx] = item;
    return next;
  }
  return [...arr, item];
}

export function removeById(arr, id) {
  return arr.filter(x => x.id !== id);
}
