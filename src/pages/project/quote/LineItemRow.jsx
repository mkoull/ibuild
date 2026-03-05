import { memo } from "react";
import _ from "../../../theme/tokens.js";
import { fmt } from "../../../theme/styles.js";
import { toPositiveNumber } from "../../../lib/validation.js";
import { Copy, Trash2, SlidersHorizontal } from "lucide-react";

/* ── Spreadsheet cell: invisible until focused ── */
const cell = {
  padding: "7px 8px",
  fontSize: 13,
  fontFamily: "inherit",
  color: _.ink,
  background: "transparent",
  border: "1.5px solid transparent",
  borderRadius: 4,
  outline: "none",
  width: "100%",
  minHeight: 36,
  transition: "border-color 0.12s, background 0.12s, box-shadow 0.12s",
};

/* ── Mobile card input ── */
const mobCell = {
  padding: "8px 10px",
  fontSize: 14,
  fontFamily: "inherit",
  color: _.ink,
  background: _.well,
  border: `1.5px solid transparent`,
  borderRadius: 6,
  outline: "none",
  width: "100%",
  minHeight: 42,
  transition: "border-color 0.12s",
};

function LineItemRow({
  item, cat, idx, descRef, uI, getRowMargin, getRowSell,
  addLineItem, delI, duplicateItem,
  setDrawerItem, mobile,
}) {
  const lineMargin = getRowMargin(item);
  const sell = getRowSell(item);
  const even = idx % 2 === 0;

  const handleKeyDown = (e, col) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLineItem(cat);
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const row = Number(e.currentTarget.dataset.row);
    const targetRow = e.key === "ArrowDown" ? row + 1 : row - 1;
    if (targetRow < 0) return;
    const root = e.currentTarget.closest("[data-line-items-grid]");
    if (!root) return;
    const next = root.querySelector(`[data-row="${targetRow}"][data-col="${col}"]`);
    if (next && typeof next.focus === "function") {
      e.preventDefault();
      next.focus();
      next.select?.();
    }
  };

  const focusIn = (e) => {
    e.currentTarget.style.borderColor = _.ac;
    e.currentTarget.style.background = "#fff";
    e.currentTarget.style.boxShadow = `0 0 0 2px ${_.ac}20`;
  };
  const focusOut = (e) => {
    e.currentTarget.style.borderColor = "transparent";
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.boxShadow = "none";
  };
  const mobFocusIn = (e) => { e.currentTarget.style.borderColor = _.ac; };
  const mobFocusOut = (e) => { e.currentTarget.style.borderColor = "transparent"; };

  /* ════ Mobile: card layout ════ */
  if (mobile) {
    return (
      <div style={{
        background: _.surface,
        border: `1px solid ${_.line}`,
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 8,
      }}>
        {/* Row 1: Description + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <input
            ref={descRef}
            style={{ ...mobCell, flex: 1, fontWeight: 500 }}
            value={item.item || ""}
            onChange={(e) => uI(cat, idx, "item", e.target.value)}
            data-row={idx} data-col={0}
            onKeyDown={(e) => handleKeyDown(e, 0)}
            onFocus={mobFocusIn} onBlur={mobFocusOut}
            placeholder="Description"
          />
          <div style={{ display: "flex", flexShrink: 0 }}>
            <button type="button" onClick={() => setDrawerItem({ cat, idx })} style={mobAct} title="Edit">
              <SlidersHorizontal size={16} />
            </button>
            <button type="button" onClick={() => duplicateItem(cat, idx)} style={mobAct} title="Duplicate">
              <Copy size={16} />
            </button>
            <button type="button" onClick={() => delI(cat, idx)} style={{ ...mobAct, color: _.red }} title="Delete">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Row 2: Qty / Rate / Margin */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div>
            <div style={mobLbl}>Qty</div>
            <input type="number" style={mobCell} value={item.qty}
              data-row={idx} data-col={1}
              onChange={(e) => uI(cat, idx, "qty", parseFloat(e.target.value) || 0)}
              onKeyDown={(e) => handleKeyDown(e, 1)}
              onFocus={mobFocusIn} onBlur={mobFocusOut} />
          </div>
          <div>
            <div style={mobLbl}>Rate</div>
            <input type="number" style={mobCell} value={item.rate}
              data-row={idx} data-col={2}
              onChange={(e) => uI(cat, idx, "rate", parseFloat(e.target.value) || 0)}
              onKeyDown={(e) => handleKeyDown(e, 2)}
              onFocus={mobFocusIn} onBlur={mobFocusOut} />
          </div>
          <div>
            <div style={mobLbl}>Margin %</div>
            <input type="number" style={mobCell} value={lineMargin}
              data-row={idx} data-col={3}
              onChange={(e) => uI(cat, idx, "marginPct", toPositiveNumber(e.target.value, 0))}
              onKeyDown={(e) => handleKeyDown(e, 3)}
              onFocus={mobFocusIn} onBlur={mobFocusOut} />
          </div>
        </div>

        {/* Row 3: Total */}
        <div style={{
          display: "flex", justifyContent: "flex-end",
          marginTop: 10, paddingTop: 10, borderTop: `1px solid ${_.line}`,
        }}>
          <span style={{
            fontSize: 15, fontWeight: 700, color: _.ink,
            fontVariantNumeric: "tabular-nums",
          }}>{fmt(sell)}</span>
        </div>
      </div>
    );
  }

  /* ════ Desktop: spreadsheet row ════ */
  return (
    <div
      data-row-wrap={idx}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(180px,1fr) 70px 90px 70px 90px 72px",
        gap: 2,
        alignItems: "center",
        padding: "2px 4px",
        minHeight: 42,
        background: even ? "transparent" : "rgba(0,0,0,0.015)",
        borderRadius: 4,
        transition: "background 0.08s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = `${_.ac}06`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = even ? "transparent" : "rgba(0,0,0,0.015)"; }}
    >
      <input
        ref={descRef} style={cell}
        value={item.item || ""}
        onChange={(e) => uI(cat, idx, "item", e.target.value)}
        data-row={idx} data-col={0}
        onKeyDown={(e) => handleKeyDown(e, 0)}
        onFocus={focusIn} onBlur={focusOut}
        placeholder="Description"
      />
      <input
        type="number" style={{ ...cell, textAlign: "right" }}
        value={item.qty} data-row={idx} data-col={1}
        onChange={(e) => uI(cat, idx, "qty", parseFloat(e.target.value) || 0)}
        onKeyDown={(e) => handleKeyDown(e, 1)}
        onFocus={focusIn} onBlur={focusOut}
      />
      <input
        type="number" style={{ ...cell, textAlign: "right" }}
        value={item.rate} data-row={idx} data-col={2}
        onChange={(e) => uI(cat, idx, "rate", parseFloat(e.target.value) || 0)}
        onKeyDown={(e) => handleKeyDown(e, 2)}
        onFocus={focusIn} onBlur={focusOut}
      />
      <input
        type="number" style={{ ...cell, textAlign: "right" }}
        value={lineMargin} data-row={idx} data-col={3}
        onChange={(e) => uI(cat, idx, "marginPct", toPositiveNumber(e.target.value, 0))}
        onKeyDown={(e) => handleKeyDown(e, 3)}
        onFocus={focusIn} onBlur={focusOut}
      />
      <div style={{
        fontSize: 13, fontWeight: 700, textAlign: "right",
        fontVariantNumeric: "tabular-nums", color: _.ink,
        padding: "0 8px",
      }}>
        {fmt(sell)}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <button type="button" onClick={() => setDrawerItem({ cat, idx })} style={actSm} title="Edit">
          <SlidersHorizontal size={13} />
        </button>
        <button type="button" onClick={() => duplicateItem(cat, idx)} style={actSm} title="Duplicate">
          <Copy size={13} />
        </button>
        <button type="button" onClick={() => delI(cat, idx)}
          style={actSm}
          title="Delete"
          onMouseEnter={(e) => { e.currentTarget.style.color = _.red; e.currentTarget.style.background = `${_.red}08`; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = _.faint; e.currentTarget.style.background = "transparent"; }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

const mobLbl = {
  fontSize: 10, color: _.muted, fontWeight: 600,
  marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em",
};

const mobAct = {
  background: "none", border: "none", cursor: "pointer",
  padding: 6, color: _.muted, display: "inline-flex",
  alignItems: "center", justifyContent: "center",
  width: 38, height: 38, borderRadius: 6,
};

const actSm = {
  background: "none", border: "none", cursor: "pointer",
  padding: 2, color: _.faint, display: "inline-flex",
  alignItems: "center", justifyContent: "center",
  width: 24, height: 38, borderRadius: 3,
  transition: "color 0.08s, background 0.08s",
};

export default memo(LineItemRow);
