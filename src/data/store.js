// ═══ localStorage wrapper ═══
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
