import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, btnGhost, badge } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import SignatureCanvas from "../../components/ui/SignatureCanvas.jsx";
import { ArrowRight, Printer, Check, X } from "lucide-react";

/* Scoped styles for on-screen preview (all rules nested under .printRoot) */
const PREVIEW_CSS = `
.printRoot{background:#fff;color:#0f172a;max-width:100%;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;line-height:1.45}
.printRoot .avoidBreak{break-inside:avoid}
.printRoot .printSection{break-inside:avoid}
.printRoot .printHeader{display:flex;justify-content:space-between;align-items:flex-start;padding:0 0 20px;border-bottom:2px solid #0f172a;margin-bottom:0}
.printRoot .hdrLeft{display:flex;align-items:center;gap:12px}
.printRoot .hdrLogo{max-height:36px;max-width:140px}
.printRoot .hdrFallback{width:28px;height:28px;background:#0f172a;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff}
.printRoot .hdrCompany{font-size:16px;font-weight:700;color:#0f172a;letter-spacing:-0.02em}
.printRoot .hdrCompanyDetail{font-size:10px;color:#64748b;margin-top:2px}
.printRoot .hdrRight{text-align:right}
.printRoot .hdrDocType{font-size:9px;letter-spacing:0.12em;font-weight:700;color:#94a3b8;text-transform:uppercase}
.printRoot .hdrQuoteNum{font-size:14px;font-weight:700;color:#0f172a;margin-top:2px}
.printRoot .metaGrid{display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #e2e8f0;margin-top:20px}
.printRoot .metaBlock{padding:16px 0}
.printRoot .metaBlock+.metaBlock{padding-left:20px;border-left:1px solid #e2e8f0}
.printRoot .metaLabel{font-size:9px;letter-spacing:0.08em;font-weight:600;color:#94a3b8;text-transform:uppercase;margin-bottom:4px}
.printRoot .metaValue{font-size:13px;font-weight:500;color:#0f172a}
.printRoot .metaValueLg{font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-0.02em}
.printRoot .metaValueSm{font-size:11px;color:#64748b;margin-top:2px}
.printRoot .summaryStrip{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:1px solid #e2e8f0;background:#f8fafc}
.printRoot .summaryCell{padding:12px 16px;border-right:1px solid #e2e8f0}
.printRoot .summaryCell:last-child{border-right:none}
.printRoot .summaryLabel{font-size:9px;letter-spacing:0.06em;font-weight:600;color:#94a3b8;text-transform:uppercase}
.printRoot .summaryVal{font-size:13px;font-weight:600;color:#0f172a;margin-top:3px}
.printRoot .summaryValBold{font-size:15px;font-weight:700;color:#0f172a;margin-top:3px}
.printRoot .briefBlock{padding:16px 0;border-bottom:1px solid #e2e8f0}
.printRoot .briefLabel{font-size:9px;letter-spacing:0.06em;font-weight:600;color:#94a3b8;text-transform:uppercase;margin-bottom:6px}
.printRoot .briefText{font-size:12px;line-height:1.7;color:#475569}
.printRoot .scopeHeading{font-size:9px;letter-spacing:0.06em;font-weight:700;color:#94a3b8;text-transform:uppercase;padding:20px 0 12px}
.printRoot .printEndBlock{break-inside:avoid;page-break-inside:avoid;margin-top:28px}
.printRoot .catHeader{display:flex;justify-content:space-between;align-items:baseline;padding:7px 8px;border-bottom:2px solid #0f172a;font-size:12px;font-weight:600;color:#0f172a;margin-top:12px;background:#f8fafc;border-radius:3px}
.printRoot .catNum{color:#94a3b8;margin-right:6px;font-weight:700}
.printRoot .scopeTable{width:100%;border-collapse:collapse;margin-bottom:4px}
.printRoot .scopeTable th{font-size:9px;letter-spacing:0.06em;font-weight:600;color:#94a3b8;text-transform:uppercase;padding:5px 0;text-align:left;border-bottom:1px solid #e2e8f0}
.printRoot .scopeTable th:nth-child(2){text-align:center;width:48px}
.printRoot .scopeTable th:nth-child(3){text-align:right;width:64px}
.printRoot .scopeTable th:nth-child(4){text-align:center;width:36px}
.printRoot .scopeTable th:nth-child(5){text-align:right;width:72px}
.printRoot .scopeTable td{padding:4px 0;font-size:11px;color:#475569;border-bottom:1px solid #f1f5f9}
.printRoot .scopeTable td:first-child{color:#0f172a;font-weight:500}
.printRoot .scopeTable td:nth-child(2){text-align:center}
.printRoot .scopeTable td:nth-child(3){text-align:right;font-variant-numeric:tabular-nums}
.printRoot .scopeTable td:nth-child(4){text-align:center;color:#94a3b8}
.printRoot .scopeTable td:nth-child(5){text-align:right;font-weight:600;color:#0f172a;font-variant-numeric:tabular-nums}
.printRoot .printTotals{margin-top:16px;display:flex;justify-content:flex-end}
.printRoot .totalsBox{width:280px;border:1.5px solid #e2e8f0;border-radius:6px;overflow:hidden}
.printRoot .totalsRow{display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;color:#64748b;font-variant-numeric:tabular-nums}
.printRoot .totalsRow+.totalsRow{border-top:1px solid #f1f5f9}
.printRoot .totalsGrand{display:flex;justify-content:space-between;padding:10px 14px;font-size:16px;font-weight:700;color:#0f172a;background:#f8fafc;border-top:2px solid #0f172a;letter-spacing:-0.02em;font-variant-numeric:tabular-nums}
.printRoot .printTerms{padding:20px 0 0;border-top:1px solid #e2e8f0;margin-top:24px}
.printRoot .termsHeading{font-size:9px;letter-spacing:0.06em;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:10px}
.printRoot .termsList{list-style:none;padding:0}
.printRoot .termsList li{font-size:11px;color:#475569;line-height:1.8;padding-left:14px;position:relative}
.printRoot .termsList li::before{content:'\\2022';position:absolute;left:0;color:#94a3b8}
.printRoot .printAcceptance{padding:20px 0 0;border-top:1px solid #e2e8f0;margin-top:16px}
.printRoot .acceptHeading{font-size:9px;letter-spacing:0.06em;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:4px}
.printRoot .acceptText{font-size:10px;color:#94a3b8;margin-bottom:14px}
.printRoot .sigGrid{display:grid;grid-template-columns:1fr 1fr;gap:32px}
.printRoot .sigBlock .sigLabel{font-size:10px;font-weight:600;color:#0f172a;margin-bottom:8px}
.printRoot .sigBlock .sigLine{border-bottom:1px solid #d1d5db;height:36px;margin-bottom:4px}
.printRoot .sigBlock .sigDate{font-size:9px;color:#94a3b8}
.printRoot .printFooter{margin-top:24px;padding:10px 0;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
.printRoot .scopeTable tbody tr:last-child{break-after:avoid}
`;

/* Full CSS for print popup window (global resets are safe in isolated window) */
const PRINT_CSS = `
@page{size:A4;margin:14mm 12mm 16mm;@bottom-center{content:"Page " counter(page);font-size:8px;color:#94a3b8}}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:auto!important;overflow:visible!important;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;color:#0f172a;font-size:12px;line-height:1.45;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;orphans:3;widows:3}
.avoidBreak{break-inside:avoid;page-break-inside:avoid}
.breakBefore{break-before:page;page-break-before:always}
.printSection{break-inside:avoid;page-break-inside:avoid}
.printSectionTitle{break-after:avoid;page-break-after:avoid}
tr{break-inside:avoid;page-break-inside:avoid}
thead{display:table-header-group}
.printRoot{background:#fff;color:#0f172a;max-width:100%}
.printHeader{display:flex;justify-content:space-between;align-items:flex-start;padding:0 0 20px;border-bottom:2px solid #0f172a;margin-bottom:0}
.hdrLeft{display:flex;align-items:center;gap:12px}
.hdrLogo{max-height:36px;max-width:140px}
.hdrFallback{width:28px;height:28px;background:#0f172a;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff}
.hdrCompany{font-size:16px;font-weight:700;color:#0f172a;letter-spacing:-0.02em}
.hdrCompanyDetail{font-size:10px;color:#64748b;margin-top:2px}
.hdrRight{text-align:right}
.hdrDocType{font-size:9px;letter-spacing:0.12em;font-weight:700;color:#94a3b8;text-transform:uppercase}
.hdrQuoteNum{font-size:14px;font-weight:700;color:#0f172a;margin-top:2px}
.metaGrid{display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #e2e8f0;margin-top:20px}
.metaBlock{padding:16px 0}
.metaBlock+.metaBlock{padding-left:20px;border-left:1px solid #e2e8f0}
.metaLabel{font-size:9px;letter-spacing:0.08em;font-weight:600;color:#94a3b8;text-transform:uppercase;margin-bottom:4px}
.metaValue{font-size:13px;font-weight:500;color:#0f172a}
.metaValueLg{font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-0.02em}
.metaValueSm{font-size:11px;color:#64748b;margin-top:2px}
.summaryStrip{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:1px solid #e2e8f0;background:#f8fafc}
.summaryCell{padding:12px 16px;border-right:1px solid #e2e8f0}
.summaryCell:last-child{border-right:none}
.summaryLabel{font-size:9px;letter-spacing:0.06em;font-weight:600;color:#94a3b8;text-transform:uppercase}
.summaryVal{font-size:13px;font-weight:600;color:#0f172a;margin-top:3px}
.summaryValBold{font-size:15px;font-weight:700;color:#0f172a;margin-top:3px}
.briefBlock{padding:16px 0;border-bottom:1px solid #e2e8f0}
.briefLabel{font-size:9px;letter-spacing:0.06em;font-weight:600;color:#94a3b8;text-transform:uppercase;margin-bottom:6px}
.briefText{font-size:12px;line-height:1.7;color:#475569}
.scopeHeading{font-size:9px;letter-spacing:0.06em;font-weight:700;color:#94a3b8;text-transform:uppercase;padding:20px 0 12px}
.printEndBlock{break-inside:avoid;page-break-inside:avoid;margin-top:28px}
.catHeader{display:flex;justify-content:space-between;align-items:baseline;padding:7px 8px;border-bottom:2px solid #0f172a;font-size:12px;font-weight:600;color:#0f172a;margin-top:12px;background:#f8fafc;border-radius:3px}
.catNum{color:#94a3b8;margin-right:6px;font-weight:700}
.scopeTable{width:100%;border-collapse:collapse;margin-bottom:4px}
.scopeTable th{font-size:9px;letter-spacing:0.06em;font-weight:600;color:#94a3b8;text-transform:uppercase;padding:5px 0;text-align:left;border-bottom:1px solid #e2e8f0}
.scopeTable th:nth-child(2){text-align:center;width:48px}
.scopeTable th:nth-child(3){text-align:right;width:64px}
.scopeTable th:nth-child(4){text-align:center;width:36px}
.scopeTable th:nth-child(5){text-align:right;width:72px}
.scopeTable td{padding:4px 0;font-size:11px;color:#475569;border-bottom:1px solid #f1f5f9}
.scopeTable td:first-child{color:#0f172a;font-weight:500}
.scopeTable td:nth-child(2){text-align:center}
.scopeTable td:nth-child(3){text-align:right;font-variant-numeric:tabular-nums}
.scopeTable td:nth-child(4){text-align:center;color:#94a3b8}
.scopeTable td:nth-child(5){text-align:right;font-weight:600;color:#0f172a;font-variant-numeric:tabular-nums}
.printTotals{margin-top:16px;display:flex;justify-content:flex-end}
.totalsBox{width:280px;border:1.5px solid #e2e8f0;border-radius:6px;overflow:hidden}
.totalsRow{display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;color:#64748b;font-variant-numeric:tabular-nums}
.totalsRow+.totalsRow{border-top:1px solid #f1f5f9}
.totalsGrand{display:flex;justify-content:space-between;padding:10px 14px;font-size:16px;font-weight:700;color:#0f172a;background:#f8fafc;border-top:2px solid #0f172a;letter-spacing:-0.02em;font-variant-numeric:tabular-nums}
.printTerms{padding:20px 0 0;border-top:1px solid #e2e8f0;margin-top:24px}
.termsHeading{font-size:9px;letter-spacing:0.06em;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:10px}
.termsList{list-style:none;padding:0}
.termsList li{font-size:11px;color:#475569;line-height:1.8;padding-left:14px;position:relative}
.termsList li::before{content:'•';position:absolute;left:0;color:#94a3b8}
.printAcceptance{padding:20px 0 0;border-top:1px solid #e2e8f0;margin-top:16px}
.acceptHeading{font-size:9px;letter-spacing:0.06em;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:4px}
.acceptText{font-size:10px;color:#94a3b8;margin-bottom:14px}
.sigGrid{display:grid;grid-template-columns:1fr 1fr;gap:32px}
.sigBlock .sigLabel{font-size:10px;font-weight:600;color:#0f172a;margin-bottom:8px}
.sigBlock .sigLine{border-bottom:1px solid #d1d5db;height:36px;margin-bottom:4px}
.sigBlock .sigDate{font-size:9px;color:#94a3b8}
.printFooter{margin-top:24px;padding:10px 0;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
.scopeTable tbody tr:last-child{break-after:avoid}
`;

export default function ProposalDetail() {
  const { propIndex } = useParams();
  const navigate = useNavigate();
  const { project: p, update: up, log } = useProject();
  const { notify, settings } = useApp();
  const propRef = useRef(null);
  const idx = parseInt(propIndex);
  const propD = p.proposals[idx];
  const [editName, setEditName] = useState(false);
  const [editValid, setEditValid] = useState(false);

  const sig = SignatureCanvas({ width: 600, height: 100 });

  if (!propD) return <Section><div style={{ color: _.muted }}>Proposal not found</div></Section>;
  const pricing = propD.pricing || {};

  const propDCats = Object.entries(propD.scope).filter(([, items]) => items.some(x => x.on));
  const propCT = (sc, c) => sc[c].filter(i => i.on).reduce((t, i) => t + i.rate * i.qty, 0);

  const co = settings.companyName || "iBuild";
  const coDetail = [settings.abn ? `ABN ${settings.abn}` : "", settings.address || "", settings.contactPhone || "", settings.contactEmail || ""].filter(Boolean).join("  ·  ");

  const printEl = () => {
    if (!propRef.current) return;
    const w = window.open("", "_blank");
    if (!w) { notify("Pop-up blocked — please allow pop-ups for this site", "error"); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${propD.name} — ${co}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>${PRINT_CSS}</style></head><body>${propRef.current.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  const validDays = propD.validDays || settings.defaultValidDays || 30;
  const paymentDays = settings.defaultPaymentTermsDays || 14;

  return (
    <Section>
      {/* ── Toolbar (not printed) ── */}
      <div style={{ display: "flex", alignItems: "center", gap: _.s2, marginBottom: _.s5 }}>
        <button onClick={() => navigate("../proposals")} style={btnGhost}><ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back</button>
        {editName ? (
          <input autoFocus style={{ ...input, fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.semi, padding: "2px 8px", maxWidth: 260 }}
            value={propD.name} onChange={e => up(pr => { pr.proposals[idx].name = e.target.value; return pr; })}
            onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setEditName(false); }}
            onBlur={() => setEditName(false)}
          />
        ) : (
          <span onClick={() => setEditName(true)} style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.semi, cursor: "text" }}>{propD.name}</span>
        )}
        <span style={badge(propD.status === "signed" ? _.green : propD.status === "declined" ? _.red : propD.status === "sent" ? _.blue : _.amber)}>{propD.status}</span>
        <div style={{ flex: 1 }} />
        <div onClick={() => { if (confirm(`Delete "${propD.name}"?`)) { up(pr => { pr.proposals.splice(idx, 1); return pr; }); navigate("../proposals"); } }}
          style={{ cursor: "pointer", color: _.faint, transition: "color 0.15s", padding: 4 }}
          onMouseEnter={e => e.currentTarget.style.color = _.red}
          onMouseLeave={e => e.currentTarget.style.color = _.faint}
        ><X size={16} /></div>
        <button onClick={printEl} style={btnGhost}><Printer size={14} /> Print / Save PDF</button>
      </div>

      {/* ── Status buttons ── */}
      <div style={{ display: "flex", gap: _.s2, marginBottom: _.s5 }}>
        {["draft", "sent", "signed", "declined"].map(s => (
          <div key={s} onClick={() => { up(pr => { pr.proposals[idx].status = s; return pr; }); log(`Proposal → ${s}`); notify(`Marked ${s}`); }}
            style={{ padding: "6px 14px", borderRadius: _.rFull, fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, cursor: "pointer", background: propD.status === s ? `${(s === "signed" ? _.green : s === "declined" ? _.red : s === "sent" ? _.blue : _.amber)}14` : _.well, color: propD.status === s ? (s === "signed" ? _.green : s === "declined" ? _.red : s === "sent" ? _.blue : _.amber) : _.muted, transition: "all 0.15s" }}>{s}</div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          PRINTABLE PROPOSAL DOCUMENT
          ══════════════════════════════════════════════════ */}
      <div ref={propRef} className="printRoot" style={{ background: "#fff", fontFamily: "'Inter',sans-serif", borderRadius: _.r, overflow: "hidden", border: `1px solid ${_.line}`, padding: "36px 44px 28px" }}>
        <style dangerouslySetInnerHTML={{ __html: PREVIEW_CSS }} />

        {/* ── Header ── */}
        <div className="printHeader avoidBreak">
          <div className="hdrLeft">
            {settings.logo ? (
              <img src={settings.logo} alt="" className="hdrLogo" />
            ) : (
              <div className="hdrFallback">i</div>
            )}
            <div>
              <div className="hdrCompany">{co}</div>
              {coDetail && <div className="hdrCompanyDetail">{coDetail}</div>}
            </div>
          </div>
          <div className="hdrRight">
            <div className="hdrDocType">Proposal / Quotation</div>
            <div className="hdrQuoteNum">{propD.id || propD.name}</div>
          </div>
        </div>

        {/* ── Client + Site meta ── */}
        <div className="metaGrid avoidBreak">
          <div className="metaBlock">
            <div className="metaLabel">Prepared For</div>
            <div className="metaValueLg">{propD.client}</div>
            {propD.address && <div className="metaValueSm">{propD.address}{propD.suburb ? `, ${propD.suburb}` : ""}</div>}
          </div>
          <div className="metaBlock">
            <div className="metaLabel">Project</div>
            <div className="metaValue">{propD.type || "—"}{propD.stories ? ` · ${propD.stories}` : ""}</div>
            {propD.area && <div className="metaValueSm">{propD.area}m² approx.</div>}
          </div>
        </div>

        {/* ── Summary strip ── */}
        <div className="summaryStrip avoidBreak">
          <div className="summaryCell">
            <div className="summaryLabel">Date</div>
            <div className="summaryVal">{propD.date}</div>
          </div>
          <div className="summaryCell">
            <div className="summaryLabel">Valid For</div>
            <div className="summaryVal">{validDays} days</div>
          </div>
          <div className="summaryCell">
            <div className="summaryLabel">Payment Terms</div>
            <div className="summaryVal">{paymentDays} days</div>
          </div>
          <div className="summaryCell">
            <div className="summaryLabel">Total (inc GST)</div>
            <div className="summaryValBold">{fmt(pricing.total)}</div>
          </div>
        </div>

        {/* ── Brief / notes ── */}
        {propD.notes && (
          <div className="briefBlock avoidBreak">
            <div className="briefLabel">Project Brief</div>
            <div className="briefText">{propD.type}{propD.area ? ` · ${propD.area}m²` : ""}. {propD.notes}</div>
          </div>
        )}

        {/* ── Scope of Works ── */}
        <div className="scopeHeading printSectionTitle">Scope of Works</div>
        {propDCats.map(([cat, items], ci) => {
          const catItems = items.filter(i2 => i2.on);
          return (
            <div key={cat} className="printSection" style={{ marginBottom: 8 }}>
              <div className="catHeader printSectionTitle">
                <span><span className="catNum">{String(ci + 1).padStart(2, "0")}</span>{cat}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(propCT(propD.scope, cat))}</span>
              </div>
              <table className="scopeTable">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Unit</th>
                    <th>Rate</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item, ix) => (
                    <tr key={ix}>
                      <td>{item.item}</td>
                      <td>{item.unit}</td>
                      <td>{fmt(item.rate)}</td>
                      <td>×{item.qty}</td>
                      <td>{fmt(item.rate * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* ── Totals + Terms + Acceptance (grouped to avoid page splits) ── */}
        <div className="printEndBlock">
        <div className="printTotals avoidBreak">
          <div className="totalsBox">
            <div className="totalsRow"><span>Subtotal</span><span>{fmt(pricing.sub)}</span></div>
            <div className="totalsRow"><span>Margin ({pricing.margin}%)</span><span>{fmt(pricing.mar)}</span></div>
            <div className="totalsRow"><span>Contingency ({pricing.contingency}%)</span><span>{fmt(pricing.con)}</span></div>
            <div className="totalsRow"><span>GST (10%)</span><span>{fmt(pricing.gst)}</span></div>
            <div className="totalsGrand"><span>Total (inc GST)</span><span>{fmt(pricing.total)}</span></div>
          </div>
        </div>

        {/* ── Terms ── */}
        <div className="printTerms">
          <div className="termsHeading">Terms & Conditions</div>
          <ul className="termsList">
            <li><strong>Validity:</strong> This quotation is valid for {validDays} days from the date above.</li>
            <li><strong>Deposit:</strong> 5% deposit required upon acceptance to secure commencement.</li>
            <li><strong>Progress Claims:</strong> Progress claims issued per milestone, payable within {paymentDays} days.</li>
            <li><strong>Variations:</strong> Any scope changes require a written Variation Order (VO) and will be priced separately.</li>
            <li><strong>Insurance:</strong> Builder carries full public liability and contract works insurance.</li>
            <li><strong>Defects Liability:</strong> 13-week defects liability period from practical completion.</li>
            <li><strong>Exclusions:</strong> Unless specifically listed above, all other works are excluded from this quotation.</li>
          </ul>
        </div>

        {/* ── Acceptance ── */}
        <div className="printAcceptance">
          <div className="acceptHeading">Acceptance</div>
          <div className="acceptText">I/We accept the scope and pricing above and authorise {co} to proceed with the works as described.</div>
          <div className="sigGrid">
            <div className="sigBlock">
              <div className="sigLabel">Client</div>
              {propD.sigData ? (
                <div>
                  <img src={propD.sigData} alt="" style={{ maxHeight: 32 }} />
                  <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>Signed</div>
                </div>
              ) : (
                <>
                  <div className="sigLine" />
                  <div className="sigDate">Name: __________________________ &nbsp;&nbsp; Date: ____ / ____ / ________</div>
                </>
              )}
            </div>
            <div className="sigBlock">
              <div className="sigLabel">Builder ({co})</div>
              <div className="sigLine" />
              <div className="sigDate">Name: __________________________ &nbsp;&nbsp; Date: ____ / ____ / ________</div>
            </div>
          </div>
        </div>
        </div>{/* end printEndBlock */}

        {/* ── Footer ── */}
        <div className="printFooter">
          <span>{co}{settings.abn ? ` · ABN ${settings.abn}` : ""}{settings.address ? ` · ${settings.address}` : ""}</span>
          <span>{settings.contactPhone || settings.contactEmail || ""}</span>
        </div>
      </div>

      {/* ── Signature capture (not printed) ── */}
      {!propD.sigData && (
        <div style={{ marginTop: _.s5 }}>
          <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, marginBottom: _.s2 }}>Client signature</div>
          <div style={{ background: "#fff", borderRadius: _.rXs, touchAction: "none", overflow: "hidden", border: `1.5px solid ${_.line2}` }}>
            <canvas ref={sig.refCb} width={sig.width} height={sig.height} style={{ width: "100%", height: 100, cursor: "crosshair" }} {...sig.handlers} />
          </div>
          <div style={{ display: "flex", gap: _.s2, marginTop: _.s2 }}>
            <button onClick={() => {
              const data = sig.getData(); if (!data) return;
              up(pr => { pr.proposals[idx].sigData = data; pr.proposals[idx].status = "signed"; return pr; });
              log("Proposal signed"); notify("Signed");
            }} style={{ padding: "9px 18px", background: _.ac, color: "#fff", border: "none", borderRadius: _.rSm, fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, cursor: "pointer" }}>Confirm</button>
            <button onClick={() => sig.clear()} style={{ padding: "9px 18px", background: _.surface, color: _.body, border: `1.5px solid ${_.line}`, borderRadius: _.rSm, fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, cursor: "pointer" }}>Clear</button>
          </div>
        </div>
      )}
      {propD.sigData && <div style={{ marginTop: _.s5, padding: `${_.s3}px`, background: `${_.green}0a`, borderRadius: _.rXs, fontSize: _.fontSize.base, color: _.green, fontWeight: _.fontWeight.medium, display: "flex", alignItems: "center", gap: 4 }}><Check size={13} /> Client signed</div>}
    </Section>
  );
}
