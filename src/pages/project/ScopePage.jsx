import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, label, btnPrimary, btnGhost, uid, ds, ts } from "../../theme/styles.js";
import { STAGES } from "../../data/defaults.js";
import { calc } from "../../lib/calc.js";
import Section from "../../components/ui/Section.jsx";
import { Check, ChevronRight, Plus, ArrowRight } from "lucide-react";

export default function ScopePage() {
  const { project: p, update: up, T, client, log } = useProject();
  const { clients, clientsHook, mobile, notify } = useApp();
  const navigate = useNavigate();
  const [exp, setExp] = useState({});
  const clientRef = useRef(null);

  const stage = p.stage || p.status;
  const margin = p.marginPct ?? p.margin ?? 0;
  const contingency = p.contingencyPct ?? p.contingency ?? 0;

  const uI = (cat, idx, k, v) => up(pr => {
    pr.scope[cat][idx][k] = v;
    if (k === "on" && v && !pr.scope[cat][idx].qty) pr.scope[cat][idx].qty = 1;
    return pr;
  });

  const addC = cat => up(pr => {
    pr.scope[cat].push({ item: "Custom Item", unit: "fixed", rate: 0, qty: 1, on: true, actual: 0, custom: true, _id: uid() });
    return pr;
  });

  // Determine client name for display
  const clientName = p.client || (client ? client.displayName : "");
  const quoteReady = clientName && T.items > 0;

  const createProp = (name) => {
    if (!name) name = `Proposal v${p.proposals.length + 1}`;
    up(pr => {
      const t = calc(pr);
      pr.proposals.push({
        id: `PROP-${uid()}`,
        name,
        date: ds(),
        scope: JSON.parse(JSON.stringify(pr.scope)),
        client: clientName,
        address: pr.address,
        suburb: pr.suburb,
        type: pr.buildType || pr.type,
        stories: pr.storeys || pr.stories,
        area: pr.floorArea || pr.area,
        notes: pr.notes,
        validDays: pr.validDays,
        pricing: { sub: t.sub, mar: t.mar, con: t.con, gst: t.gst, total: t.curr, margin: t.margin, contingency: t.contingency },
        sigData: null,
        status: "draft",
      });
      return pr;
    });
    log("Proposal saved: " + name);
    notify("Proposal saved");
    navigate("../proposals");
  };

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s2 }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Quote</h1>
        {T.curr > 0 && <span style={{ fontSize: 40, fontWeight: 700, color: _.ink, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</span>}
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: _.s6, marginBottom: _.s9, paddingBottom: _.s5, borderBottom: `1px solid ${_.line}` }}>
        {[["Details", !!clientName], ["Scope", T.items > 0], ["Review", T.curr > 0]].map(([l, done]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: done ? _.green : _.well, border: done ? "none" : `1.5px solid ${_.line2}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {done && <Check size={11} strokeWidth={3} color="#fff" />}
            </div>
            <span style={{ fontSize: 13, fontWeight: done ? 600 : 400, color: done ? _.ink : _.muted }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Client details */}
      <div style={{ marginBottom: _.s9 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s5 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: _.ink }}>Client & Project</div>
          {p.clientId && client && (
            <button onClick={() => navigate(`/clients/${p.clientId}`)} style={btnGhost}>Edit client</button>
          )}
        </div>
        <div style={{ marginBottom: _.s4 }}>
          <label style={label}>Project name</label>
          <input style={input} value={p.name || ""} onChange={e => up(pr => { pr.name = e.target.value; return pr; })} placeholder="e.g. Johnson Residence Extension" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: `${_.s3}px ${_.s4}px` }}>
          {[
            ["Client name", "client", "Johnson Residence"],
            ["Email", "email", "client@email.com"],
            ["Phone", "phone", "0412 345 678"],
            ["Site address", "address", "42 Smith St"],
            ["Suburb", "suburb", "Richmond"],
            ["Assigned to", "assignedTo", "Site manager name"],
            ["Build type", "buildType", ""],
            ["Storeys", "storeys", ""],
            ["Floor area (m\u00B2)", "floorArea", "280"],
          ].map(([l, k, ph]) => (
            <div key={k}>
              <label style={label}>{l}</label>
              {k === "buildType" ? (
                <select style={{ ...input, cursor: "pointer" }} value={p.buildType || p.type || ""} onChange={e => up(pr => { pr.buildType = e.target.value; pr.type = e.target.value; return pr; })}>
                  {["New Build", "Extension", "Renovation", "Knockdown Rebuild", "Townhouse", "Duplex"].map(o => <option key={o}>{o}</option>)}
                </select>
              ) : k === "storeys" ? (
                <select style={{ ...input, cursor: "pointer" }} value={p.storeys || p.stories || ""} onChange={e => up(pr => { pr.storeys = e.target.value; pr.stories = e.target.value; return pr; })}>
                  {["Single Storey", "Double Storey", "Three Storey", "Split Level"].map(o => <option key={o}>{o}</option>)}
                </select>
              ) : k === "floorArea" ? (
                <input ref={k === "client" ? clientRef : undefined} style={input} value={p.floorArea || p.area || ""} onChange={e => up(pr => { pr.floorArea = e.target.value; pr.area = e.target.value; return pr; })} placeholder={ph} type="number" />
              ) : (
                <input ref={k === "client" ? clientRef : undefined} style={input} value={p[k] || ""} onChange={e => up(pr => { pr[k] = e.target.value; return pr; })} placeholder={ph} />
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: _.s3 }}>
          <label style={label}>Notes</label>
          <textarea style={{ ...input, minHeight: 56, resize: "vertical" }} value={p.notes || ""} onChange={e => up(pr => { pr.notes = e.target.value; return pr; })} placeholder="Scope notes, special requirements..." />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: _.s4, marginTop: _.s4 }}>
          <div>
            <label style={label}>Margin %</label>
            <input type="number" style={{ ...input, textAlign: "center", fontWeight: 600, fontSize: 18 }} value={margin} onChange={e => up(pr => { pr.marginPct = parseFloat(e.target.value) || 0; pr.margin = pr.marginPct; return pr; })} />
          </div>
          <div>
            <label style={label}>Contingency %</label>
            <input type="number" style={{ ...input, textAlign: "center", fontWeight: 600, fontSize: 18 }} value={contingency} onChange={e => up(pr => { pr.contingencyPct = parseFloat(e.target.value) || 0; pr.contingency = pr.contingencyPct; return pr; })} />
          </div>
          <div>
            <label style={label}>Stage</label>
            <select style={{ ...input, cursor: "pointer" }} value={stage} onChange={e => { const nv = e.target.value; up(pr => { pr.stage = nv; pr.status = nv; return pr; }); log("Status → " + nv); }}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Scope of Works */}
      <div style={{ marginBottom: _.s9 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s5 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: _.ink }}>Scope of Works</div>
          {T.items > 0 && <span style={{ fontSize: 14, color: _.body }}>{T.items} items · {fmt(T.sub)}</span>}
        </div>
        {Object.entries(p.scope).map(([cat, items]) => {
          const open = exp[cat];
          const catT = items.filter(i => i.on).reduce((t, i) => t + i.rate * i.qty, 0);
          const n = items.filter(i => i.on).length;
          return (
            <div key={cat} style={{ marginBottom: 2 }}>
              <div onClick={() => setExp(e => ({ ...e, [cat]: !e[cat] }))} style={{
                padding: "10px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between",
                alignItems: "center", borderLeft: n > 0 ? `2px solid ${_.ac}` : `2px solid transparent`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                  <span style={{ transform: open ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}>
                    <ChevronRight size={13} color={n > 0 ? _.ac : _.muted} />
                  </span>
                  <span style={{ fontSize: 14, fontWeight: n > 0 ? 600 : 400, color: n > 0 ? _.ink : _.muted }}>{cat}</span>
                  {n > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: _.ac, marginLeft: 4 }}>{n}</span>}
                </div>
                {catT > 0 && <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: _.ink }}>{fmt(catT)}</span>}
              </div>
              {open && (
                <div style={{ paddingBottom: _.s4, paddingLeft: 24, borderLeft: `2px solid ${_.line}`, marginLeft: 0 }}>
                  {items.map((item, idx) => (
                    <div key={item._id} style={{ display: "flex", gap: _.s2, alignItems: "center", padding: "5px 0" }}>
                      <div onClick={() => uI(cat, idx, "on", !item.on)} style={{
                        width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${item.on ? _.ac : _.line2}`,
                        background: item.on ? _.ac : "transparent", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>{item.on && <Check size={10} strokeWidth={3} color="#fff" />}</div>
                      <span style={{ flex: 1, fontSize: 13, color: item.on ? _.ink : _.muted }}>{item.item}</span>
                      {item.on && <>
                        <input type="number" style={{ width: 48, padding: "3px 5px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: 12, textAlign: "center", outline: "none", fontWeight: 600 }}
                          value={item.qty} onChange={e => uI(cat, idx, "qty", parseFloat(e.target.value) || 0)} />
                        <span style={{ fontSize: 11, color: _.muted, minWidth: 22 }}>{item.unit}</span>
                        <input type="number" style={{ width: 60, padding: "3px 5px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: 12, textAlign: "right", outline: "none", fontWeight: 600 }}
                          value={item.rate} onChange={e => uI(cat, idx, "rate", parseFloat(e.target.value) || 0)} />
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 56, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(item.rate * item.qty)}</span>
                      </>}
                    </div>
                  ))}
                  <div onClick={() => addC(cat)} style={{ padding: "6px 0", cursor: "pointer", color: _.ac, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  ><Plus size={13} /> Add item</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Review */}
      {T.curr > 0 && (
        <div style={{ paddingTop: _.s8, marginTop: _.s4, borderTop: `2px solid ${_.ink}`, marginBottom: _.s7 }}>
          <div style={{ fontSize: 11, color: _.body, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>Review</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s5 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: _.ink }}>Contract Total</div>
            <div style={{ fontSize: mobile ? 40 : 56, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: "#0a0f1a" }}>{fmt(T.curr)}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: _.s6 }}>
            <div style={{ textAlign: "right", minWidth: 200 }}>
              {[["Subtotal", fmt(T.sub)], [`Margin ${margin}%`, fmt(T.mar)], [`Contingency ${contingency}%`, fmt(T.con)], ["GST", fmt(T.gst)]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13, color: _.muted }}>
                  <span>{l}</span><span style={{ fontVariantNumeric: "tabular-nums", marginLeft: 24 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: _.s2 }}>
            {quoteReady
              ? <button onClick={() => createProp()} style={{ ...btnPrimary, padding: "11px 24px", fontSize: 14 }}>Generate proposal <ArrowRight size={14} /></button>
              : <button style={{ ...btnPrimary, opacity: 0.4, cursor: "default", padding: "11px 24px", fontSize: 14 }}>Add client details first</button>}
            <button onClick={() => navigate("../costs")} style={btnGhost}>Cost tracker</button>
          </div>
        </div>
      )}
    </Section>
  );
}
