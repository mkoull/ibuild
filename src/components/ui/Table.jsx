import _ from "../../theme/tokens.js";

export default function Table({ columns, data, onRowClick, emptyText = "No data" }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: _.muted, fontSize: 14, border: `1.5px dashed ${_.line2}`, borderRadius: _.r }}>
        {emptyText}
      </div>
    );
  }

  const gridCols = columns.map(c => c.width || "1fr").join(" ");

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: gridCols, gap: 8,
        padding: "8px 0", borderBottom: `2px solid ${_.ink}`,
        fontSize: 10, color: _.muted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
      }}>
        {columns.map(c => (
          <span key={c.key} style={{ textAlign: c.align || "left" }}>{c.label}</span>
        ))}
      </div>
      {/* Rows */}
      {data.map((row, i) => (
        <div key={row.id || i}
          onClick={() => onRowClick?.(row)}
          style={{
            display: "grid", gridTemplateColumns: gridCols, gap: 8,
            padding: "12px 0", borderBottom: `1px solid ${_.line}`,
            alignItems: "center", fontSize: 13,
            cursor: onRowClick ? "pointer" : "default",
            transition: "padding-left 0.12s",
          }}
          onMouseEnter={e => { if (onRowClick) e.currentTarget.style.paddingLeft = "4px"; }}
          onMouseLeave={e => { if (onRowClick) e.currentTarget.style.paddingLeft = "0"; }}
        >
          {columns.map(c => (
            <span key={c.key} style={{ textAlign: c.align || "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.render ? c.render(row) : row[c.key]}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
