import { useMemo, useState } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { applyApprovedVariation } from "../../lib/costEngine.js";
import _ from "../../theme/tokens.js";
import { fmt, input, label, uid, badge } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { ClipboardList, Plus, Send, Check, XCircle } from "lucide-react";

const STATUS_COLOR = {
  Draft: _.muted,
  Pending: _.amber,
  Approved: _.green,
  Rejected: _.red,
};

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function nextVariationNumber(variations) {
  const max = (variations || []).reduce((acc, v) => {
    const m = String(v.number || "").match(/(\d+)/);
    const n = m ? Number(m[1]) : 0;
    return Math.max(acc, n);
  }, 0);
  return `VO-${String(max + 1).padStart(3, "0")}`;
}

export default function VariationsPage() {
  const { project: p, update: up, log } = useProject();
  const { mobile, notify } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", costImpact: "", sellImpact: "", _err: false });

  const variations = Array.isArray(p.variations) ? p.variations : [];
  const approvedValue = useMemo(
    () => variations.filter((v) => v.status === "Approved").reduce((t, v) => t + toNum(v.sellImpact), 0),
    [variations],
  );
  const pendingValue = useMemo(
    () => variations.filter((v) => v.status === "Pending").reduce((t, v) => t + toNum(v.sellImpact), 0),
    [variations],
  );

  const createVariation = () => {
    if (!form.title.trim()) {
      setForm((f) => ({ ...f, _err: true }));
      return;
    }
    const variation = {
      id: uid(),
      number: nextVariationNumber(variations),
      title: form.title.trim(),
      description: form.description.trim(),
      costImpact: toNum(form.costImpact),
      sellImpact: toNum(form.sellImpact),
      status: "Draft",
      createdAt: new Date().toISOString(),
    };
    up((pr) => {
      if (!Array.isArray(pr.variations)) pr.variations = [];
      pr.variations.unshift(variation);
      return pr;
    });
    notify("Variation created");
    log(`Variation created: ${variation.number} ${variation.title}`);
    setForm({ title: "", description: "", costImpact: "", sellImpact: "", _err: false });
    setShowCreate(false);
  };

  const setStatus = (variationId, status) => {
    up((pr) => {
      const v = (pr.variations || []).find((x) => x.id === variationId);
      if (!v) return pr;
      const previous = v.status;
      v.status = status;
      if (status === "Pending") v.submittedAt = new Date().toISOString();
      if (status === "Rejected") v.rejectedAt = new Date().toISOString();
      if (status === "Approved" && previous !== "Approved") {
        applyApprovedVariation(pr, v);
      }
      return pr;
    });
    notify(`Variation ${status}`);
    log(`Variation ${status}: ${variationId}`);
  };

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: _.s3, marginBottom: _.s6, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Variations</h1>
          <div style={{ fontSize: _.fontSize.md, color: _.muted }}>Adjust contract and budget through controlled approvals.</div>
        </div>
        <Button icon={Plus} onClick={() => setShowCreate(true)}>Create Variation</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: _.s3, marginBottom: _.s6 }}>
        <div style={{ border: `1px solid ${_.line}`, borderRadius: _.r, padding: _.s4, background: _.surface }}>
          <div style={{ fontSize: _.fontSize.caption, color: _.muted, textTransform: "uppercase", letterSpacing: _.letterSpacing.wider, marginBottom: _.s2 }}>Approved</div>
          <div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: _.green }}>{fmt(approvedValue)}</div>
        </div>
        <div style={{ border: `1px solid ${_.line}`, borderRadius: _.r, padding: _.s4, background: _.surface }}>
          <div style={{ fontSize: _.fontSize.caption, color: _.muted, textTransform: "uppercase", letterSpacing: _.letterSpacing.wider, marginBottom: _.s2 }}>Pending</div>
          <div style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: _.amber }}>{fmt(pendingValue)}</div>
        </div>
      </div>

      {variations.length === 0 && <Empty icon={ClipboardList} text="No variations yet" />}
      {variations.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "110px 1fr 120px 120px 110px 220px", gap: _.s2, padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`, fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>
            <span>Variation #</span>
            <span>Title</span>
            {!mobile && (
              <>
                <span style={{ textAlign: "right" }}>Cost Impact</span>
                <span style={{ textAlign: "right" }}>Sell Impact</span>
                <span style={{ textAlign: "center" }}>Status</span>
                <span style={{ textAlign: "right" }}>Actions</span>
              </>
            )}
          </div>

          {variations.map((v) => (
            <div key={v.id} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr auto" : "110px 1fr 120px 120px 110px 220px", gap: _.s2, padding: `${_.s3}px 0`, borderBottom: `1px solid ${_.line}`, alignItems: "center" }}>
              <span style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.bold, color: _.ink }}>{v.number || "—"}</span>
              <div>
                <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, color: _.ink }}>{v.title || "—"}</div>
                <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{v.description || "No description"}</div>
              </div>
              {!mobile && (
                <>
                  <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(v.costImpact || 0)}</span>
                  <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{fmt(v.sellImpact || 0)}</span>
                  <div style={{ textAlign: "center" }}><span style={badge(STATUS_COLOR[v.status] || _.muted)}>{v.status || "Draft"}</span></div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                    {v.status === "Draft" && <Button size="sm" variant="secondary" icon={Send} onClick={() => setStatus(v.id, "Pending")}>Submit</Button>}
                    {v.status === "Pending" && (
                      <>
                        <Button size="sm" variant="secondary" icon={Check} onClick={() => setStatus(v.id, "Approved")}>Approve</Button>
                        <Button size="sm" variant="ghost" icon={XCircle} onClick={() => setStatus(v.id, "Rejected")}>Reject</Button>
                      </>
                    )}
                  </div>
                </>
              )}
              {mobile && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span style={badge(STATUS_COLOR[v.status] || _.muted)}>{v.status || "Draft"}</span>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Variation" width={520}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: _.s3 }}>
          <div>
            <label style={label}>Title *</label>
            <input style={{ ...input, borderColor: form._err && !form.title ? _.red : "transparent" }} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, _err: false }))} />
          </div>
          <div>
            <label style={label}>Description</label>
            <input style={input} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s3 }}>
            <div>
              <label style={label}>Cost Impact</label>
              <input type="number" style={input} value={form.costImpact} onChange={(e) => setForm((f) => ({ ...f, costImpact: e.target.value }))} />
            </div>
            <div>
              <label style={label}>Sell Impact</label>
              <input type="number" style={input} value={form.sellImpact} onChange={(e) => setForm((f) => ({ ...f, sellImpact: e.target.value }))} />
            </div>
          </div>
          <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>New variations start as Draft.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: _.s2, marginTop: _.s5 }}>
          <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button onClick={createVariation}>Create</Button>
        </div>
      </Modal>
    </Section>
  );
}
