import _ from "../../../theme/tokens.js";
import { fmt, input } from "../../../theme/styles.js";
import Card from "../../../components/ui/Card.jsx";
import Button from "../../../components/ui/Button.jsx";
import { X } from "lucide-react";

export default function CategorySidebar({
  scopeCategories, scope, selectedCat, setSelectedCat,
  newCat, setNewCat, addCategory, setDelCat,
  asSlideover, onClose,
}) {
  const content = (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s2 }}>
        <div style={{ fontSize: _.fontSize.caption, color: _.muted, textTransform: "uppercase", letterSpacing: _.letterSpacing.wide }}>
          Categories
        </div>
        {asSlideover && (
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: _.muted }}>
            <X size={16} />
          </button>
        )}
      </div>
      {scopeCategories.length === 0 && (
        <div style={{ fontSize: _.fontSize.sm, color: _.muted, padding: "10px 0" }}>
          Add a category to start your quote.
        </div>
      )}
      <div style={{ display: "grid", gap: 6 }}>
        {scopeCategories.map((cat) => {
          const items = scope[cat] || [];
          const active = selectedCat === cat;
          const catCount = items.filter((i) => i.on).length;
          const catTotal = items.filter((i) => i.on).reduce((t, i) => t + (Number(i.rate) || 0) * (Number(i.qty) || 0), 0);
          return (
            <div key={cat} style={{ display: "flex", gap: 2 }}>
              <button
                type="button"
                onClick={() => { setSelectedCat(cat); if (asSlideover) onClose(); }}
                style={{
                  flex: 1, border: `1px solid ${active ? _.ac : _.line}`,
                  borderRadius: _.rSm, background: active ? `${_.ac}10` : _.surface,
                  textAlign: "left", padding: "8px 10px", cursor: "pointer",
                  fontFamily: "inherit", minHeight: 44,
                }}
              >
                <div style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, color: _.ink }}>{cat}</div>
                <div style={{ fontSize: _.fontSize.caption, color: _.muted }}>{catCount} items · {fmt(catTotal)}</div>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDelCat(cat); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: _.faint, padding: "0 4px", display: "flex", alignItems: "center",
                  transition: `color ${_.tr}`,
                }}
                onMouseEnter={e => e.currentTarget.style.color = _.red}
                onMouseLeave={e => e.currentTarget.style.color = _.faint}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: _.s3 }}>
        <input
          style={{ ...input, width: "100%" }}
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="Add category"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newCat.trim()) {
              addCategory(newCat);
            }
          }}
        />
        <Button size="sm" variant="secondary" onClick={() => addCategory(newCat)}>Add Category</Button>
      </div>
    </>
  );

  if (asSlideover) {
    return (
      <>
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: _.overlay, zIndex: 50, animation: "fadeIn 0.12s ease" }} />
        <div style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 260, zIndex: 51,
          background: _.surface, boxShadow: _.sh3, padding: 14,
          overflowY: "auto", animation: "slideInLeft 0.2s ease",
        }}>
          {content}
        </div>
        <style>{`@keyframes slideInLeft{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
      </>
    );
  }

  return (
    <Card style={{ padding: 12, maxHeight: "70vh", overflowY: "auto", position: "sticky", top: 0 }}>
      {content}
    </Card>
  );
}
