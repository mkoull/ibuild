import { useEffect, useRef } from "react";
import _ from "../../../theme/tokens.js";
import Card from "../../../components/ui/Card.jsx";
import Button from "../../../components/ui/Button.jsx";
import LineItemRow from "./LineItemRow.jsx";
import { Plus } from "lucide-react";

const headerStyle = {
  fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi,
  padding: "6px 8px", whiteSpace: "nowrap", textTransform: "uppercase",
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
    el.scrollLeft = Number(saved.left) || 0;
  }, [cat, tableScrollMemoryRef]);

  return (
    <Card style={{ padding: mobile ? 10 : 12, minWidth: 0, maxWidth: "100%" }}>
      <div
        data-line-items-grid
        ref={scrollerRef}
        onScroll={(e) => {
          if (!tableScrollMemoryRef?.current || !cat) return;
          tableScrollMemoryRef.current[cat] = {
            top: e.currentTarget.scrollTop,
            left: e.currentTarget.scrollLeft,
          };
        }}
        style={{ position: "relative", overflowX: mobile ? "hidden" : "auto", overflowY: "auto", maxWidth: "100%", minWidth: 0, maxHeight: "62vh" }}
      >
        <div style={{ minWidth: mobile ? 0 : 980 }}>
          {!mobile && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "minmax(220px,1fr) 130px 80px 90px 110px 120px 100px 96px",
              gap: 4, borderBottom: `1px solid ${_.line}`, marginBottom: 4,
            }}>
              <div style={headerStyle}>Description</div>
              <div style={headerStyle}>Type</div>
              <div style={{ ...headerStyle, textAlign: "right" }}>Qty</div>
              <div style={headerStyle}>Unit</div>
              <div style={{ ...headerStyle, textAlign: "right" }}>Cost</div>
              <div style={{ ...headerStyle, textAlign: "right" }}>Sell Price</div>
              <div style={{ ...headerStyle, textAlign: "right" }}>Margin %</div>
              <div style={headerStyle}>Actions</div>
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
        {!mobile && (
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 24, pointerEvents: "none", background: "linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.94))" }} />
        )}
      </div>

      {items.length === 0 && (
        <div style={{
          padding: "18px 12px", textAlign: "center",
          fontSize: _.fontSize.sm, color: _.muted,
          border: `1px dashed ${_.line2}`, borderRadius: _.rSm,
          marginTop: _.s2,
        }}>
          Search the library or add a custom line item to start pricing.
        </div>
      )}

      <button
        type="button"
        onClick={() => addLineItem(cat)}
        style={{
          width: "100%", marginTop: 8,
          padding: "10px 12px",
          border: `1.5px dashed ${_.line2}`, borderRadius: _.rSm,
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
    </Card>
  );
}
