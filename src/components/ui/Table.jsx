import { useMemo, useState } from "react";
import _ from "../../theme/tokens.js";
import SearchInput from "./SearchInput.jsx";

export default function Table({
  columns,
  data,
  onRowClick,
  emptyText = "No data",
  loading = false,
  searchable = true,
  sortable = true,
  paginated = true,
  pageSize = 10,
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const rows = Array.isArray(data) ? data : [];
  const gridCols = columns.map((c) => c.width || "1fr").join(" ");

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) => {
      return columns.some((c) => {
        const value = row?.[c.key];
        return String(value ?? "").toLowerCase().includes(q);
      });
    });
  }, [rows, columns, query]);

  const sorted = useMemo(() => {
    if (!sortable || !sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a?.[sortKey];
      const bv = b?.[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
  }, [filtered, sortDir, sortKey, sortable, columns]);

  const totalPages = paginated ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visible = paginated ? sorted.slice(start, start + pageSize) : sorted;

  const toggleSort = (key, allowSort = true) => {
    if (!sortable || !allowSort) return;
    setPage(1);
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  return (
    <div>
      {searchable && (
        <div style={{ marginBottom: _.s3 }}>
          <SearchInput
            value={query}
            onChange={(v) => { setQuery(v); setPage(1); }}
            placeholder="Search table..."
            style={{ maxWidth: 280 }}
          />
        </div>
      )}

      <div style={{
        display: "grid", gridTemplateColumns: gridCols, gap: _.s2,
        padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`,
        fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi,
        letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
      }}>
        {columns.map((c) => {
          const canSort = c.sortable !== false;
          const active = sortKey === c.key;
          const sortMark = active ? (sortDir === "asc" ? " ▲" : " ▼") : "";
          return (
            <span
              key={c.key}
              onClick={() => toggleSort(c.key, canSort)}
              style={{ textAlign: c.align || "left", cursor: sortable && canSort ? "pointer" : "default" }}
              title={sortable && canSort ? "Sort" : undefined}
            >
              {c.label}{sortMark}
            </span>
          );
        })}
      </div>

      {loading && (
        <div style={{ display: "grid", gap: _.s1, marginTop: _.s2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: 34, borderRadius: _.rSm, background: _.well, animation: "fadeIn 0.2s ease" }} />
          ))}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div style={{ padding: _.s7, textAlign: "center", color: _.muted, fontSize: _.fontSize.md, border: `1.5px dashed ${_.line2}`, borderRadius: _.r }}>
          {emptyText}
        </div>
      )}

      {!loading && visible.map((row, i) => (
        <div key={row.id || i}
          onClick={() => onRowClick?.(row)}
          style={{
            display: "grid", gridTemplateColumns: gridCols, gap: _.s2,
            padding: `${_.s3}px ${_.s1}px`, borderBottom: `1px solid ${_.line}`,
            alignItems: "center", fontSize: _.fontSize.base,
            cursor: onRowClick ? "pointer" : "default",
            borderRadius: _.rXs, transition: `background ${_.tr}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = _.well; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          {columns.map(c => (
            <span key={c.key} style={{ textAlign: c.align || "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.render ? c.render(row) : row[c.key]}
            </span>
          ))}
        </div>
      ))}

      {!loading && paginated && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: _.s2, paddingTop: _.s3 }}>
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} style={{ border: `1px solid ${_.line}`, background: _.surface, borderRadius: _.rSm, padding: "6px 10px", cursor: safePage === 1 ? "default" : "pointer", opacity: safePage === 1 ? 0.5 : 1 }}>Prev</button>
          <span style={{ fontSize: _.fontSize.sm, color: _.muted }}>Page {safePage} of {totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={{ border: `1px solid ${_.line}`, background: _.surface, borderRadius: _.rSm, padding: "6px 10px", cursor: safePage === totalPages ? "default" : "pointer", opacity: safePage === totalPages ? 0.5 : 1 }}>Next</button>
        </div>
      )}
    </div>
  );
}
