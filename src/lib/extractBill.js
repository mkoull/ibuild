/**
 * Best-effort extraction of bill fields from PDF text content.
 * Works on text-selectable PDFs only. Scanned PDFs will return null fields.
 * This is a heuristic parser — not guaranteed to be accurate.
 */

const MONEY_RE = /\$?\s?([\d,]+\.\d{2})/g;
const DATE_RE = /(\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4})/g;
const INV_NUM_RE = /(?:invoice|inv|tax invoice|bill|ref)[\s#:.-]*([A-Z0-9][\w-]{2,20})/i;
const ABN_RE = /ABN[\s:]*(\d{2}\s?\d{3}\s?\d{3}\s?\d{3})/i;
const GST_RE = /GST[\s:]*\$?\s?([\d,]+\.\d{2})/i;
const TOTAL_RE = /(?:total|amount due|balance due|total inc|total \(inc)[\s:]*\$?\s?([\d,]+\.\d{2})/i;
const SUBTOTAL_RE = /(?:subtotal|sub total|total ex|total \(ex)[\s:]*\$?\s?([\d,]+\.\d{2})/i;
const DUE_DATE_RE = /(?:due date|payment due|due by)[\s:]*(\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4})/i;

function parseMoney(s) {
  if (!s) return null;
  return parseFloat(s.replace(/,/g, "")) || null;
}

function extractSupplierName(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (line.length > 3 && line.length < 60 && !/^\d/.test(line) && !/invoice|tax|abn|date|page/i.test(line)) {
      return line;
    }
  }
  return null;
}

/**
 * Extract bill data from raw PDF text.
 * @param {string} text - Plain text extracted from PDF
 * @returns {{ supplier, invoiceNumber, date, dueDate, subtotal, gst, total, confidence }}
 */
export function extractBillFields(text) {
  if (!text || text.trim().length < 20) {
    return { supplier: null, invoiceNumber: null, date: null, dueDate: null, subtotal: null, gst: null, total: null, confidence: "failed" };
  }

  const supplier = extractSupplierName(text);

  const invMatch = text.match(INV_NUM_RE);
  const invoiceNumber = invMatch ? invMatch[1] : null;

  const dueDateMatch = text.match(DUE_DATE_RE);
  const dueDate = dueDateMatch ? dueDateMatch[1] : null;

  const dates = [...text.matchAll(DATE_RE)].map(m => m[1]);
  const date = dates.length > 0 ? dates[0] : null;

  const totalMatch = text.match(TOTAL_RE);
  const total = totalMatch ? parseMoney(totalMatch[1]) : null;

  const subtotalMatch = text.match(SUBTOTAL_RE);
  const subtotal = subtotalMatch ? parseMoney(subtotalMatch[1]) : null;

  const gstMatch = text.match(GST_RE);
  const gst = gstMatch ? parseMoney(gstMatch[1]) : null;

  const finalTotal = total || (subtotal && gst ? subtotal + gst : null);

  const fieldsFound = [supplier, invoiceNumber, finalTotal].filter(Boolean).length;
  const confidence = fieldsFound >= 2 ? "ready" : fieldsFound >= 1 ? "partial" : "failed";

  return { supplier, invoiceNumber, date, dueDate, subtotal, gst, total: finalTotal, confidence };
}

/**
 * Attempt to extract text from a PDF stored as base64 data URL.
 * Uses a lightweight approach: decode the PDF binary and find text streams.
 * Only works for PDFs with embedded text (not scanned images).
 */
export function extractTextFromPdfBase64(dataUrl) {
  try {
    const base64 = dataUrl.split(",")[1] || dataUrl;
    const binary = atob(base64);
    const chunks = [];
    const streamRe = /stream\r?\n([\s\S]*?)endstream/g;
    let match;
    while ((match = streamRe.exec(binary)) !== null) {
      const content = match[1];
      const textMatches = [...content.matchAll(/\(([^)]+)\)/g)];
      textMatches.forEach(m => {
        const decoded = m[1].replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
        if (decoded.trim().length > 1) chunks.push(decoded.trim());
      });
      const hexMatches = [...content.matchAll(/<([0-9A-Fa-f]+)>/g)];
      hexMatches.forEach(m => {
        try {
          let hex = m[1];
          if (hex.length % 2 !== 0) hex += "0";
          let str = "";
          for (let i = 0; i < hex.length; i += 4) {
            const code = parseInt(hex.substring(i, i + 4), 16);
            if (code > 31 && code < 127) str += String.fromCharCode(code);
          }
          if (str.trim().length > 1) chunks.push(str.trim());
        } catch { /* skip */ }
      });
    }
    return chunks.join("\n");
  } catch {
    return "";
  }
}
