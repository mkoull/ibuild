import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useProject } from "../../context/ProjectContext.jsx";
import { uid } from "../../theme/styles.js";
import _ from "../../theme/tokens.js";
import Button from "../../components/ui/Button.jsx";

const BOX = {
  background: _.surface,
  border: `1px solid ${_.line}`,
  borderRadius: _.r,
};

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function calcLine(item) {
  const quantity = toNum(item.quantity);
  const unitRate = toNum(item.unitRate);
  const marginPercent = toNum(item.marginPercent);
  const costTotal = quantity * unitRate;
  const sellTotal = costTotal + (costTotal * (marginPercent / 100));
  return {
    ...item,
    quantity,
    unitRate,
    marginPercent,
    costTotal: Math.round(costTotal * 100) / 100,
    sellTotal: Math.round(sellTotal * 100) / 100,
  };
}

function money(n) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNum(n));
}

export default function ScopePage() {
  const { project, update } = useProject();
  const categories = Array.isArray(project.costCategories) ? project.costCategories : [];

  const totals = useMemo(() => {
    let totalCost = 0;
    let totalSell = 0;
    categories.forEach((cat) => {
      (cat.items || []).forEach((item) => {
        totalCost += toNum(item.costTotal);
        totalSell += toNum(item.sellTotal);
      });
    });
    const marginValue = totalSell - totalCost;
    const marginPercent = totalSell > 0 ? (marginValue / totalSell) * 100 : 0;
    return { totalCost, totalSell, marginValue, marginPercent };
  }, [categories]);

  const addCategory = () => {
    update((pr) => {
      if (!Array.isArray(pr.costCategories)) pr.costCategories = [];
      pr.costCategories.push({ id: uid(), name: `Category ${pr.costCategories.length + 1}`, items: [] });
      return pr;
    });
  };

  const renameCategory = (categoryId, name) => {
    update((pr) => {
      const cat = (pr.costCategories || []).find((c) => c.id === categoryId);
      if (cat) cat.name = name;
      return pr;
    });
  };

  const addLineItem = (categoryId) => {
    update((pr) => {
      const cat = (pr.costCategories || []).find((c) => c.id === categoryId);
      if (!cat) return pr;
      if (!Array.isArray(cat.items)) cat.items = [];
      cat.items.push(calcLine({
        id: uid(),
        description: "",
        quantity: 1,
        unit: "ea",
        unitRate: 0,
        costTotal: 0,
        marginPercent: 20,
        sellTotal: 0,
      }));
      return pr;
    });
  };

  const updateLineItem = (categoryId, itemId, field, value) => {
    update((pr) => {
      const cat = (pr.costCategories || []).find((c) => c.id === categoryId);
      if (!cat) return pr;
      const idx = (cat.items || []).findIndex((i) => i.id === itemId);
      if (idx < 0) return pr;
      const base = cat.items[idx];
      const next = field === "description" || field === "unit"
        ? { ...base, [field]: value }
        : { ...base, [field]: toNum(value) };
      cat.items[idx] = calcLine(next);
      return pr;
    });
  };

  const removeLineItem = (categoryId, itemId) => {
    update((pr) => {
      const cat = (pr.costCategories || []).find((c) => c.id === categoryId);
      if (!cat) return pr;
      cat.items = (cat.items || []).filter((i) => i.id !== itemId);
      return pr;
    });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(260px, 320px)", gap: 16, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, margin: 0, color: _.ink }}>Estimate Cost Engine</h2>
          <Button size="sm" icon={Plus} onClick={addCategory}>Add Category</Button>
        </div>

        {categories.length === 0 && (
          <div style={{ ...BOX, padding: 20, color: _.muted }}>
            No categories yet. Add a category to start building your estimate.
          </div>
        )}

        {categories.map((cat) => (
          <div key={cat.id} style={BOX}>
            <div style={{ padding: 12, borderBottom: `1px solid ${_.line}`, display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={cat.name}
                onChange={(e) => renameCategory(cat.id, e.target.value)}
                placeholder="Category name"
                style={{
                  flex: 1,
                  border: `1px solid ${_.line}`,
                  borderRadius: _.rSm,
                  padding: "8px 10px",
                  fontSize: 14,
                  background: _.bg,
                  color: _.ink,
                }}
              />
              <Button size="sm" variant="secondary" icon={Plus} onClick={() => addLineItem(cat.id)}>Add Line Item</Button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: 12, color: _.muted }}>
                    <th style={{ padding: "10px 12px", borderBottom: `1px solid ${_.line}` }}>Description</th>
                    <th style={{ padding: "10px 12px", borderBottom: `1px solid ${_.line}` }}>Qty</th>
                    <th style={{ padding: "10px 12px", borderBottom: `1px solid ${_.line}` }}>Unit</th>
                    <th style={{ padding: "10px 12px", borderBottom: `1px solid ${_.line}` }}>Rate</th>
                    <th style={{ padding: "10px 12px", borderBottom: `1px solid ${_.line}` }}>Cost</th>
                    <th style={{ padding: "10px 12px", borderBottom: `1px solid ${_.line}` }}>Margin %</th>
                    <th style={{ padding: "10px 12px", borderBottom: `1px solid ${_.line}` }}>Sell</th>
                    <th style={{ padding: "10px 12px", borderBottom: `1px solid ${_.line}` }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(cat.items || []).map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${_.line}` }}>
                        <input
                          value={item.description || ""}
                          onChange={(e) => updateLineItem(cat.id, item.id, "description", e.target.value)}
                          style={cellInput}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${_.line}` }}>
                        <input
                          type="number"
                          value={item.quantity ?? 0}
                          onChange={(e) => updateLineItem(cat.id, item.id, "quantity", e.target.value)}
                          style={cellInput}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${_.line}` }}>
                        <input
                          value={item.unit || ""}
                          onChange={(e) => updateLineItem(cat.id, item.id, "unit", e.target.value)}
                          style={cellInput}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${_.line}` }}>
                        <input
                          type="number"
                          value={item.unitRate ?? 0}
                          onChange={(e) => updateLineItem(cat.id, item.id, "unitRate", e.target.value)}
                          style={cellInput}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${_.line}`, fontVariantNumeric: "tabular-nums" }}>
                        {money(item.costTotal)}
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${_.line}` }}>
                        <input
                          type="number"
                          value={item.marginPercent ?? 0}
                          onChange={(e) => updateLineItem(cat.id, item.id, "marginPercent", e.target.value)}
                          style={cellInput}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${_.line}`, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                        {money(item.sellTotal)}
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${_.line}` }}>
                        <button
                          type="button"
                          onClick={() => removeLineItem(cat.id, item.id)}
                          style={{ border: "none", background: "transparent", color: _.muted, cursor: "pointer" }}
                          title="Delete line item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <aside style={{ position: "sticky", top: 16, ...BOX, padding: 14 }}>
        <div style={{ fontSize: 11, color: _.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
          Summary
        </div>
        <SummaryRow label="Total Cost" value={money(totals.totalCost)} />
        <SummaryRow label="Total Sell" value={money(totals.totalSell)} strong />
        <SummaryRow label="Margin %" value={`${totals.marginPercent.toFixed(2)}%`} />
        <SummaryRow label="Margin $" value={money(totals.marginValue)} strong />
      </aside>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${_.line}` }}>
      <span style={{ color: _.muted, fontSize: 13 }}>{label}</span>
      <span style={{ color: _.ink, fontSize: 14, fontWeight: strong ? 700 : 600, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

const cellInput = {
  width: "100%",
  border: `1px solid ${_.line}`,
  borderRadius: _.rXs || 6,
  padding: "7px 8px",
  background: _.bg,
  color: _.ink,
  fontSize: 13,
};
