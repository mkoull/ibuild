import _ from "../theme/tokens.js";

export const TRADE_BENCHMARKS = [
  { trade: "Concrete", low: 130, high: 220, unit: "m²", keys: ["concrete", "slab", "footing"] },
  { trade: "Framing", low: 85, high: 155, unit: "m²", keys: ["framing", "frame", "structure", "timber"] },
  { trade: "Roofing", low: 55, high: 120, unit: "m²", keys: ["roof", "roofing", "cladding"] },
  { trade: "Electrical", low: 75, high: 145, unit: "hour", keys: ["electrical", "wiring", "switchboard", "power"] },
  { trade: "Plumbing", low: 95, high: 180, unit: "hour", keys: ["plumbing", "drain", "gas"] },
  { trade: "Painting", low: 12, high: 26, unit: "m²", keys: ["painting", "paint", "finishes"] },
  { trade: "Windows & Doors", low: 450, high: 2200, unit: "unit", keys: ["window", "door", "glazing"] },
  { trade: "Internal Linings", low: 35, high: 80, unit: "m²", keys: ["lining", "gyprock", "plaster"] },
];

export function findTradeBenchmark({ categoryName = "", description = "", unit = "" }) {
  const cat = String(categoryName).toLowerCase();
  const desc = String(description).toLowerCase();
  const u = String(unit || "").toLowerCase();

  const scored = TRADE_BENCHMARKS.map((b) => {
    const score = (b.keys || []).reduce((s, k) => {
      if (cat.includes(k)) return s + 3;
      if (desc.includes(k)) return s + 1;
      return s;
    }, 0);
    return { ...b, score };
  }).filter((b) => b.score > 0);

  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  if (u && best.unit && u !== String(best.unit).toLowerCase()) {
    return null;
  }
  return best;
}

export function evaluateBenchmark(yourCost, benchmark) {
  const rate = Number(yourCost) || 0;
  if (!benchmark || rate <= 0) {
    return { label: "—", color: _.muted };
  }

  const low = Number(benchmark.low) || 0;
  const high = Number(benchmark.high) || 0;

  if (rate < low) return { label: "Below range", color: _.blue };
  if (rate <= high) return { label: "Within range", color: _.green };
  if (rate <= high * 1.15) return { label: "Slightly above", color: _.amber };
  return { label: "Significantly above", color: _.red };
}
