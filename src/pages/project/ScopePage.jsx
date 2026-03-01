import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, label, btnPrimary, btnGhost, uid, ds, ts } from "../../theme/styles.js";
import { STAGES } from "../../data/defaults.js";
import { calc } from "../../lib/calc.js";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import { Check, ChevronRight, Plus, ArrowRight, X, Library, Send } from "lucide-react";

export default function ScopePage() {
  const { project: p, update: up, T, client, log } = useProject();
  const { clients, clientsHook, rateLibrary, mobile, notify } = useApp();
  const navigate = useNavigate();
  const [exp, setExp] = useState({});
  const [newCat, setNewCat] = useState("");
  const [editCat, setEditCat] = useState(null);
  const [editCatName, setEditCatName] = useState("");
  const [ratePickerCat, setRatePickerCat] = useState(null);
  const [rfqCat, setRfqCat] = useState(null);
  const [delCat, setDelCat] = useState(null);

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

  const delI = (cat, idx) => up(pr => {
    pr.scope[cat].splice(idx, 1);
    return pr;
  });

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

  // Rate Library picker: find items matching category name
  const ratePickerItems = ratePickerCat ? (() => {
    const cat = rateLibrary.categories.find(c => c.name.toLowerCase() === ratePickerCat.toLowerCase());
    if (cat) return rateLibrary.getItemsByCategory(cat.id);
    return rateLibrary.items.slice(0, 20);
  })() : [];

  const addFromLibrary = (item) => {
    if (!ratePickerCat) return;
    up(pr => {
      if (!pr.scope[ratePickerCat]) pr.scope[ratePickerCat] = [];
      pr.scope[ratePickerCat].push({
        item: item.name, unit: item.unit, rate: item.unitRate,
        qty: item.defaultQty || 1, on: true, actual: 0, _id: uid(),
      });
      return pr;
    });
    notify(`Added: ${item.name}`);
  };

  // Sticky sidebar content
  const SummaryContent = () => (
    <>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: _.muted, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>Quote Summary</div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", color: T.curr > 0 ? _.ink : _.faint, lineHeight: 1 }}>
          {fmt(T.curr)}
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${_.line}`, paddingTop: 12, marginBottom: 16 }}>
        {[
          ["Items", T.items],
          ["Subtotal", fmt(T.sub)],
          [`Margin ${margin}%`, fmt(T.mar)],
          [`Contingency ${contingency}%`, fmt(T.con)],
          ["GST", fmt(T.gst)],
        ].map(([l, v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: _.body }}>
            <span>{l}</span><span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{v}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", fontSize: 14, fontWeight: 700, color: _.ink, borderTop: `1px solid ${_.line}`, marginTop: 8 }}>
          <span>Total</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</span>
        </div>
      </div>
      {quoteReady ? (
        <Button onClick={() => createProp()} icon={ArrowRight} style={{ width: "100%" }}>Generate Proposal</Button>
      ) : (
        <Button disabled style={{ width: "100%" }}>Add client details first</Button>
      )}
    </>
  );

  return (
    <div style={{ animation: "fadeUp 0.2s ease", maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s2 }}>
        <h1 style={{ fontSize: mobile ? 28 : 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Quote</h1>
        {mobile && T.curr > 0 && <span style={{ fontSize: 24, fontWeight: 700, color: _.ink, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</span>}
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: _.s6, marginBottom: _.s7, paddingBottom: _.s5, borderBottom: `1px solid ${_.line}` }}>
        {[["Details", !!clientName], ["Scope", T.items > 0], ["Review", T.curr > 0]].map(([l, done]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: done ? _.green : _.well, border: done ? "none" : `1.5px solid ${_.line2}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {done && <Check size={11} strokeWidth={3} color="#fff" />}
            </div>
            <span style={{ fontSize: 13, fontWeight: done ? 600 : 400, color: done ? _.ink : _.muted }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Two-column layout: builder + sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 280px", gap: mobile ? 0 : 32, alignItems: "start" }}>
        {/* LEFT: scope builder */}
        <div>
          {/* Client details */}
          <div style={{ marginBottom: _.s8 }}>
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
                ["Floor area (m²)", "floorArea", "280"],
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
                    <input style={input} value={p.floorArea || p.area || ""} onChange={e => up(pr => { pr.floorArea = e.target.value; pr.area = e.target.value; return pr; })} placeholder={ph} type="number" />
                  ) : (
                    <input style={input} value={p[k] || ""} onChange={e => up(pr => { pr[k] = e.target.value; return pr; })} placeholder={ph} />
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
          <div style={{ marginBottom: _.s8 }}>
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
                      {editCat === cat ? (
                        <input autoFocus style={{ fontSize: 14, fontWeight: 600, color: _.ink, background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, padding: "2px 6px", outline: "none", fontFamily: "inherit" }}
                          value={editCatName} onChange={e => setEditCatName(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          onKeyDown={e => {
                            if (e.key === "Enter") { e.target.blur(); }
                            if (e.key === "Escape") { setEditCat(null); setEditCatName(""); }
                          }}
                          onBlur={() => {
                            const nm = editCatName.trim();
                            if (!nm || nm === cat) { setEditCat(null); return; }
                            if (p.scope[nm]) { notify("Category already exists", "error"); return; }
                            up(pr => { pr.scope[nm] = pr.scope[cat]; delete pr.scope[cat]; return pr; });
                            setExp(e2 => { const n2 = { ...e2, [nm]: e2[cat] }; delete n2[cat]; return n2; });
                            setEditCat(null); setEditCatName("");
                          }}
                        />
                      ) : (
                        <span onClick={e => { e.stopPropagation(); setEditCat(cat); setEditCatName(cat); }} style={{ fontSize: 14, fontWeight: n > 0 ? 600 : 400, color: n > 0 ? _.ink : _.muted, cursor: "text" }}>{cat}</span>
                      )}
                      {n > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: _.ac, marginLeft: 4 }}>{n}</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: _.s3 }}>
                      {catT > 0 && <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: _.ink }}>{fmt(catT)}</span>}
                      <div onClick={e => { e.stopPropagation(); setDelCat(cat); }}
                        style={{ cursor: "pointer", color: _.faint, transition: `color ${_.tr}`, padding: 2 }}
                        onMouseEnter={e => e.currentTarget.style.color = _.red}
                        onMouseLeave={e => e.currentTarget.style.color = _.faint}
                      ><X size={13} /></div>
                    </div>
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
                          <input style={{ flex: 1, fontSize: 13, color: item.on ? _.ink : _.muted, background: "transparent", border: "none", outline: "none", fontFamily: "inherit", padding: 0 }}
                            value={item.item} onChange={e => uI(cat, idx, "item", e.target.value)} />
                          {item.on && <>
                            <input type="number" style={{ width: 48, padding: "3px 5px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: 12, textAlign: "center", outline: "none", fontWeight: 600 }}
                              value={item.qty} onChange={e => uI(cat, idx, "qty", parseFloat(e.target.value) || 0)} />
                            <input style={{ width: 40, padding: "3px 4px", background: "transparent", border: "none", outline: "none", fontSize: 11, color: _.muted, fontFamily: "inherit", textAlign: "center" }}
                              value={item.unit} onChange={e => uI(cat, idx, "unit", e.target.value)} />
                            <input type="number" style={{ width: 60, padding: "3px 5px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: 12, textAlign: "right", outline: "none", fontWeight: 600 }}
                              value={item.rate} onChange={e => uI(cat, idx, "rate", parseFloat(e.target.value) || 0)} />
                            <span style={{ fontSize: 13, fontWeight: 600, minWidth: 56, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(item.rate * item.qty)}</span>
                          </>}
                          <div onClick={() => delI(cat, idx)}
                            style={{ cursor: "pointer", color: _.faint, transition: `color ${_.tr}`, flexShrink: 0, padding: 2 }}
                            onMouseEnter={e => e.currentTarget.style.color = _.red}
                            onMouseLeave={e => e.currentTarget.style.color = _.faint}
                          ><X size={12} /></div>
                        </div>
                      ))}
                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: _.s3, paddingTop: 4, flexWrap: "wrap" }}>
                        <div onClick={() => addC(cat)} style={{ padding: "6px 0", cursor: "pointer", color: _.ac, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        ><Plus size={13} /> Add custom</div>
                        <div onClick={() => setRatePickerCat(cat)} style={{ padding: "6px 0", cursor: "pointer", color: _.ac, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        ><Library size={12} /> From library</div>
                        <div onClick={() => setRfqCat(cat)} style={{ padding: "6px 0", cursor: "pointer", color: _.muted, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        ><Send size={11} /> Request quote</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ display: "flex", gap: _.s2, alignItems: "center", marginTop: _.s4 }}>
              <input style={{ ...input, flex: 1, maxWidth: 240 }} value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category name" onKeyDown={e => {
                if (e.key === "Enter" && newCat.trim()) {
                  up(pr => { if (!pr.scope[newCat.trim()]) pr.scope[newCat.trim()] = []; return pr; });
                  setExp(e2 => ({ ...e2, [newCat.trim()]: true }));
                  setNewCat("");
                }
              }} />
              <button onClick={() => {
                if (!newCat.trim()) { notify("Enter a category name", "error"); return; }
                if (p.scope[newCat.trim()]) { notify("Category already exists", "error"); return; }
                up(pr => { pr.scope[newCat.trim()] = []; return pr; });
                setExp(e2 => ({ ...e2, [newCat.trim()]: true }));
                setNewCat("");
              }} style={{ ...btnGhost, whiteSpace: "nowrap" }}><Plus size={13} /> Add category</button>
            </div>
          </div>

          {/* Review section */}
          {T.curr > 0 && (
            <div style={{ paddingTop: _.s8, marginTop: _.s4, borderTop: `2px solid ${_.ink}`, marginBottom: _.s7 }}>
              <div style={{ fontSize: 11, color: _.body, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>Review</div>
              {/* Category breakdown */}
              {Object.entries(p.scope).filter(([, items]) => items.some(i => i.on)).map(([cat, items]) => {
                const catItems = items.filter(i => i.on);
                const catTotal = catItems.reduce((t, i) => t + i.rate * i.qty, 0);
                return (
                  <div key={cat} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: _.ink, marginBottom: 6, paddingBottom: 4, borderBottom: `1px solid ${_.line}` }}>
                      <span>{cat}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(catTotal)}</span>
                    </div>
                    {catItems.map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: _.body, padding: "2px 0 2px 12px" }}>
                        <span>{item.item} × {item.qty} {item.unit}</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(item.rate * item.qty)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
              {/* Totals */}
              <div style={{ borderTop: `2px solid ${_.ink}`, paddingTop: 12, marginTop: 8 }}>
                {[["Subtotal", fmt(T.sub)], [`Margin ${margin}%`, fmt(T.mar)], [`Contingency ${contingency}%`, fmt(T.con)], ["GST 10%", fmt(T.gst)]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: _.muted }}>
                    <span>{l}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px", fontSize: 20, fontWeight: 700, color: _.ink, borderTop: `1px solid ${_.line}`, marginTop: 8 }}>
                  <span>Contract Total</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: _.s2, marginTop: 20 }}>
                {quoteReady
                  ? <Button onClick={() => createProp()} icon={ArrowRight}>Generate Proposal</Button>
                  : <Button disabled>Add client details first</Button>}
                <Button variant="ghost" onClick={() => navigate("../costs")}>Cost tracker</Button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Sticky sidebar (desktop only) */}
        {!mobile && (
          <div style={{ position: "sticky", top: 0 }}>
            <Card style={{ padding: 20 }}>
              <SummaryContent />
            </Card>
          </div>
        )}
      </div>

      {/* Mobile: floating summary bar */}
      {mobile && T.curr > 0 && (
        <div style={{
          position: "fixed", bottom: 72, left: 0, right: 0,
          background: _.surface, borderTop: `1px solid ${_.line}`,
          padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.06)", zIndex: 50,
        }}>
          <div>
            <div style={{ fontSize: 11, color: _.muted, fontWeight: 600 }}>{T.items} items</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</div>
          </div>
          {quoteReady && <Button size="sm" onClick={() => createProp()} icon={ArrowRight}>Generate</Button>}
        </div>
      )}

      {/* Rate Library Picker Modal */}
      <Modal open={!!ratePickerCat} onClose={() => setRatePickerCat(null)} title={`Add from Rate Library — ${ratePickerCat}`}>
        {ratePickerItems.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center", color: _.muted, fontSize: 13 }}>
            No matching items in rate library. Add items via <span style={{ color: _.ac, cursor: "pointer" }} onClick={() => { setRatePickerCat(null); navigate("/rate-library"); }}>Rate Library</span>.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: _.muted, marginBottom: 12 }}>Click to add items to scope</div>
            {ratePickerItems.map(item => (
              <div key={item.id} onClick={() => addFromLibrary(item)} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: `1px solid ${_.line}`, cursor: "pointer",
                transition: `background ${_.tr}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: _.ink }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: _.muted }}>{item.unit} · {fmt(item.unitRate)}</div>
                </div>
                <Plus size={14} color={_.ac} />
              </div>
            ))}
          </>
        )}
        <div style={{ marginTop: 16 }}>
          <Button variant="ghost" onClick={() => setRatePickerCat(null)}>Done</Button>
        </div>
      </Modal>

      {/* RFQ Stub Modal */}
      <Modal open={!!rfqCat} onClose={() => setRfqCat(null)} title="Request for Quote" width={400}>
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <Send size={32} color={_.muted} style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 14, color: _.body, marginBottom: 8 }}>RFQ feature coming soon</div>
          <div style={{ fontSize: 13, color: _.muted }}>You'll be able to send quote requests to trades for <strong>{rfqCat}</strong> directly from here.</div>
        </div>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Button variant="secondary" onClick={() => setRfqCat(null)}>Close</Button>
        </div>
      </Modal>

      {/* Delete category confirmation modal */}
      <Modal open={!!delCat} onClose={() => setDelCat(null)} title="Delete Category" width={400}>
        <div style={{ fontSize: 14, color: _.body, marginBottom: 24 }}>
          Delete <strong>{delCat}</strong> and all its items?
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDelCat(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            up(pr => { delete pr.scope[delCat]; return pr; });
            setDelCat(null);
          }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
