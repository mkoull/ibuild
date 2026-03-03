const STORAGE_KEY = "ib_feature_flags";

const DEFAULTS = {
  shadow_write_enabled: false,
  backend_source_of_truth: false,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(flags) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

export const FLAGS = DEFAULTS;

export function isEnabled(name) {
  return load()[name] === true;
}

export function setFlag(name, value) {
  const flags = load();
  flags[name] = value;
  save(flags);
}

export function getAllFlags() {
  return load();
}
