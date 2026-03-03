import { useEffect, useMemo, useState } from "react";
import _ from "../../theme/tokens.js";
import { fmt, uid } from "../../theme/styles.js";
import Button from "../../components/ui/Button.jsx";
import { useProject } from "../../context/ProjectContext.jsx";

const TYPE_OPTIONS = ["Labour", "Material", "Subcontract", "Other"];
const TAX_OPTIONS = ["GST", "Exempt"];

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function lineExTotal(line) {
  const qty = Number(line.qty) || 0;
  const unitCost = Number(line.unitCost) || 0;
  const markupPct = Number(line.markupPct) || 0;
  const withMarkup = unitCost * (1 + markupPct / 100);
  return round2(qty * withMarkup);
}

function lineTax(line) {
  if ((line.tax || "GST") === "GST") return round2(lineExTotal(line) * 0.1);
  return 0;
}

function lineIncTotal(line) {
  return round2(lineExTotal(line) + lineTax(line));
}

function computeTotals(lines) {
  const totalEx = round2((lines || []).reduce((t, l) => t + lineExTotal(l), 0));
  const gst = round2((lines || []).reduce((t, l) => t + lineTax(l), 0));
  const quoteTotal = round2(totalEx + gst);
  return { totalEx, gst, quoteTotal };
}

function hydrateCostings(project) {
  const existing = project.costings?.lineItems;
  if (Array.isArray(existing) && existing.length > 0) {
    return existing.map((l) => ({
      id: l.id || uid(),
      category: l.category || "General",
      description: l.description || "",
      type: l.type || "Labour",
      qty: Number(l.qty) || 0,
      uom: l.uom || "ea",
      unitCost: Number(l.unitCost) || 0,
      markupPct: Number(l.markupPct) || 0,
      tax: l.tax || "GST",
    }));
  }

  const fromScope = [];
  Object.entries(project.scope || {}).forEach(([cat, items]) => {
    (items || []).filter((i) => i.on).forEach((i) => {
      fromScope.push({
        id: i._id || uid(),
        category: cat || "General",
        description: i.item || "",
        type: "Labour",
        qty: Number(i.qty) || 0,
        uom: i.unit || "ea",
        unitCost: Number(i.rate) || 0,
        markupPct: 0,
        tax: "GST",
      });
    });
  });

  if (fromScope.length > 0) return fromScope;
  return [{
    id: uid(),
    category: "General",
    description: "",
    type: "Labour",
    qty: 1,
    uom: "ea",
    unitCost: 0,
    markupPct: 0,
    tax: "GST",
  }];
}

export default function EstimateCostingsWrapper() {
  const { project: p, update: up } = useProject();
  const lines = useMemo(() => hydrateCostings(p), [p]);
  const categories = useMemo(() => {
    const uniq = [...new Set(lines.map((l) => l.category || "General"))];
    return uniq.length ? uniq : ["General"];
  }, [lines]);
  const [activeCategory, setActiveCategory] = useState(categories[0] || "General");
  const [newCategory, setNewCategory] = useState("");
  const totals = useMemo(() => computeTotals(lines), [lines]);

  useEffect(() => {
    if (!categories.includes(activeCategory)) setActiveCategory(categories[0] || "General");
  }, [activeCategory, categories]);

  const filtered = lines.filter((l) => (l.category || "General") === activeCategory);

  const updateLine = (id, field, value) => {
    up((pr) => {
      if (!pr.costings) pr.costings = {};
      const current = hydrateCostings(pr);
      const idx = current.findIndex((l) => l.id === id);
      if (idx === -1) return pr;
      current[idx] = { ...current[idx], [field]: value };
      pr.costings.lineItems = current;
      pr.costingsTotals = computeTotals(current);
      return pr;
    });
  };

  const addLine = () => {
    up((pr) => {
      if (!pr.costings) pr.costings = {};
      const current = hydrateCostings(pr);
      current.push({
        id: uid(),
        category: activeCategory || "General",
        description: "",
        type: "Labour",
        qty: 1,
        uom: "ea",
        unitCost: 0,
        markupPct: 0,
        tax: "GST",
      });
      pr.costings.lineItems = current;
      pr.costingsTotals = computeTotals(current);
      return pr;
    });
  };

  const removeLine = (id) => {
    up((pr) => {
      if (!pr.costings) pr.costings = {};
      const current = hydrateCostings(pr).filter((l) => l.id !== id);
      pr.costings.lineItems = current.length ? current : [{
        id: uid(),
        category: activeCategory || "General",
        description: "",
        type: "Labour",
        qty: 1,
        uom: "ea",
        unitCost: 0,
        markupPct: 0,
        tax: "GST",
      }];
      pr.costingsTotals = computeTotals(pr.costings.lineItems);
      return pr;
    });
  };

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    setActiveCategory(name);
    setNewCategory("");
    up((pr) => {
      if (!pr.costings) pr.costings = {};
      const current = hydrateCostings(pr);
      current.push({
        id: uid(),
        category: name,
        description: "",
        type: "Labour",
        qty: 1,
        uom: "ea",
        unitCost: 0,
        markupPct: 0,
        tax: "GST",
      });
      pr.costings.lineItems = current;
      pr.costingsTotals = computeTotals(current);
      return pr;
    });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: _.s4, alignItems: "start" }}>
      <div style={{ border: `1px solid ${_.line}`, borderRadius: _.rSm, background: _.surface, padding: _.s3 }}>
        <div style={{ fontSize: _.fontSize.xs, color: _.muted, textTransform: "uppercase", letterSpacing: _.letterSpacing.wide, marginBottom: _.s2 }}>
          Categories / Trades
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: _.s1 }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              style={{
                textAlign: "left",
                border: `1px solid ${activeCategory === c ? _.ac : _.line}`,
                background: activeCategory === c ? `${_.ac}12` : _.surface,
                color: activeCategory === c ? _.ac : _.ink,
                borderRadius: _.rSm,
                padding: `${_.s2}px ${_.s3}px`,
                cursor: "pointer",
                fontSize: _.fontSize.sm,
                fontWeight: _.fontWeight.medium,
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: _.s1, marginTop: _.s3 }}>
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category"
            style={{ flex: 1, border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: `${_.s2}px ${_.s2}px`, fontSize: _.fontSize.sm }}
          />
          <Button size="sm" onClick={addCategory}>Add</Button>
        </div>
      </div>

      <div style={{ border: `1px solid ${_.line}`, borderRadius: _.rSm, background: _.surface, padding: _.s3 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${_.line2}` }}>
                {["Description", "Type", "Qty", "UOM", "Unit Cost", "Markup %", "Tax", "Total", ""].map((h) => (
                  <th key={h} style={{ textAlign: h === "Total" ? "right" : "left", padding: `${_.s2}px`, fontSize: _.fontSize.xs, color: _.muted, textTransform: "uppercase", letterSpacing: _.letterSpacing.wide }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((line) => (
                <tr key={line.id} style={{ borderBottom: `1px solid ${_.line}` }}>
                  <td style={{ padding: _.s2 }}>
                    <input value={line.description} onChange={(e) => updateLine(line.id, "description", e.target.value)} style={{ width: "100%", border: `1px solid ${_.line}`, borderRadius: _.rXs, padding: "6px 8px" }} />
                  </td>
                  <td style={{ padding: _.s2 }}>
                    <select value={line.type} onChange={(e) => updateLine(line.id, "type", e.target.value)} style={{ width: "100%", border: `1px solid ${_.line}`, borderRadius: _.rXs, padding: "6px 8px" }}>
                      {TYPE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: _.s2 }}>
                    <input type="number" value={line.qty} onChange={(e) => updateLine(line.id, "qty", Number(e.target.value) || 0)} style={{ width: 84, border: `1px solid ${_.line}`, borderRadius: _.rXs, padding: "6px 8px" }} />
                  </td>
                  <td style={{ padding: _.s2 }}>
                    <input value={line.uom} onChange={(e) => updateLine(line.id, "uom", e.target.value)} style={{ width: 90, border: `1px solid ${_.line}`, borderRadius: _.rXs, padding: "6px 8px" }} />
                  </td>
                  <td style={{ padding: _.s2 }}>
                    <input type="number" value={line.unitCost} onChange={(e) => updateLine(line.id, "unitCost", Number(e.target.value) || 0)} style={{ width: 110, border: `1px solid ${_.line}`, borderRadius: _.rXs, padding: "6px 8px", textAlign: "right" }} />
                  </td>
                  <td style={{ padding: _.s2 }}>
                    <input type="number" value={line.markupPct} onChange={(e) => updateLine(line.id, "markupPct", Number(e.target.value) || 0)} style={{ width: 96, border: `1px solid ${_.line}`, borderRadius: _.rXs, padding: "6px 8px", textAlign: "right" }} />
                  </td>
                  <td style={{ padding: _.s2 }}>
                    <select value={line.tax} onChange={(e) => updateLine(line.id, "tax", e.target.value)} style={{ width: 96, border: `1px solid ${_.line}`, borderRadius: _.rXs, padding: "6px 8px" }}>
                      {TAX_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: _.s2, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>
                    {fmt(lineIncTotal(line))}
                  </td>
                  <td style={{ padding: _.s2, textAlign: "right" }}>
                    <button onClick={() => removeLine(line.id)} style={{ border: "none", background: "transparent", color: _.red, cursor: "pointer" }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: _.s3 }}>
          <Button variant="secondary" onClick={addLine}>Add Line Item</Button>
          <div style={{ minWidth: 280, border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: _.s2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, color: _.body, padding: "2px 0" }}>
              <span>Total (ex)</span><strong>{fmt(totals.totalEx)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, color: _.body, padding: "2px 0" }}>
              <span>GST</span><strong>{fmt(totals.gst)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.md, color: _.ink, padding: "6px 0 0", borderTop: `1px solid ${_.line}` }}>
              <span style={{ fontWeight: _.fontWeight.semi }}>Quote Total</span>
              <strong>{fmt(totals.quoteTotal)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
