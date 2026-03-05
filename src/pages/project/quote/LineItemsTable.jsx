import { useEffect, useRef } from "react";
import _ from "../../../theme/tokens.js";
import LineItemRow from "./LineItemRow.jsx";
import { Plus } from "lucide-react";

const headerStyle = {
  fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi,
  padding: "6px 4px", whiteSpace: "nowrap", textTransform: "uppercase",
  letterSpacing: _.letterSpacing.wide,
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
    <div style={{ minWidth: 0, maxWidth: "100%" }}>
      <div
        data-line-items-grid
        ref={scrollerRef}
        onScroll={(e) => {
          if (!tableScrollMemoryRef?.current || !cat) return;
          tableScrollMemoryRef.current[cat] = { top: e.currentTarget.scrollTop };
        }}
        style={{ overflowY: "auto", maxHeight: "50vh" }}
      >
        {!mobile && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(180px,1fr) 70px 90px 70px 90px 72px",
            gap: 4, borderBottom: `1px solid ${_.line}`, marginBottom: 2, paddingBottom: 2,
          }}>
            <div style={headerStyle}>Description</div>
            <div style={{ ...headerStyle, textAlign: "right" }}>Qty</div>
            <div style={{ ...headerStyle, textAlign: "right" }}>Rate</div>
            <div style={{ ...headerStyle, textAlign: "right" }}>Margin</div>
            <div style={{ ...headerStyle, textAlign: "right" }}>Total</div>
            <div style={headerStyle}></div>
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
          padding: "14px 12px", textAlign: "center",
          fontSize: _.fontSize.sm, color: _.muted,
        }}>
          Search the library above or add a line item below.
        </div>
      )}

      <button
        type="button"
        onClick={() => addLineItem(cat)}
        style={{
          width: "100%", marginTop: 6,
          padding: "8px 12px",
          border: `1.5px dashed ${_.line2}`, borderRadius: 6,
          background: "transparent", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, fontSize: _.fontSize.sm, color: _.ac,
          fontWeight: _.fontWeight.semi, fontFamily: "inherit",
          transition: `all ${_.tr}`,
          minHeight: 44,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = `${_.ac}08`; e.currentTarget.style.borderColor = _.ac; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = _.line2; }}
      >
        <Plus size={14} /> Add line item
      </button>
    </div>
  );
}
