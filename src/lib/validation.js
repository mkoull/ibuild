export function isRequiredText(value) {
  return String(value || "").trim().length > 0;
}

export function toPositiveNumber(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n < 0 ? 0 : n;
}

export function isValidIsoDate(value) {
  const v = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00`);
  return !Number.isNaN(d.getTime());
}
