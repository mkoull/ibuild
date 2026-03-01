import { useState } from "react";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, label, btnPrimary, btnSecondary } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import { ChevronRight, Plus, X } from "lucide-react";

export default function RateLibraryPage() {
  const { rateLibrary, mobile } = useApp();
  const { categories, items, addCategory, updateCategory, removeCategory, addItem, updateItem, removeItem, getItemsByCategory } = rateLibrary;
  const [exp, setExp] = useState({});
  const [newCat, setNewCat] = useState("");

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? 28 : 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Rate Library</h1>
      <div style={{ fontSize: 14, color: _.muted, marginBottom: 32 }}>{categories.length} categories · {items.length} items</div>

      {/* Add category */}
      <div style={{ display: "flex", gap: _.s2, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${_.line}` }}>
        <input style={{ ...input, flex: 1 }} placeholder="New category name…" value={newCat} onChange={e => setNewCat(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && newCat.trim()) { addCategory(newCat.trim()); setNewCat(""); } }} />
        <button onClick={() => { if (newCat.trim()) { addCategory(newCat.trim()); setNewCat(""); } }} style={btnPrimary}>Add Category</button>
      </div>

      {/* Categories accordion */}
      {categories.map(cat => {
        const catItems = getItemsByCategory(cat.id);
        const open = exp[cat.id];
        const catTotal = catItems.reduce((t, i) => t + i.unitRate * i.defaultQty, 0);

        return (
          <div key={cat.id} style={{ marginBottom: 2 }}>
            <div onClick={() => setExp(e => ({ ...e, [cat.id]: !e[cat.id] }))} style={{
              padding: "10px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between",
              alignItems: "center", borderLeft: catItems.length > 0 ? `2px solid ${_.ac}` : `2px solid transparent`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                <span style={{ transform: open ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}>
                  <ChevronRight size={13} color={catItems.length > 0 ? _.ac : _.muted} />
                </span>
                <span style={{ fontSize: 14, fontWeight: catItems.length > 0 ? 600 : 400, color: catItems.length > 0 ? _.ink : _.muted }}>{cat.name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: _.ac, marginLeft: 4 }}>{catItems.length}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {catTotal > 0 && <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(catTotal)}</span>}
                <div onClick={e => { e.stopPropagation(); if (confirm(`Delete "${cat.name}" and all its items?`)) removeCategory(cat.id); }}
                  style={{ cursor: "pointer", color: _.faint, padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = _.red}
                  onMouseLeave={e => e.currentTarget.style.color = _.faint}
                ><X size={13} /></div>
              </div>
            </div>

            {open && (
              <div style={{ paddingBottom: _.s4, paddingLeft: 24, borderLeft: `2px solid ${_.line}` }}>
                {/* Items table header */}
                {catItems.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 50px auto", gap: 6, padding: "4px 0", fontSize: 10, color: _.muted, fontWeight: 600, textTransform: "uppercase" }}>
                    <span>Item</span><span>Unit</span><span>Rate</span><span>Qty</span><span></span>
                  </div>
                )}
                {catItems.map(item => (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 50px auto", gap: 6, padding: "5px 0", alignItems: "center", borderBottom: `1px solid ${_.line}` }}>
                    <input style={{ ...input, padding: "4px 8px", fontSize: 13 }} value={item.name} onChange={e => updateItem(item.id, { name: e.target.value })} />
                    <input style={{ ...input, padding: "4px 8px", fontSize: 12 }} value={item.unit} onChange={e => updateItem(item.id, { unit: e.target.value })} />
                    <input type="number" style={{ ...input, padding: "4px 8px", fontSize: 12, textAlign: "right" }} value={item.unitRate} onChange={e => updateItem(item.id, { unitRate: parseFloat(e.target.value) || 0 })} />
                    <input type="number" style={{ ...input, padding: "4px 8px", fontSize: 12, textAlign: "center" }} value={item.defaultQty} onChange={e => updateItem(item.id, { defaultQty: parseFloat(e.target.value) || 0 })} />
                    <div onClick={() => removeItem(item.id)} style={{ cursor: "pointer", color: _.faint, padding: 2 }}
                      onMouseEnter={e => e.currentTarget.style.color = _.red}
                      onMouseLeave={e => e.currentTarget.style.color = _.faint}
                    ><X size={12} /></div>
                  </div>
                ))}
                <div onClick={() => addItem(cat.id, { name: "New Item" })} style={{
                  padding: "6px 0", cursor: "pointer", color: _.ac, fontSize: 12, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 4,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                ><Plus size={13} /> Add item</div>
              </div>
            )}
          </div>
        );
      })}
    </Section>
  );
}
