import _ from "../../../theme/tokens.js";
import { fmt } from "../../../theme/styles.js";
import Button from "../../../components/ui/Button.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import { ArrowLeft, ArrowRight, Menu } from "lucide-react";
import useQuoteEditor from "./useQuoteEditor.js";
import CategorySidebar from "./CategorySidebar.jsx";
import RateLibrarySearch from "./RateLibrarySearch.jsx";
import LineItemsTable from "./LineItemsTable.jsx";
import LineItemDrawer from "./LineItemDrawer.jsx";
import QuoteSummaryCard from "./QuoteSummaryCard.jsx";

export default function QuoteEditor({ project, up, T, margin, contingency, mobile, rateLibrary, notify, onNavigate }) {
  const editor = useQuoteEditor({ project, up, margin, rateLibrary, notify });
  const {
    selectedCat, setSelectedCat,
    newCat, setNewCat,
    librarySearch, setLibrarySearch,
    drawerItem, setDrawerItem,
    deletedItem, undoDelete,
    delCat, setDelCat,
    mobileSidebar, setMobileSidebar,
    rowMenu, setRowMenu,
    descInputRefs, scopeCategories,
    uI, addLineItem, delI,
    getRowMargin, getRowSell,
    duplicateItem, moveItemUp, moveItemDown, moveItemToCategory,
    addCategory, deleteCategory,
    libraryMatches, addFromLibrary,
    filesToDataUrls,
  } = editor;

  const items = selectedCat ? (project.scope[selectedCat] || []) : [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: _.s3 }}>
          {mobile && (
            <button type="button" onClick={() => setMobileSidebar(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: _.body, display: "flex", minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
              <Menu size={18} />
            </button>
          )}
          <div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, color: _.ink }}>Quote Editor</div>
        </div>
        {T.items > 0 && <span style={{ fontSize: _.fontSize.md, color: _.body }}>{T.items} items · {fmt(T.sub)}</span>}
      </div>

      {/* Mobile summary card */}
      {mobile && <QuoteSummaryCard T={T} margin={margin} contingency={contingency} mobile={mobile} />}

      {/* 3-column desktop / single column mobile */}
      <div style={{
        display: "grid",
        gridTemplateColumns: mobile ? "1fr" : "220px minmax(0,1fr) 260px",
        gap: _.s3,
        alignItems: "start",
      }}>
        {/* Left: Category sidebar (desktop only; mobile uses slideover) */}
        {!mobile && (
          <CategorySidebar
            scopeCategories={scopeCategories} scope={project.scope}
            selectedCat={selectedCat} setSelectedCat={setSelectedCat}
            newCat={newCat} setNewCat={setNewCat}
            addCategory={addCategory} setDelCat={setDelCat}
          />
        )}

        {/* Center: search + table */}
        <div>
          {selectedCat ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s2 }}>
                <div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.semi, color: _.ink }}>{selectedCat}</div>
              </div>
              <RateLibrarySearch
                librarySearch={librarySearch} setLibrarySearch={setLibrarySearch}
                libraryMatches={libraryMatches} addFromLibrary={addFromLibrary}
                disabled={!selectedCat}
              />
              <LineItemsTable
                items={items} cat={selectedCat} descInputRefs={descInputRefs}
                uI={uI} getRowMargin={getRowMargin} getRowSell={getRowSell}
                addLineItem={addLineItem} delI={delI}
                duplicateItem={duplicateItem} moveItemUp={moveItemUp} moveItemDown={moveItemDown}
                moveItemToCategory={moveItemToCategory}
                setDrawerItem={setDrawerItem} scopeCategories={scopeCategories}
                rowMenu={rowMenu} setRowMenu={setRowMenu} mobile={mobile}
              />
            </>
          ) : (
            <div style={{ padding: "28px 12px", textAlign: "center", color: _.muted }}>
              {scopeCategories.length === 0
                ? "Add a category to start building your quote."
                : "Select a category to start adding line items."
              }
            </div>
          )}
        </div>

        {/* Right: Quote summary (desktop) */}
        {!mobile && (
          <QuoteSummaryCard T={T} margin={margin} contingency={contingency} mobile={false} onReview={() => onNavigate("review")} />
        )}
      </div>

      {/* Step navigation */}
      <div style={{ marginTop: _.s7, display: "flex", gap: _.s3 }}>
        <Button variant="ghost" onClick={() => onNavigate("details")} icon={ArrowLeft}>Details</Button>
        <Button onClick={() => onNavigate("extras")} icon={ArrowRight}>Continue to Extras</Button>
      </div>

      {/* Fixed bottom totals bar */}
      <div style={{
        position: "fixed",
        bottom: mobile ? "var(--mobile-bottom-total)" : 0,
        left: 0, right: 0,
        background: _.surface, borderTop: `1px solid ${_.line}`,
        padding: mobile ? "10px 16px" : "10px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.06)", zIndex: 45,
      }}>
        <div style={{ display: "flex", gap: mobile ? _.s3 : _.s6, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi }}>Total Sell</div>
            <div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</div>
          </div>
          <div>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi }}>Margin %</div>
            <div style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi }}>{Number(margin || 0).toFixed(2)}%</div>
          </div>
          <div>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi }}>GST</div>
            <div style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums" }}>{fmt(T.gst)}</div>
          </div>
        </div>
        <Button size="sm" onClick={() => onNavigate("review")} icon={ArrowRight}>Review Quote</Button>
      </div>

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

      {/* Mobile category sidebar (slideover) */}
      {mobile && mobileSidebar && (
        <CategorySidebar
          asSlideover onClose={() => setMobileSidebar(false)}
          scopeCategories={scopeCategories} scope={project.scope}
          selectedCat={selectedCat} setSelectedCat={setSelectedCat}
          newCat={newCat} setNewCat={setNewCat}
          addCategory={addCategory} setDelCat={setDelCat}
        />
      )}

      {/* Line item drawer */}
      <LineItemDrawer
        open={!!drawerItem}
        onClose={() => setDrawerItem(null)}
        project={project}
        cat={drawerItem?.cat}
        idx={drawerItem?.idx}
        uI={uI} delI={delI}
        filesToDataUrls={filesToDataUrls} up={up}
      />

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
