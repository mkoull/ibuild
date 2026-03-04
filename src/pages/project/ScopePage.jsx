import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { uid } from "../../theme/styles.js";
import _ from "../../theme/tokens.js";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { calculateTotals, normalizeCategories } from "../../lib/costEngine.js";

const BOX = {
  background: _.surface,
  border: `1px solid ${_.line}`,
  borderRadius: _.r,
};

const RESIDENTIAL_TEMPLATE = [
  "Site Works",
  "Framing",
  "Electrical",
  "Plumbing",
  "Roofing",
  "Internal Finishes",
];

function money(n) {
  const safe = Number.isFinite(Number(n)) ? Number(n) : 0;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export default function ScopePage() {
  const { project, update } = useProject();
  const { rateLibrary } = useApp();
  const navigate = useNavigate();
  const [libraryModalCategoryId, setLibraryModalCategoryId] = useState("");
  const [libraryQuery, setLibraryQuery] = useState("");
  const isActive = String(project.stage || project.status || "").toLowerCase() === "active";
  const estimateCategories = normalizeCategories(project?.estimate?.categories || project.costCategories || []);
  const budgetCategories = normalizeCategories(project?.job?.budget?.categories || []);
  const categories = isActive ? budgetCategories : estimateCategories;

  const totals = useMemo(() => calculateTotals(categories), [categories]);
  const baselineSell = Number(project?.job?.baseline?.totals?.totalSell) || 0;
  const contractValue = Number(project?.job?.contract?.currentContractValue) || totals.totalSell;
  const baselineDate = project?.job?.baseline?.createdAt || project?.convertedAt || null;
  const noCategories = categories.length === 0;
  const itemCount = categories.reduce((sum, cat) => sum + ((cat.items || []).length), 0);
  const hasItems = itemCount > 0;
  const workflowSteps = [
    { key: "categories", label: "Step 1 — Add Categories", complete: categories.length > 0 },
    { key: "items", label: "Step 2 — Add Cost Items", complete: hasItems },
    { key: "margin", label: "Step 3 — Review Margin", complete: hasItems && totals.totalSell > 0 },
    { key: "quote", label: "Step 4 — Generate Quote", complete: false },
  ];
  const libraryCategoryById = useMemo(() => {
    const m = {};
    (rateLibrary.categories || []).forEach((c) => { m[c.id] = c.name; });
    return m;
  }, [rateLibrary.categories]);
  const filteredLibraryItems = useMemo(() => {
    const q = libraryQuery.trim().toLowerCase();
    return (rateLibrary.items || [])
      .map((item) => {
        const labour = Number(item.labourCost) || 0;
        const material = Number(item.materialCost) || 0;
        const unitCost = Number(item.unitRate ?? (labour + material)) || 0;
        return {
          ...item,
          categoryName: libraryCategoryById[item.categoryId] || item.category || "Uncategorised",
          unitCost,
          markupPct: Number(item.markupPct ?? item.margin ?? 20) || 20,
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
      .slice(0, 60);
  }, [rateLibrary.items, libraryQuery, libraryCategoryById]);

  const addCategory = () => {
    if (isActive) return;
    update((pr) => {
      if (!Array.isArray(pr.costCategories)) pr.costCategories = [];
      pr.costCategories.push({ id: uid(), name: `Category ${pr.costCategories.length + 1}`, items: [] });
      pr.estimate = {
        categories: normalizeCategories(pr.costCategories),
        totals: calculateTotals(pr.costCategories),
      };
      return pr;
    });
  };

  const applyResidentialTemplate = () => {
    if (isActive) return;
    update((pr) => {
      if (!Array.isArray(pr.costCategories)) pr.costCategories = [];
      const existing = new Set((pr.costCategories || []).map((c) => String(c.name || "").trim().toLowerCase()));
      RESIDENTIAL_TEMPLATE.forEach((name) => {
        if (existing.has(name.toLowerCase())) return;
        pr.costCategories.push({ id: uid(), name, items: [] });
      });
      pr.estimate = {
        categories: normalizeCategories(pr.costCategories),
        totals: calculateTotals(pr.costCategories),
      };
      return pr;
    });
  };

  const renameCategory = (categoryId, name) => {
    if (isActive) return;
    update((pr) => {
      const cat = (pr.costCategories || []).find((c) => c.id === categoryId);
      if (cat) cat.name = name;
      pr.estimate = {
        categories: normalizeCategories(pr.costCategories),
        totals: calculateTotals(pr.costCategories),
      };
      return pr;
    });
  };

  const addLineItem = (categoryId) => {
    if (isActive) return;
    update((pr) => {
      const cat = (pr.costCategories || []).find((c) => c.id === categoryId);
      if (!cat) return pr;
      if (!Array.isArray(cat.items)) cat.items = [];
      cat.items.push({
        id: uid(),
        description: "",
        quantity: 1,
        unit: "ea",
        unitRate: 0,
        costTotal: 0,
        marginPercent: 20,
        sellTotal: 0,
      });
      cat.items = normalizeCategories([{ id: cat.id, name: cat.name, items: cat.items }])[0].items;
      pr.estimate = {
        categories: normalizeCategories(pr.costCategories),
        totals: calculateTotals(pr.costCategories),
      };
      return pr;
    });
  };

  const addFromLibrary = (categoryId, libraryItem) => {
    if (isActive) return;
    update((pr) => {
      const cat = (pr.costCategories || []).find((c) => c.id === categoryId);
      if (!cat) return pr;
      if (!Array.isArray(cat.items)) cat.items = [];
      cat.items.push({
        id: uid(),
        description: libraryItem.name || libraryItem.description || "",
        quantity: 1,
        unit: libraryItem.unit || "unit",
        unitRate: Number(libraryItem.unitCost) || 0,
        costTotal: 0,
        marginPercent: Number(libraryItem.markupPct) || 20,
        sellTotal: 0,
      });
      cat.items = normalizeCategories([{ id: cat.id, name: cat.name, items: cat.items }])[0].items;
      pr.estimate = {
        categories: normalizeCategories(pr.costCategories),
        totals: calculateTotals(pr.costCategories),
      };
      return pr;
    });
    setLibraryModalCategoryId("");
    setLibraryQuery("");
  };

  const updateLineItem = (categoryId, itemId, field, value) => {
    if (isActive) return;
    update((pr) => {
      const cat = (pr.costCategories || []).find((c) => c.id === categoryId);
      if (!cat) return pr;
      const idx = (cat.items || []).findIndex((i) => i.id === itemId);
      if (idx < 0) return pr;
      const base = cat.items[idx];
      const next = field === "description" || field === "unit"
        ? { ...base, [field]: value }
        : { ...base, [field]: Number(value) };
      const normalized = normalizeCategories([{ id: cat.id, name: cat.name, items: [next] }])[0].items[0];
      cat.items[idx] = normalized;
      pr.estimate = {
        categories: normalizeCategories(pr.costCategories),
        totals: calculateTotals(pr.costCategories),
      };
      return pr;
    });
  };

  const removeLineItem = (categoryId, itemId) => {
    if (isActive) return;
    update((pr) => {
      const cat = (pr.costCategories || []).find((c) => c.id === categoryId);
      if (!cat) return pr;
      cat.items = (cat.items || []).filter((i) => i.id !== itemId);
      pr.estimate = {
        categories: normalizeCategories(pr.costCategories),
        totals: calculateTotals(pr.costCategories),
      };
      return pr;
    });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(260px, 320px)", gap: 16, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {!isActive && (
          <div style={{ ...BOX, padding: 12 }}>
            <div style={{ fontSize: 12, color: _.muted, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>
              Estimate Workflow
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {workflowSteps.map((step) => (
                <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: step.complete ? _.green : _.line2,
                    boxShadow: step.complete ? `0 0 0 2px ${_.green}22` : "none",
                  }} />
                  <span style={{ color: step.complete ? _.ink : _.muted, fontWeight: step.complete ? 600 : 500 }}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, margin: 0, color: _.ink }}>
            {isActive ? "Job Budget (from baseline)" : "Estimate Cost Engine"}
          </h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {!isActive && hasItems && (
              <Button size="sm" variant="secondary" onClick={() => navigate("../quote")}>
                Generate Quote
              </Button>
            )}
            {!isActive && (
              <Button size="sm" icon={Plus} onClick={addCategory}>
                {noCategories ? "Add First Category" : "Add Category"}
              </Button>
            )}
          </div>
        </div>
        {isActive && (
          <div style={{ ...BOX, padding: 12, fontSize: 13, color: _.muted }}>
            {baselineDate ? `Baseline locked on ${new Date(baselineDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}` : "Baseline locked"}
          </div>
        )}

        {noCategories && (
          <div style={{ ...BOX, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: _.ink, marginBottom: 8 }}>
              Start building your estimate.
            </div>
            <div style={{ fontSize: 13, color: _.muted, display: "grid", gap: 4 }}>
              <span>Step 1: Add your first category.</span>
              <span>Example categories:</span>
              <span>Site Works</span>
              <span>Framing</span>
              <span>Electrical</span>
              <span>Plumbing</span>
              <span style={{ marginTop: 4 }}>Step 2: Add cost items</span>
              <span>Step 3: Generate quote</span>
            </div>
            {!isActive && (
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button size="sm" icon={Plus} onClick={addCategory}>Add First Category</Button>
                <Button size="sm" variant="secondary" onClick={applyResidentialTemplate}>
                  Residential Build Template
                </Button>
              </div>
            )}
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
              {!isActive && (
                <>
                  <Button size="sm" variant="secondary" icon={Plus} onClick={() => setLibraryModalCategoryId(cat.id)}>
                    Add from Library
                  </Button>
                  <Button size="sm" variant="secondary" icon={Plus} onClick={() => addLineItem(cat.id)}>
                    Add Line Item
                  </Button>
                </>
              )}
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
                          readOnly={isActive}
                          onChange={(e) => updateLineItem(cat.id, item.id, "description", e.target.value)}
                          style={cellInput}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${_.line}` }}>
                        <input
                          type="number"
                          readOnly={isActive}
                          value={item.quantity ?? 0}
                          onChange={(e) => updateLineItem(cat.id, item.id, "quantity", e.target.value)}
                          style={cellInput}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${_.line}` }}>
                        <input
                          value={item.unit || ""}
                          readOnly={isActive}
                          onChange={(e) => updateLineItem(cat.id, item.id, "unit", e.target.value)}
                          style={cellInput}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${_.line}` }}>
                        <input
                          type="number"
                          readOnly={isActive}
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
                          readOnly={isActive}
                          value={item.marginPercent ?? 0}
                          onChange={(e) => updateLineItem(cat.id, item.id, "marginPercent", e.target.value)}
                          style={cellInput}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${_.line}`, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                        {money(item.sellTotal)}
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${_.line}` }}>
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(cat.id, item.id)}
                            style={{ border: "none", background: "transparent", color: _.muted, cursor: "pointer" }}
                            title="Delete line item"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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
        {isActive && (
          <>
            <SummaryRow label="Baseline Total Sell" value={money(baselineSell)} />
            <SummaryRow label="Current Contract Value" value={money(contractValue)} strong />
          </>
        )}
      </aside>

      <Modal
        open={!!libraryModalCategoryId}
        onClose={() => { setLibraryModalCategoryId(""); setLibraryQuery(""); }}
        title="Add Cost Item From Library"
        width={760}
      >
        <SearchInput value={libraryQuery} onChange={setLibraryQuery} placeholder="Search cost library items..." style={{ marginBottom: 10 }} />
        <div style={{ maxHeight: 420, overflowY: "auto", border: `1px solid ${_.line}`, borderRadius: 8 }}>
          {filteredLibraryItems.length === 0 && (
            <div style={{ padding: 12, fontSize: 13, color: _.muted }}>No library items found.</div>
          )}
          {filteredLibraryItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => addFromLibrary(libraryModalCategoryId, item)}
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                background: _.surface,
                borderBottom: `1px solid ${_.line}`,
                padding: "10px 12px",
                cursor: "pointer",
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr 0.7fr 0.7fr",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: _.ink }}>{item.name || "Cost Item"}</div>
                <div style={{ fontSize: 12, color: _.muted }}>{item.description || "No description"}</div>
              </div>
              <span style={{ fontSize: 12, color: _.muted }}>{item.categoryName}</span>
              <span style={{ fontSize: 13, color: _.ink }}>{item.unit}</span>
              <span style={{ textAlign: "right", fontSize: 13, color: _.ink, fontWeight: 600 }}>{money(item.unitCost)}</span>
            </button>
          ))}
        </div>
      </Modal>
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
