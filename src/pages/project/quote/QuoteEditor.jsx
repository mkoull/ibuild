import { useEffect, useState } from "react";
import _ from "../../../theme/tokens.js";
import { fmt, input } from "../../../theme/styles.js";
import Button from "../../../components/ui/Button.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import { Plus, Trash2, X } from "lucide-react";
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

  const selectTab = (cat) => {
    setSelectedCat(cat);
    setLibrarySearch("");
  };

  const handleAddCategory = () => {
    const name = addCatInput.trim();
    if (!name) return;
    addCategory(name);
    setAddCatInput("");
    setShowAddCat(false);
  };

  const catItems = safeScope[selectedCat] || [];
  const activeItems = catItems.filter((i) => i.on);
  const catSell = activeItems.reduce((t, i) => t + getRowSell(i), 0);

  return (
    <div>
      {/* ═══ 2-column layout ═══ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isDesktop ? "1fr 320px" : "1fr",
        gap: 28,
        alignItems: "start",
      }}>
        {/* ═══ Main column ═══ */}
        <div>
          {/* ── Tab bar ── */}
          <div style={{
            display: "flex", alignItems: "stretch",
            borderBottom: `2px solid ${_.line}`,
            marginBottom: 0,
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}>
            {scopeCategories.map((cat) => {
              const active = selectedCat === cat;
              const items = safeScope[cat] || [];
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => selectTab(cat)}
                  style={{
                    padding: "12px 18px",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? _.ink : _.muted,
                    background: "none",
                    border: "none",
                    borderBottom: active ? `2px solid ${_.ac}` : "2px solid transparent",
                    marginBottom: -2,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily: "inherit",
                    transition: "color 0.1s, border-color 0.1s",
                    minHeight: 44,
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = _.body; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = _.muted; }}
                >
                  {cat}
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: active ? _.ac : _.faint,
                    background: active ? `${_.ac}10` : `${_.line}80`,
                    padding: "1px 6px", borderRadius: 99,
                    lineHeight: "16px",
                  }}>
                    {items.length}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setShowAddCat(true)}
              style={{
                padding: "12px 14px",
                background: "none", border: "none",
                borderBottom: "2px solid transparent",
                marginBottom: -2,
                cursor: "pointer", color: _.muted,
                display: "flex", alignItems: "center",
                minHeight: 44,
                transition: "color 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = _.ac; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = _.muted; }}
              title="Add category"
            >
              <Plus size={15} />
            </button>

            {/* Push summary button to right on non-desktop */}
            {!isDesktop && (
              <>
                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  onClick={() => setShowSummarySheet(true)}
                  style={{
                    padding: "8px 14px",
                    background: "none", border: "none",
                    borderBottom: "2px solid transparent",
                    marginBottom: -2,
                    cursor: "pointer",
                    fontSize: 14, fontWeight: 700, color: _.ink,
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                    fontFamily: "inherit",
                    minHeight: 44,
                  }}
                >
                  {fmt(T.curr)}
                </button>
              </>
            )}
          </div>

          {/* ── Category content ── */}
          {scopeCategories.length === 0 ? (
            /* Empty state */
            <div style={{
              padding: "60px 24px", textAlign: "center",
              borderRadius: 10,
              marginTop: 24,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: `${_.ac}10`, display: "flex",
                alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <Plus size={24} color={_.ac} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: _.ink, marginBottom: 6 }}>
                Start building your quote
              </div>
              <div style={{ fontSize: 14, color: _.muted, marginBottom: 20, lineHeight: 1.5 }}>
                Add your first category to begin adding line items.
              </div>
              <Button onClick={() => setShowAddCat(true)} icon={Plus}>Add Category</Button>
            </div>
          ) : selectedCat ? (
            <div style={{ paddingTop: 20 }}>
              {/* Category header */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-end",
                marginBottom: 16, paddingBottom: 14,
                borderBottom: `1px solid ${_.line}`,
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{
                      fontSize: 20, fontWeight: 700, color: _.ink,
                      margin: 0, letterSpacing: _.letterSpacing.tight,
                    }}>{selectedCat}</h2>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: _.ac,
                      background: `${_.ac}10`, padding: "3px 10px",
                      borderRadius: 99,
                    }}>
                      {catItems.length} {catItems.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: 10, color: _.muted, textTransform: "uppercase",
                      letterSpacing: "0.06em", fontWeight: 600, marginBottom: 2,
                    }}>Category Total</div>
                    <div style={{
                      fontSize: 24, fontWeight: 700, color: catSell > 0 ? _.ink : _.faint,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: _.letterSpacing.tight, lineHeight: 1,
                    }}>{fmt(catSell)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDelCat(selectedCat)}
                    style={{
                      background: "none", border: `1px solid ${_.line}`,
                      borderRadius: 6, cursor: "pointer", padding: 8,
                      color: _.muted, display: "flex",
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = _.red; e.currentTarget.style.color = _.red; e.currentTarget.style.background = `${_.red}06`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = _.line; e.currentTarget.style.color = _.muted; e.currentTarget.style.background = "none"; }}
                    title="Delete category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Rate library search */}
              <RateLibrarySearch
                librarySearch={librarySearch}
                setLibrarySearch={setLibrarySearch}
                libraryMatches={libraryMatches}
                addFromLibrary={addFromLibrary}
                disabled={false}
              />

              {/* Items table */}
              <LineItemsTable
                items={catItems}
                cat={selectedCat}
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
          ) : null}
        </div>

        {/* ═══ Desktop: Sticky summary ═══ */}
        {isDesktop && (
          <div style={{ position: "sticky", top: 16, marginTop: 48 }}>
            <QuoteSummaryCard T={T} margin={margin} contingency={contingency} mobile={false} sticky={false} onReview={() => onNavigate("review")} />
          </div>
        )}
      </div>

      {/* ── Undo toast ── */}
      {deletedItem && (
        <div style={{
          position: "fixed", bottom: mobile ? 80 : 24, left: "50%", transform: "translateX(-50%)",
          background: _.ink, color: "#fff", padding: "10px 20px", borderRadius: _.rFull,
          boxShadow: _.sh3, zIndex: 100, display: "flex", alignItems: "center", gap: 12,
          fontSize: 13, animation: "fadeIn 0.15s ease",
        }}>
          <span>Item deleted</span>
          <button type="button" onClick={undoDelete}
            style={{
              background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
              cursor: "pointer", padding: "5px 14px", borderRadius: _.rSm,
              fontWeight: 600, fontSize: 12, fontFamily: "inherit",
            }}>
            Undo
          </button>
        </div>
      )}

      {/* ── Summary sheet (tablet/mobile) ── */}
      {!isDesktop && showSummarySheet && (
        <>
          <div onClick={() => setShowSummarySheet(false)} style={{ position: "fixed", inset: 0, background: _.overlay, zIndex: 70 }} />
          <div style={{
            position: "fixed", zIndex: 71, background: _.surface, boxShadow: _.shadowElevated,
            ...(isMobileBp
              ? { left: 0, right: 0, bottom: 0, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "72vh", overflowY: "auto", padding: "20px 24px" }
              : { top: 0, right: 0, bottom: 0, width: 380, borderLeft: `1px solid ${_.line}`, padding: 24, overflowY: "auto" }),
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: _.ink }}>Quote Summary</div>
              <button type="button" onClick={() => setShowSummarySheet(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: _.muted, display: "flex" }}>
                <X size={18} />
              </button>
            </div>
            <QuoteSummaryCard T={T} margin={margin} contingency={contingency} mobile={false} sticky={false}
              onReview={() => { setShowSummarySheet(false); onNavigate("review"); }} />
          </div>
        </>
      )}

      {/* ── Add category modal ── */}
      <Modal open={showAddCat} onClose={() => { setShowAddCat(false); setAddCatInput(""); }} title="Add Category" width={420}>
        <div style={{ marginBottom: 16 }}>
          <input
            autoFocus
            style={{ ...input, width: "100%", minHeight: 48, fontSize: 15 }}
            value={addCatInput}
            onChange={(e) => setAddCatInput(e.target.value)}
            placeholder="e.g. Concrete, Framing, Electrical"
            onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => { setShowAddCat(false); setAddCatInput(""); }}>Cancel</Button>
          <Button onClick={handleAddCategory} icon={Plus}>Add</Button>
        </div>
      </Modal>

      {/* ── Edit line item modal ── */}
      <Modal open={!!editModalItem} onClose={() => setEditModalItem(null)} title="Edit Line Item" width={540}>
        {editModalItem && (() => {
          const editItems = safeScope[editModalItem.cat] || [];
          const editItem = editItems[editModalItem.idx];
          if (!editItem) return null;
          return (
            <div style={{ display: "grid", gap: 16 }}>
              <Field label="Description">
                <input style={mInput} value={editItem.item || ""} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "item", e.target.value)} placeholder="Description" />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Type">
                  <select style={mInput} value={editItem.type || "Labour"} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "type", e.target.value)}>
                    <option>Labour</option><option>Material</option><option>Subcontract</option><option>Plant</option><option>Other</option>
                  </select>
                </Field>
                <Field label="Unit">
                  <select style={mInput} value={editItem.unit || "ea"} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "unit", e.target.value)}>
                    <option>ea</option><option>m</option><option>m²</option><option>m³</option><option>hr</option><option>day</option><option>lm</option><option>item</option><option>lot</option><option>kg</option><option>t</option>
                  </select>
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Field label="Qty">
                  <input type="number" style={mInput} value={editItem.qty || 0} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "qty", Number(e.target.value) || 0)} />
                </Field>
                <Field label="Rate">
                  <input type="number" style={mInput} value={editItem.rate || 0} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "rate", Number(e.target.value) || 0)} />
                </Field>
                <Field label="Margin %">
                  <input type="number" style={mInput} value={editItem.marginPct ?? margin} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "marginPct", Number(e.target.value) || 0)} />
                </Field>
              </div>
              <Field label="Notes">
                <textarea style={{ ...mInput, minHeight: 72, resize: "vertical", padding: "10px 12px" }} value={editItem.notes || ""} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "notes", e.target.value)} placeholder="Item notes…" />
              </Field>
              <Field label="Supplier">
                <input style={mInput} value={editItem.supplier || ""} onChange={(e) => uI(editModalItem.cat, editModalItem.idx, "supplier", e.target.value)} placeholder="Supplier name…" />
              </Field>
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
                <Button onClick={() => setEditModalItem(null)}>Done</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Delete category modal ── */}
      <Modal open={!!delCat} onClose={() => setDelCat(null)} title="Delete Category" width={420}>
        <div style={{ fontSize: 14, color: _.body, marginBottom: 20, lineHeight: 1.5 }}>
          Delete <strong>{delCat}</strong> and all its line items?
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDelCat(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteCategory(delCat)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 600,
        color: _.muted, marginBottom: 5,
        textTransform: "uppercase", letterSpacing: "0.04em",
      }}>{label}</label>
      {children}
    </div>
  );
}

const mInput = {
  width: "100%", minHeight: 46,
  border: `1px solid ${_.line}`, borderRadius: 6,
  padding: "0 12px", fontFamily: "inherit", fontSize: 14,
  background: _.well, color: _.ink, outline: "none",
  transition: "border-color 0.12s",
};
