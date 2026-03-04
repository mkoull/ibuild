import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import Button from "../../components/ui/Button.jsx";
import { Plus, Trash2 } from "lucide-react";

const UNITS = ["m²", "m³", "unit", "hour"];

export default function RateLibraryPage() {
  const { rateLibrary, mobile, notify } = useApp();
  const { categories, items, addCategory, removeCategory, addItem, updateItem, removeItem, getItemsByCategory } = rateLibrary;
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    unit: "unit",
    labourCost: "",
    materialCost: "",
    markup: "20",
  });

  const categoryNameById = useMemo(() => {
    const map = {};
    (categories || []).forEach((c) => { map[c.id] = c.name; });
    return map;
  }, [categories]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (items || [])
      .map((item) => {
        const labourCost = Number(item.labourCost) || 0;
        const materialCost = Number(item.materialCost) || 0;
        const unitCost = Number(item.unitRate ?? labourCost + materialCost) || 0;
        return {
          ...item,
          categoryName: categoryNameById[item.categoryId] || item.category || "Uncategorised",
          labourCost,
          materialCost,
          unitCost,
          markup: Number(item.markupPct ?? item.margin ?? 0) || 0,
        };
      })
      .filter((item) => {
        if (!q) return true;
        return (
          String(item.name || "").toLowerCase().includes(q)
          || String(item.description || "").toLowerCase().includes(q)
          || String(item.categoryName || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [items, search, categoryNameById]);

  const onCreate = () => {
    if (!form.name.trim() || !form.category.trim()) {
      notify("Name and category are required", "error");
      return;
    }
    const labourCost = Number(form.labourCost) || 0;
    const materialCost = Number(form.materialCost) || 0;
    const unitRate = labourCost + materialCost;
    const markupPct = Number(form.markup) || 0;
    const existingCategory = (categories || []).find((c) => String(c.name || "").toLowerCase() === form.category.trim().toLowerCase());
    const category = existingCategory || addCategory(form.category.trim());
    addItem(category.id, {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      unit: form.unit,
      labourCost,
      materialCost,
      unitRate,
      markupPct,
      margin: markupPct,
      defaultQty: 1,
    });
    notify("Cost item created");
    setForm({
      name: "",
      description: "",
      category: form.category.trim(),
      unit: "unit",
      labourCost: "",
      materialCost: "",
      markup: "20",
    });
  };

  const deleteCategory = (categoryId, name) => {
    const linkedItems = getItemsByCategory(categoryId);
    if (linkedItems.length > 0) {
      notify("Delete items in this category first", "info");
      return;
    }
    if (confirm(`Delete category "${name}"?`)) {
      removeCategory(categoryId);
    }
  };

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 8 }}>
        Cost Library
      </h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: 24 }}>
        {categories.length} categories · {items.length} cost items
      </div>

      <div style={{ ...boxStyle, marginBottom: 20 }}>
        <div style={boxTitleStyle}>Create Cost Item</div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          <input style={input} placeholder="Name" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
          <input style={input} placeholder="Category" value={form.category} onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))} />
          <select style={{ ...input, cursor: "pointer" }} value={form.unit} onChange={(e) => setForm((v) => ({ ...v, unit: e.target.value }))}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <input style={{ ...input, gridColumn: mobile ? "auto" : "1 / span 3" }} placeholder="Description" value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
          <input type="number" style={input} placeholder="Labour Cost" value={form.labourCost} onChange={(e) => setForm((v) => ({ ...v, labourCost: e.target.value }))} />
          <input type="number" style={input} placeholder="Material Cost" value={form.materialCost} onChange={(e) => setForm((v) => ({ ...v, materialCost: e.target.value }))} />
          <input type="number" style={input} placeholder="Markup %" value={form.markup} onChange={(e) => setForm((v) => ({ ...v, markup: e.target.value }))} />
        </div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <Button icon={Plus} onClick={onCreate}>Create Cost Item</Button>
        </div>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search cost items..." style={{ marginBottom: 16, maxWidth: 360 }} />

      <div style={{ ...boxStyle, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
          <thead>
            <tr style={{ textAlign: "left", fontSize: 12, color: _.muted }}>
              <th style={thStyle}>Item Name</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Unit</th>
              <th style={thStyle}>Unit Cost</th>
              <th style={thStyle}>Labour Cost</th>
              <th style={thStyle}>Material Cost</th>
              <th style={thStyle}>Markup %</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>
                  <input style={cellInput} value={item.name || ""} onChange={(e) => updateItem(item.id, { name: e.target.value })} />
                </td>
                <td style={tdStyle}>
                  <input
                    style={cellInput}
                    value={item.categoryName || ""}
                    onChange={(e) => {
                      const categoryName = e.target.value;
                      const found = (categories || []).find((c) => String(c.name || "").toLowerCase() === categoryName.trim().toLowerCase());
                      const cat = found || (categoryName.trim() ? addCategory(categoryName.trim()) : null);
                      if (!cat) return;
                      updateItem(item.id, { categoryId: cat.id, category: categoryName.trim() });
                    }}
                  />
                </td>
                <td style={tdStyle}>
                  <select style={{ ...cellInput, cursor: "pointer" }} value={item.unit || "unit"} onChange={(e) => updateItem(item.id, { unit: e.target.value })}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    style={{ ...cellInput, textAlign: "right" }}
                    value={item.unitCost}
                    onChange={(e) => updateItem(item.id, { unitRate: Number(e.target.value) || 0 })}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    style={{ ...cellInput, textAlign: "right" }}
                    value={item.labourCost}
                    onChange={(e) => {
                      const labourCost = Number(e.target.value) || 0;
                      const materialCost = Number(item.materialCost) || 0;
                      updateItem(item.id, { labourCost, unitRate: labourCost + materialCost });
                    }}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    style={{ ...cellInput, textAlign: "right" }}
                    value={item.materialCost}
                    onChange={(e) => {
                      const materialCost = Number(e.target.value) || 0;
                      const labourCost = Number(item.labourCost) || 0;
                      updateItem(item.id, { materialCost, unitRate: labourCost + materialCost });
                    }}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    style={{ ...cellInput, textAlign: "right" }}
                    value={item.markup}
                    onChange={(e) => {
                      const markupPct = Number(e.target.value) || 0;
                      updateItem(item.id, { markupPct, margin: markupPct });
                    }}
                  />
                </td>
                <td style={tdStyle}>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    style={{ border: "none", background: "transparent", color: _.muted, cursor: "pointer" }}
                    title="Delete item"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {(categories || []).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => deleteCategory(cat.id, cat.name)}
              style={{
                border: `1px solid ${_.line}`,
                background: _.surface,
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 12,
                color: _.muted,
                cursor: "pointer",
              }}
            >
              {cat.name} ({getItemsByCategory(cat.id).length})
            </button>
          ))}
          {categories.length === 0 && <span style={{ fontSize: 12, color: _.muted }}>No categories yet.</span>}
        </div>
        {rows.length === 0 && (
          <div style={{ marginTop: 12, fontSize: 13, color: _.muted }}>
            No cost items found.
          </div>
        )}
      </div>
    </Section>
  );
}

const boxStyle = {
  border: `1px solid ${_.line}`,
  borderRadius: 10,
  background: _.surface,
  padding: 14,
};

const boxTitleStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: _.ink,
  marginBottom: 10,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const thStyle = {
  padding: "8px 10px",
  borderBottom: `1px solid ${_.line}`,
};

const tdStyle = {
  padding: "8px 10px",
  borderBottom: `1px solid ${_.line}`,
};

const cellInput = {
  width: "100%",
  border: `1px solid ${_.line}`,
  borderRadius: 6,
  padding: "6px 8px",
  background: _.bg,
  color: _.ink,
  fontSize: 13,
};
