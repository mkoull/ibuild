import { useEffect, useState } from "react";
import _ from "../../../theme/tokens.js";
import { fmt, input } from "../../../theme/styles.js";
import Button from "../../../components/ui/Button.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import { ArrowRight, X, ChevronDown, Plus, Trash2 } from "lucide-react";
import useQuoteEditor from "./useQuoteEditor.js";
import RateLibrarySearch from "./RateLibrarySearch.jsx";
import LineItemsTable from "./LineItemsTable.jsx";
import QuoteSummaryCard from "./QuoteSummaryCard.jsx";

export default function QuoteEditor({ project, up, T, margin, contingency, mobile, rateLibrary, notify, onNavigate }) {
  const editor = useQuoteEditor({ project, up, margin, rateLibrary, notify });
  const [viewportW, setViewportW] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1280));
  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [editModalItem, setEditModalItem] = useState(null);
  const [addCatInput, setAddCatInput] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const {
    selectedCat, setSelectedCat,
    librarySearch, setLibrarySearch,
    deletedItem, undoDelete,
    delCat, setDelCat,
    tableScrollMemoryRef,
    descInputRefs, scopeCategories,
    uI, addLineItem, delI,
    getRowMargin, getRowSell,
    duplicateItem,
    addCategory, deleteCategory,
    libraryMatches, addFromLibrary,
  } = editor;

  const safeScope = project?.scope && typeof project.scope === "object" ? project.scope : {};
  const isDesktop = viewportW >= 1200;
  const isMobileBp = viewportW < 900;

  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isDesktop) setShowSummarySheet(false);
  }, [isDesktop]);

  const toggleAccordion = (cat) => {
    setSelectedCat((prev) => prev === cat ? "" : cat);
    setLibrarySearch("");
  };

  const handleAddCategory = () => {
    const name = addCatInput.trim();
    if (!name) return;
    addCategory(name);
    setAddCatInput("");
    setShowAddCat(false);
  };

  return (
    <div>
      {/* ─── Layout: accordion (main) + summary (desktop right) ─── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isDesktop ? "1fr 300px" : "1fr",
        gap: 24,
        alignItems: "start",
      }}>
        {/* ─── Main: Accordion categories ─── */}
        <div>
          {/* Header bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>
              {scopeCategories.length} categories · {T.items} items
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {!isDesktop && (
                <Button size="sm" variant="secondary" onClick={() => setShowSummarySheet(true)}>
                  Summary
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setShowAddCat(true)} icon={Plus}>
                Category
              </Button>
            </div>
          </div>

          {/* Empty state */}
          {scopeCategories.length === 0 && (
            <div style={{
              padding: "40px 20px", textAlign: "center",
              border: `2px dashed ${_.line2}`, borderRadius: _.rSm,
              color: _.muted, fontSize: _.fontSize.md,
            }}>
              <div style={{ marginBottom: 12 }}>No categories yet.</div>
              <Button size="sm" onClick={() => setShowAddCat(true)} icon={Plus}>Add Category</Button>
            </div>
          )}

          {/* Accordions */}
          {scopeCategories.map((cat) => {
            const catItems = safeScope[cat] || [];
            const activeItems = catItems.filter((i) => i.on);
            const catTotal = activeItems.reduce((t, i) => t + i.rate * i.qty, 0);
            const isOpen = selectedCat === cat;
            return (
              <div key={cat} style={{ marginBottom: 6 }}>
                {/* Header */}
                <button
                  type="button"
                  onClick={() => toggleAccordion(cat)}
                  style={{
                    width: "100%", textAlign: "left",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px", cursor: "pointer",
                    background: isOpen ? _.surface : _.well,
                    border: isOpen ? `1.5px solid ${_.ac}44` : `1px solid ${_.line}`,
                    borderRadius: isOpen ? `8px 8px 0 0` : 8,
                    fontFamily: "inherit",
                    transition: "all 0.12s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ChevronDown size={14} color={isOpen ? _.ac : _.muted} style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.12s" }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: _.ink }}>{cat}</span>
                    <span style={{ fontSize: 12, color: _.muted, fontWeight: 400 }}>
                      {catItems.length} {catItems.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: catTotal > 0 ? _.ink : _.muted, fontVariantNumeric: "tabular-nums" }}>
                      {fmt(catTotal)}
                    </span>
                    <div
                      onClick={(e) => { e.stopPropagation(); setDelCat(cat); }}
                      style={{ padding: 4, color: _.faint, cursor: "pointer", display: "flex" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = _.red; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = _.faint; }}
                    >
                      <Trash2 size={13} />
                    </div>
                  </div>
                </button>

                {/* Body */}
                {isOpen && (
                  <div style={{
                    border: `1.5px solid ${_.ac}44`,
                    borderTop: "none",
                    borderRadius: "0 0 8px 8px",
                    background: _.surface,
                    padding: "12px 14px 8px",
                    position: "relative",
                    zIndex: 2,
                  }}>
                    <RateLibrarySearch
                      librarySearch={librarySearch}
                      setLibrarySearch={setLibrarySearch}
                      libraryMatches={libraryMatches}
                      addFromLibrary={addFromLibrary}
                      disabled={false}
                    />
                    <LineItemsTable
                      items={catItems}
                      cat={cat}
                      descInputRefs={descInputRefs}
                      uI={uI}
                      getRowMargin={getRowMargin}
                      getRowSell={getRowSell}
                      addLineItem={addLineItem}
                      delI={delI}
                      duplicateItem={duplicateItem}
                      setDrawerItem={setEditModalItem}
                      tableScrollMemoryRef={tableScrollMemoryRef}
                      mobile={isMobileBp}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ─── Desktop: Sticky summary ─── */}
        {isDesktop && (
          <div style={{ position: "sticky", top: 0 }}>
            <QuoteSummaryCard T={T} margin={margin} contingency={contingency} mobile={false} sticky={false} onReview={() => onNavigate("review")} />
          </div>
        )}
      </div>

      {/* ─── Undo toast ─── */}
      {deletedItem && (
        <div style={{
          position: "fixed", bottom: mobile ? 80 : 60, left: "50%", transform: "translateX(-50%)",
          background: _.ink, color: "#fff", padding: "10px 20px", borderRadius: _.rFull,
          boxShadow: _.sh3, zIndex: 60, display: "flex", alignItems: "center", gap: 12,
          fontSize: _.fontSize.base, animation: "fadeIn 0.15s ease",
        }}>
          <span>Item deleted</span>
          <button type="button" onClick={undoDelete}
            style={{ background: "none", border: `1px solid rgba(255,255,255,0.3)`, color: "#fff", cursor: "pointer", padding: "4px 12px", borderRadius: _.rSm, fontWeight: _.fontWeight.semi, fontSize: _.fontSize.sm, fontFamily: "inherit" }}>
            Undo
          </button>
        </div>
      )}

      {/* ─── Summary sheet (tablet/mobile) ─── */}
      {!isDesktop && showSummarySheet && (
        <>
          <div onClick={() => setShowSummarySheet(false)} style={{ position: "fixed", inset: 0, background: _.overlay, zIndex: 70 }} />
          <div style={{
            position: "fixed", zIndex: 71, background: _.surface, boxShadow: _.sh3,
            ...(isMobileBp
              ? { left: 0, right: 0, bottom: 0, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "72vh", overflowY: "auto", padding: "16px 20px" }
              : { top: 0, right: 0, bottom: 0, width: 360, borderLeft: `1px solid ${_.line}`, padding: 16, overflowY: "auto" }),
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: _.ink }}>Quote Summary</div>
              <button type="button" onClick={() => setShowSummarySheet(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: _.muted }}>
                <X size={16} />
              </button>
            </div>
            <QuoteSummaryCard T={T} margin={margin} contingency={contingency} mobile={false} sticky={false} onReview={() => { setShowSummarySheet(false); onNavigate("review"); }} />
          </div>
        </>
      )}

      {/* ─── Add category modal ─── */}
      <Modal open={showAddCat} onClose={() => { setShowAddCat(false); setAddCatInput(""); }} title="Add Category" width={400}>
        <div style={{ marginBottom: 16 }}>
          <input
            autoFocus
            style={{ ...input, width: "100%", minHeight: 44 }}
            value={addCatInput}
            onChange={(e) => setAddCatInput(e.target.value)}
            placeholder="Category name (e.g. Concrete, Framing)"
            onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => { setShowAddCat(false); setAddCatInput(""); }}>Cancel</Button>
          <Button onClick={handleAddCategory} icon={Plus}>Add</Button>
        </div>
      </Modal>

      {/* ─── Edit line item modal ─── */}
      <Modal open={!!editModalItem} onClose={() => setEditModalItem(null)} title="Edit Line Item" width={520}>
        {editModalItem && (() => {
          const editItems = safeScope[editModalItem.cat] || [];
          const editItem = editItems[editModalItem.idx];
          if (!editItem) return null;
          return (
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={modalLabel}>Description</label>
                <input style={modalInput} value={editItem.item || ""} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "item", e.target.value)} placeholder="Description" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={modalLabel}>Type</label>
                  <select style={modalInput} value={editItem.type || "Labour"} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "type", e.target.value)}>
                    <option>Labour</option><option>Material</option><option>Subcontract</option><option>Plant</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={modalLabel}>Unit</label>
                  <select style={modalInput} value={editItem.unit || "ea"} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "unit", e.target.value)}>
                    <option>ea</option><option>m</option><option>m²</option><option>m³</option><option>hr</option><option>day</option><option>lm</option><option>item</option><option>lot</option><option>kg</option><option>t</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={modalLabel}>Qty</label>
                  <input type="number" style={modalInput} value={editItem.qty || 0} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "qty", Number(e.target.value) || 0)} />
                </div>
                <div>
                  <label style={modalLabel}>Rate</label>
                  <input type="number" style={modalInput} value={editItem.rate || 0} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "rate", Number(e.target.value) || 0)} />
                </div>
                <div>
                  <label style={modalLabel}>Margin %</label>
                  <input type="number" style={modalInput} value={editItem.marginPct ?? margin} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "marginPct", Number(e.target.value) || 0)} />
                </div>
              </div>
              <div>
                <label style={modalLabel}>Notes</label>
                <textarea style={{ ...modalInput, minHeight: 60, resize: "vertical", padding: 10 }} value={editItem.notes || ""} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "notes", e.target.value)} placeholder="Item notes…" />
              </div>
              <div>
                <label style={modalLabel}>Supplier</label>
                <input style={modalInput} value={editItem.supplier || ""} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "supplier", e.target.value)} placeholder="Supplier name…" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={() => setEditModalItem(null)}>Done</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ─── Delete category modal ─── */}
      <Modal open={!!delCat} onClose={() => setDelCat(null)} title="Delete Category" width={400}>
        <div style={{ fontSize: 14, color: _.body, marginBottom: 20 }}>
          Delete <strong>{delCat}</strong> and all its line items? This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDelCat(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteCategory(delCat)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

const modalLabel = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: _.muted, marginBottom: 4,
  textTransform: "uppercase", letterSpacing: "0.04em",
};

const modalInput = {
  width: "100%", minHeight: 44,
  border: `1px solid ${_.line}`, borderRadius: 6,
  padding: "0 10px", fontFamily: "inherit", fontSize: 14,
  background: _.well, color: _.ink,
};
