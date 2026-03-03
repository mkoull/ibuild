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
import { uid, fmt, input, label, badge } from "../../theme/styles.js";
import { Wrench, Plus, Trash2, Play, CheckCircle } from "lucide-react";

const STATUS_FLOW = ["draft", "issued", "in_progress", "complete"];
const STATUS_COLORS = { draft: _.muted, issued: _.blue, in_progress: _.amber, complete: _.green };
const STATUS_LABELS = { draft: "Draft", issued: "Issued", in_progress: "In Progress", complete: "Complete" };

const blankWO = () => ({
  id: uid(),
  tradeId: "",
  description: "",
  scheduledDate: "",
  completedDate: "",
  status: "draft",
  amount: 0,
  milestoneId: "",
  notes: "",
});

export default function WorkOrdersPage() {
  const { project: p, update } = useProject();
  const { mobile, notify, tradesHook } = useApp();
  const [editWO, setEditWO] = useState(null);

  const wos = p.workOrders || [];
  const milestones = p.schedule || [];
  const trades = tradesHook?.trades || [];

  const tradeName = (id) => trades.find(t => t.id === id)?.businessName || "—";
  const milestoneName = (id) => milestones.find(m => m.id === id)?.name || "—";

  const saveWO = (wo) => {
    update(draft => {
      if (!draft.workOrders) draft.workOrders = [];
      const idx = draft.workOrders.findIndex(x => x.id === wo.id);
      if (idx >= 0) draft.workOrders[idx] = wo;
      else draft.workOrders.push(wo);
    });
    setEditWO(null);
    notify("Work order saved");
  };

  const deleteWO = (id) => {
    update(draft => {
      draft.workOrders = (draft.workOrders || []).filter(x => x.id !== id);
    });
    setEditWO(null);
    notify("Work order deleted");
  };

  const advanceStatus = (wo) => {
    const idx = STATUS_FLOW.indexOf(wo.status);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[idx + 1];
    const updated = { ...wo, status: next };
    if (next === "complete") updated.completedDate = new Date().toISOString().split("T")[0];
    saveWO(updated);
  };

  const columns = [
    { key: "id", label: "WO #", width: "90px", render: r => r.id.slice(0, 6) },
    { key: "description", label: "Description", width: "1fr", render: r => r.description || "—" },
    { key: "trade", label: "Trade", width: "140px", render: r => tradeName(r.tradeId) },
    { key: "milestone", label: "Milestone", width: "140px", render: r => milestoneName(r.milestoneId) },
    { key: "amount", label: "Amount", width: "100px", align: "right", render: r => fmt(r.amount || 0) },
    { key: "status", label: "Status", width: "100px", render: r => <span style={badge(STATUS_COLORS[r.status] || _.muted)}>{STATUS_LABELS[r.status] || r.status}</span> },
  ];

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Work Orders</h1>
          <div style={{ fontSize: _.fontSize.md, color: _.muted }}>{wos.length} order{wos.length !== 1 ? "s" : ""}</div>
        </div>
        <Button icon={Plus} onClick={() => setEditWO(blankWO())}>New Work Order</Button>
      </div>

      {wos.length === 0 ? (
        <Empty icon={Wrench} title="No work orders" text="Create work orders to assign tasks to trades and track completion." action={() => setEditWO(blankWO())} actionText="Create Work Order" />
      ) : (
        <Card>
          <Table columns={columns} data={wos} onRowClick={row => setEditWO({ ...row })} />
        </Card>
      )}

      <Modal open={!!editWO} onClose={() => setEditWO(null)} title={editWO?.status === "draft" ? "Edit Work Order" : `WO ${editWO?.id?.slice(0, 6)}`} width={560}>
        {editWO && <WOForm wo={editWO} setWO={setEditWO} trades={trades} milestones={milestones} onSave={saveWO} onDelete={deleteWO} onAdvance={advanceStatus} />}
      </Modal>
    </Section>
  );
}

function WOForm({ wo, setWO, trades, milestones, onSave, onDelete, onAdvance }) {
  const set = (k, v) => setWO(prev => ({ ...prev, [k]: v }));
  const isDraft = wo.status === "draft";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s3, marginBottom: _.s4 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={label}>Description</label>
          <input style={input} value={wo.description} onChange={e => set("description", e.target.value)} placeholder="Work order description" />
        </div>
        <div>
          <label style={label}>Trade</label>
          <select style={input} value={wo.tradeId} onChange={e => set("tradeId", e.target.value)}>
            <option value="">— Select trade —</option>
            {trades.map(t => <option key={t.id} value={t.id}>{t.businessName}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>Milestone</label>
          <select style={input} value={wo.milestoneId} onChange={e => set("milestoneId", e.target.value)}>
            <option value="">— None —</option>
            {milestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>Amount</label>
          <input style={{ ...input, textAlign: "right" }} type="number" value={wo.amount} onChange={e => set("amount", parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label style={label}>Status</label>
          <div style={{ ...input, background: _.well }}>
            <span style={badge(STATUS_COLORS[wo.status] || _.muted)}>{STATUS_LABELS[wo.status] || wo.status}</span>
          </div>
        </div>
        <div>
          <label style={label}>Scheduled Date</label>
          <input style={input} type="date" value={wo.scheduledDate} onChange={e => set("scheduledDate", e.target.value)} />
        </div>
        <div>
          <label style={label}>Completed Date</label>
          <input style={input} type="date" value={wo.completedDate || ""} onChange={e => set("completedDate", e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: _.s4 }}>
        <label style={label}>Notes</label>
        <textarea style={{ ...input, minHeight: 60 }} value={wo.notes || ""} onChange={e => set("notes", e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: _.s2, justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: _.s2 }}>
          <Button onClick={() => onSave(wo)}>Save</Button>
          {wo.status !== "complete" && (
            <Button variant="secondary" icon={wo.status === "draft" ? Play : CheckCircle} onClick={() => onAdvance(wo)}>
              {wo.status === "draft" ? "Issue" : wo.status === "issued" ? "Start" : "Complete"}
            </Button>
          )}
        </div>
        {isDraft && <Button variant="danger" size="sm" icon={Trash2} onClick={() => onDelete(wo.id)}>Delete</Button>}
      </div>
    </div>
  );
}
