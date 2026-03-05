import { memo } from "react";
import _ from "../../../theme/tokens.js";
import { input } from "../../../theme/styles.js";
import { toPositiveNumber } from "../../../lib/validation.js";
import { Copy, Trash2, SlidersHorizontal } from "lucide-react";

const cellInput = {
  ...input,
  padding: "6px 8px",
  fontSize: _.fontSize.sm,
  minHeight: 40,
};

function LineItemRow({
  item, cat, idx, descRef, uI, getRowMargin, getRowSell,
  addLineItem, delI, duplicateItem,
  setDrawerItem, mobile,
}) {
  const lineMargin = getRowMargin(item);
  const sell = getRowSell(item);

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

  if (mobile) {
    return (
      <div style={{ border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: "10px 12px", marginBottom: 8, background: _.surface }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 6 }}>
          <input
            ref={descRef}
            style={{ ...cellInput, flex: 1, fontWeight: _.fontWeight.medium, fontSize: _.fontSize.base }}
            value={item.item || ""}
            onChange={(e) => uI(cat, idx, "item", e.target.value)}
            data-row={idx}
            data-col={0}
            onKeyDown={(e) => handleKeyDown(e, 0)}
            placeholder="Description"
          />
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button type="button" onClick={() => setDrawerItem({ cat, idx })} style={actionBtn} title="More details">
              <SlidersHorizontal size={14} />
            </button>
            <button type="button" onClick={() => duplicateItem(cat, idx)} style={actionBtn} title="Duplicate row">
              <Copy size={14} />
            </button>
            <button type="button" onClick={() => delI(cat, idx)} style={{ ...actionBtn, color: _.red }} title="Delete row">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          <div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Qty</div>
            <input type="number" style={{ ...cellInput, width: "100%" }} value={item.qty} data-row={idx} data-col={1} onChange={(e) => uI(cat, idx, "qty", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, 1)} />
          </div>
          <div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Rate</div>
            <input type="number" style={{ ...cellInput, width: "100%" }} value={item.rate} data-row={idx} data-col={2} onChange={(e) => uI(cat, idx, "rate", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, 2)} />
          </div>
          <div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Margin %</div>
            <input type="number" style={{ ...cellInput, width: "100%" }} value={lineMargin} data-row={idx} data-col={3} onChange={(e) => uI(cat, idx, "marginPct", toPositiveNumber(e.target.value, 0))} onKeyDown={(e) => handleKeyDown(e, 3)} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <div style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, color: _.ink, fontVariantNumeric: "tabular-nums" }}>
            Total: ${sell.toFixed(2)}
          </div>
        </div>
      </div>
    );
  }

  // Desktop: 5+1 columns — Description, Qty, Rate, Margin%, Total, Actions
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(180px,1fr) 70px 90px 70px 90px 72px", gap: 4, alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${_.line}08`, minHeight: 44 }}>
      <input ref={descRef} style={{ ...cellInput }} value={item.item || ""} onChange={(e) => uI(cat, idx, "item", e.target.value)} data-row={idx} data-col={0} onKeyDown={(e) => handleKeyDown(e, 0)} placeholder="Description" />
      <input type="number" style={{ ...cellInput, textAlign: "right" }} value={item.qty} data-row={idx} data-col={1} onChange={(e) => uI(cat, idx, "qty", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, 1)} />
      <input type="number" style={{ ...cellInput, textAlign: "right" }} value={item.rate} data-row={idx} data-col={2} onChange={(e) => uI(cat, idx, "rate", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, 2)} />
      <input type="number" style={{ ...cellInput, textAlign: "right" }} value={lineMargin} data-row={idx} data-col={3} onChange={(e) => uI(cat, idx, "marginPct", toPositiveNumber(e.target.value, 0))} onKeyDown={(e) => handleKeyDown(e, 3)} />
      <div style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, textAlign: "right", fontVariantNumeric: "tabular-nums", color: _.ink, padding: "0 4px" }}>
        {sell.toFixed(0)}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0 }}>
        <button type="button" onClick={() => setDrawerItem({ cat, idx })} style={actionBtnSm} title="More details">
          <SlidersHorizontal size={13} />
        </button>
        <button type="button" onClick={() => duplicateItem(cat, idx)} style={actionBtnSm} title="Duplicate row">
          <Copy size={13} />
        </button>
        <button type="button" onClick={() => delI(cat, idx)} style={{ ...actionBtnSm, color: _.red }} title="Delete row">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

const actionBtn = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 4,
  color: _.muted,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 44,
  height: 44,
  borderRadius: _.rXs,
};

const actionBtnSm = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 2,
  color: _.muted,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 44,
  borderRadius: _.rXs,
};

export default memo(LineItemRow);
