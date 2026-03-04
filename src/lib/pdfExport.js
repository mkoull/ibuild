function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildTable(headers, rows) {
  const thead = `<thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`;
  return `<table>${thead}${tbody}</table>`;
}

export function exportPrintPdf({
  title,
  companyName,
  projectName,
  clientName,
  dateLabel,
  sections = [],
}) {
  const win = window.open("", "_blank");
  if (!win) return false;

  const content = sections
    .map((section) => {
      const body = section.type === "table"
        ? buildTable(section.headers || [], section.rows || [])
        : `<p>${esc(section.text || "")}</p>`;
      return `<section><h3>${esc(section.title || "")}</h3>${body}</section>`;
    })
    .join("");

  win.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title || "Export")}</title>
  <style>
    @page { size: A4; margin: 14mm 12mm; }
    * { box-sizing: border-box; }
    body { font-family: Inter, Arial, sans-serif; color: #0f172a; font-size: 12px; margin: 0; }
    header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px; }
    h1 { font-size: 20px; margin: 0 0 6px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; }
    .label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; margin-right: 6px; }
    section { margin: 14px 0; break-inside: avoid; }
    h3 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: #475569; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 7px 6px; text-align: left; vertical-align: top; }
    th { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
    p { margin: 0; line-height: 1.45; color: #334155; }
  </style>
</head>
<body>
  <header>
    <h1>${esc(title || "Document Export")}</h1>
    <div class="meta">
      <div><span class="label">Company</span>${esc(companyName || "Your Company")}</div>
      <div><span class="label">Date</span>${esc(dateLabel || new Date().toLocaleDateString("en-AU"))}</div>
      <div><span class="label">Project</span>${esc(projectName || "—")}</div>
      <div><span class="label">Client</span>${esc(clientName || "—")}</div>
    </div>
  </header>
  ${content}
</body>
</html>`);
  win.document.close();
  setTimeout(() => win.print(), 300);
  return true;
}

