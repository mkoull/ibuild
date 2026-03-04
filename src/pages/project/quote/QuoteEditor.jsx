import { useEffect, useState } from "react";
import _ from "../../../theme/tokens.js";
import { fmt } from "../../../theme/styles.js";
import Button from "../../../components/ui/Button.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import useQuoteEditor from "./useQuoteEditor.js";
import CategorySidebar from "./CategorySidebar.jsx";
import RateLibrarySearch from "./RateLibrarySearch.jsx";
import LineItemsTable from "./LineItemsTable.jsx";
import LineItemDrawer from "./LineItemDrawer.jsx";
import QuoteSummaryCard from "./QuoteSummaryCard.jsx";

export default function QuoteEditor({ project, up, T, margin, contingency, mobile, rateLibrary, notify, onNavigate }) {
  const editor = useQuoteEditor({ project, up, margin, rateLibrary, notify });
  const [viewportW, setViewportW] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1280));
  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(true);
  const {
    selectedCat, setSelectedCat,
    newCat, setNewCat,
    librarySearch, setLibrarySearch,
    drawerItem, setDrawerItem,
    deletedItem, undoDelete,
    delCat, setDelCat,
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
  const isDesktop = viewportW >= 1024;
  const isMobileBp = viewportW < 768;
  const compactCategories = !isDesktop;

  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isDesktop) setShowSummarySheet(false);
  }, [isDesktop]);

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
              Summary
            </Button>
          )}
        </div>
      </div>

      {isMobileBp && (
        <div style={{ marginBottom: _.s3 }}>
          <Button size="sm" variant="secondary" onClick={() => setMobileCategoriesOpen((v) => !v)}>
            {mobileCategoriesOpen ? "Hide Categories" : "Show Categories"}
          </Button>
        </div>
      )}

      {/* 3-column desktop / responsive tablet-mobile */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isDesktop
          ? "260px minmax(0,1fr) 340px"
          : isMobileBp
            ? "1fr"
            : "84px minmax(0,1fr)",
        gap: _.s3,
        alignItems: "start",
        maxWidth: "100%",
        overflowX: "hidden",
      }}>
        {/* Left: Category sidebar */}
        {(isDesktop || !isMobileBp || mobileCategoriesOpen) && (
          <CategorySidebar
            scopeCategories={scopeCategories} scope={project.scope}
            selectedCat={selectedCat} setSelectedCat={setSelectedCat}
            newCat={newCat} setNewCat={setNewCat}
            addCategory={addCategory} setDelCat={setDelCat}
            compact={compactCategories}
          />
        )}

        {/* Center: search + table */}
        <div style={{ minWidth: 0, maxWidth: "100%" }}>
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
        {isDesktop && (
          <div style={{ width: 340, minWidth: 340 }}>
            <QuoteSummaryCard T={T} margin={margin} contingency={contingency} mobile={false} sticky onReview={() => onNavigate("review")} />
          </div>
        )}
      </div>

      {/* Step navigation */}
      <div style={{ marginTop: _.s7, display: "flex", gap: _.s3 }}>
        <Button variant="ghost" onClick={() => onNavigate("details")} icon={ArrowLeft}>Details</Button>
        <Button onClick={() => onNavigate("extras")} icon={ArrowRight}>Continue to Extras</Button>
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
