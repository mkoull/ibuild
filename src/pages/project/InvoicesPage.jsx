import { useMemo, useState } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, label, badge, uid } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Card from "../../components/ui/Card.jsx";
import { Receipt, Plus, Send, DollarSign, AlertCircle } from "lucide-react";

const INVOICE_STATUS_COLORS = {
  Draft: _.muted,
  Sent: _.blue,
  Paid: _.green,
  Overdue: _.red,
};

const num = (v) => Number(v) || 0;
const toIsoDate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

function isOverdue(inv) {
  if (!inv?.dueDate) return false;
  const status = String(inv.status || "").toLowerCase();
  if (status === "paid" || status === "draft") return false;
  return new Date(`${inv.dueDate}T23:59:59`).getTime() < Date.now();
}

export default function InvoicesPage() {
  const { project: p, update: up, T, log } = useProject();
  const { mobile, notify } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    description: "",
    amount: "",
    invoiceDate: toIsoDate(),
    dueDate: "",
  });

  const invoices = useMemo(() => {
    return (p.invoices || []).map((inv) => {
      const status = String(inv.status || "Draft");
      const overdue = status !== "Paid" && (status === "Overdue" || isOverdue(inv));
      return overdue ? { ...inv, status: "Overdue" } : inv;
    });
  }, [p.invoices]);

  const contractValue = Number(p?.job?.contract?.currentContractValue || T.curr || 0);
  const totalInvoiced = invoices
    .filter((inv) => {
      const s = String(inv.status || "").toLowerCase();
      return s !== "draft";
    })
    .reduce((t, inv) => t + num(inv.amount), 0);
  const totalPaid = invoices
    .filter((inv) => String(inv.status || "").toLowerCase() === "paid")
    .reduce((t, inv) => t + num(inv.amount), 0);
  const remainingToInvoice = contractValue - totalInvoiced;
  const outstandingBalance = totalInvoiced - totalPaid;
  const invoicedPct = contractValue > 0 ? Math.min(100, Math.max(0, (totalInvoiced / contractValue) * 100)) : 0;

  const createInvoice = () => {
    const amount = num(invoiceForm.amount);
    if (!invoiceForm.description.trim() || amount <= 0 || !invoiceForm.invoiceDate) {
      notify("Description, amount and invoice date are required", "error");
      return;
    }
    if (amount > remainingToInvoice) {
      notify("Amount exceeds remaining to invoice", "error");
      return;
    }
    up((pr) => {
      if (!Array.isArray(pr.invoices)) pr.invoices = [];
      if (!Array.isArray(pr.claims)) pr.claims = [];

      const claim = {
        id: uid(),
        number: `CLM-${String(pr.claims.length + 1).padStart(3, "0")}`,
        title: invoiceForm.description.trim(),
        amount,
        status: "Draft",
        createdAt: new Date().toISOString(),
      };
      pr.claims.push(claim);

      pr.invoices.push({
        id: uid(),
        claimId: claim.id,
        number: `INV-${String(pr.invoices.length + 1).padStart(3, "0")}`,
        title: invoiceForm.description.trim(),
        description: invoiceForm.description.trim(),
        amount,
        invoiceDate: invoiceForm.invoiceDate,
        issuedDate: invoiceForm.invoiceDate,
        dueDate: invoiceForm.dueDate || "",
        dueAt: invoiceForm.dueDate || "",
        paidDate: "",
        status: "Draft",
        createdAt: new Date().toISOString(),
      });
    });
    log(`Invoice created: ${invoiceForm.description} (${fmt(amount)})`);
    notify("Invoice created");
    setInvoiceForm({
      description: "",
      amount: "",
      invoiceDate: toIsoDate(),
      dueDate: "",
    });
    setCreateOpen(false);
  };

  const updateInvoiceStatus = (invoiceId, status) => {
    up((pr) => {
      const inv = (pr.invoices || []).find((x) => x.id === invoiceId);
      if (!inv) return;

      if (status === "Overdue" && (String(inv.status).toLowerCase() === "paid" || String(inv.status).toLowerCase() === "draft")) {
        return;
      }

      inv.status = status;
      if (status === "Paid") {
        inv.paidDate = toIsoDate();
      }
      if (status === "Sent" && !inv.invoiceDate) {
        inv.invoiceDate = toIsoDate();
      }

      const claim = (pr.claims || []).find((c) => c.id === inv.claimId);
      if (claim) {
        if (status === "Paid") claim.status = "Paid";
        else if (status === "Sent" || status === "Overdue") claim.status = "Issued";
        else claim.status = "Draft";
      }
    });
    notify(`Invoice marked ${status}`);
  };

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>
        Invoices & Progress Claims
      </h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s4 }}>
        Contract: {fmt(contractValue)} • Invoiced: {fmt(totalInvoiced)} • Paid: {fmt(totalPaid)}
      </div>

      <div style={{ height: 6, background: _.well, borderRadius: 3, marginBottom: _.s2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${invoicedPct}%`, background: _.ac, borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, color: _.muted, marginBottom: _.s6, paddingBottom: _.s5, borderBottom: `1px solid ${_.line}` }}>
        <span>{invoicedPct.toFixed(1)}% invoiced</span>
        <span>{fmt(remainingToInvoice)} remaining to invoice</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: _.s3, marginBottom: _.s5 }}>
        <Card style={{ padding: _.s3 }}>
          <div style={label}>Total Contract Value</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold }}>{fmt(contractValue)}</div>
        </Card>
        <Card style={{ padding: _.s3 }}>
          <div style={label}>Total Invoiced</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold }}>{fmt(totalInvoiced)}</div>
        </Card>
        <Card style={{ padding: _.s3 }}>
          <div style={label}>Total Paid</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, color: totalPaid > 0 ? _.green : _.ink }}>{fmt(totalPaid)}</div>
        </Card>
        <Card style={{ padding: _.s3 }}>
          <div style={label}>Remaining to Invoice</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, color: remainingToInvoice < 0 ? _.red : _.ink }}>{fmt(remainingToInvoice)}</div>
        </Card>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s3, flexWrap: "wrap", gap: _.s2 }}>
        <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>
          Outstanding Balance: <strong style={{ color: outstandingBalance > 0 ? _.red : _.green }}>{fmt(outstandingBalance)}</strong>
        </div>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>Create Invoice</Button>
      </div>

      {invoices.length === 0 ? (
        <Empty icon={Receipt} title="No invoices yet" text="Create your first invoice to start tracking claims and payments." action={() => setCreateOpen(true)} actionText="Create Invoice" />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "120px 120px 120px 120px 240px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
            <span>Invoice #</span>
            <span>Date</span>
            <span style={{ textAlign: "right" }}>Amount</span>
            <span style={{ textAlign: "center" }}>Status</span>
            {!mobile && <span style={{ textAlign: "right" }}>Actions</span>}
          </div>
          {invoices.map((inv) => {
            const status = String(inv.status || "Draft");
            const overdue = status !== "Paid" && (status === "Overdue" || isOverdue(inv));
            const displayStatus = overdue ? "Overdue" : status;
            return (
              <div key={inv.id} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "120px 120px 120px 120px 240px", gap: _.s2, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center" }}>
                <span style={{ fontWeight: _.fontWeight.semi }}>{inv.number || inv.id}</span>
                <div>
                  <div style={{ fontWeight: _.fontWeight.medium }}>{inv.invoiceDate || inv.issuedDate || "—"}</div>
                  {mobile && <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{fmt(inv.amount)}</div>}
                </div>
                {!mobile && <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{fmt(inv.amount)}</span>}
                <div style={{ textAlign: "center" }}>
                  <span style={badge(INVOICE_STATUS_COLORS[displayStatus] || _.muted)}>
                    {displayStatus}
                  </span>
                  {overdue && (
                    <div style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4, color: _.red, fontSize: _.fontSize.xs }}>
                      <AlertCircle size={10} />
                      Due {inv.dueDate || "—"}
                    </div>
                  )}
                </div>
                {!mobile && (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2 }}>
                    {displayStatus === "Draft" && (
                      <Button size="sm" variant="secondary" icon={Send} onClick={() => updateInvoiceStatus(inv.id, "Sent")}>
                        Send
                      </Button>
                    )}
                    {(displayStatus === "Sent" || displayStatus === "Overdue") && (
                      <Button size="sm" variant="secondary" icon={DollarSign} onClick={() => updateInvoiceStatus(inv.id, "Paid")}>
                        Mark Paid
                      </Button>
                    )}
                    {displayStatus === "Sent" && isOverdue(inv) && (
                      <Button size="sm" variant="ghost" onClick={() => updateInvoiceStatus(inv.id, "Overdue")}>
                        Mark Overdue
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Invoice" width={460}>
        <div style={{ display: "grid", gap: _.s3 }}>
          <div>
            <label style={label}>Description *</label>
            <input style={input} value={invoiceForm.description} onChange={(e) => setInvoiceForm((v) => ({ ...v, description: e.target.value }))} placeholder="Progress Claim 1" />
          </div>
          <div>
            <label style={label}>Amount *</label>
            <input type="number" style={input} value={invoiceForm.amount} onChange={(e) => setInvoiceForm((v) => ({ ...v, amount: e.target.value }))} />
          </div>
          <div>
            <label style={label}>Invoice Date *</label>
            <input type="date" style={input} value={invoiceForm.invoiceDate} onChange={(e) => setInvoiceForm((v) => ({ ...v, invoiceDate: e.target.value }))} />
          </div>
          <div>
            <label style={label}>Due Date</label>
            <input type="date" style={input} value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm((v) => ({ ...v, dueDate: e.target.value }))} />
          </div>
          <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>
            Remaining to invoice: <strong>{fmt(remainingToInvoice)}</strong>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2, marginTop: _.s5 }}>
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={createInvoice}>Create</Button>
        </div>
      </Modal>
    </Section>
  );
}
