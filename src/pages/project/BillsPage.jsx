import { useState, useMemo, useRef, useCallback } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { commitmentRemaining } from "../../lib/calc.js";
import { extractBillFields, extractTextFromPdfBase64 } from "../../lib/extractBill.js";
import _ from "../../theme/tokens.js";
import { fmt, input, label, badge, uid, ds } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import {
  FileText, Plus, X, Send, DollarSign, AlertTriangle, Upload, Inbox,
  CheckCircle, Eye, Trash2, FileUp, Search,
} from "lucide-react";

const STATUS_COLOR = { Draft: _.muted, Approved: _.amber, Paid: _.green, Void: _.faint };
const EXTRACT_BADGE = { ready: _.green, partial: _.amber, failed: _.faint, pending: _.muted };
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function BillsPage() {
  const { project: p, update: up, T, log } = useProject();
  const { trades, mobile, notify } = useApp();

  const [activeTab, setActiveTab] = useState("inbox");
  const [showAdd, setShowAdd] = useState(false);
  const [billForm, setBillForm] = useState({ vendorName: "", billNumber: "", date: ds(), dueDate: "", subtotal: "", gst: "", notes: "" });
  const [lines, setLines] = useState([]);
  const [openBill, setOpenBill] = useState(null);
  const [overMatch, setOverMatch] = useState(null);
  const [previewUpload, setPreviewUpload] = useState(null);
  const [reviewUpload, setReviewUpload] = useState(null);
  const [dupWarning, setDupWarning] = useState(null);
  const fileInputRef = useRef(null);

  const bills = p.supplierBills || [];
  const uploads = p.billUploads || [];
  const commitments = (p.commitments || []).filter(c => c.status === "Committed" || c.status === "approved");

  const inboxItems = useMemo(() => uploads.filter(u => u.status !== "processed"), [uploads]);
  const processedCount = useMemo(() => uploads.filter(u => u.status === "processed").length, [uploads]);

  const tradeName = (tradeId) => {
    if (!tradeId) return "—";
    const t = (trades || []).find(x => x.id === tradeId);
    return t ? (t.businessName || t.name || "Trade") : "Unknown";
  };

  const billTotals = useMemo(() => {
    const all = bills.filter(b => b.status !== "Void");
    return {
      count: all.length,
      total: all.reduce((s, b) => s + (b.total || 0), 0),
      draft: bills.filter(b => b.status === "Draft").reduce((s, b) => s + (b.total || 0), 0),
      approved: bills.filter(b => b.status === "Approved").reduce((s, b) => s + (b.total || 0), 0),
      paid: bills.filter(b => b.status === "Paid").reduce((s, b) => s + (b.total || 0), 0),
    };
  }, [bills]);

  // ─── Line management ───
  const addLine = () => setLines([...lines, { id: uid(), tradeId: "", costCode: "", description: "", amount: "", commitmentId: "" }]);
  const updateLine = (i, k, v) => { const next = [...lines]; next[i] = { ...next[i], [k]: v }; setLines(next); };
  const removeLine = (i) => setLines(lines.filter((_, idx) => idx !== i));

  const commitRemaining = (cId) => {
    const c = commitments.find(x => x.id === cId);
    if (!c) return null;
    return commitmentRemaining(c, bills);
  };

  // ─── Upload handling ───
  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        notify(`${file.name} exceeds 5 MB limit`, "error");
        return;
      }
      const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        notify(`${file.name}: only PDF, JPG, PNG accepted`, "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;

        let extracted = null;
        let extractionStatus = "needs_manual";
        if (file.type === "application/pdf") {
          const text = extractTextFromPdfBase64(dataUrl);
          if (text && text.trim().length > 20) {
            extracted = extractBillFields(text);
            extractionStatus = extracted.confidence;
          }
        }

        up(pr => {
          if (!pr.billUploads) pr.billUploads = [];
          pr.billUploads.push({
            id: uid(),
            filename: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileData: dataUrl,
            uploadedAt: new Date().toISOString(),
            status: "unprocessed",
            extractionStatus,
            extracted,
            billId: null,
          });
          return pr;
        });
        log(`Bill uploaded: ${file.name}`);
        notify(`${file.name} uploaded`);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setActiveTab("inbox");
  }, [up, log, notify]);

  // ─── Review & Create Bill from upload ───
  const startReview = (uploadItem) => {
    const ext = uploadItem.extracted || {};
    setBillForm({
      vendorName: ext.supplier || "",
      billNumber: ext.invoiceNumber || "",
      date: ext.date || ds(),
      dueDate: ext.dueDate || "",
      subtotal: ext.subtotal ? String(ext.subtotal) : "",
      gst: ext.gst ? String(ext.gst) : "",
      notes: "",
    });
    const totalAmt = ext.total || 0;
    if (totalAmt > 0 && !ext.subtotal) {
      setLines([{ id: uid(), tradeId: "", costCode: "", description: uploadItem.filename, amount: String(totalAmt), commitmentId: "" }]);
    } else {
      setLines([{ id: uid(), tradeId: "", costCode: "", description: "", amount: "", commitmentId: "" }]);
    }
    setReviewUpload(uploadItem);
    setShowAdd(true);
    setActiveTab("bills");
  };

  const deleteUpload = (uploadId) => {
    up(pr => {
      pr.billUploads = (pr.billUploads || []).filter(u => u.id !== uploadId);
      return pr;
    });
    notify("Upload removed");
  };

  // ─── Duplicate detection ───
  const checkDuplicate = (vendor, billNum, total, date) => {
    for (const b of bills) {
      if (b.status === "Void") continue;
      if (vendor && billNum && b.vendorName === vendor && b.billNumber === billNum) {
        return { type: "exact", bill: b };
      }
      if (total > 0 && date && Math.abs(b.total - total) < 0.01 && b.date === date) {
        return { type: "similar", bill: b };
      }
    }
    return null;
  };

  // ─── Create bill ───
  const createBill = (forceOverMatch, forceDuplicate) => {
    if (!billForm.vendorName) { notify("Vendor name required", "error"); return; }
    const parsed = lines.map(l => ({ ...l, amount: parseFloat(l.amount) || 0 })).filter(l => l.amount > 0 && l.description);
    if (parsed.length === 0) { notify("At least one line required", "error"); return; }

    const total = parsed.reduce((s, l) => s + l.amount, 0);

    if (!forceDuplicate) {
      const dup = checkDuplicate(billForm.vendorName, billForm.billNumber, total, billForm.date);
      if (dup) {
        setDupWarning({ dup, total });
        return;
      }
    }

    if (!forceOverMatch) {
      for (const l of parsed) {
        if (l.commitmentId) {
          const r = commitRemaining(l.commitmentId);
          if (r && l.amount > r.remaining) {
            setOverMatch({ line: l, remaining: r.remaining, excess: l.amount - r.remaining });
            return;
          }
        }
      }
    }

    const billId = uid();
    up(pr => {
      if (!pr.supplierBills) pr.supplierBills = [];
      pr.supplierBills.push({
        id: billId,
        vendorName: billForm.vendorName,
        billNumber: billForm.billNumber,
        date: billForm.date || ds(),
        dueDate: billForm.dueDate || "",
        status: "Draft",
        lines: parsed,
        total,
        notes: billForm.notes || "",
        uploadId: reviewUpload ? reviewUpload.id : undefined,
        createdAt: new Date().toISOString(),
      });

      if (reviewUpload) {
        const idx = (pr.billUploads || []).findIndex(u => u.id === reviewUpload.id);
        if (idx !== -1) {
          pr.billUploads[idx].status = "processed";
          pr.billUploads[idx].billId = billId;
        }
      }
      return pr;
    });
    log(`Bill from ${billForm.vendorName}: ${fmt(total)}`);
    notify(`Bill created — ${fmt(total)}`);
    setBillForm({ vendorName: "", billNumber: "", date: ds(), dueDate: "", subtotal: "", gst: "", notes: "" });
    setLines([]);
    setShowAdd(false);
    setOverMatch(null);
    setDupWarning(null);
    setReviewUpload(null);
  };

  // ─── Status changes ───
  const setBillStatus = (billIdx, newStatus) => {
    up(pr => {
      const bill = pr.supplierBills[billIdx];
      const oldStatus = bill.status;
      bill.status = newStatus;
      if (!pr.actuals) pr.actuals = [];

      if (newStatus === "Paid") {
        bill.paidAt = ds();
        bill.lines.forEach(l => {
          pr.actuals.push({
            id: uid(),
            tradeId: l.tradeId || undefined,
            costCode: l.costCode || undefined,
            description: `Bill ${bill.billNumber || bill.id}: ${l.description}`,
            amount: l.amount,
            date: ds(),
            source: "Bill",
            billId: bill.id,
          });
        });
      }

      if (newStatus === "Void") {
        pr.actuals = pr.actuals.filter(a => a.billId !== bill.id);
      }

      if (oldStatus === "Paid" && newStatus !== "Paid" && newStatus !== "Void") {
        pr.actuals = pr.actuals.filter(a => a.billId !== bill.id);
      }

      return pr;
    });
    const bill = bills[billIdx];
    log(`Bill ${bill.billNumber || bill.id} → ${newStatus}`);
    notify(`${bill.vendorName} bill → ${newStatus}`);
  };

  // ─── Detail view ───
  const detail = openBill !== null ? bills[openBill] : null;
  const detailUpload = detail && detail.uploadId
    ? uploads.find(u => u.id === detail.uploadId) : null;

  // ─── Tab definitions ───
  const tabs = [
    { key: "inbox", label: "Inbox", count: inboxItems.length },
    { key: "bills", label: "Bills", count: bills.length },
  ];

  return (
    <Section>
      <div style={{ display: "flex", alignItems: mobile ? "flex-start" : "center", justifyContent: "space-between", marginBottom: _.s2, flexDirection: mobile ? "column" : "row", gap: _.s3 }}>
        <div>
          <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Supplier Bills</h1>
          <div style={{ fontSize: _.fontSize.md, color: _.muted }}>Upload, review and manage accounts payable</div>
        </div>
        <div style={{ display: "flex", gap: _.s2 }}>
          <Button icon={Upload} variant="secondary" onClick={() => fileInputRef.current?.click()}>Upload bill</Button>
          <Button icon={Plus} onClick={() => { setShowAdd(true); setReviewUpload(null); if (lines.length === 0) addLine(); setActiveTab("bills"); }}>Add bill</Button>
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple style={{ display: "none" }} onChange={handleFileUpload} />
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: mobile ? _.s2 : _.s3, marginBottom: _.s6 }}>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Total Bills</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: billTotals.total > 0 ? _.ink : _.faint }}>{billTotals.total > 0 ? fmt(billTotals.total) : "—"}</div>
        </Card>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Awaiting Approval</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: billTotals.draft > 0 ? _.amber : _.faint }}>{billTotals.draft > 0 ? fmt(billTotals.draft) : "—"}</div>
        </Card>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Approved</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: billTotals.approved > 0 ? _.amber : _.faint }}>{billTotals.approved > 0 ? fmt(billTotals.approved) : "—"}</div>
        </Card>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Paid</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: billTotals.paid > 0 ? _.green : _.faint }}>{billTotals.paid > 0 ? fmt(billTotals.paid) : "—"}</div>
        </Card>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${_.line}`, marginBottom: _.s6 }}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: `${_.s3}px ${_.s4}px`, cursor: "pointer",
            fontSize: _.fontSize.base, fontWeight: activeTab === t.key ? _.fontWeight.semi : _.fontWeight.normal,
            color: activeTab === t.key ? _.ink : _.muted,
            borderBottom: activeTab === t.key ? `2px solid ${_.ink}` : "2px solid transparent",
            marginBottom: -2, transition: `all ${_.tr}`, display: "flex", alignItems: "center", gap: 6,
          }}>
            {t.key === "inbox" && <Inbox size={14} />}
            {t.key === "bills" && <FileText size={14} />}
            {t.label}
            {t.count > 0 && (
              <span style={{
                fontSize: _.fontSize.xs, fontWeight: _.fontWeight.bold,
                background: t.key === "inbox" && t.count > 0 ? _.ac : _.well,
                color: t.key === "inbox" && t.count > 0 ? "#fff" : _.muted,
                padding: "1px 7px", borderRadius: _.rFull, minWidth: 18, textAlign: "center",
              }}>{t.count}</span>
            )}
          </div>
        ))}
      </div>

      {/* ═══════════════════════ INBOX TAB ═══════════════════════ */}
      {activeTab === "inbox" && (
        <>
          {inboxItems.length === 0 && (
            <Empty icon={Inbox} text="No unprocessed uploads">
              <div style={{ marginTop: _.s3 }}>
                <Button variant="secondary" icon={Upload} onClick={() => fileInputRef.current?.click()}>Upload a bill</Button>
              </div>
            </Empty>
          )}

          {inboxItems.length > 0 && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: mobile ? "1fr auto" : "1fr 120px 120px 90px 180px",
                gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`,
                fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi,
                letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
              }}>
                <span>File</span>
                {!mobile && <span>Uploaded</span>}
                {!mobile && <span>Extracted Total</span>}
                {!mobile && <span>Status</span>}
                <span style={{ textAlign: "right" }}>Actions</span>
              </div>
              {inboxItems.map(item => {
                const ext = item.extracted || {};
                const statusLabel = item.extractionStatus === "ready" ? "Ready"
                  : item.extractionStatus === "partial" ? "Partial"
                  : "Needs manual";
                const statusColor = EXTRACT_BADGE[item.extractionStatus] || EXTRACT_BADGE.failed;
                return (
                  <div key={item.id} style={{
                    display: "grid",
                    gridTemplateColumns: mobile ? "1fr auto" : "1fr 120px 120px 90px 180px",
                    gap: _.s2, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`,
                    alignItems: "center", fontSize: _.fontSize.base, transition: `background ${_.tr}`,
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = _.well}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: _.s2 }}>
                      <FileUp size={16} color={_.muted} style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: _.fontWeight.medium, color: _.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.filename}</div>
                        {mobile && (
                          <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>
                            {ext.supplier || "—"} · {ext.total ? fmt(ext.total) : "—"}
                          </div>
                        )}
                      </div>
                    </div>
                    {!mobile && (
                      <span style={{ fontSize: _.fontSize.sm, color: _.body }}>
                        {new Date(item.uploadedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                      </span>
                    )}
                    {!mobile && (
                      <span style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: ext.total ? _.ink : _.faint }}>
                        {ext.total ? fmt(ext.total) : "—"}
                      </span>
                    )}
                    {!mobile && (
                      <span style={badge(statusColor)}>{statusLabel}</span>
                    )}
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <Button variant="secondary" size="sm" icon={Search} onClick={() => startReview(item)}>Review</Button>
                      <div onClick={() => setPreviewUpload(item)} style={{ cursor: "pointer", color: _.faint, padding: 4, display: "flex", alignItems: "center", transition: `color ${_.tr}` }} onMouseEnter={e => e.currentTarget.style.color = _.ink} onMouseLeave={e => e.currentTarget.style.color = _.faint}>
                        <Eye size={14} />
                      </div>
                      <div onClick={() => deleteUpload(item.id)} style={{ cursor: "pointer", color: _.faint, padding: 4, display: "flex", alignItems: "center", transition: `color ${_.tr}` }} onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}>
                        <Trash2 size={14} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Extraction summary for non-empty inbox */}
          {inboxItems.length > 0 && (
            <div style={{ fontSize: _.fontSize.sm, color: _.faint, marginTop: _.s4, padding: `${_.s3}px 0`, borderTop: `1px solid ${_.line}` }}>
              {inboxItems.filter(u => u.extractionStatus === "ready").length} ready for review ·
              {" "}{inboxItems.filter(u => u.extractionStatus === "partial").length} partial ·
              {" "}{inboxItems.filter(u => u.extractionStatus === "needs_manual" || u.extractionStatus === "failed").length} need manual entry
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════ BILLS TAB ═══════════════════════ */}
      {activeTab === "bills" && (
        <>
          {/* ─── Add bill form ─── */}
          {showAdd && (
            <div style={{ marginBottom: _.s7, paddingBottom: _.s7, borderBottom: `1px solid ${_.line}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: _.s3, marginBottom: _.s4 }}>
                <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase" }}>
                  {reviewUpload ? "Review & Create Bill" : "New Supplier Bill"}
                </div>
                {reviewUpload && (
                  <span style={{ fontSize: _.fontSize.sm, color: _.ac }}>
                    from: {reviewUpload.filename}
                  </span>
                )}
              </div>

              {/* If reviewing, show attachment preview */}
              {reviewUpload && reviewUpload.fileData && (
                <div style={{ marginBottom: _.s4, padding: _.s3, background: _.well, borderRadius: _.rSm, display: "flex", alignItems: "center", gap: _.s3 }}>
                  <FileUp size={16} color={_.muted} />
                  <span style={{ fontSize: _.fontSize.sm, color: _.body, flex: 1 }}>{reviewUpload.filename}</span>
                  <Button variant="ghost" size="sm" icon={Eye} onClick={() => setPreviewUpload(reviewUpload)}>View</Button>
                </div>
              )}

              {/* Extracted fields notice */}
              {reviewUpload && reviewUpload.extracted && reviewUpload.extractionStatus !== "failed" && (
                <div style={{ marginBottom: _.s4, padding: `${_.s2}px ${_.s3}px`, background: `${_.green}0A`, border: `1px solid ${_.green}30`, borderRadius: _.rSm, fontSize: _.fontSize.sm, color: _.green, display: "flex", alignItems: "center", gap: _.s2 }}>
                  <CheckCircle size={14} />
                  Fields pre-filled from document. Please verify before saving.
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 130px 130px", gap: `${_.s3}px ${_.s4}px`, marginBottom: _.s5 }}>
                <div>
                  <label style={label}>Vendor *</label>
                  <input style={input} value={billForm.vendorName} onChange={e => setBillForm({ ...billForm, vendorName: e.target.value })} placeholder="ABC Plumbing" />
                </div>
                <div>
                  <label style={label}>Bill / Invoice #</label>
                  <input style={input} value={billForm.billNumber} onChange={e => setBillForm({ ...billForm, billNumber: e.target.value })} placeholder="INV-001" />
                </div>
                <div>
                  <label style={label}>Date</label>
                  <input type="date" style={{ ...input, cursor: "pointer" }} value={billForm.date} onChange={e => setBillForm({ ...billForm, date: e.target.value })} />
                </div>
                <div>
                  <label style={label}>Due date</label>
                  <input type="date" style={{ ...input, cursor: "pointer" }} value={billForm.dueDate} onChange={e => setBillForm({ ...billForm, dueDate: e.target.value })} />
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: _.s5 }}>
                <label style={label}>Notes</label>
                <input style={input} value={billForm.notes} onChange={e => setBillForm({ ...billForm, notes: e.target.value })} placeholder="Optional notes" />
              </div>

              {/* Bill lines */}
              <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s3 }}>Lines</div>
              {lines.map((l, i) => (
                <div key={l.id} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "140px 70px 1fr 100px 160px 28px", gap: `${_.s2}px ${_.s3}px`, marginBottom: _.s3, alignItems: mobile ? "stretch" : "end" }}>
                  <div>
                    {i === 0 && <label style={label}>Trade</label>}
                    <select style={{ ...input, cursor: "pointer" }} value={l.tradeId} onChange={e => updateLine(i, "tradeId", e.target.value)}>
                      <option value="">—</option>
                      {(trades || []).map(t => <option key={t.id} value={t.id}>{t.businessName || t.name || t.id}</option>)}
                    </select>
                  </div>
                  <div>
                    {i === 0 && <label style={label}>Code</label>}
                    <input style={input} value={l.costCode} onChange={e => updateLine(i, "costCode", e.target.value)} placeholder="01" />
                  </div>
                  <div>
                    {i === 0 && <label style={label}>Description *</label>}
                    <input style={input} value={l.description} onChange={e => updateLine(i, "description", e.target.value)} placeholder="Labour" />
                  </div>
                  <div>
                    {i === 0 && <label style={label}>Amount *</label>}
                    <input type="number" style={input} value={l.amount} onChange={e => updateLine(i, "amount", e.target.value)} placeholder="3000" />
                  </div>
                  <div>
                    {i === 0 && <label style={label}>Match to PO</label>}
                    <select style={{ ...input, cursor: "pointer", fontSize: _.fontSize.sm }} value={l.commitmentId} onChange={e => updateLine(i, "commitmentId", e.target.value)}>
                      <option value="">— None —</option>
                      {commitments.filter(c => !l.tradeId || c.tradeId === l.tradeId).map(c => {
                        const r = commitRemaining(c.id);
                        return <option key={c.id} value={c.id}>{(c.vendorName || c.vendor || "PO")} — {fmt(c.amount)} (rem: {r ? fmt(r.remaining) : "—"})</option>;
                      })}
                    </select>
                  </div>
                  <div onClick={() => removeLine(i)} style={{ cursor: "pointer", color: _.faint, display: "flex", alignItems: "center", justifyContent: "center", marginTop: i === 0 ? 18 : 0, transition: `color ${_.tr}` }} onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                </div>
              ))}
              <div style={{ display: "flex", gap: _.s3, alignItems: "center", marginBottom: _.s4 }}>
                <Button variant="secondary" size="sm" icon={Plus} onClick={addLine}>Add line</Button>
                {lines.length > 0 && (
                  <span style={{ fontSize: _.fontSize.sm, color: _.muted }}>
                    Total: <strong style={{ color: _.ink }}>{fmt(lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0))}</strong>
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: _.s2 }}>
                <Button onClick={() => createBill(false, false)}>{reviewUpload ? "Create bill from upload" : "Create bill"}</Button>
                <Button variant="ghost" onClick={() => { setShowAdd(false); setLines([]); setReviewUpload(null); }}>Cancel</Button>
              </div>
            </div>
          )}

          {/* ─── Bills list ─── */}
          {bills.length === 0 && !showAdd && <Empty icon={FileText} text="No supplier bills yet" />}
          {bills.length > 0 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr auto 100px 100px 80px 130px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
                <span>Vendor</span>
                {!mobile && <span>Bill #</span>}
                {!mobile && <span>Date</span>}
                {!mobile && <span style={{ textAlign: "right" }}>Total</span>}
                <span style={{ textAlign: "center" }}>Status</span>
                {!mobile && <span></span>}
              </div>
              {bills.map((bill, i) => {
                const isVoid = bill.status === "Void";
                const hasAttachment = !!bill.uploadId;
                return (
                  <div key={bill.id} style={{
                    display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "1fr auto 100px 100px 80px 130px", gap: _.s2,
                    padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center",
                    fontSize: _.fontSize.base, opacity: isVoid ? 0.5 : 1, transition: `background ${_.tr}`, cursor: "pointer",
                  }}
                    onClick={() => setOpenBill(i)}
                    onMouseEnter={e => e.currentTarget.style.background = _.well}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: _.s2 }}>
                      <div>
                        <div style={{ fontWeight: _.fontWeight.medium, color: _.ink }}>{bill.vendorName}</div>
                        {mobile && <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{bill.billNumber || "—"} · {fmt(bill.total)}</div>}
                      </div>
                      {hasAttachment && <FileUp size={12} color={_.faint} />}
                    </div>
                    {!mobile && <span style={{ fontSize: _.fontSize.sm, color: _.body }}>{bill.billNumber || "—"}</span>}
                    {!mobile && <span style={{ fontSize: _.fontSize.sm, color: _.body }}>{bill.date || "—"}</span>}
                    {!mobile && <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(bill.total)}</span>}
                    <div style={{ textAlign: "center" }} onClick={e => e.stopPropagation()}>
                      <span style={badge(STATUS_COLOR[bill.status] || _.muted)}>{bill.status}</span>
                    </div>
                    {!mobile && (
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                        {bill.status === "Draft" && <Button variant="secondary" size="sm" icon={Send} onClick={() => setBillStatus(i, "Approved")}>Approve</Button>}
                        {bill.status === "Approved" && <Button variant="secondary" size="sm" icon={DollarSign} onClick={() => setBillStatus(i, "Paid")} style={{ color: _.green }}>Pay</Button>}
                        {bill.status !== "Void" && bill.status !== "Paid" && <Button variant="ghost" size="sm" onClick={() => setBillStatus(i, "Void")} style={{ color: _.faint }}>Void</Button>}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </>
      )}

      {/* ─── Bill detail modal ─── */}
      <Modal open={detail !== null} onClose={() => setOpenBill(null)} title={detail ? `${detail.vendorName} — ${detail.billNumber || detail.id}` : ""} width={640}>
        {detail && (
          <div>
            <div style={{ display: "flex", gap: _.s5, marginBottom: _.s5, flexWrap: "wrap" }}>
              <div><div style={label}>Date</div><div style={{ fontWeight: _.fontWeight.semi }}>{detail.date || "—"}</div></div>
              {detail.dueDate && <div><div style={label}>Due</div><div style={{ fontWeight: _.fontWeight.semi }}>{detail.dueDate}</div></div>}
              <div><div style={label}>Total</div><div style={{ fontWeight: _.fontWeight.bold, fontSize: _.fontSize.xl, fontVariantNumeric: "tabular-nums" }}>{fmt(detail.total)}</div></div>
              <div><div style={label}>Status</div><span style={badge(STATUS_COLOR[detail.status])}>{detail.status}</span></div>
            </div>

            {detail.notes && (
              <div style={{ fontSize: _.fontSize.sm, color: _.body, marginBottom: _.s4, padding: `${_.s2}px ${_.s3}px`, background: _.well, borderRadius: _.rSm }}>{detail.notes}</div>
            )}

            {detailUpload && (
              <div style={{ display: "flex", alignItems: "center", gap: _.s2, marginBottom: _.s4, padding: `${_.s2}px ${_.s3}px`, background: _.well, borderRadius: _.rSm }}>
                <FileUp size={14} color={_.muted} />
                <span style={{ fontSize: _.fontSize.sm, color: _.body, flex: 1 }}>{detailUpload.filename}</span>
                <Button variant="ghost" size="sm" icon={Eye} onClick={() => { setOpenBill(null); setPreviewUpload(detailUpload); }}>View</Button>
              </div>
            )}

            <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Lines</div>
            <div style={{ display: "grid", gridTemplateColumns: "80px 50px 1fr 80px 100px", gap: _.s1, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi }}>
              <span>Trade</span><span>Code</span><span>Description</span><span style={{ textAlign: "right" }}>Amount</span><span>PO Match</span>
            </div>
            {(detail.lines || []).map((l, i) => (
              <div key={l.id || i} style={{ display: "grid", gridTemplateColumns: "80px 50px 1fr 80px 100px", gap: _.s1, padding: `${_.s2}px 0`, borderBottom: `1px solid ${_.line}`, fontSize: _.fontSize.sm }}>
                <span style={{ color: _.muted }}>{tradeName(l.tradeId)}</span>
                <span style={{ color: _.muted }}>{l.costCode || "—"}</span>
                <span style={{ color: _.ink }}>{l.description}</span>
                <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(l.amount)}</span>
                <span style={{ color: l.commitmentId ? _.green : _.faint, fontSize: _.fontSize.xs }}>{l.commitmentId ? "Matched" : "—"}</span>
              </div>
            ))}

            <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end", marginTop: _.s5 }}>
              {detail.status === "Draft" && <Button variant="secondary" icon={Send} onClick={() => { setBillStatus(openBill, "Approved"); setOpenBill(null); }}>Approve</Button>}
              {detail.status === "Approved" && <Button icon={DollarSign} onClick={() => { setBillStatus(openBill, "Paid"); setOpenBill(null); }}>Mark Paid</Button>}
              {detail.status !== "Void" && detail.status !== "Paid" && <Button variant="ghost" onClick={() => { setBillStatus(openBill, "Void"); setOpenBill(null); }} style={{ color: _.faint }}>Void</Button>}
              <Button variant="ghost" onClick={() => setOpenBill(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── File preview modal ─── */}
      <Modal open={!!previewUpload} onClose={() => setPreviewUpload(null)} title={previewUpload ? previewUpload.filename : ""} width={720}>
        {previewUpload && (
          <div>
            {previewUpload.fileType === "application/pdf" ? (
              <iframe src={previewUpload.fileData} style={{ width: "100%", height: 500, border: "none", borderRadius: _.rSm }} title="PDF Preview" />
            ) : (
              <img src={previewUpload.fileData} alt={previewUpload.filename} style={{ width: "100%", maxHeight: 500, objectFit: "contain", borderRadius: _.rSm }} />
            )}

            {/* Extraction details */}
            {previewUpload.extracted && (
              <div style={{ marginTop: _.s4, padding: _.s3, background: _.well, borderRadius: _.rSm }}>
                <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>
                  Extracted fields
                  <span style={{ ...badge(EXTRACT_BADGE[previewUpload.extractionStatus] || _.faint), marginLeft: _.s2 }}>
                    {previewUpload.extractionStatus}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s2, fontSize: _.fontSize.sm }}>
                  <div><span style={{ color: _.muted }}>Supplier:</span> {previewUpload.extracted.supplier || "—"}</div>
                  <div><span style={{ color: _.muted }}>Invoice #:</span> {previewUpload.extracted.invoiceNumber || "—"}</div>
                  <div><span style={{ color: _.muted }}>Date:</span> {previewUpload.extracted.date || "—"}</div>
                  <div><span style={{ color: _.muted }}>Total:</span> {previewUpload.extracted.total ? fmt(previewUpload.extracted.total) : "—"}</div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end", marginTop: _.s4 }}>
              {previewUpload.status !== "processed" && (
                <Button icon={Search} onClick={() => { setPreviewUpload(null); startReview(previewUpload); }}>Review & Create Bill</Button>
              )}
              <Button variant="ghost" onClick={() => setPreviewUpload(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Over-match warning ─── */}
      <Modal open={!!overMatch} onClose={() => setOverMatch(null)} title="PO Over-match Warning" width={440}>
        {overMatch && (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: _.s3, marginBottom: _.s5 }}>
              <AlertTriangle size={20} color={_.red} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: _.fontSize.md, color: _.body, lineHeight: _.lineHeight.body, marginBottom: _.s2 }}>
                  Line &ldquo;{overMatch.line.description}&rdquo; ({fmt(overMatch.line.amount)}) exceeds PO remaining of {fmt(overMatch.remaining)} by {fmt(overMatch.excess)}.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setOverMatch(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => createBill(true, true)}>Create anyway</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Duplicate warning ─── */}
      <Modal open={!!dupWarning} onClose={() => setDupWarning(null)} title="Possible Duplicate" width={440}>
        {dupWarning && (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: _.s3, marginBottom: _.s5 }}>
              <AlertTriangle size={20} color={_.amber} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: _.fontSize.md, color: _.body, lineHeight: _.lineHeight.body, marginBottom: _.s2 }}>
                  {dupWarning.dup.type === "exact"
                    ? `A bill from "${dupWarning.dup.bill.vendorName}" with invoice # "${dupWarning.dup.bill.billNumber}" already exists (${fmt(dupWarning.dup.bill.total)}).`
                    : `A bill with the same total (${fmt(dupWarning.dup.bill.total)}) and date (${dupWarning.dup.bill.date}) already exists from "${dupWarning.dup.bill.vendorName}".`
                  }
                </div>
                <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>
                  Are you sure this is a different bill?
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setDupWarning(null)}>Cancel</Button>
              <Button onClick={() => { setDupWarning(null); createBill(true, true); }}>Create anyway</Button>
            </div>
          </div>
        )}
      </Modal>
    </Section>
  );
}
