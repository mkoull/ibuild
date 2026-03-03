import { useState } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Table from "../../components/ui/Table.jsx";
import _ from "../../theme/tokens.js";
import { uid, fmt, ds, input, label, badge } from "../../theme/styles.js";
import { ShoppingCart, Plus, Trash2, Check, Send, PackageCheck } from "lucide-react";

const STATUS_FLOW = ["draft", "sent", "accepted", "received"];
const STATUS_COLORS = { draft: _.muted, sent: _.blue, accepted: _.green, received: _.violet };

const blankPO = () => ({
  id: uid(),
  tradeId: "",
  items: [],
  status: "draft",
  totalAmount: 0,
  issueDate: new Date().toISOString().split("T")[0],
  expectedDelivery: "",
  linkedBudgetLineId: null,
  notes: "",
});

const blankItem = () => ({ id: uid(), description: "", qty: 1, unit: "each", rate: 0 });

export default function PurchaseOrdersPage() {
  const { project: p, update } = useProject();
  const { mobile, notify, tradesHook } = useApp();
  const [editPO, setEditPO] = useState(null);

  const pos = p.purchaseOrders || [];

  const trades = tradesHook?.trades || [];
  const tradeName = (id) => trades.find(t => t.id === id)?.businessName || "—";

  const savePO = (po) => {
    po.totalAmount = (po.items || []).reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);
    update(draft => {
      if (!draft.purchaseOrders) draft.purchaseOrders = [];
      const idx = draft.purchaseOrders.findIndex(x => x.id === po.id);
      if (idx >= 0) draft.purchaseOrders[idx] = po;
      else draft.purchaseOrders.push(po);
    });
    setEditPO(null);
    notify("Purchase order saved");
  };

  const deletePO = (id) => {
    update(draft => {
      draft.purchaseOrders = (draft.purchaseOrders || []).filter(x => x.id !== id);
    });
    setEditPO(null);
    notify("Purchase order deleted");
  };

  const advanceStatus = (po) => {
    const idx = STATUS_FLOW.indexOf(po.status);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[idx + 1];
    const updated = { ...po, status: next };

    // When accepted → create commitment
    if (next === "accepted") {
      update(draft => {
        if (!draft.commitments) draft.commitments = [];
        const exists = draft.commitments.some(c => c.linkedPOId === po.id);
        if (!exists) {
          draft.commitments.push({
            id: uid(),
            tradeId: po.tradeId,
            description: `PO: ${po.items.map(i => i.description).filter(Boolean).join(", ") || "Purchase Order"}`,
            amount: po.totalAmount,
            status: "committed",
            linkedPOId: po.id,
            linkedBudgetLineId: po.linkedBudgetLineId || null,
            date: ds(),
          });
        }
        const poIdx = (draft.purchaseOrders || []).findIndex(x => x.id === po.id);
        if (poIdx >= 0) draft.purchaseOrders[poIdx] = updated;
      });
    } else {
      savePO(updated);
      return;
    }
    setEditPO(null);
    notify(`PO ${next}`);
  };

  const columns = [
    { key: "id", label: "PO #", width: "100px", render: r => r.id.slice(0, 6) },
    { key: "trade", label: "Trade", width: "1fr", render: r => tradeName(r.tradeId) },
    { key: "items", label: "Items", width: "60px", align: "center", render: r => (r.items || []).length },
    { key: "totalAmount", label: "Amount", width: "120px", align: "right", render: r => fmt(r.totalAmount || 0) },
    { key: "status", label: "Status", width: "100px", render: r => <span style={badge(STATUS_COLORS[r.status] || _.muted)}>{r.status}</span> },
    { key: "issueDate", label: "Date", width: "100px", render: r => r.issueDate || "—" },
  ];

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Purchase Orders</h1>
          <div style={{ fontSize: _.fontSize.md, color: _.muted }}>{pos.length} PO{pos.length !== 1 ? "s" : ""}</div>
        </div>
        <Button icon={Plus} onClick={() => setEditPO(blankPO())}>New PO</Button>
      </div>

      {pos.length === 0 ? (
        <Empty icon={ShoppingCart} title="No purchase orders" text="Create a purchase order to track materials and subcontractor procurement." action={() => setEditPO(blankPO())} actionText="Create PO" />
      ) : (
        <Card>
          <Table columns={columns} data={pos} onRowClick={row => setEditPO({ ...row, items: [...(row.items || []).map(i => ({ ...i }))] })} />
        </Card>
      )}

      {/* PO Edit Modal */}
      <Modal open={!!editPO} onClose={() => setEditPO(null)} title={editPO?.status === "draft" ? "Edit Purchase Order" : `PO ${editPO?.id?.slice(0, 6)}`} width={640}>
        {editPO && <POForm po={editPO} setPO={setEditPO} trades={trades} onSave={savePO} onDelete={deletePO} onAdvance={advanceStatus} />}
      </Modal>
    </Section>
  );
}

function POForm({ po, setPO, trades, onSave, onDelete, onAdvance }) {
  const set = (k, v) => setPO(prev => ({ ...prev, [k]: v }));
  const isDraft = po.status === "draft";

  const setItem = (idx, k, v) => {
    const items = [...po.items];
    items[idx] = { ...items[idx], [k]: v };
    setPO(prev => ({ ...prev, items }));
  };
  const addItem = () => setPO(prev => ({ ...prev, items: [...prev.items, blankItem()] }));
  const removeItem = (idx) => setPO(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const total = po.items.reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s3, marginBottom: _.s4 }}>
        <div>
          <label style={label}>Trade</label>
          <select style={input} value={po.tradeId} onChange={e => set("tradeId", e.target.value)} disabled={!isDraft}>
            <option value="">— Select trade —</option>
            {trades.map(t => <option key={t.id} value={t.id}>{t.businessName}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>Status</label>
          <div style={{ ...input, background: _.well, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={badge(STATUS_COLORS[po.status] || _.muted)}>{po.status}</span>
          </div>
        </div>
        <div>
          <label style={label}>Issue Date</label>
          <input style={input} type="date" value={po.issueDate} onChange={e => set("issueDate", e.target.value)} disabled={!isDraft} />
        </div>
        <div>
          <label style={label}>Expected Delivery</label>
          <input style={input} type="date" value={po.expectedDelivery} onChange={e => set("expectedDelivery", e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: _.s3 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s2 }}>
          <label style={{ ...label, marginBottom: 0 }}>Line Items</label>
          {isDraft && <Button size="sm" variant="secondary" icon={Plus} onClick={addItem}>Add</Button>}
        </div>
        {po.items.map((item, idx) => (
          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "2fr 60px 60px 80px 32px", gap: _.s2, marginBottom: _.s2, alignItems: "end" }}>
            <div>
              {idx === 0 && <label style={{ ...label, fontSize: _.fontSize.xs }}>Description</label>}
              <input style={input} value={item.description} onChange={e => setItem(idx, "description", e.target.value)} disabled={!isDraft} />
            </div>
            <div>
              {idx === 0 && <label style={{ ...label, fontSize: _.fontSize.xs }}>Qty</label>}
              <input style={{ ...input, textAlign: "center" }} type="number" value={item.qty} onChange={e => setItem(idx, "qty", parseFloat(e.target.value) || 0)} disabled={!isDraft} />
            </div>
            <div>
              {idx === 0 && <label style={{ ...label, fontSize: _.fontSize.xs }}>Unit</label>}
              <input style={{ ...input, textAlign: "center" }} value={item.unit} onChange={e => setItem(idx, "unit", e.target.value)} disabled={!isDraft} />
            </div>
            <div>
              {idx === 0 && <label style={{ ...label, fontSize: _.fontSize.xs }}>Rate</label>}
              <input style={{ ...input, textAlign: "right" }} type="number" value={item.rate} onChange={e => setItem(idx, "rate", parseFloat(e.target.value) || 0)} disabled={!isDraft} />
            </div>
            {isDraft && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: _.red }} onClick={() => removeItem(idx)}>
                <Trash2 size={14} />
              </div>
            )}
          </div>
        ))}
        <div style={{ textAlign: "right", fontWeight: _.fontWeight.semi, fontSize: _.fontSize.lg, color: _.ink, marginTop: _.s2 }}>
          Total: {fmt(total)}
        </div>
      </div>

      <div style={{ marginBottom: _.s4 }}>
        <label style={label}>Notes</label>
        <textarea style={{ ...input, minHeight: 60 }} value={po.notes || ""} onChange={e => set("notes", e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: _.s2, justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: _.s2 }}>
          {isDraft && <Button onClick={() => onSave(po)}>Save Draft</Button>}
          {po.status !== "received" && (
            <Button variant="secondary" icon={po.status === "draft" ? Send : po.status === "sent" ? Check : PackageCheck} onClick={() => onAdvance(po)}>
              {po.status === "draft" ? "Send" : po.status === "sent" ? "Accept" : "Mark Received"}
            </Button>
          )}
        </div>
        {isDraft && (
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => onDelete(po.id)}>Delete</Button>
        )}
      </div>
    </div>
  );
}
