import { useState } from "react";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, label, btnPrimary, btnSecondary } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { ChevronRight, Plus, X } from "lucide-react";

export default function RateLibraryPage() {
  const { rateLibrary, mobile } = useApp();
  const { categories, items, addCategory, updateCategory, removeCategory, addItem, updateItem, removeItem, getItemsByCategory } = rateLibrary;
  const [exp, setExp] = useState({});
  const [newCat, setNewCat] = useState("");
  const [search, setSearch] = useState("");

  // Filter categories + items by search
  const filteredCategories = categories.filter(cat => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (cat.name.toLowerCase().includes(q)) return true;
    return getItemsByCategory(cat.id).some(i => i.name.toLowerCase().includes(q) || (i.supplierCode || "").toLowerCase().includes(q));
  });

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 8 }}>Rate Library</h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: 24 }}>{categories.length} categories · {items.length} items</div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search items..." style={{ marginBottom: 24, maxWidth: 320 }} />

      {/* Add category */}
      <div style={{ display: "flex", gap: _.s2, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${_.line}` }}>
        <input style={{ ...input, flex: 1 }} placeholder="New category name…" value={newCat} onChange={e => setNewCat(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && newCat.trim()) { addCategory(newCat.trim()); setNewCat(""); } }} />
        <button onClick={() => { if (newCat.trim()) { addCategory(newCat.trim()); setNewCat(""); } }} style={btnPrimary}>Add Category</button>
      </div>

      {/* Categories accordion */}
      {filteredCategories.map(cat => {
        const catItems = getItemsByCategory(cat.id);
        const displayItems = search.trim()
          ? catItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.supplierCode || "").toLowerCase().includes(search.toLowerCase()) || cat.name.toLowerCase().includes(search.toLowerCase()))
          : catItems;
        const open = exp[cat.id] || (search.trim() && displayItems.length > 0);
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
                <span style={{ fontSize: _.fontSize.md, fontWeight: catItems.length > 0 ? _.fontWeight.semi : _.fontWeight.normal, color: catItems.length > 0 ? _.ink : _.muted }}>{cat.name}</span>
                <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.ac, marginLeft: 4 }}>{catItems.length}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {catTotal > 0 && <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(catTotal)}</span>}
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
                {displayItems.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 70px 80px 50px auto" : "1fr 70px 80px 50px 70px 80px auto", gap: 6, padding: "4px 0", fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, textTransform: "uppercase" }}>
                    <span>Item</span><span>Unit</span><span>Rate</span><span>Qty</span>
                    {!mobile && <><span>Margin %</span><span>Supplier</span></>}
                    <span></span>
                  </div>
                )}
                {displayItems.map(item => (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 70px 80px 50px auto" : "1fr 70px 80px 50px 70px 80px auto", gap: 6, padding: "5px 0", alignItems: "center", borderBottom: `1px solid ${_.line}` }}>
                    <input style={{ ...input, padding: "4px 8px", fontSize: _.fontSize.base }} value={item.name} onChange={e => updateItem(item.id, { name: e.target.value })} />
                    <input style={{ ...input, padding: "4px 8px", fontSize: _.fontSize.sm }} value={item.unit} onChange={e => updateItem(item.id, { unit: e.target.value })} />
                    <input type="number" style={{ ...input, padding: "4px 8px", fontSize: _.fontSize.sm, textAlign: "right" }} value={item.unitRate} onChange={e => updateItem(item.id, { unitRate: parseFloat(e.target.value) || 0 })} />
                    <input type="number" style={{ ...input, padding: "4px 8px", fontSize: _.fontSize.sm, textAlign: "center" }} value={item.defaultQty} onChange={e => updateItem(item.id, { defaultQty: parseFloat(e.target.value) || 0 })} />
                    {!mobile && (
                      <>
                        <input type="number" style={{ ...input, padding: "4px 8px", fontSize: _.fontSize.sm, textAlign: "center" }} value={item.margin || 0} onChange={e => updateItem(item.id, { margin: parseFloat(e.target.value) || 0 })} />
                        <input style={{ ...input, padding: "4px 8px", fontSize: _.fontSize.caption }} value={item.supplierCode || ""} onChange={e => updateItem(item.id, { supplierCode: e.target.value })} placeholder="Code" />
                      </>
                    )}
                    <div onClick={() => removeItem(item.id)} style={{ cursor: "pointer", color: _.faint, padding: 2 }}
                      onMouseEnter={e => e.currentTarget.style.color = _.red}
                      onMouseLeave={e => e.currentTarget.style.color = _.faint}
                    ><X size={12} /></div>
                  </div>
                ))}
                <div onClick={() => addItem(cat.id, { name: "New Item" })} style={{
                  padding: "6px 0", cursor: "pointer", color: _.ac, fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi,
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
