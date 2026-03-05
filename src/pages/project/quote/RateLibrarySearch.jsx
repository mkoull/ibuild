import _ from "../../../theme/tokens.js";
import { fmt } from "../../../theme/styles.js";
import { Search } from "lucide-react";

export default function RateLibrarySearch({ librarySearch, setLibrarySearch, libraryMatches, addFromLibrary, disabled }) {
  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        border: `1px solid ${_.line}`, borderRadius: 6,
        padding: "7px 10px", background: disabled ? _.bg : _.well,
        opacity: disabled ? 0.5 : 1,
        transition: "border-color 0.12s",
      }}>
        <Search size={14} color={_.muted} style={{ flexShrink: 0 }} />
        <input
          style={{
            border: "none", outline: "none", background: "transparent",
            width: "100%", fontSize: 13, color: _.ink, fontFamily: "inherit",
          }}
          value={librarySearch}
          onChange={(e) => setLibrarySearch(e.target.value)}
          placeholder="Search rate library..."
          disabled={disabled}
        />
      </div>
      {librarySearch.trim() && !disabled && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: _.surface, border: `1px solid ${_.line}`, borderRadius: 8,
          boxShadow: _.shadowElevated, maxHeight: 240, overflowY: "auto",
        }}>
          {libraryMatches.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: 13, color: _.muted }}>No matching library items</div>
          ) : libraryMatches.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => addFromLibrary(item)}
              style={{
                width: "100%", textAlign: "left", border: "none", background: "transparent",
                cursor: "pointer", padding: "10px 14px", borderBottom: `1px solid ${_.line}`,
                fontFamily: "inherit", transition: "background 0.08s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = _.bg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ fontSize: 13, color: _.ink, fontWeight: 500 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: _.muted, marginTop: 1 }}>
                {item.unit || "ea"} · {fmt(Number(item.unitRate) || 0)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
