import { useEffect, useState } from "react";
import _ from "../../../theme/tokens.js";
import { fmt } from "../../../theme/styles.js";
import Button from "../../../components/ui/Button.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import { ArrowRight, X, ChevronDown } from "lucide-react";
import useQuoteEditor from "./useQuoteEditor.js";
import CategorySidebar from "./CategorySidebar.jsx";
import RateLibrarySearch from "./RateLibrarySearch.jsx";
import LineItemsTable from "./LineItemsTable.jsx";
import QuoteSummaryCard from "./QuoteSummaryCard.jsx";

export default function QuoteEditor({ project, up, T, margin, contingency, mobile, rateLibrary, notify, onNavigate }) {
  const editor = useQuoteEditor({ project, up, margin, rateLibrary, notify });
  const [viewportW, setViewportW] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1280));
  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [editModalItem, setEditModalItem] = useState(null);
  const {
    selectedCat, setSelectedCat,
    newCat, setNewCat,
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
  const items = selectedCat ? (safeScope[selectedCat] || []) : [];
  const isDesktop = viewportW >= 1200;
  const isTablet = viewportW >= 900 && viewportW < 1200;
  const isMobileBp = viewportW < 900;
  const compactCategories = viewportW < 1180;

  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isDesktop) setShowSummarySheet(false);
  }, [isDesktop]);

  // Toggle accordion: open a category (close others on tablet/mobile)
  const toggleAccordion = (cat) => {
    setSelectedCat((prev) => prev === cat ? "" : cat);
  };

  // Accordion view for tablet/mobile (and also used in desktop alongside sidebar)
  const renderAccordion = () => (
    <div>
      {scopeCategories.length === 0 && (
        <div style={{ padding: "28px 12px", textAlign: "center", color: _.muted }}>
          No scope items yet. Add a category to start pricing.
        </div>
      )}
      {scopeCategories.map((cat) => {
        const catItems = safeScope[cat] || [];
        const activeItems = catItems.filter((i) => i.on);
        const catTotal = activeItems.reduce((t, i) => t + i.rate * i.qty, 0);
        const isOpen = selectedCat === cat;
        return (
          <div key={cat} style={{ marginBottom: 8 }}>
            {/* Accordion header */}
            <div
              onClick={() => toggleAccordion(cat)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", cursor: "pointer",
                background: isOpen ? `${_.ac}08` : _.well,
                border: `1px solid ${isOpen ? `${_.ac}33` : _.line}`,
                borderRadius: isOpen ? `${_.rSm}px ${_.rSm}px 0 0` : _.rSm,
                minHeight: 52,
                transition: `all 0.15s ease`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                <ChevronDown size={14} color={_.muted} style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }} />
                <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>{cat}</span>
                <span style={{ fontSize: _.fontSize.sm, color: _.muted }}>({catItems.length} items)</span>
              </div>
              <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, fontVariantNumeric: "tabular-nums" }}>
                {fmt(catTotal)}
              </span>
            </div>
            {/* Accordion body */}
            {isOpen && (
              <div style={{
                border: `1px solid ${_.ac}33`,
                borderTop: "none",
                borderRadius: `0 0 ${_.rSm}px ${_.rSm}px`,
                padding: "8px 0",
              }}>
                <div style={{ padding: "0 12px" }}>
                  <RateLibrarySearch
                    librarySearch={librarySearch}
                    setLibrarySearch={setLibrarySearch}
                    libraryMatches={libraryMatches}
                    addFromLibrary={addFromLibrary}
                    disabled={!selectedCat}
                  />
                </div>
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
  );

  return (
    <div style={{ overflowX: "hidden", maxWidth: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: _.s3 }}>
          <div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, color: _.ink }}>Quote Editor</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
          {T.items > 0 && <span style={{ fontSize: _.fontSize.md, color: _.body }}>{T.items} items · {fmt(T.sub)}</span>}
          {!isDesktop && (
            <Button size="sm" variant="secondary" onClick={() => setShowSummarySheet(true)} aria-label="Open quote summary">
              {isMobileBp ? "View Summary" : "Summary"}
            </Button>
          )}
        </div>
      </div>

      {isMobileBp && (
        <div style={{ display: "flex", gap: _.s2, alignItems: "center", marginBottom: _.s3 }}>
          <Button size="sm" variant="secondary" onClick={() => setShowCategorySheet(true)}>
            Categories
          </Button>
          <div style={{ flex: 1, fontSize: _.fontSize.sm, color: _.muted, textAlign: "right" }}>
            {scopeCategories.length} categories
          </div>
        </div>
      )}

      {/* Desktop: sidebar + accordion + summary | Tablet/Mobile: accordion only */}
      {isDesktop ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "220px minmax(0,1fr) 340px",
          gap: _.s3,
          alignItems: "start",
          maxWidth: "100%",
          overflowX: "hidden",
        }}>
          <CategorySidebar
            scopeCategories={scopeCategories}
            scope={safeScope}
            selectedCat={selectedCat}
            setSelectedCat={setSelectedCat}
            newCat={newCat}
            setNewCat={setNewCat}
            addCategory={addCategory}
            setDelCat={setDelCat}
            compact={compactCategories}
          />
          <div style={{ minWidth: 0, maxWidth: "100%" }}>
            {renderAccordion()}
          </div>
          <div style={{ minWidth: 340 }}>
            <QuoteSummaryCard T={T} margin={margin} contingency={contingency} mobile={false} sticky onReview={() => onNavigate("review")} />
          </div>
        </div>
      ) : (
        <div style={{ minWidth: 0, maxWidth: "100%" }}>
          {renderAccordion()}
        </div>
      )}

      {/* Undo toast */}
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

      {/* Responsive summary drawer/sheet */}
      {!isDesktop && showSummarySheet && (
        <>
          <div onClick={() => setShowSummarySheet(false)} style={{ position: "fixed", inset: 0, background: _.overlay, zIndex: 70 }} />
          <div style={{
            position: "fixed",
            zIndex: 71,
            background: _.surface,
            boxShadow: _.sh3,
            ...(isMobileBp
              ? { left: 0, right: 0, bottom: "var(--mobile-bottom-total)", borderTopLeftRadius: _.r, borderTopRightRadius: _.r, maxHeight: "72vh", overflowY: "auto", padding: 12 }
              : { top: 0, right: 0, bottom: 0, width: 360, borderLeft: `1px solid ${_.line}`, padding: 12, overflowY: "auto" }),
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s2 }}>
              <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>Quote Summary</div>
              <button type="button" onClick={() => setShowSummarySheet(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: _.muted }}>
                <X size={16} />
              </button>
            </div>
            <QuoteSummaryCard T={T} margin={margin} contingency={contingency} mobile={false} sticky={false} onReview={() => { setShowSummarySheet(false); onNavigate("review"); }} />
          </div>
        </>
      )}

      {/* Mobile category drawer */}
      {isMobileBp && showCategorySheet && (
        <CategorySidebar
          scopeCategories={scopeCategories}
          scope={safeScope}
          selectedCat={selectedCat}
          setSelectedCat={setSelectedCat}
          newCat={newCat}
          setNewCat={setNewCat}
          addCategory={addCategory}
          setDelCat={setDelCat}
          asSlideover
          onClose={() => setShowCategorySheet(false)}
        />
      )}

      {/* Edit line item modal */}
      <Modal open={!!editModalItem} onClose={() => setEditModalItem(null)} title="Edit line item" width={720}>
        {editModalItem && (() => {
          const editItems = safeScope[editModalItem.cat] || [];
          const editItem = editItems[editModalItem.idx];
          if (!editItem) return null;
          return (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>
                Edit details for this line item.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input style={{ minHeight: 44, border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: "0 10px", fontFamily: "inherit" }} value={editItem.item || ""} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "item", e.target.value)} placeholder="Description" />
                <select style={{ minHeight: 44, border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: "0 10px", fontFamily: "inherit" }} value={editItem.type || "Labour"} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "type", e.target.value)}>
                  <option>Labour</option>
                  <option>Material</option>
                  <option>Subcontract</option>
                  <option>Plant</option>
                  <option>Other</option>
                </select>
                <input type="number" style={{ minHeight: 44, border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: "0 10px", fontFamily: "inherit" }} value={editItem.qty || 0} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "qty", Number(e.target.value) || 0)} placeholder="Qty" />
                <select style={{ minHeight: 44, border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: "0 10px", fontFamily: "inherit" }} value={editItem.unit || "ea"} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "unit", e.target.value)}>
                  <option>ea</option><option>m</option><option>m²</option><option>m³</option><option>hr</option><option>day</option><option>lm</option><option>item</option><option>lot</option><option>kg</option><option>t</option>
                </select>
                <input type="number" style={{ minHeight: 44, border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: "0 10px", fontFamily: "inherit" }} value={editItem.rate || 0} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "rate", Number(e.target.value) || 0)} placeholder="Rate" />
                <input type="number" style={{ minHeight: 44, border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: "0 10px", fontFamily: "inherit" }} value={editItem.marginPct ?? margin} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "marginPct", Number(e.target.value) || 0)} placeholder="Margin %" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: _.muted, display: "block", marginBottom: 4 }}>Notes</label>
                <textarea style={{ width: "100%", minHeight: 60, border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: 10, fontFamily: "inherit", fontSize: 14, resize: "vertical" }} value={editItem.notes || ""} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "notes", e.target.value)} placeholder="Item notes…" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: _.muted, display: "block", marginBottom: 4 }}>Supplier</label>
                <input style={{ width: "100%", minHeight: 44, border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: "0 10px", fontFamily: "inherit" }} value={editItem.supplier || ""} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "supplier", e.target.value)} placeholder="Supplier name…" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Button variant="ghost" onClick={() => setEditModalItem(null)}>Close</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Delete category modal */}
      <Modal open={!!delCat} onClose={() => setDelCat(null)} title="Delete Category" width={400}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, marginBottom: 24 }}>Delete <strong>{delCat}</strong> and all its items?</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDelCat(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteCategory(delCat)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
