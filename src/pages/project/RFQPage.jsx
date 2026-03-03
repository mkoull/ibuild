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
import { uid, ds, input, label, badge } from "../../theme/styles.js";
import { FileQuestion, Plus, Trash2, Check, ShoppingCart } from "lucide-react";

const STATUS_COLORS = { draft: _.muted, sent: _.blue, received: _.amber, accepted: _.green, closed: _.violet };

const blankRFQ = () => ({
  id: uid(),
  tradeIds: [],
  scopeItems: [],
  dueDate: "",
  status: "draft",
  responses: [],
  notes: "",
  createdAt: ds(),
});

export default function RFQPage() {
  const { project: p, update } = useProject();
  const { mobile, notify, tradesHook } = useApp();
  const [editRFQ, setEditRFQ] = useState(null);

  const rfqs = p.rfqs || [];
  const trades = tradesHook?.trades || [];
  const scope = p.scope || {};

  const tradeName = (id) => trades.find(t => t.id === id)?.businessName || id;

  const saveRFQ = (rfq) => {
    update(draft => {
      if (!draft.rfqs) draft.rfqs = [];
      const idx = draft.rfqs.findIndex(x => x.id === rfq.id);
      if (idx >= 0) draft.rfqs[idx] = rfq;
      else draft.rfqs.push(rfq);
    });
    setEditRFQ(null);
    notify("RFQ saved");
  };

  const deleteRFQ = (id) => {
    update(draft => {
      draft.rfqs = (draft.rfqs || []).filter(x => x.id !== id);
    });
    setEditRFQ(null);
    notify("RFQ deleted");
  };

  const acceptResponse = (rfq, respIdx) => {
    const resp = rfq.responses[respIdx];
    if (!resp) return;

    // Mark accepted
    const updatedRFQ = { ...rfq, status: "accepted", responses: rfq.responses.map((r, i) => ({ ...r, accepted: i === respIdx })) };

    // Create PO from accepted response
    update(draft => {
      if (!draft.purchaseOrders) draft.purchaseOrders = [];
      draft.purchaseOrders.push({
        id: uid(),
        tradeId: resp.tradeId,
        items: (rfq.scopeItems || []).map(si => ({
          id: uid(),
          description: si.description || si.item || "",
          qty: si.qty || 1,
          unit: si.unit || "each",
          rate: resp.quotedAmount ? (resp.quotedAmount / Math.max((rfq.scopeItems || []).length, 1)) : 0,
        })),
        status: "draft",
        totalAmount: resp.quotedAmount || 0,
        issueDate: new Date().toISOString().split("T")[0],
        expectedDelivery: "",
        notes: `Auto-created from RFQ ${rfq.id.slice(0, 6)}`,
      });

      // Update the RFQ
      const rfqIdx = (draft.rfqs || []).findIndex(x => x.id === rfq.id);
      if (rfqIdx >= 0) draft.rfqs[rfqIdx] = updatedRFQ;
    });
    setEditRFQ(null);
    notify("Response accepted — PO created");
  };

  // Get scope items for selection
  const allScopeItems = Object.entries(scope).flatMap(([cat, items]) =>
    (items || []).filter(i => i.on).map(i => ({ ...i, category: cat }))
  );

  const columns = [
    { key: "id", label: "RFQ #", width: "90px", render: r => r.id.slice(0, 6) },
    { key: "trades", label: "Trades", width: "1fr", render: r => (r.tradeIds || []).map(id => tradeName(id)).join(", ") || "—" },
    { key: "items", label: "Items", width: "60px", align: "center", render: r => (r.scopeItems || []).length },
    { key: "responses", label: "Responses", width: "80px", align: "center", render: r => (r.responses || []).length },
    { key: "dueDate", label: "Due", width: "100px", render: r => r.dueDate || "—" },
    { key: "status", label: "Status", width: "100px", render: r => <span style={badge(STATUS_COLORS[r.status] || _.muted)}>{r.status}</span> },
  ];

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Requests for Quote</h1>
          <div style={{ fontSize: _.fontSize.md, color: _.muted }}>{rfqs.length} RFQ{rfqs.length !== 1 ? "s" : ""}</div>
        </div>
        <Button icon={Plus} onClick={() => setEditRFQ(blankRFQ())}>New RFQ</Button>
      </div>

      {rfqs.length === 0 ? (
        <Empty icon={FileQuestion} title="No requests for quote" text="Create an RFQ to get pricing from your trades for scope items." action={() => setEditRFQ(blankRFQ())} actionText="Create RFQ" />
      ) : (
        <Card>
          <Table columns={columns} data={rfqs} onRowClick={row => setEditRFQ(JSON.parse(JSON.stringify(row)))} />
        </Card>
      )}

      <Modal open={!!editRFQ} onClose={() => setEditRFQ(null)} title="Request for Quote" width={640}>
        {editRFQ && (
          <RFQForm rfq={editRFQ} setRFQ={setEditRFQ} trades={trades} allScopeItems={allScopeItems}
            onSave={saveRFQ} onDelete={deleteRFQ} onAcceptResponse={acceptResponse} />
        )}
      </Modal>
    </Section>
  );
}

function RFQForm({ rfq, setRFQ, trades, allScopeItems, onSave, onDelete, onAcceptResponse }) {
  const set = (k, v) => setRFQ(prev => ({ ...prev, [k]: v }));
  const isDraft = rfq.status === "draft";

  const toggleTrade = (id) => {
    const current = rfq.tradeIds || [];
    set("tradeIds", current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  };

  const toggleScopeItem = (item) => {
    const current = rfq.scopeItems || [];
    const exists = current.some(x => x._id === item._id);
    set("scopeItems", exists ? current.filter(x => x._id !== item._id) : [...current, item]);
  };

  const addResponse = () => {
    set("responses", [...(rfq.responses || []), { id: uid(), tradeId: "", quotedAmount: 0, notes: "", accepted: false }]);
  };

  const setResponse = (idx, k, v) => {
    const responses = [...(rfq.responses || [])];
    responses[idx] = { ...responses[idx], [k]: v };
    set("responses", responses);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s3, marginBottom: _.s4 }}>
        <div>
          <label style={label}>Due Date</label>
          <input style={input} type="date" value={rfq.dueDate} onChange={e => set("dueDate", e.target.value)} />
        </div>
        <div>
          <label style={label}>Status</label>
          <div style={{ ...input, background: _.well }}>
            <span style={badge(STATUS_COLORS[rfq.status] || _.muted)}>{rfq.status}</span>
          </div>
        </div>
      </div>

      {/* Trade selection */}
      <div style={{ marginBottom: _.s4 }}>
        <label style={label}>Trades to Quote</label>
        <div style={{ display: "flex", gap: _.s2, flexWrap: "wrap" }}>
          {trades.map(t => (
            <div key={t.id} onClick={() => isDraft && toggleTrade(t.id)}
              style={{ padding: `${_.s1}px ${_.s3}px`, borderRadius: _.rFull, fontSize: _.fontSize.sm, cursor: isDraft ? "pointer" : "default",
                background: (rfq.tradeIds || []).includes(t.id) ? _.ac : _.well, color: (rfq.tradeIds || []).includes(t.id) ? "#fff" : _.body,
                transition: `all ${_.tr}` }}>
              {t.businessName}
            </div>
          ))}
        </div>
      </div>

      {/* Scope items */}
      {isDraft && allScopeItems.length > 0 && (
        <div style={{ marginBottom: _.s4 }}>
          <label style={label}>Scope Items</label>
          <div style={{ maxHeight: 160, overflow: "auto", border: `1px solid ${_.line}`, borderRadius: _.rSm, padding: _.s2 }}>
            {allScopeItems.map(item => (
              <div key={item._id} onClick={() => toggleScopeItem(item)}
                style={{ display: "flex", alignItems: "center", gap: _.s2, padding: `${_.s1}px 0`, cursor: "pointer", fontSize: _.fontSize.sm }}>
                <input type="checkbox" checked={(rfq.scopeItems || []).some(x => x._id === item._id)} readOnly />
                <span>{item.category}: {item.item || item.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Responses */}
      <div style={{ marginBottom: _.s4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s2 }}>
          <label style={{ ...label, marginBottom: 0 }}>Responses ({(rfq.responses || []).length})</label>
          <Button size="sm" variant="secondary" icon={Plus} onClick={addResponse}>Add Response</Button>
        </div>
        {(rfq.responses || []).map((resp, idx) => (
          <div key={resp.id} style={{ border: `1px solid ${resp.accepted ? _.green : _.line}`, borderRadius: _.rSm, padding: _.s3, marginBottom: _.s2, background: resp.accepted ? `${_.green}10` : "transparent" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 32px", gap: _.s2, marginBottom: _.s2 }}>
              <select style={input} value={resp.tradeId} onChange={e => setResponse(idx, "tradeId", e.target.value)}>
                <option value="">— Trade —</option>
                {trades.map(t => <option key={t.id} value={t.id}>{t.businessName}</option>)}
              </select>
              <input style={{ ...input, textAlign: "right" }} type="number" placeholder="Amount" value={resp.quotedAmount || ""} onChange={e => setResponse(idx, "quotedAmount", parseFloat(e.target.value) || 0)} />
              {!resp.accepted && rfq.status !== "accepted" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: _.green }} title="Accept" onClick={() => onAcceptResponse(rfq, idx)}>
                  <Check size={16} />
                </div>
              )}
            </div>
            <input style={input} placeholder="Notes" value={resp.notes || ""} onChange={e => setResponse(idx, "notes", e.target.value)} />
            {resp.accepted && <div style={{ fontSize: _.fontSize.xs, color: _.green, marginTop: _.s1, fontWeight: _.fontWeight.semi }}>Accepted — PO created</div>}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: _.s4 }}>
        <label style={label}>Notes</label>
        <textarea style={{ ...input, minHeight: 60 }} value={rfq.notes || ""} onChange={e => set("notes", e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: _.s2, justifyContent: "space-between" }}>
        <Button onClick={() => onSave(rfq)}>Save</Button>
        {isDraft && <Button variant="danger" size="sm" icon={Trash2} onClick={() => onDelete(rfq.id)}>Delete</Button>}
      </div>
    </div>
  );
}
