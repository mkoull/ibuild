import { useEffect, useRef } from "react";
import _ from "../../../theme/tokens.js";
import LineItemRow from "./LineItemRow.jsx";
import { Plus } from "lucide-react";

const hdr = {
  fontSize: 10, color: _.muted, fontWeight: 600,
  padding: "8px 8px", whiteSpace: "nowrap",
  textTransform: "uppercase", letterSpacing: "0.06em",
  userSelect: "none",
};

export default function LineItemsTable({
  items, cat, descInputRefs,
  uI, getRowMargin, getRowSell, addLineItem, delI,
  duplicateItem,
  setDrawerItem, tableScrollMemoryRef, mobile,
}) {
  const scrollerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !cat) return;
    const saved = tableScrollMemoryRef?.current?.[cat];
    if (!saved) return;
    el.scrollTop = Number(saved.top) || 0;
  }, [cat, tableScrollMemoryRef]);

  return (
    <div>
      <div
        data-line-items-grid
        ref={scrollerRef}
        onScroll={(e) => {
          if (!tableScrollMemoryRef?.current || !cat) return;
          tableScrollMemoryRef.current[cat] = { top: e.currentTarget.scrollTop };
        }}
        style={{ overflowY: "auto", maxHeight: "56vh" }}
      >
        {/* Desktop column headers */}
        {!mobile && items.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(180px,1fr) 70px 90px 70px 90px 72px",
            gap: 2,
            padding: "0 4px",
            borderBottom: `2px solid ${_.line}`,
            marginBottom: 4,
          }}>
            <div style={hdr}>Description</div>
            <div style={{ ...hdr, textAlign: "right" }}>Qty</div>
            <div style={{ ...hdr, textAlign: "right" }}>Rate</div>
            <div style={{ ...hdr, textAlign: "right" }}>Margin</div>
            <div style={{ ...hdr, textAlign: "right" }}>Total</div>
            <div style={hdr} />
          </div>
        )}

        {items.map((item, idx) => (
          <LineItemRow
            key={item._id}
            item={item} cat={cat} idx={idx}
            descRef={(el) => { descInputRefs.current[`${cat}:${idx}`] = el; }}
            uI={uI} getRowMargin={getRowMargin} getRowSell={getRowSell}
            addLineItem={addLineItem} delI={delI}
            duplicateItem={duplicateItem}
            setDrawerItem={setDrawerItem}
            mobile={mobile}
          />
        ))}
      </div>

      {items.length === 0 && (
        <div style={{
          padding: "32px 16px", textAlign: "center",
          fontSize: 14, color: _.muted, lineHeight: 1.5,
        }}>
          No items yet. Search the library or add a line item to get started.
        </div>
      )}

      <button
        type="button"
        onClick={() => addLineItem(cat)}
        style={{
          width: "100%", marginTop: items.length > 0 ? 8 : 0,
          padding: "10px 12px",
          border: `1.5px dashed ${_.line2}`, borderRadius: 8,
          background: "transparent", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, fontSize: 13, color: _.ac,
          fontWeight: 600, fontFamily: "inherit",
          transition: "all 0.12s ease",
          minHeight: 44,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = `${_.ac}06`; e.currentTarget.style.borderColor = _.ac; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = _.line2; }}
      >
        <Plus size={14} /> Add line item
      </button>
    </div>
  );
}
