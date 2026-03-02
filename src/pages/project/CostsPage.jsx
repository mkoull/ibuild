import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, label, badge, uid, ds } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { BarChart3, Plus, ArrowRight, X } from "lucide-react";

const TABS = ["Budget", "Commitments", "Actuals", "Scope Costs"];

export default function CostsPage() {
  const { project: p, update: up, T, log } = useProject();
  const { trades, mobile, notify } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState("Budget");
  const [budgetForm, setBudgetForm] = useState({ costCode: "", labelText: "", budgetAmount: "", tradeId: "" });
  const [commitForm, setCommitForm] = useState({ vendor: "", description: "", amount: "", tradeId: "" });
  const [deleteModal, setDeleteModal] = useState(null);

  const budgetLines = p.budget || [];
  const commitments = p.commitments || [];
  const actuals = p.actuals || [];

  const variance = T.budgetTotal - T.actualsTotal;

  const uI = (cat, idx, k, v) => up(pr => { pr.scope[cat][idx][k] = v; return pr; });

  const addBudgetLine = () => {
    const amt = parseFloat(budgetForm.budgetAmount);
    if (!budgetForm.labelText || !amt) { notify("Label and amount required", "error"); return; }
    up(pr => {
      if (!pr.budget) pr.budget = [];
      pr.budget.push({ id: uid(), costCode: budgetForm.costCode, label: budgetForm.labelText, budgetAmount: amt, tradeId: budgetForm.tradeId });
      return pr;
    });
    log(`Budget line added: ${budgetForm.labelText} (${fmt(amt)})`);
    notify("Budget line added");
    setBudgetForm({ costCode: "", labelText: "", budgetAmount: "", tradeId: "" });
  };

  const addCommitment = () => {
    const amt = parseFloat(commitForm.amount);
    if (!commitForm.description || !amt) { notify("Description and amount required", "error"); return; }
    up(pr => {
      if (!pr.commitments) pr.commitments = [];
      pr.commitments.push({ id: uid(), vendor: commitForm.vendor, description: commitForm.description, amount: amt, tradeId: commitForm.tradeId, status: "pending", createdAt: ds() });
      return pr;
    });
    log(`Commitment added: ${commitForm.description} (${fmt(amt)})`);
    notify("Commitment added");
    setCommitForm({ vendor: "", description: "", amount: "", tradeId: "" });
  };

  const removeItem = () => {
    if (!deleteModal) return;
    const { type, idx } = deleteModal;
    up(pr => {
      if (type === "budget") pr.budget.splice(idx, 1);
      if (type === "commitment") pr.commitments.splice(idx, 1);
      if (type === "actual") pr.actuals.splice(idx, 1);
      return pr;
    });
    notify("Removed");
    setDeleteModal(null);
  };

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: _.s2 }}>Costs</h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s6 }}>Budget, commitments, and actual costs</div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: mobile ? _.s2 : _.s3, marginBottom: _.s7 }}>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Budget</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.budgetTotal > 0 ? _.ink : _.faint }}>{T.budgetTotal > 0 ? fmt(T.budgetTotal) : "—"}</div>
        </Card>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Committed</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.committedTotal > 0 ? _.amber : _.faint }}>{T.committedTotal > 0 ? fmt(T.committedTotal) : "—"}</div>
        </Card>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Actual</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.actualsTotal > 0 ? _.ac : _.faint }}>{T.actualsTotal > 0 ? fmt(T.actualsTotal) : "—"}</div>
        </Card>
        <Card style={{ padding: mobile ? _.s3 : _.s4 }}>
          <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Variance</div>
          <div style={{ fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: T.budgetTotal > 0 ? (variance >= 0 ? _.green : _.red) : _.faint }}>
            {T.budgetTotal > 0 ? `${variance >= 0 ? "+" : ""}${fmt(variance)}` : "—"}
          </div>
        </Card>
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
          }}>{t}</div>
        ))}
      </div>

      {/* ─── BUDGET TAB ─── */}
      {tab === "Budget" && (
        <div>
          <div style={{ marginBottom: _.s6, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s4 }}>Add Budget Line</div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "80px 1fr 140px auto", gap: `${_.s3}px ${_.s4}px`, alignItems: mobile ? "stretch" : "end" }}>
              <div><label style={label}>Code</label><input style={input} value={budgetForm.costCode} onChange={e => setBudgetForm({ ...budgetForm, costCode: e.target.value })} placeholder="01" /></div>
              <div><label style={label}>Label *</label><input style={input} value={budgetForm.labelText} onChange={e => setBudgetForm({ ...budgetForm, labelText: e.target.value })} placeholder="Concrete works" /></div>
              <div><label style={label}>Amount *</label><input type="number" style={input} value={budgetForm.budgetAmount} onChange={e => setBudgetForm({ ...budgetForm, budgetAmount: e.target.value })} placeholder="50000" /></div>
              <Button onClick={addBudgetLine} icon={Plus}>Add</Button>
            </div>
          </div>

          {budgetLines.length === 0 ? (
            <Empty icon={BarChart3} text="No budget lines yet" />
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 40px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
                <span>Code</span><span>Label</span><span style={{ textAlign: "right" }}>Amount</span><span></span>
              </div>
              {budgetLines.map((b, i) => (
                <div key={b.id || i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 40px", gap: _.s2, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: _.fontSize.base }}>
                  <span style={{ color: _.muted, fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{b.costCode || "—"}</span>
                  <span style={{ fontWeight: _.fontWeight.medium, color: _.ink }}>{b.label}</span>
                  <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(b.budgetAmount)}</span>
                  <div onClick={() => setDeleteModal({ type: "budget", idx: i })} style={{ cursor: "pointer", color: _.faint, display: "flex", justifyContent: "center", transition: `color ${_.tr}` }} onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", padding: `${_.s3}px 0`, fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold }}>
                Total: {fmt(T.budgetTotal)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── COMMITMENTS TAB ─── */}
      {tab === "Commitments" && (
        <div>
          <div style={{ marginBottom: _.s6, paddingBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wider, textTransform: "uppercase", marginBottom: _.s4 }}>Add Commitment (PO)</div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 140px auto", gap: `${_.s3}px ${_.s4}px`, alignItems: mobile ? "stretch" : "end" }}>
              <div><label style={label}>Vendor</label><input style={input} value={commitForm.vendor} onChange={e => setCommitForm({ ...commitForm, vendor: e.target.value })} placeholder="Trade name" /></div>
              <div><label style={label}>Description *</label><input style={input} value={commitForm.description} onChange={e => setCommitForm({ ...commitForm, description: e.target.value })} placeholder="Concrete slab pour" /></div>
              <div><label style={label}>Amount *</label><input type="number" style={input} value={commitForm.amount} onChange={e => setCommitForm({ ...commitForm, amount: e.target.value })} placeholder="25000" /></div>
              <Button onClick={addCommitment} icon={Plus}>Add</Button>
            </div>
          </div>

          {commitments.length === 0 ? (
            <Empty icon={BarChart3} text="No commitments yet" />
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 80px 40px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
                <span>Vendor</span><span>Description</span><span style={{ textAlign: "right" }}>Amount</span><span style={{ textAlign: "center" }}>Status</span><span></span>
              </div>
              {commitments.map((c, i) => (
                <div key={c.id || i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 80px 40px", gap: _.s2, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: _.fontSize.base }}>
                  <span style={{ color: _.body }}>{c.vendor || "—"}</span>
                  <span style={{ fontWeight: _.fontWeight.medium, color: _.ink }}>{c.description}</span>
                  <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(c.amount)}</span>
                  <div style={{ textAlign: "center" }}>
                    <span onClick={() => { up(pr => { pr.commitments[i].status = c.status === "approved" ? "pending" : "approved"; return pr; }); }} style={{ ...badge(c.status === "approved" ? _.green : _.amber), cursor: "pointer" }}>
                      {c.status === "approved" ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <div onClick={() => setDeleteModal({ type: "commitment", idx: i })} style={{ cursor: "pointer", color: _.faint, display: "flex", justifyContent: "center", transition: `color ${_.tr}` }} onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", padding: `${_.s3}px 0`, fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold }}>
                Total: {fmt(T.committedTotal)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── ACTUALS TAB ─── */}
      {tab === "Actuals" && (
        <div>
          {actuals.length === 0 ? (
            <Empty icon={BarChart3} text="No actual costs recorded yet" />
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 90px 40px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
                <span>Description</span><span>Source</span><span style={{ textAlign: "right" }}>Amount</span><span>Date</span><span></span>
              </div>
              {actuals.map((a, i) => (
                <div key={a.id || i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 90px 40px", gap: _.s2, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center", fontSize: _.fontSize.base }}>
                  <span style={{ fontWeight: _.fontWeight.medium, color: _.ink }}>{a.description}</span>
                  <span style={{ color: _.muted, fontSize: _.fontSize.sm }}>{a.source || "Manual"}</span>
                  <span style={{ textAlign: "right", fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(a.amount)}</span>
                  <span style={{ fontSize: _.fontSize.sm, color: _.body }}>{a.date || "—"}</span>
                  <div onClick={() => setDeleteModal({ type: "actual", idx: i })} style={{ cursor: "pointer", color: _.faint, display: "flex", justifyContent: "center", transition: `color ${_.tr}` }} onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", padding: `${_.s3}px 0`, fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold }}>
                Total: {fmt(T.actualsTotal)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── SCOPE COSTS TAB (legacy) ─── */}
      {tab === "Scope Costs" && (
        <div>
          {T.cats.length === 0 && <Empty icon={BarChart3} text="Add scope items in Quote to begin tracking" action={() => navigate("../quote?step=scope")} actionText="Go to Quote" />}
          {T.cats.map(([cat, items]) => {
            const est = T.cT(p.scope, cat);
            const act = T.cA(p.scope, cat);
            const v = act - est;
            return (
              <div key={cat} style={{ marginBottom: _.s6, paddingBottom: _.s5, borderBottom: `1px solid ${_.line}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s2 }}>
                  <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi }}>{cat}</span>
                  {v !== 0 && <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: v > 0 ? _.red : _.green }}>{v > 0 ? "+" : ""}{fmt(v)}</span>}
                </div>
                <div style={{ display: "flex", gap: _.s5, fontSize: _.fontSize.base, color: _.muted, marginBottom: _.s3 }}>
                  <span>Budget <strong style={{ color: _.ink }}>{fmt(est)}</strong></span>
                  <span>Actual <strong style={{ color: act > est ? _.red : _.green }}>{fmt(act)}</strong></span>
                </div>
                {act > 0 && <div style={{ height: 3, background: _.line, borderRadius: 2, marginBottom: _.s3 }}><div style={{ height: "100%", width: `${Math.min((act / est) * 100, 100)}%`, background: act > est ? _.red : _.green, borderRadius: 2, transition: "width 0.4s" }} /></div>}
                {items.filter(i => i.on).map(item => (
                  <div key={item._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: _.fontSize.base }}>
                    <span style={{ color: _.body }}>{item.item}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                      <span style={{ color: _.muted, fontVariantNumeric: "tabular-nums" }}>{fmt(item.rate * item.qty)}</span>
                      <input type="number" placeholder="Actual" style={{ width: 76, padding: "3px 6px", background: _.well, border: `1px solid ${_.line}`, borderRadius: 5, color: _.ink, fontSize: _.fontSize.sm, textAlign: "right", outline: "none" }}
                        value={item.actual || ""} onChange={e => uI(cat, p.scope[cat].indexOf(item), "actual", parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Item" width={400}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, marginBottom: _.s6 }}>Are you sure you want to delete this item?</div>
        <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" onClick={removeItem}>Delete</Button>
        </div>
      </Modal>
    </Section>
  );
}
