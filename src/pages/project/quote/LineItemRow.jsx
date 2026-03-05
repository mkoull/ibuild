import { memo } from "react";
import _ from "../../../theme/tokens.js";
import { input } from "../../../theme/styles.js";
import { toPositiveNumber } from "../../../lib/validation.js";
import { LINE_ITEM_TYPES, UNIT_OPTIONS } from "./constants.js";
import { Copy, Trash2, SlidersHorizontal } from "lucide-react";

const cellInput = {
  ...input,
  padding: "6px 8px",
  fontSize: _.fontSize.sm,
  minHeight: 32,
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
            <button type="button" onClick={() => setDrawerItem({ cat, idx })} style={actionBtn} title="Advanced details">
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
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Type</div>
            <select style={{ ...cellInput, width: "100%", cursor: "pointer" }} value={item.type || "Labour"} data-row={idx} data-col={1} onChange={(e) => uI(cat, idx, "type", e.target.value)} onKeyDown={(e) => handleKeyDown(e, 1)}>
              {LINE_ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Qty</div>
            <input type="number" style={{ ...cellInput, width: "100%" }} value={item.qty} data-row={idx} data-col={2} onChange={(e) => uI(cat, idx, "qty", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, 2)} />
          </div>
          <div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Unit</div>
            <select style={{ ...cellInput, width: "100%", cursor: "pointer" }} value={item.unit || "ea"} data-row={idx} data-col={3} onChange={(e) => uI(cat, idx, "unit", e.target.value)} onKeyDown={(e) => handleKeyDown(e, 3)}>
              {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 6 }}>
          <div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Cost</div>
            <input type="number" style={{ ...cellInput, width: "100%" }} value={item.rate} data-row={idx} data-col={4} onChange={(e) => uI(cat, idx, "rate", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, 4)} />
          </div>
          <div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Sell</div>
            <input
              type="number"
              style={{ ...cellInput, width: "100%" }}
              value={sell.toFixed(2)}
              data-row={idx}
              data-col={5}
              onChange={(e) => {
                const sellVal = toPositiveNumber(e.target.value, 0);
                const qty = Number(item.qty) || 0;
                const denom = 1 + (lineMargin / 100);
                const nextRate = qty > 0 ? (sellVal / denom) / qty : 0;
                uI(cat, idx, "rate", nextRate);
              }}
              onKeyDown={(e) => handleKeyDown(e, 5)}
            />
          </div>
          <div>
            <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: 2 }}>Margin %</div>
            <input type="number" style={{ ...cellInput, width: "100%" }} value={lineMargin} data-row={idx} data-col={6} onChange={(e) => uI(cat, idx, "marginPct", toPositiveNumber(e.target.value, 0))} onKeyDown={(e) => handleKeyDown(e, 6)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1fr) 130px 80px 90px 110px 120px 100px 96px", gap: 4, alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${_.line}08`, minHeight: 36 }}>
      <input ref={descRef} style={{ ...cellInput }} value={item.item || ""} onChange={(e) => uI(cat, idx, "item", e.target.value)} data-row={idx} data-col={0} onKeyDown={(e) => handleKeyDown(e, 0)} placeholder="Description" />
      <select style={{ ...cellInput, cursor: "pointer" }} value={item.type || "Labour"} data-row={idx} data-col={1} onChange={(e) => uI(cat, idx, "type", e.target.value)} onKeyDown={(e) => handleKeyDown(e, 1)}>
        {LINE_ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
      </select>
      <input type="number" style={{ ...cellInput, textAlign: "right" }} value={item.qty} data-row={idx} data-col={2} onChange={(e) => uI(cat, idx, "qty", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, 2)} />
      <select style={{ ...cellInput, cursor: "pointer", fontSize: _.fontSize.xs }} value={item.unit || "ea"} data-row={idx} data-col={3} onChange={(e) => uI(cat, idx, "unit", e.target.value)} onKeyDown={(e) => handleKeyDown(e, 3)}>
        {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
      </select>
      <input type="number" style={{ ...cellInput, textAlign: "right" }} value={item.rate} data-row={idx} data-col={4} onChange={(e) => uI(cat, idx, "rate", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, 4)} />
      <input
        type="number"
        style={{ ...cellInput, textAlign: "right" }}
        value={sell.toFixed(2)}
        data-row={idx}
        data-col={5}
        onChange={(e) => {
          const sellVal = toPositiveNumber(e.target.value, 0);
          const qty = Number(item.qty) || 0;
          const denom = 1 + (lineMargin / 100);
          const nextRate = qty > 0 ? (sellVal / denom) / qty : 0;
          uI(cat, idx, "rate", nextRate);
        }}
        onKeyDown={(e) => handleKeyDown(e, 5)}
      />
      <input type="number" style={{ ...cellInput, textAlign: "right" }} value={lineMargin} data-row={idx} data-col={6} onChange={(e) => uI(cat, idx, "marginPct", toPositiveNumber(e.target.value, 0))} onKeyDown={(e) => handleKeyDown(e, 6)} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
        <button type="button" onClick={() => setDrawerItem({ cat, idx })} style={actionBtn} title="Advanced details">
          <SlidersHorizontal size={13} />
        </button>
        <button type="button" onClick={() => duplicateItem(cat, idx)} style={actionBtn} title="Duplicate row">
          <Copy size={13} />
        </button>
        <button type="button" onClick={() => delI(cat, idx)} style={{ ...actionBtn, color: _.red }} title="Delete row">
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

export default memo(LineItemRow);
