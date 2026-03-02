import { useState } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { createVariationBudgetLine, createVariationLedgerEntry } from "../../lib/budgetEngine.js";
import _ from "../../theme/tokens.js";
import { fmt, input, label, badge, uid, ds } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { ClipboardList, ArrowRight, X, Send, Check, XCircle } from "lucide-react";

const STATUS_COLOR = { draft: _.muted, sent: _.amber, approved: _.green, rejected: _.red };
const STATUS_LABEL = { draft: "Draft", sent: "Sent", approved: "Approved", rejected: "Rejected" };

export default function VariationsPage() {
  const { project: p, update: up, T, log } = useProject();
  const { mobile, notify } = useApp();
  const [form, setForm] = useState({ title: "", description: "", amount: "", _err: false });
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", amount: "" });
  const [deleteIdx, setDeleteIdx] = useState(null);

  const createVariation = () => {
    if (!form.title || !form.amount) { setForm({ ...form, _err: true }); return; }
    const amt = parseFloat(form.amount) || 0;
    up(pr => {
      pr.variations.push({
        id: `VO-${uid()}`,
        title: form.title,
        description: form.description,
        amount: amt,
        status: "draft",
        createdAt: ds(),
      });
      return pr;
    });
    log(`Variation created: ${form.title} (${fmt(parseFloat(form.amount))})`);
    notify("Variation created");
    setForm({ title: "", description: "", amount: "", _err: false });
  };

  const setStatus = (i, newStatus) => {
    up(pr => {
      const v = pr.variations[i];
      v.status = newStatus;
      if (newStatus === "approved") {
        v.approvedAt = ds();
        // Feed-through: create budget line + ledger entry
        if (!pr.budget) pr.budget = [];
        if (!pr.variationLedger) pr.variationLedger = [];
        const alreadyLinked = pr.budget.some(b => b.linkedVariationId === v.id);
        if (!alreadyLinked) {
          const budgetLine = createVariationBudgetLine(v);
          pr.budget.push(budgetLine);
          pr.variationLedger.push(createVariationLedgerEntry(v, budgetLine.id));
        }
      }
      return pr;
    });
    const v = p.variations[i];
    log(`Variation ${STATUS_LABEL[newStatus]}: ${v.title} (${fmt(v.amount)})`);
    notify(`${v.title} → ${STATUS_LABEL[newStatus]}`);
    if (editIdx === i) setEditIdx(null);
  };

  const saveEdit = () => {
    if (editIdx === null) return;
    up(pr => {
      const v = pr.variations[editIdx];
      if (editForm.title.trim()) v.title = editForm.title.trim();
      if (editForm.description !== undefined) v.description = editForm.description;
      if (editForm.amount !== "") v.amount = parseFloat(editForm.amount) || v.amount;
      return pr;
    });
    notify("Variation updated");
    setEditIdx(null);
  };

  const openEdit = (i) => {
    const v = p.variations[i];
    setEditForm({ title: v.title || v.description || "", description: v.description || "", amount: String(v.amount) });
    setEditIdx(i);
  };

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Variations</h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s7 }}>Changes to the original contract scope</div>

      {/* Contract equation */}
      <div style={{ display: "flex", gap: mobile ? _.s4 : _.s7, marginBottom: _.s7, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}`, alignItems: "baseline", flexWrap: "wrap" }}>
        <div><div style={label}>Original</div><div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(T.orig)}</div></div>
        <span style={{ color: _.faint, fontSize: _.fontSize.unit }}>+</span>
        <div><div style={{ ...label, color: _.ac }}>Approved ({T.aVCount})</div><div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: _.ac, fontVariantNumeric: "tabular-nums" }}>{fmt(T.aV)}</div></div>
        <span style={{ color: _.faint, fontSize: _.fontSize.unit }}>=</span>
        <div><div style={{ ...label, color: _.green }}>Current Contract</div><div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: _.green, fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</div></div>
      </div>

      {/* Create form */}
      <div style={{ marginBottom: _.s7, paddingBottom: _.s7, borderBottom: `1px solid ${_.line}` }}>
        <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s4 }}>New Variation</div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 140px", gap: `${_.s3}px ${_.s4}px`, marginBottom: _.s3 }}>
          <div>
            <label style={label}>Title *</label>
            <input style={{ ...input, borderColor: form._err && !form.title ? _.red : "transparent" }} value={form.title} onChange={e => setForm({ ...form, title: e.target.value, _err: false })} placeholder="Upgraded stone benchtop" />
          </div>
          <div>
            <label style={label}>Description</label>
            <input style={input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Owner selection change" />
          </div>
          <div>
            <label style={label}>Amount (inc GST) *</label>
            <input type="number" style={{ ...input, borderColor: form._err && !form.amount ? _.red : "transparent" }} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value, _err: false })} placeholder="3500" />
          </div>
        </div>
        {form._err && <div style={{ fontSize: _.fontSize.base, color: _.red, marginBottom: _.s2 }}>Title and amount are required</div>}
        {form.amount && <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s3 }}>Contract {parseFloat(form.amount) >= 0 ? "increases" : "decreases"} by <strong style={{ color: _.ac }}>{fmt(Math.abs(parseFloat(form.amount) || 0))}</strong></div>}
        <Button icon={ArrowRight} onClick={createVariation}>Create variation</Button>
      </div>

      {/* Variations list */}
      {p.variations.length === 0 && <Empty icon={ClipboardList} text="No variations yet" />}

      {p.variations.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "auto 1fr 100px 90px 140px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
            <span>ID</span><span>Title</span>
            {!mobile && <><span style={{ textAlign: "right" }}>Amount</span><span style={{ textAlign: "center" }}>Status</span><span></span></>}
          </div>

          {p.variations.map((v, i) => {
            const title = v.title || v.description || "—";
            const isDraft = v.status === "draft";
            const isSent = v.status === "sent";
            return (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "auto 1fr 100px 90px 140px", gap: _.s2,
                padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center",
                transition: `background ${_.tr}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.bold, color: _.ink, fontVariantNumeric: "tabular-nums" }}>{v.id}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, color: _.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {title}
                  </div>
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 1 }}>
                    {v.createdAt || v.date || "—"}{v.description && v.title ? ` · ${v.description}` : ""}
                  </div>
                </div>
                {!mobile && (
                  <>
                    <span style={{ textAlign: "right", fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: v.amount >= 0 ? _.ink : _.red }}>
                      {v.amount >= 0 ? "+" : ""}{fmt(v.amount)}
                    </span>
                    <div style={{ textAlign: "center" }}>
                      <span style={badge(STATUS_COLOR[v.status] || _.muted)}>{STATUS_LABEL[v.status] || v.status}</span>
                    </div>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      {isDraft && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(i)}>Edit</Button>
                          <Button variant="secondary" size="sm" icon={Send} onClick={() => setStatus(i, "sent")}>Send</Button>
                        </>
                      )}
                      {isSent && (
                        <>
                          <Button variant="secondary" size="sm" icon={Check} onClick={() => setStatus(i, "approved")} style={{ color: _.green }}>Approve</Button>
                          <Button variant="ghost" size="sm" icon={XCircle} onClick={() => setStatus(i, "rejected")} style={{ color: _.red }}>Reject</Button>
                        </>
                      )}
                      {(isDraft || isSent) && (
                        <div onClick={() => setDeleteIdx(i)} style={{ cursor: "pointer", color: _.faint, padding: 4, display: "flex", alignItems: "center", transition: `color ${_.tr}` }}
                          onMouseEnter={e => e.currentTarget.style.color = _.red}
                          onMouseLeave={e => e.currentTarget.style.color = _.faint}
                        ><X size={13} /></div>
                      )}
                    </div>
                  </>
                )}
                {mobile && (
                  <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                    <span style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{v.amount >= 0 ? "+" : ""}{fmt(v.amount)}</span>
                    <span style={badge(STATUS_COLOR[v.status] || _.muted)}>{STATUS_LABEL[v.status] || v.status}</span>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Edit draft modal */}
      <Modal open={editIdx !== null} onClose={() => setEditIdx(null)} title="Edit Variation" width={440}>
        <div style={{ display: "flex", flexDirection: "column", gap: _.s3 }}>
          <div><label style={label}>Title</label><input style={input} value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
          <div><label style={label}>Description</label><input style={input} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
          <div><label style={label}>Amount (inc GST)</label><input type="number" style={input} value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} /></div>
        </div>
        <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end", marginTop: _.s5 }}>
          <Button variant="ghost" onClick={() => setEditIdx(null)}>Cancel</Button>
          <Button onClick={saveEdit}>Save</Button>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={deleteIdx !== null} onClose={() => setDeleteIdx(null)} title="Delete Variation" width={400}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, marginBottom: _.s6 }}>
          Delete <strong>{deleteIdx !== null && p.variations[deleteIdx] ? p.variations[deleteIdx].id : ""}</strong>?
        </div>
        <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDeleteIdx(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            const v = p.variations[deleteIdx];
            up(pr => { pr.variations.splice(deleteIdx, 1); return pr; });
            log(`Variation deleted: ${v?.title || v?.description || v?.id}`);
            notify("Deleted");
            setDeleteIdx(null);
          }}>Delete</Button>
        </div>
      </Modal>
    </Section>
  );
}
