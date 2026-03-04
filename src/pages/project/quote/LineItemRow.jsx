import { memo, useState, useRef, useEffect } from "react";
import _ from "../../../theme/tokens.js";
import { fmt, input } from "../../../theme/styles.js";
import { toPositiveNumber } from "../../../lib/validation.js";
import { LINE_ITEM_TYPES, UNIT_OPTIONS } from "./constants.js";
import { MoreHorizontal, Copy, ArrowUp, ArrowDown, FolderInput, Trash2, FileText } from "lucide-react";

const cellInput = {
  ...input,
  padding: "6px 8px",
  fontSize: _.fontSize.sm,
  minHeight: 32,
};

function LineItemRow({
  item, cat, idx, descRef, uI, getRowMargin, getRowSell,
  addLineItem, delI, duplicateItem, moveItemUp, moveItemDown,
  moveItemToCategory, setDrawerItem, scopeCategories,
  rowMenu, setRowMenu, mobile,
}) {
  const menuRef = useRef(null);
  const isMenuOpen = rowMenu?.cat === cat && rowMenu?.idx === idx;
  const lineMargin = getRowMargin(item);
  const sell = getRowSell(item);

  // Close menu on outside click
  useEffect(() => {
    if (!isMenuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setRowMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMenuOpen, setRowMenu]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addLineItem(cat); }
  };

  const [moveOpen, setMoveOpen] = useState(false);
  const otherCats = scopeCategories.filter(c => c !== cat);

  if (mobile) {
    return (
      <div style={{
        border: `1px solid ${_.line}`, borderRadius: _.rSm,
        padding: "10px 12px", marginBottom: 8, background: _.surface,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <input
            ref={descRef}
            style={{ ...cellInput, flex: 1, fontWeight: _.fontWeight.medium, fontSize: _.fontSize.base }}
            value={item.item || ""}
            onChange={(e) => uI(cat, idx, "item", e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Description"
          />
          <div style={{ position: "relative" }} ref={menuRef}>
            <button type="button" onClick={() => setRowMenu(isMenuOpen ? null : { cat, idx })}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: _.muted, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MoreHorizontal size={16} />
            </button>
            {isMenuOpen && renderMenu()}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          <div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Type</div>
            <select style={{ ...cellInput, width: "100%", cursor: "pointer" }} value={item.type || "Labour"} onChange={(e) => uI(cat, idx, "type", e.target.value)}>
              {LINE_ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Qty</div>
            <input type="number" style={{ ...cellInput, width: "100%" }} value={item.qty} onChange={(e) => uI(cat, idx, "qty", parseFloat(e.target.value) || 0)} onKeyDown={handleKeyDown} />
          </div>
          <div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Unit</div>
            <select style={{ ...cellInput, width: "100%", cursor: "pointer" }} value={item.unit || "ea"} onChange={(e) => uI(cat, idx, "unit", e.target.value)}>
              {UNIT_OPTIONS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 6 }}>
          <div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Cost</div>
            <input type="number" style={{ ...cellInput, width: "100%" }} value={item.rate} onChange={(e) => uI(cat, idx, "rate", parseFloat(e.target.value) || 0)} onKeyDown={handleKeyDown} />
          </div>
          <div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Margin %</div>
            <input type="number" style={{ ...cellInput, width: "100%" }} value={lineMargin} onChange={(e) => uI(cat, idx, "marginPct", toPositiveNumber(e.target.value, 0))} onKeyDown={handleKeyDown} />
          </div>
          <div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Total</div>
            <div style={{ padding: "6px 8px", fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums", color: _.ink }}>{fmt(sell)}</div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: CSS grid row
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "minmax(140px,1fr) 120px 70px 70px 90px 80px 80px 40px",
      gap: 4, alignItems: "center",
      padding: "4px 0", borderBottom: `1px solid ${_.line}08`,
      minHeight: 36,
    }}>
      <input
        ref={descRef}
        style={{ ...cellInput }}
        value={item.item || ""}
        onChange={(e) => uI(cat, idx, "item", e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Description"
      />
      <select style={{ ...cellInput, cursor: "pointer" }} value={item.type || "Labour"} onChange={(e) => uI(cat, idx, "type", e.target.value)}>
        {LINE_ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
      </select>
      <input type="number" style={{ ...cellInput, textAlign: "right" }} value={item.qty} onChange={(e) => uI(cat, idx, "qty", parseFloat(e.target.value) || 0)} onKeyDown={handleKeyDown} />
      <select style={{ ...cellInput, cursor: "pointer", fontSize: _.fontSize.xs }} value={item.unit || "ea"} onChange={(e) => uI(cat, idx, "unit", e.target.value)}>
        {UNIT_OPTIONS.map(u => <option key={u}>{u}</option>)}
      </select>
      <input type="number" style={{ ...cellInput, textAlign: "right" }} value={item.rate} onChange={(e) => uI(cat, idx, "rate", parseFloat(e.target.value) || 0)} onKeyDown={handleKeyDown} />
      <input type="number" style={{ ...cellInput, textAlign: "right" }} value={lineMargin} onChange={(e) => uI(cat, idx, "marginPct", toPositiveNumber(e.target.value, 0))} onKeyDown={handleKeyDown} />
      <div style={{ padding: "6px 8px", fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums", color: _.ink, textAlign: "right", whiteSpace: "nowrap" }}>
        {fmt(sell)}
      </div>
      <div style={{ position: "relative" }} ref={menuRef}>
        <button type="button" onClick={() => setRowMenu(isMenuOpen ? null : { cat, idx })}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: _.muted, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: _.rXs, transition: `background ${_.tr}` }}
          onMouseEnter={e => e.currentTarget.style.background = _.well}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <MoreHorizontal size={14} />
        </button>
        {isMenuOpen && renderMenu()}
      </div>
    </div>
  );

  function renderMenu() {
    const menuStyle = {
      position: "absolute", right: 0, top: "100%", zIndex: 30,
      background: _.surface, border: `1px solid ${_.line}`, borderRadius: _.rSm,
      boxShadow: _.sh2, minWidth: 170, overflow: "hidden",
    };
    const menuItem = {
      width: "100%", textAlign: "left", border: "none", background: "transparent",
      padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center",
      gap: 8, fontSize: _.fontSize.sm, color: _.ink, fontFamily: "inherit",
    };
    return (
      <div style={menuStyle}>
        <button type="button" style={menuItem} onClick={() => { setDrawerItem({ cat, idx }); setRowMenu(null); }}
          onMouseEnter={e => e.currentTarget.style.background = _.well} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <FileText size={13} /> More details
        </button>
        <button type="button" style={menuItem} onClick={() => { duplicateItem(cat, idx); setRowMenu(null); }}
          onMouseEnter={e => e.currentTarget.style.background = _.well} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <Copy size={13} /> Duplicate
        </button>
        <button type="button" style={menuItem} onClick={() => { moveItemUp(cat, idx); setRowMenu(null); }}
          onMouseEnter={e => e.currentTarget.style.background = _.well} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <ArrowUp size={13} /> Move up
        </button>
        <button type="button" style={menuItem} onClick={() => { moveItemDown(cat, idx); setRowMenu(null); }}
          onMouseEnter={e => e.currentTarget.style.background = _.well} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <ArrowDown size={13} /> Move down
        </button>
        {otherCats.length > 0 && (
          <div style={{ position: "relative" }}>
            <button type="button" style={menuItem} onClick={() => setMoveOpen(v => !v)}
              onMouseEnter={e => e.currentTarget.style.background = _.well} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <FolderInput size={13} /> Move to category
            </button>
            {moveOpen && (
              <div style={{ paddingLeft: 20, borderTop: `1px solid ${_.line}08` }}>
                {otherCats.map(c => (
                  <button key={c} type="button" style={{ ...menuItem, fontSize: _.fontSize.xs, padding: "6px 12px" }}
                    onClick={() => { moveItemToCategory(cat, idx, c); setRowMenu(null); setMoveOpen(false); }}
                    onMouseEnter={e => e.currentTarget.style.background = _.well} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div style={{ borderTop: `1px solid ${_.line}` }}>
          <button type="button" style={{ ...menuItem, color: _.red }} onClick={() => { delI(cat, idx); setRowMenu(null); }}
            onMouseEnter={e => e.currentTarget.style.background = `${_.red}08`} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    );
  }
}

export default memo(LineItemRow);
