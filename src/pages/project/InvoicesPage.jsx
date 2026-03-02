import { useState, useMemo } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, label, badge, uid, ds } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { Receipt, ArrowRight, AlertTriangle, X, Send, DollarSign, Printer, Plus, ClipboardList } from "lucide-react";

const TABS = ["Invoices", "Claims"];
const TYPES = ["Deposit", "Progress", "Final", "Variation"];
const STATUS_COLOR = { draft: _.muted, sent: _.amber, pending: _.amber, paid: _.green, void: _.faint };
const STATUS_LABEL = { draft: "Draft", sent: "Sent", pending: "Sent", paid: "Paid", void: "Void" };
const CLAIM_COLOR = { Planned: _.muted, Invoiced: _.amber, Paid: _.green };

export default function InvoicesPage() {
  const { project: p, update: up, T, log } = useProject();
  const { mobile, notify, settings } = useApp();

  const [tab, setTab] = useState("Invoices");
  const [form, setForm] = useState({ type: "Progress", title: "", amount: "", percent: "", dueAt: "" });
  const [overModal, setOverModal] = useState(null);
  const [deleteIdx, setDeleteIdx] = useState(null);

  // Claims state
  const [claimForm, setClaimForm] = useState({ label: "", percent: "", amount: "", dueOn: "contract", milestoneIdx: "" });
  const [claimModal, setClaimModal] = useState(false);
  const [deleteClaimIdx, setDeleteClaimIdx] = useState(null);

  const milestones = p.schedule || [];
  const paymentSchedule = p.paymentSchedule || [];
  const retentionPct = p.retentionPercent || 0;
  const retentionHeld = T.curr > 0 ? T.curr * (retentionPct / 100) : 0;

  // Derive claim amounts from percent where applicable
  const resolvedClaims = useMemo(() =>
    paymentSchedule.map(c => ({
      ...c,
      resolvedAmount: c.percent ? Math.round(T.curr * (c.percent / 100) * 100) / 100 : (c.amount || 0),
    })),
    [paymentSchedule, T.curr],
  );

  const totalClaimPct = paymentSchedule.reduce((s, c) => s + (c.percent || 0), 0);
  const totalClaimAmt = resolvedClaims.reduce((s, c) => s + c.resolvedAmount, 0);

  const contractBase = T.curr;
  const setAmountFromPct = (pctStr) => {
    const pct = parseFloat(pctStr);
    if (!pctStr && pctStr !== "0") { setForm(f => ({ ...f, percent: "", amount: "" })); return; }
    const amt = contractBase > 0 && !isNaN(pct) ? Math.round(contractBase * (pct / 100) * 100) / 100 : "";
    setForm(f => ({ ...f, percent: pctStr, amount: amt !== "" ? String(amt) : "" }));
  };
  const setPctFromAmount = (amtStr) => {
    const amt = parseFloat(amtStr);
    if (!amtStr && amtStr !== "0") { setForm(f => ({ ...f, amount: "", percent: "" })); return; }
    const pct = contractBase > 0 && !isNaN(amt) ? Math.round((amt / contractBase) * 100 * 100) / 100 : "";
    setForm(f => ({ ...f, amount: amtStr, percent: pct !== "" ? String(pct) : "" }));
  };

  // ─── INVOICE HANDLERS ───
  const createInvoice = (force) => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { notify("Enter a valid amount", "error"); return; }
    if (!force && T.inv + amt > T.curr && T.curr > 0) { setOverModal({ amt }); return; }
    up(pr => {
      pr.invoices.push({
        id: `INV-${uid()}`,
        type: form.type,
        title: form.title || `${form.type} claim ${pr.invoices.length + 1}`,
        amount: amt,
        status: "draft",
        issuedAt: ds(),
        dueAt: form.dueAt || "",
      });
      return pr;
    });
    log(`Invoice created: ${form.title || form.type} (${fmt(amt)})`);
    notify(`Invoice created — ${fmt(amt)}`);
    setForm({ type: "Progress", title: "", amount: "", percent: "", dueAt: "" });
    setOverModal(null);
  };

  const setStatus = (i, newStatus) => {
    up(pr => {
      const inv = pr.invoices[i];
      inv.status = newStatus;
      if (!pr.actuals) pr.actuals = [];
      if (!pr.paymentSchedule) pr.paymentSchedule = [];

      if (newStatus === "paid") {
        inv.paidAt = ds();
        const existing = pr.actuals.find(a => a.invoiceId === inv.id);
        if (!existing) {
          pr.actuals.push({ id: uid(), description: `Payment: ${inv.title || inv.desc || inv.id}`, amount: inv.amount, date: ds(), source: "Invoice", invoiceId: inv.id });
        }
        const linked = pr.paymentSchedule.find(c => c.invoiceId === inv.id);
        if (linked) linked.status = "Paid";
      }

      if (newStatus === "void") {
        pr.actuals = pr.actuals.filter(a => a.invoiceId !== inv.id);
        const linked = pr.paymentSchedule.find(c => c.invoiceId === inv.id);
        if (linked) { linked.status = "Planned"; linked.invoiceId = undefined; }
      }

      if (newStatus === "sent") inv.issuedAt = inv.issuedAt || ds();
      return pr;
    });
    const inv = p.invoices[i];
    log(`Invoice ${STATUS_LABEL[newStatus]}: ${inv.title} (${fmt(inv.amount)})`);
    notify(`${inv.title} → ${STATUS_LABEL[newStatus]}`);
  };

  // ─── CLAIM HANDLERS ───
  const addClaimStage = () => {
    const pct = parseFloat(claimForm.percent) || 0;
    const amt = parseFloat(claimForm.amount) || 0;
    if (!claimForm.label) { notify("Label required", "error"); return; }
    if (!pct && !amt) { notify("Percent or amount required", "error"); return; }

    if (pct && totalClaimPct + pct > 100) { notify(`Total % would be ${totalClaimPct + pct}% — exceeds 100%`, "error"); return; }

    up(pr => {
      if (!pr.paymentSchedule) pr.paymentSchedule = [];
      const msIdx = claimForm.dueOn === "milestone" && claimForm.milestoneIdx !== "" ? parseInt(claimForm.milestoneIdx) : undefined;
      pr.paymentSchedule.push({
        id: uid(),
        label: claimForm.label,
        percent: pct || undefined,
        amount: pct ? undefined : amt,
        dueOn: claimForm.dueOn,
        milestoneIdx: msIdx,
        milestoneId: msIdx != null && milestones[msIdx] ? milestones[msIdx].id : undefined,
        status: "Planned",
      });
      return pr;
    });
    log(`Claim stage added: ${claimForm.label}`);
    notify("Claim stage added");
    setClaimForm({ label: "", percent: "", amount: "", dueOn: "contract", milestoneIdx: "" });
    setClaimModal(false);
  };

  const createInvoiceFromClaim = (claimIdx) => {
    const claim = resolvedClaims[claimIdx];
    if (!claim || claim.status !== "Planned") return;

    up(pr => {
      const invId = `INV-${uid()}`;
      const invType = claim.label.toLowerCase().includes("deposit") ? "Deposit" : claim.label.toLowerCase().includes("final") ? "Final" : "Progress";
      pr.invoices.push({
        id: invId,
        type: invType,
        title: claim.label,
        amount: claim.resolvedAmount,
        status: "draft",
        issuedAt: ds(),
        dueAt: "",
        claimStageId: claim.id,
      });
      pr.paymentSchedule[claimIdx].status = "Invoiced";
      pr.paymentSchedule[claimIdx].invoiceId = invId;
      return pr;
    });
    log(`Invoice from claim: ${claim.label} (${fmt(claim.resolvedAmount)})`);
    notify(`Invoice created from ${claim.label}`);
    setTab("Invoices");
  };

  const removeClaimStage = () => {
    if (deleteClaimIdx === null) return;
    const claim = paymentSchedule[deleteClaimIdx];
    if (claim && claim.status !== "Planned") { notify("Can only delete Planned claims", "error"); setDeleteClaimIdx(null); return; }
    up(pr => { pr.paymentSchedule.splice(deleteClaimIdx, 1); return pr; });
    notify("Claim stage removed");
    setDeleteClaimIdx(null);
  };

  // ─── DERIVED VALUES ───
  const invPct = T.curr > 0 ? Math.min((T.inv / T.curr) * 100, 100) : 0;
  const remaining = T.curr - T.inv;

  const clientName = p.client || "";
  const clientAddr = [p.address, p.suburb].filter(Boolean).join(", ");
  const co = settings.companyName || "iBuild";
  const coDetails = [co, settings.abn ? `ABN ${settings.abn}` : "", settings.address || "", settings.contactPhone || "", settings.contactEmail || ""].filter(Boolean).join(" · ");

  const printInvoice = (inv) => {
    const w = window.open("", "_blank");
    if (!w) { notify("Pop-up blocked", "error"); return; }
    const logoHtml = settings.logo ? `<img src="${settings.logo}" style="max-height:36px;max-width:140px" />` : "";
    const payDays = settings.defaultPaymentTermsDays || 14;
    const gstAmt = Math.round((inv.amount || 0) / 11);
    const exGst = (inv.amount || 0) - gstAmt;
    const css = `@page{size:A4;margin:14mm 12mm 16mm}*{margin:0;padding:0;box-sizing:border-box}html,body{height:auto!important;font-family:'Inter',-apple-system,sans-serif;color:#0f172a;font-size:12px;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.root{padding:36px 44px 28px}.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #0f172a}.hdrLeft{display:flex;align-items:center;gap:12px}.coName{font-size:16px;font-weight:700}.coDetail{font-size:10px;color:#64748b;margin-top:2px}.docType{font-size:9px;letter-spacing:0.12em;font-weight:700;color:#94a3b8;text-transform:uppercase}.docNum{font-size:16px;font-weight:700;margin-top:2px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #e2e8f0;margin-top:20px}.metaL,.metaR{padding:16px 0}.metaR{padding-left:20px;border-left:1px solid #e2e8f0}.ml{font-size:9px;letter-spacing:0.08em;font-weight:600;color:#94a3b8;text-transform:uppercase;margin-bottom:4px}.mv{font-size:13px;font-weight:500}.mvLg{font-size:18px;font-weight:700;letter-spacing:-0.02em}.mvSm{font-size:11px;color:#64748b;margin-top:2px}table{width:100%;border-collapse:collapse;margin-top:20px}th{font-size:9px;letter-spacing:0.06em;font-weight:600;color:#94a3b8;text-transform:uppercase;padding:6px 0;text-align:left;border-bottom:1px solid #e2e8f0}td{padding:8px 0;font-size:12px;border-bottom:1px solid #f1f5f9}.tRight{text-align:right}table .bold{font-weight:600}.totBox{width:260px;margin-left:auto;margin-top:16px;border:1.5px solid #e2e8f0;border-radius:6px;overflow:hidden}.tRow{display:flex;justify-content:space-between;padding:6px 14px;font-size:11px;color:#64748b;font-variant-numeric:tabular-nums}.tRow+.tRow{border-top:1px solid #f1f5f9}.tGrand{display:flex;justify-content:space-between;padding:10px 14px;font-size:16px;font-weight:700;background:#f8fafc;border-top:2px solid #0f172a;font-variant-numeric:tabular-nums}.terms{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;line-height:1.8}.ft{margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${inv.id} — ${co}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>${css}</style></head><body><div class="root"><div class="hdr"><div class="hdrLeft">${logoHtml}<div><div class="coName">${co}</div>${coDetails ? `<div class="coDetail">${coDetails}</div>` : ""}</div></div><div style="text-align:right"><div class="docType">Tax Invoice</div><div class="docNum">${inv.id}</div></div></div><div class="meta"><div class="metaL"><div class="ml">Bill To</div><div class="mvLg">${clientName}</div>${clientAddr ? `<div class="mvSm">${clientAddr}</div>` : ""}</div><div class="metaR"><div class="ml">Invoice Details</div><div class="mv">${inv.title || inv.desc || "—"}</div><div class="mvSm">Type: ${inv.type || "Progress"}</div></div></div><table><thead><tr><th>Description</th><th class="tRight">Amount</th></tr></thead><tbody><tr><td>${inv.title || "Progress claim"} — ${inv.type || "Progress"}</td><td class="tRight bold">${fmt(inv.amount)}</td></tr></tbody></table><div class="totBox"><div class="tRow"><span>Subtotal (ex GST)</span><span>${fmt(exGst)}</span></div><div class="tRow"><span>GST</span><span>${fmt(gstAmt)}</span></div><div class="tGrand"><span>Total (inc GST)</span><span>${fmt(inv.amount)}</span></div></div><div class="meta" style="margin-top:20px"><div class="metaL"><div class="ml">Issued</div><div class="mv">${inv.issuedAt || inv.date || "—"}</div></div><div class="metaR"><div class="ml">Due Date</div><div class="mv">${inv.dueAt || "—"}</div></div></div><div class="terms">Payment terms: ${payDays} days from date of invoice. Please reference <strong>${inv.id}</strong> with payment.<br>Bank details available on request.</div><div class="ft"><span>${co}${settings.abn ? ` · ABN ${settings.abn}` : ""}${settings.address ? ` · ${settings.address}` : ""}</span><span>${settings.contactPhone || settings.contactEmail || ""}</span></div></div></body></html>`;
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Invoices</h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s5 }}>Progress claims and payment tracking</div>

      {/* Summary row */}
      <div style={{ display: "flex", gap: mobile ? _.s4 : _.s7, marginBottom: _.s5, alignItems: "baseline", flexWrap: "wrap" }}>
        <div><div style={label}>Contract</div><div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</div></div>
        <div><div style={{ ...label, color: _.ac }}>Invoiced</div><div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: _.ac, fontVariantNumeric: "tabular-nums" }}>{fmt(T.inv)}</div></div>
        <div><div style={{ ...label, color: T.outstanding > 0 ? _.red : _.muted }}>Outstanding</div><div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: T.outstanding > 0 ? _.red : _.faint, fontVariantNumeric: "tabular-nums" }}>{T.outstanding > 0 ? fmt(T.outstanding) : "—"}</div></div>
        <div><div style={{ ...label, color: _.green }}>Paid</div><div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: _.green, fontVariantNumeric: "tabular-nums" }}>{fmt(T.paid)}</div></div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: _.well, borderRadius: 3, marginBottom: _.s2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${invPct}%`, background: invPct >= 100 ? _.green : _.ac, borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, color: _.muted, marginBottom: _.s6, paddingBottom: _.s5, borderBottom: `1px solid ${_.line}` }}>
        <span>{invPct.toFixed(1)}% invoiced</span><span>{remaining > 0 ? `${fmt(remaining)} remaining` : "Fully invoiced"}</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${_.line}`, marginBottom: _.s6 }}>
        {TABS.map(t => (
          <div key={t} onClick={() => setTab(t)} style={{
            padding: `${_.s3}px ${_.s4}px`, cursor: "pointer",
            fontSize: _.fontSize.base, fontWeight: tab === t ? _.fontWeight.semi : _.fontWeight.normal,
            color: tab === t ? _.ink : _.muted,
            borderBottom: tab === t ? `2px solid ${_.ink}` : "2px solid transparent",
            marginBottom: -2, transition: `all ${_.tr}`,
          }}>{t}{t === "Claims" && paymentSchedule.length > 0 ? ` (${paymentSchedule.length})` : ""}</div>
        ))}
      </div>

      {/* ═══ INVOICES TAB ═══ */}
      {tab === "Invoices" && (
        <>
          {/* Create invoice */}
          <div style={{ marginBottom: _.s7, paddingBottom: _.s7, borderBottom: `1px solid ${_.line}` }}>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s4 }}>New Invoice</div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "120px 1fr 90px 140px 130px", gap: `${_.s3}px ${_.s4}px`, marginBottom: _.s2 }}>
              <div>
                <label style={label}>Type</label>
                <select style={{ ...input, cursor: "pointer" }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Title</label>
                <input style={input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={`${form.type} claim`} />
              </div>
              <div>
                <label style={label}>% of contract</label>
                <input type="number" step="0.01" min="0" max="100" style={{ ...input, textAlign: "center", fontWeight: _.fontWeight.semi }} value={form.percent} onChange={e => setAmountFromPct(e.target.value)} placeholder="10" />
              </div>
              <div>
                <label style={label}>Amount (inc GST) *</label>
                <input type="number" style={input} value={form.amount} onChange={e => setPctFromAmount(e.target.value)} placeholder="25000" />
              </div>
              <div>
                <label style={label}>Due date</label>
                <input type="date" style={{ ...input, cursor: "pointer" }} value={form.dueAt} onChange={e => setForm({ ...form, dueAt: e.target.value })} />
              </div>
            </div>
            {contractBase > 0 && (
              <div style={{ fontSize: _.fontSize.sm, color: _.faint, marginBottom: _.s3 }}>
                % of contract value: <strong style={{ color: _.muted }}>{fmt(contractBase)}</strong>
                {form.amount && remaining > 0 ? <span> · Remaining after this: {fmt(remaining - (parseFloat(form.amount) || 0))}</span> : null}
              </div>
            )}
            {form.amount && T.curr > 0 && T.inv + (parseFloat(form.amount) || 0) > T.curr && (
              <div style={{ display: "flex", alignItems: "center", gap: _.s2, fontSize: _.fontSize.base, color: _.red, marginBottom: _.s3 }}>
                <AlertTriangle size={13} /> This will exceed the contract value by {fmt(T.inv + (parseFloat(form.amount) || 0) - T.curr)}
              </div>
            )}
            <Button icon={ArrowRight} onClick={() => createInvoice(false)}>Create invoice</Button>
          </div>

          {/* Invoice list */}
          {p.invoices.length === 0 && <Empty icon={Receipt} text="No invoices yet" />}
          {p.invoices.length > 0 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "auto 1fr 80px 50px 100px 80px 160px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
                <span>ID</span><span>Title</span>
                {!mobile && <><span>Type</span><span style={{ textAlign: "right" }}>%</span><span style={{ textAlign: "right" }}>Amount</span><span style={{ textAlign: "center" }}>Status</span><span></span></>}
              </div>
              {p.invoices.map((inv, i) => {
                const isDraft = inv.status === "draft";
                const isSent = inv.status === "sent" || inv.status === "pending";
                const isPaid = inv.status === "paid";
                const isVoid = inv.status === "void";
                return (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "auto 1fr 80px 50px 100px 80px 160px", gap: _.s2,
                    padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center",
                    opacity: isVoid ? 0.5 : 1, transition: `background ${_.tr}`,
                  }}
                    onMouseEnter={e => { if (!isVoid) e.currentTarget.style.background = _.well; }}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.bold, color: _.ink, fontVariantNumeric: "tabular-nums" }}>{inv.id}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, color: _.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {inv.title || inv.desc || "—"}
                      </div>
                      <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 1 }}>
                        {inv.issuedAt || inv.date || "—"}{inv.dueAt ? ` · Due ${inv.dueAt}` : ""}
                      </div>
                    </div>
                    {!mobile && (
                      <>
                        <span style={{ fontSize: _.fontSize.sm, color: _.body }}>{inv.type || "Progress"}</span>
                        <span style={{ textAlign: "right", fontSize: _.fontSize.sm, color: _.muted, fontVariantNumeric: "tabular-nums" }}>{contractBase > 0 ? `${(((inv.amount || 0) / contractBase) * 100).toFixed(1)}%` : "—"}</span>
                        <span style={{ textAlign: "right", fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(inv.amount)}</span>
                        <div style={{ textAlign: "center" }}>
                          <span style={badge(STATUS_COLOR[inv.status] || _.muted)}>{STATUS_LABEL[inv.status] || inv.status}</span>
                        </div>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          {isDraft && <Button variant="secondary" size="sm" icon={Send} onClick={() => setStatus(i, "sent")}>Send</Button>}
                          {isSent && <Button variant="secondary" size="sm" icon={DollarSign} onClick={() => setStatus(i, "paid")} style={{ color: _.green }}>Paid</Button>}
                          {!isVoid && !isPaid && <Button variant="ghost" size="sm" onClick={() => setStatus(i, "void")} style={{ color: _.faint }}>Void</Button>}
                          {(isSent || isPaid) && <div onClick={() => printInvoice(inv)} style={{ cursor: "pointer", color: _.faint, padding: 4, display: "flex", alignItems: "center", transition: `color ${_.tr}` }} onMouseEnter={e => e.currentTarget.style.color = _.ink} onMouseLeave={e => e.currentTarget.style.color = _.faint}><Printer size={13} /></div>}
                          {isDraft && <div onClick={() => setDeleteIdx(i)} style={{ cursor: "pointer", color: _.faint, padding: 4, display: "flex", alignItems: "center", transition: `color ${_.tr}` }} onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>}
                        </div>
                      </>
                    )}
                    {mobile && (
                      <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                        <span style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(inv.amount)}</span>
                        <span style={badge(STATUS_COLOR[inv.status] || _.muted)}>{STATUS_LABEL[inv.status] || inv.status}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </>
      )}

      {/* ═══ CLAIMS TAB ═══ */}
      {tab === "Claims" && (
        <>
          {/* Retention info */}
          <div style={{ display: "flex", gap: mobile ? _.s4 : _.s6, marginBottom: _.s5, alignItems: "baseline", flexWrap: "wrap" }}>
            <div>
              <div style={label}>Scheduled</div>
              <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>
                {totalClaimPct > 0 ? `${totalClaimPct}%` : fmt(totalClaimAmt)}
              </div>
            </div>
            <div>
              <div style={label}>Remaining</div>
              <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.curr > 0 && totalClaimAmt > T.curr ? _.red : _.muted }}>
                {T.curr > 0 ? fmt(T.curr - totalClaimAmt) : "—"}
              </div>
            </div>
            {retentionPct > 0 && (
              <div>
                <div style={label}>Retention ({retentionPct}%)</div>
                <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: _.amber }}>{fmt(retentionHeld)}</div>
              </div>
            )}
          </div>

          {/* Retention setting */}
          <div style={{ display: "flex", alignItems: "center", gap: _.s3, marginBottom: _.s6, paddingBottom: _.s5, borderBottom: `1px solid ${_.line}` }}>
            <label style={{ ...label, marginBottom: 0 }}>Retention %</label>
            <input type="number" style={{ ...input, width: 80 }} value={retentionPct || ""} placeholder="0" onChange={e => {
              const v = parseFloat(e.target.value) || 0;
              up(pr => { pr.retentionPercent = v; return pr; });
            }} />
          </div>

          {/* Add claim button */}
          <div style={{ marginBottom: _.s5 }}>
            <Button icon={Plus} onClick={() => setClaimModal(true)}>Add claim stage</Button>
          </div>

          {/* Claims table */}
          {resolvedClaims.length === 0 ? (
            <Empty icon={ClipboardList} text="No payment schedule defined" />
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto auto" : "1fr 70px 100px 140px 80px 130px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
                <span>Stage</span>
                {!mobile && <span style={{ textAlign: "right" }}>%</span>}
                {!mobile && <span style={{ textAlign: "right" }}>Amount</span>}
                {!mobile && <span>Trigger</span>}
                <span style={{ textAlign: "center" }}>Status</span>
                <span style={{ textAlign: "right" }}>Action</span>
              </div>
              {resolvedClaims.map((c, i) => {
                const msMatch = c.dueOn === "milestone"
                  ? (c.milestoneId ? milestones.find(m => m.id === c.milestoneId) : null) || (c.milestoneIdx != null ? milestones[c.milestoneIdx] : null)
                  : null;
                const msName = msMatch ? msMatch.name : null;
                return (
                  <div key={c.id} style={{
                    display: "grid", gridTemplateColumns: mobile ? "1fr auto auto" : "1fr 70px 100px 140px 80px 130px", gap: _.s2,
                    padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: _.fontSize.base,
                    opacity: c.status === "Paid" ? 0.7 : 1,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: _.fontWeight.medium, color: _.ink }}>{c.label}</div>
                      {mobile && <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{c.percent ? `${c.percent}%` : ""} · {fmt(c.resolvedAmount)}</div>}
                    </div>
                    {!mobile && <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: _.muted }}>{c.percent ? `${c.percent}%` : "—"}</span>}
                    {!mobile && <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(c.resolvedAmount)}</span>}
                    {!mobile && (
                      <span style={{ fontSize: _.fontSize.sm, color: _.body }}>
                        {c.dueOn === "milestone" && msName ? `Milestone: ${msName}` : "On contract"}
                      </span>
                    )}
                    <div style={{ textAlign: "center" }}>
                      <span style={badge(CLAIM_COLOR[c.status] || _.muted)}>{c.status}</span>
                    </div>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      {c.status === "Planned" && (
                        <>
                          <Button variant="secondary" size="sm" icon={Receipt} onClick={() => createInvoiceFromClaim(i)}>Invoice</Button>
                          <div onClick={() => setDeleteClaimIdx(i)} style={{ cursor: "pointer", color: _.faint, padding: 4, display: "flex", alignItems: "center", transition: `color ${_.tr}` }} onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                        </>
                      )}
                      {c.status === "Invoiced" && <span style={{ fontSize: _.fontSize.sm, color: _.muted }}>{c.invoiceId}</span>}
                      {c.status === "Paid" && <span style={{ fontSize: _.fontSize.sm, color: _.green }}>Complete</span>}
                    </div>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "flex-end", padding: `${_.s3}px 0`, fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold }}>
                Total: {fmt(totalClaimAmt)}{totalClaimPct > 0 ? ` (${totalClaimPct}%)` : ""}
              </div>
            </>
          )}
        </>
      )}

      {/* ─── Add Claim Modal ─── */}
      <Modal open={claimModal} onClose={() => setClaimModal(false)} title="Add Claim Stage" width={480}>
        <div style={{ display: "flex", flexDirection: "column", gap: _.s4 }}>
          <div>
            <label style={label}>Label *</label>
            <input style={input} value={claimForm.label} onChange={e => setClaimForm({ ...claimForm, label: e.target.value })} placeholder="e.g. Deposit, Stage 1, Final" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s3 }}>
            <div>
              <label style={label}>% of contract</label>
              <input type="number" step="0.01" min="0" max="100" style={{ ...input, textAlign: "center", fontWeight: _.fontWeight.semi }} value={claimForm.percent} onChange={e => {
                const pctStr = e.target.value;
                const pct = parseFloat(pctStr);
                const amt = contractBase > 0 && !isNaN(pct) ? Math.round(contractBase * (pct / 100) * 100) / 100 : "";
                setClaimForm(f => ({ ...f, percent: pctStr, amount: amt !== "" ? String(amt) : "" }));
              }} placeholder="10" />
            </div>
            <div>
              <label style={label}>Amount (inc GST)</label>
              <input type="number" style={input} value={claimForm.amount} onChange={e => {
                const amtStr = e.target.value;
                const amt = parseFloat(amtStr);
                const pct = contractBase > 0 && !isNaN(amt) ? Math.round((amt / contractBase) * 100 * 100) / 100 : "";
                setClaimForm(f => ({ ...f, amount: amtStr, percent: pct !== "" ? String(pct) : "" }));
              }} placeholder="50000" />
            </div>
          </div>
          {contractBase > 0 && (
            <div style={{ fontSize: _.fontSize.sm, color: _.faint }}>
              % of contract value: <strong style={{ color: _.muted }}>{fmt(contractBase)}</strong>
            </div>
          )}
          <div>
            <label style={label}>Trigger</label>
            <select style={{ ...input, cursor: "pointer" }} value={claimForm.dueOn} onChange={e => setClaimForm({ ...claimForm, dueOn: e.target.value })}>
              <option value="contract">On contract</option>
              <option value="milestone">On milestone</option>
            </select>
          </div>
          {claimForm.dueOn === "milestone" && (
            <div>
              <label style={label}>Milestone</label>
              {milestones.length === 0 ? (
                <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>No milestones defined. Add them in Schedule.</div>
              ) : (
                <select style={{ ...input, cursor: "pointer" }} value={claimForm.milestoneIdx} onChange={e => setClaimForm({ ...claimForm, milestoneIdx: e.target.value })}>
                  <option value="">— Select —</option>
                  {milestones.map((m, i) => <option key={i} value={i}>{m.name}</option>)}
                </select>
              )}
            </div>
          )}
          {totalClaimPct + (parseFloat(claimForm.percent) || 0) > 100 && claimForm.percent && (
            <div style={{ display: "flex", alignItems: "center", gap: _.s2, fontSize: _.fontSize.sm, color: _.red }}>
              <AlertTriangle size={12} /> Total would exceed 100% ({totalClaimPct + (parseFloat(claimForm.percent) || 0)}%)
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end", marginTop: _.s6 }}>
          <Button variant="ghost" onClick={() => setClaimModal(false)}>Cancel</Button>
          <Button onClick={addClaimStage}>Add stage</Button>
        </div>
      </Modal>

      {/* Over-invoice confirmation modal */}
      <Modal open={!!overModal} onClose={() => setOverModal(null)} title="Over-invoice Warning" width={440}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: _.s3, marginBottom: _.s5 }}>
          <AlertTriangle size={20} color={_.red} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: _.fontSize.md, color: _.body, lineHeight: _.lineHeight.body, marginBottom: _.s2 }}>
              This invoice of <strong>{overModal ? fmt(overModal.amt) : ""}</strong> will bring the invoiced total above the contract value of <strong>{fmt(T.curr)}</strong>.
            </div>
            <div style={{ fontSize: _.fontSize.base, color: _.muted }}>
              Total invoiced will be {overModal ? fmt(T.inv + overModal.amt) : ""} ({overModal && T.curr > 0 ? ((T.inv + overModal.amt) / T.curr * 100).toFixed(1) : 0}% of contract).
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setOverModal(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => createInvoice(true)}>Create anyway</Button>
        </div>
      </Modal>

      {/* Delete invoice modal */}
      <Modal open={deleteIdx !== null} onClose={() => setDeleteIdx(null)} title="Delete Invoice" width={400}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, marginBottom: _.s6 }}>
          Delete <strong>{deleteIdx !== null && p.invoices[deleteIdx] ? (p.invoices[deleteIdx].title || p.invoices[deleteIdx].desc) : ""}</strong>?
        </div>
        <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDeleteIdx(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            const inv = p.invoices[deleteIdx];
            up(pr => {
              if (inv.claimStageId && pr.paymentSchedule) {
                const linked = pr.paymentSchedule.find(c => c.invoiceId === inv.id);
                if (linked) { linked.status = "Planned"; linked.invoiceId = undefined; }
              }
              pr.invoices.splice(deleteIdx, 1);
              return pr;
            });
            log(`Invoice deleted: ${inv?.title || inv?.desc || inv?.id}`);
            notify("Deleted");
            setDeleteIdx(null);
          }}>Delete</Button>
        </div>
      </Modal>

      {/* Delete claim modal */}
      <Modal open={deleteClaimIdx !== null} onClose={() => setDeleteClaimIdx(null)} title="Delete Claim Stage" width={400}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, marginBottom: _.s6 }}>
          Delete <strong>{deleteClaimIdx !== null && paymentSchedule[deleteClaimIdx] ? paymentSchedule[deleteClaimIdx].label : ""}</strong>?
        </div>
        <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDeleteClaimIdx(null)}>Cancel</Button>
          <Button variant="danger" onClick={removeClaimStage}>Delete</Button>
        </div>
      </Modal>
    </Section>
  );
}
