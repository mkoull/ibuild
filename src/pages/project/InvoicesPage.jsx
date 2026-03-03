import { useMemo, useState } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, label, badge, uid } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { Receipt, Plus, Send, DollarSign } from "lucide-react";

const CLAIM_STATUS_COLORS = { Draft: _.muted, Issued: _.amber, Paid: _.green };
const INVOICE_STATUS_COLORS = { Unpaid: _.amber, Paid: _.green, Void: _.faint };

export default function InvoicesPage() {
  const { project: p, update: up, T, log } = useProject();
  const { mobile, notify } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({ title: "", amount: "" });

  const claims = p.claims || [];
  const invoices = p.invoices || [];
  const contractValue = Number(p?.job?.contract?.currentContractValue || T.curr || 0);
  const totalClaimed = claims.reduce((t, c) => t + (Number(c.amount) || 0), 0);
  const totalPaid = invoices
    .filter((inv) => String(inv.status || "").toLowerCase() === "paid")
    .reduce((t, inv) => t + (Number(inv.amount) || 0), 0);
  const remainingToClaim = contractValue - totalClaimed;
  const outstandingReceivables = totalClaimed - totalPaid;
  const claimPct = contractValue > 0 ? Math.min(100, Math.max(0, (totalClaimed / contractValue) * 100)) : 0;

  const createClaim = () => {
    const amount = Number(claimForm.amount) || 0;
    if (!claimForm.title.trim() || amount <= 0) {
      notify("Title and amount are required", "error");
      return;
    }
    if (amount > remainingToClaim) {
      notify("Amount cannot exceed remaining to claim", "error");
      return;
    }
    up((pr) => {
      if (!Array.isArray(pr.claims)) pr.claims = [];
      const claimNumber = `CLM-${String(pr.claims.length + 1).padStart(3, "0")}`;
      pr.claims.push({
        id: uid(),
        number: claimNumber,
        title: claimForm.title.trim(),
        amount,
        status: "Draft",
        createdAt: new Date().toISOString(),
      });
    });
    log(`Claim created: ${claimForm.title} (${fmt(amount)})`);
    notify("Claim created");
    setClaimForm({ title: "", amount: "" });
    setCreateOpen(false);
  };

  const issueClaim = (claimId) => {
    up((pr) => {
      const claim = (pr.claims || []).find((c) => c.id === claimId);
      if (!claim || claim.status !== "Draft") return;
      if (!Array.isArray(pr.invoices)) pr.invoices = [];
      claim.status = "Issued";
      const invoiceNumber = `INV-${String(pr.invoices.length + 1).padStart(3, "0")}`;
      pr.invoices.push({
        id: uid(),
        claimId: claim.id,
        number: invoiceNumber,
        amount: claim.amount,
        issuedDate: new Date().toISOString().split("T")[0],
        paidDate: "",
        status: "Unpaid",
        title: claim.title,
      });
    });
    notify("Claim issued and invoice created");
  };

  const markInvoicePaid = (invoiceId) => {
    up((pr) => {
      const inv = (pr.invoices || []).find((x) => x.id === invoiceId);
      if (!inv || inv.status === "Paid") return;
      inv.status = "Paid";
      inv.paidDate = new Date().toISOString().split("T")[0];
      const claim = (pr.claims || []).find((c) => c.id === inv.claimId);
      if (claim) claim.status = "Paid";
    });
    notify("Invoice marked paid");
  };

  const invoiceByClaimId = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => { if (inv.claimId) map[inv.claimId] = inv; });
    return map;
  }, [invoices]);

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>
        Progress Claims & Invoicing
      </h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s4 }}>
        Contract: {fmt(contractValue)} • Claimed: {fmt(totalClaimed)} • Paid: {fmt(totalPaid)}
      </div>

      <div style={{ height: 6, background: _.well, borderRadius: 3, marginBottom: _.s2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${claimPct}%`, background: _.ac, borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, color: _.muted, marginBottom: _.s6, paddingBottom: _.s5, borderBottom: `1px solid ${_.line}` }}>
        <span>{claimPct.toFixed(1)}% claimed</span>
        <span>{fmt(remainingToClaim)} remaining to claim</span>
      </div>

      <div style={{ display: "flex", gap: _.s5, marginBottom: _.s5, flexWrap: "wrap" }}>
        <div><div style={label}>Outstanding Receivables</div><div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, color: outstandingReceivables > 0 ? _.red : _.green }}>{fmt(outstandingReceivables)}</div></div>
        <div><div style={label}>Invoices</div><div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold }}>{invoices.length}</div></div>
        <div><Button icon={Plus} onClick={() => setCreateOpen(true)}>Create Claim</Button></div>
      </div>

      {claims.length === 0 ? (
        <Empty icon={Receipt} title="No claims yet" text="Create a claim to start progress invoicing." action={() => setCreateOpen(true)} actionText="Create Claim" />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "120px 1fr 120px 120px 180px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
            <span>Claim #</span>
            <span>Title</span>
            {!mobile && <span style={{ textAlign: "right" }}>Amount</span>}
            <span style={{ textAlign: "center" }}>Status</span>
            {!mobile && <span style={{ textAlign: "right" }}>Actions</span>}
          </div>
          {claims.map((claim) => {
            const linkedInvoice = invoiceByClaimId[claim.id];
            return (
              <div key={claim.id} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "120px 1fr 120px 120px 180px", gap: _.s2, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center" }}>
                <span style={{ fontWeight: _.fontWeight.semi }}>{claim.number}</span>
                <div>
                  <div style={{ fontWeight: _.fontWeight.medium }}>{claim.title}</div>
                  {mobile && <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{fmt(claim.amount)}</div>}
                </div>
                {!mobile && <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{fmt(claim.amount)}</span>}
                <div style={{ textAlign: "center" }}>
                  <span style={badge(CLAIM_STATUS_COLORS[claim.status] || _.muted)}>{claim.status}</span>
                </div>
                {!mobile && (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2 }}>
                    {claim.status === "Draft" && (
                      <Button size="sm" variant="secondary" icon={Send} onClick={() => issueClaim(claim.id)}>
                        Issue
                      </Button>
                    )}
                    {linkedInvoice?.status === "Unpaid" && (
                      <Button size="sm" variant="secondary" icon={DollarSign} onClick={() => markInvoicePaid(linkedInvoice.id)}>
                        Mark Paid
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {invoices.length > 0 && (
        <div style={{ marginTop: _.s7 }}>
          <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s3 }}>
            Generated Invoices
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "120px 120px 1fr 120px 120px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
            <span>Invoice #</span>
            {!mobile && <span>Claim #</span>}
            <span>Amount</span>
            <span style={{ textAlign: "center" }}>Status</span>
            {!mobile && <span style={{ textAlign: "right" }}>Paid Date</span>}
          </div>
          {invoices.map((inv) => (
            <div key={inv.id} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "120px 120px 1fr 120px 120px", gap: _.s2, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center" }}>
              <span style={{ fontWeight: _.fontWeight.semi }}>{inv.number || inv.id}</span>
              {!mobile && <span style={{ color: _.muted }}>{claims.find((c) => c.id === inv.claimId)?.number || "—"}</span>}
              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{fmt(inv.amount)}</span>
              <div style={{ textAlign: "center" }}><span style={badge(INVOICE_STATUS_COLORS[inv.status] || _.muted)}>{inv.status}</span></div>
              {!mobile && <span style={{ textAlign: "right", color: _.muted }}>{inv.paidDate || "—"}</span>}
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Claim" width={460}>
        <div style={{ display: "grid", gap: _.s3 }}>
          <div>
            <label style={label}>Title *</label>
            <input style={input} value={claimForm.title} onChange={(e) => setClaimForm((v) => ({ ...v, title: e.target.value }))} placeholder="Progress Claim 1" />
          </div>
          <div>
            <label style={label}>Amount *</label>
            <input type="number" style={input} value={claimForm.amount} onChange={(e) => setClaimForm((v) => ({ ...v, amount: e.target.value }))} />
          </div>
          <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>
            Remaining to claim: <strong>{fmt(remainingToClaim)}</strong>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2, marginTop: _.s5 }}>
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={createClaim}>Create</Button>
        </div>
      </Modal>
    </Section>
  );
}
