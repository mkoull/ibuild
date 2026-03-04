import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Table from "../../components/ui/Table.jsx";
import _ from "../../theme/tokens.js";
import { uid, ds, fmt, input, label, badge } from "../../theme/styles.js";
import { exportPrintPdf } from "../../lib/pdfExport.js";
import { ShoppingCart, Plus, Receipt, FilePlus2 } from "lucide-react";
import { isSubcontractor } from "../../lib/permissions.js";

const PO_STATUSES = ["Draft", "Issued", "Received", "Billed"];
const STATUS_COLORS = {
  Draft: _.muted,
  Issued: _.blue,
  Received: _.green,
  Billed: _.violet,
};

function newPoForm() {
  return {
    supplier: "",
    budgetItemId: "",
    description: "",
    amount: "",
    expectedDeliveryDate: "",
    status: "Draft",
  };
}

function newBillForm() {
  return {
    poId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  };
}

export default function PurchaseOrdersPage() {
  const { project: p, update } = useProject();
  const { mobile, notify, settings, addNotification, currentUser } = useApp();
  const [showPoModal, setShowPoModal] = useState(false);
  const [searchParams] = useSearchParams();
  const [showBillModal, setShowBillModal] = useState(false);
  const [poForm, setPoForm] = useState(newPoForm);
  const [billForm, setBillForm] = useState(newBillForm);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setShowPoModal(true);
    }
  }, [searchParams]);

  const budgetLines = p.workingBudget || p.budget || [];
  const procurement = p.procurement || { purchaseOrders: [], bills: [] };
  const allPurchaseOrders = procurement.purchaseOrders || [];
  const bills = procurement.bills || [];
  const subcontractor = isSubcontractor(currentUser);
  const allowedTrades = Array.isArray(currentUser?.assignedTradeNames) ? currentUser.assignedTradeNames : [];
  const purchaseOrders = subcontractor
    ? allPurchaseOrders.filter((po) => {
      const supplier = String(po.supplier || "").toLowerCase();
      return allowedTrades.some((t) => supplier.includes(String(t || "").toLowerCase()));
    })
    : allPurchaseOrders;

  const budgetLabelById = useMemo(() => {
    const out = {};
    budgetLines.forEach((b) => {
      out[b.id] = `${b.sectionName ? `${b.sectionName} - ` : ""}${b.label || b.description || "Budget line"}`;
    });
    return out;
  }, [budgetLines]);

  const totalOrderedValue = useMemo(
    () => purchaseOrders.reduce((sum, po) => sum + (Number(po.amount) || 0), 0),
    [purchaseOrders],
  );
  const outstandingOrders = useMemo(
    () => purchaseOrders.filter((po) => po.status !== "Billed").length,
    [purchaseOrders],
  );

  const applyBilledToBudgetLine = (pr, po) => {
    if (!po || !po.budgetItemId) return;
    if (po._actualApplied) return;
    const lines = pr.workingBudget || pr.budget || [];
    const line = lines.find((b) => b.id === po.budgetItemId);
    if (!line) return;
    const budgetCost = Number(line.budgetCost ?? line.budgetAmount) || 0;
    const amount = Number(po.amount) || 0;
    const actualCost = (Number(line.actualCost ?? line.actualAmount) || 0) + amount;
    line.budgetCost = budgetCost;
    line.budgetAmount = budgetCost;
    line.actualCost = actualCost;
    line.actualAmount = actualCost;
    line.variance = budgetCost - actualCost;
    po._actualApplied = true;
  };

  const columns = [
    { key: "number", label: "PO #", width: "120px", render: (r) => r.number || "—" },
    { key: "supplier", label: "Supplier", width: "1fr", render: (r) => r.supplier || "—" },
    { key: "budgetItem", label: "Budget Item", width: "1fr", render: (r) => budgetLabelById[r.budgetItemId] || "—" },
    { key: "amount", label: "Amount", width: "140px", align: "right", render: (r) => fmt(r.amount || 0) },
    { key: "status", label: "Status", width: "120px", render: (r) => <span style={badge(STATUS_COLORS[r.status] || _.muted)}>{r.status || "Draft"}</span> },
    {
      key: "actions",
      label: "Actions",
      width: "180px",
      sortable: false,
      render: (r) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s1 }}>
          {PO_STATUSES.map((status) => (
            <Button
              key={`${r.id}-${status}`}
              size="sm"
              variant={r.status === status ? "secondary" : "ghost"}
              onClick={() => markStatus(r.id, status)}
              disabled={r.status === status}
            >
              {status}
            </Button>
          ))}
        </div>
      ),
    },
  ];

  const createPo = () => {
    const amount = Number(poForm.amount) || 0;
    if (!poForm.supplier.trim() || !poForm.budgetItemId || amount <= 0) {
      notify("Supplier, budget item and amount are required", "error");
      return;
    }
    const now = new Date().toISOString();
    const nextNumber = `PO-${String(purchaseOrders.length + 1).padStart(4, "0")}`;
    update((pr) => {
      if (!pr.procurement) pr.procurement = { purchaseOrders: [], bills: [] };
      if (!Array.isArray(pr.procurement.purchaseOrders)) pr.procurement.purchaseOrders = [];
      const po = {
        id: uid(),
        number: nextNumber,
        supplier: poForm.supplier.trim(),
        budgetItemId: poForm.budgetItemId,
        description: poForm.description.trim(),
        amount,
        expectedDeliveryDate: poForm.expectedDeliveryDate || null,
        status: poForm.status || "Draft",
        _actualApplied: false,
        createdAt: now,
      };
      pr.procurement.purchaseOrders.push(po);
    });
    setPoForm(newPoForm());
    setShowPoModal(false);
    notify("Purchase order created");
  };

  const markStatus = (poId, status) => {
    let changedPo = null;
    update((pr) => {
      if (!pr.procurement?.purchaseOrders) return;
      const po = pr.procurement.purchaseOrders.find((x) => x.id === poId);
      if (!po) return;
      const previous = po.status;
      po.status = status;
      if (status === "Issued" && previous !== "Issued") {
        changedPo = { number: po.number, supplier: po.supplier };
      }
      if (status === "Billed") {
        applyBilledToBudgetLine(pr, po);
      }
    });
    if (changedPo) {
      addNotification({
        message: `Purchase order issued: ${changedPo.number || "PO"} ${changedPo.supplier ? `(${changedPo.supplier})` : ""}`.trim(),
        type: "purchase_order_issued",
        link: `/projects/${p.id}/procurement`,
      });
    }
  };

  const recordBill = () => {
    const amount = Number(billForm.amount) || 0;
    if (!billForm.poId || amount <= 0 || !billForm.date) {
      notify("PO, amount and date are required", "error");
      return;
    }
    update((pr) => {
      if (!pr.procurement) pr.procurement = { purchaseOrders: [], bills: [] };
      if (!Array.isArray(pr.procurement.bills)) pr.procurement.bills = [];
      const po = (pr.procurement.purchaseOrders || []).find((x) => x.id === billForm.poId);
      if (!po) return;
      pr.procurement.bills.push({
        id: uid(),
        poId: po.id,
        supplier: po.supplier,
        amount,
        date: billForm.date,
      });
      po.status = "Billed";
      applyBilledToBudgetLine(pr, { ...po, amount });
    });
    setBillForm(newBillForm());
    setShowBillModal(false);
    notify("Supplier bill recorded");
  };

  const exportPurchaseOrdersPdf = () => {
    const ok = exportPrintPdf({
      title: "Purchase Orders",
      companyName: settings?.companyName || "",
      projectName: p.name || "Project",
      clientName: p.client || "",
      dateLabel: ds(),
      sections: [
        {
          title: "Purchase Order List",
          type: "table",
          headers: ["PO #", "Supplier", "Budget Item", "Amount", "Status", "Expected Delivery"],
          rows: (purchaseOrders || []).map((po) => ([
            po.number || "",
            po.supplier || "",
            budgetLabelById[po.budgetItemId] || "",
            fmt(po.amount || 0),
            po.status || "Draft",
            po.expectedDeliveryDate || "—",
          ])),
        },
      ],
    });
    if (!ok) notify("Pop-up blocked — please allow pop-ups for this site", "error");
  };

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: _.s3, marginBottom: _.s5, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Procurement</h1>
          <div style={{ fontSize: _.fontSize.md, color: _.muted }}>
            {purchaseOrders.length} purchase order{purchaseOrders.length === 1 ? "" : "s"} • {bills.length} bill{bills.length === 1 ? "" : "s"}
          </div>
        </div>
        <div style={{ display: "flex", gap: _.s2, flexWrap: "wrap" }}>
          {!subcontractor && <Button icon={Plus} onClick={() => setShowPoModal(true)}>Create Purchase Order</Button>}
          {!subcontractor && <Button variant="secondary" icon={Receipt} onClick={() => setShowBillModal(true)} disabled={purchaseOrders.length === 0}>Record Bill</Button>}
          <Button variant="secondary" onClick={exportPurchaseOrdersPdf} disabled={purchaseOrders.length === 0}>Download Purchase Order PDF</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: _.s3, marginBottom: _.s5 }}>
        <Card style={{ padding: _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>
            Total POs
          </div>
          <div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: _.ink }}>{purchaseOrders.length}</div>
        </Card>
        <Card style={{ padding: _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>
            Outstanding Orders
          </div>
          <div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: _.amber }}>{outstandingOrders}</div>
        </Card>
        <Card style={{ padding: _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>
            Total Ordered Value
          </div>
          <div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: _.ink }}>{fmt(totalOrderedValue)}</div>
        </Card>
      </div>

      {purchaseOrders.length === 0 ? (
        <Empty
          icon={ShoppingCart}
          title="No purchase orders yet"
          text="Create your first PO and link it to a budget item to start tracking actual costs."
          action={() => setShowPoModal(true)}
          actionText="Create Purchase Order"
        />
      ) : (
        <Card>
          <Table columns={columns} data={purchaseOrders} />
          <div style={{ marginTop: _.s3, display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: _.s3 }}>
            {purchaseOrders.map((po) => (
              <div key={po.id} style={{ padding: _.s3, border: `1px solid ${_.line}`, borderRadius: _.rSm }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: _.s2 }}>
                  <strong style={{ color: _.ink }}>{po.number}</strong>
                  <span style={badge(STATUS_COLORS[po.status] || _.muted)}>{po.status}</span>
                </div>
                <div style={{ fontSize: _.fontSize.sm, color: _.body, marginBottom: _.s2 }}>{po.description || "No description"}</div>
                <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginBottom: _.s2 }}>
                  Linked budget: {budgetLabelById[po.budgetItemId] || "—"}
                </div>
                <div style={{ fontSize: _.fontSize.xs, color: _.muted, marginBottom: _.s2 }}>
                  Expected delivery: {po.expectedDeliveryDate || "—"}
                </div>
                <div style={{ display: "flex", gap: _.s2, flexWrap: "wrap" }}>
                  {!subcontractor && PO_STATUSES.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={po.status === status ? "secondary" : "ghost"}
                      onClick={() => markStatus(po.id, status)}
                      disabled={po.status === status}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={showPoModal} onClose={() => setShowPoModal(false)} title="Create Purchase Order" width={560}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s3 }}>
          <div>
            <label style={label}>Supplier *</label>
            <input style={input} value={poForm.supplier} onChange={(e) => setPoForm((v) => ({ ...v, supplier: e.target.value }))} />
          </div>
          <div>
            <label style={label}>Amount *</label>
            <input type="number" style={input} value={poForm.amount} onChange={(e) => setPoForm((v) => ({ ...v, amount: e.target.value }))} />
          </div>
          <div>
            <label style={label}>Expected Delivery Date</label>
            <input type="date" style={{ ...input, cursor: "pointer" }} value={poForm.expectedDeliveryDate} onChange={(e) => setPoForm((v) => ({ ...v, expectedDeliveryDate: e.target.value }))} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Budget Item *</label>
            <select style={{ ...input, cursor: "pointer" }} value={poForm.budgetItemId} onChange={(e) => setPoForm((v) => ({ ...v, budgetItemId: e.target.value }))}>
              <option value="">— Select budget line —</option>
              {budgetLines.map((b) => (
                <option key={b.id} value={b.id}>
                  {budgetLabelById[b.id]} ({fmt(b.budgetCost ?? b.budgetAmount ?? 0)})
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Description</label>
            <textarea style={{ ...input, minHeight: 72 }} value={poForm.description} onChange={(e) => setPoForm((v) => ({ ...v, description: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2, marginTop: _.s4 }}>
          <Button variant="ghost" onClick={() => setShowPoModal(false)}>Cancel</Button>
          <Button icon={FilePlus2} onClick={createPo}>Create PO</Button>
        </div>
      </Modal>

      <Modal open={showBillModal} onClose={() => setShowBillModal(false)} title="Record Bill" width={520}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s3 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>PO *</label>
            <select style={{ ...input, cursor: "pointer" }} value={billForm.poId} onChange={(e) => setBillForm((v) => ({ ...v, poId: e.target.value }))}>
              <option value="">— Select PO —</option>
              {purchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.number} - {po.supplier} ({fmt(po.amount)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Bill Amount *</label>
            <input type="number" style={input} value={billForm.amount} onChange={(e) => setBillForm((v) => ({ ...v, amount: e.target.value }))} />
          </div>
          <div>
            <label style={label}>Date *</label>
            <input type="date" style={input} value={billForm.date} onChange={(e) => setBillForm((v) => ({ ...v, date: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2, marginTop: _.s4 }}>
          <Button variant="ghost" onClick={() => setShowBillModal(false)}>Cancel</Button>
          <Button icon={Receipt} onClick={recordBill}>Record Bill</Button>
        </div>
      </Modal>
    </Section>
  );
}
