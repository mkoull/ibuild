import _ from "../../theme/tokens.js";

export default function Table({ columns, data, onRowClick, emptyText = "No data" }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: _.s7, textAlign: "center", color: _.muted, fontSize: _.fontSize.md, border: `1.5px dashed ${_.line2}`, borderRadius: _.r }}>
        {emptyText}
      </div>
    );
  }

  const gridCols = columns.map(c => c.width || "1fr").join(" ");

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: gridCols, gap: _.s2,
        padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`,
        fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi,
        letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
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
            display: "grid", gridTemplateColumns: gridCols, gap: _.s2,
            padding: `${_.s3}px ${_.s1}px`, borderBottom: `1px solid ${_.line}`,
            alignItems: "center", fontSize: _.fontSize.base,
            cursor: onRowClick ? "pointer" : "default",
            borderRadius: _.rXs, transition: `background ${_.tr}`,
          }}
          onMouseEnter={onRowClick ? e => { e.currentTarget.style.background = _.well; } : undefined}
          onMouseLeave={onRowClick ? e => { e.currentTarget.style.background = "transparent"; } : undefined}
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
