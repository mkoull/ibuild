import _ from "../../../theme/tokens.js";
import { fmt } from "../../../theme/styles.js";
import { Search } from "lucide-react";

export default function RateLibrarySearch({ librarySearch, setLibrarySearch, libraryMatches, addFromLibrary, disabled }) {
  return (
    <div style={{ position: "relative", marginBottom: _.s2 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        border: `1px solid ${_.line}`, borderRadius: _.rSm,
        padding: "6px 10px", background: disabled ? _.bg : _.well,
        opacity: disabled ? 0.5 : 1,
      }}>
        <Search size={13} color={_.muted} />
        <input
          style={{
            border: "none", outline: "none", background: "transparent",
            width: "100%", fontSize: _.fontSize.base, color: _.ink, fontFamily: "inherit",
          }}
          value={librarySearch}
          onChange={(e) => setLibrarySearch(e.target.value)}
          placeholder="Search rate library..."
          disabled={disabled}
        />
      </div>
      {librarySearch.trim() && !disabled && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
          background: _.surface, border: `1px solid ${_.line}`, borderRadius: _.rSm,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)", maxHeight: 240, overflowY: "auto",
        }}>
          {libraryMatches.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: _.fontSize.sm, color: _.muted }}>No matching library items</div>
          ) : libraryMatches.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => addFromLibrary(item)}
              style={{
                width: "100%", textAlign: "left", border: "none", background: "transparent",
                cursor: "pointer", padding: "9px 12px", borderBottom: `1px solid ${_.line}`,
                fontFamily: "inherit",
              }}
              onMouseEnter={e => e.currentTarget.style.background = _.well}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ fontSize: _.fontSize.base, color: _.ink, fontWeight: _.fontWeight.medium }}>{item.name}</div>
              <div style={{ fontSize: _.fontSize.caption, color: _.muted }}>{item.unit || "ea"} · {fmt(Number(item.unitRate) || 0)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
