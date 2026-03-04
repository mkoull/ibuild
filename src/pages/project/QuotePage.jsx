import { useState, useRef, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, label, btnGhost, uid, ds, ts } from "../../theme/styles.js";
import { STAGES, DEFAULT_EXCLUSIONS, DEFAULT_ALLOWANCES, DEFAULT_PC_ITEMS, DEFAULT_QUALIFICATIONS, DEFAULT_TERMS } from "../../data/defaults.js";
import { calc } from "../../lib/calc.js";
import { canTransition, isQuote, isJob, needsQuoteToJobConversion } from "../../lib/lifecycle.js";
import { usePageBottomBar } from "../../hooks/usePageBottomBar.js";
import { applyConvertToJobBaseline, calculateTotals, normalizeCategories } from "../../lib/costEngine.js";
import { exportPrintPdf } from "../../lib/pdfExport.js";
import Card from "../../components/ui/Card.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import { Check, ChevronRight, ChevronDown, Plus, ArrowRight, ArrowLeft, X, Library, Send, Search, UserPlus, FileCheck } from "lucide-react";

const STEPS = ["details", "scope", "extras", "review"];
const STEP_LABELS = { details: "Details", scope: "Scope", extras: "Extras", review: "Review" };
const QUOTE_STATUSES = ["Draft", "Sent", "Accepted", "Rejected"];

export default function QuotePage() {
  const { project: p, update: up, T, client, log, transitionStage } = useProject();
  const { clients, clientsHook, rateLibrary, mobile, notify, settings } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentStep = STEPS.includes(searchParams.get("step")) ? searchParams.get("step") : "details";
  const setStep = useCallback((s) => setSearchParams({ step: s }, { replace: true }), [setSearchParams]);

  const [exp, setExp] = useState({});
  const [newCat, setNewCat] = useState("");
  const [editCat, setEditCat] = useState(null);
  const [editCatName, setEditCatName] = useState("");
  const [ratePickerCat, setRatePickerCat] = useState(null);
  const [rfqCat, setRfqCat] = useState(null);
  const [delCat, setDelCat] = useState(null);
  const [clientOpen, setClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [newClientModal, setNewClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ displayName: "", companyName: "" });
  const clientDropRef = useRef(null);

  // Extras step state
  const [extrasExp, setExtrasExp] = useState({ exclusions: true, allowances: true, pcItems: true, qualifications: true, terms: true });
  const [exclInput, setExclInput] = useState("");
  const [allowInput, setAllowInput] = useState({ description: "", amount: "" });
  const [pcInput, setPcInput] = useState({ description: "", amount: "" });
  const [qualInput, setQualInput] = useState("");
  const [termInput, setTermInput] = useState("");

  const stage = p.stage || p.status;
  const margin = p.marginPct ?? p.margin ?? 0;
  const contingency = p.contingencyPct ?? p.contingency ?? 0;

  const clientName = p.client || (client ? client.displayName : "");
  const hasClient = !!p.clientId;
  const hasScope = T.items > 0;
  const quoteReady = clientName && hasScope;
  const proposalGenerated = p.proposal && p.proposal.status === "Generated";
  const quoteDoc = p.quoteDocument || null;
  const estimateCategories = normalizeCategories((p?.estimate && p.estimate.categories) || p.costCategories || []);
  const estimateTotals = calculateTotals(estimateCategories);
  usePageBottomBar(mobile && T.curr > 0 ? 64 : 0);

  // Step completeness
  const stepDone = {
    details: hasClient,
    scope: hasScope,
    extras: true,
    review: proposalGenerated,
  };

  // ─── Scope mutation helpers ───
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

  // ─── Client picker ───
  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase().trim();
    if (!q) return clients.slice(0, 20);
    return clients.filter(c =>
      (c.displayName || "").toLowerCase().includes(q) ||
      (c.companyName || "").toLowerCase().includes(q)
    ).slice(0, 20);
  }, [clients, clientSearch]);

  const selectClient = (c) => {
    up(pr => {
      pr.clientId = c.id;
      pr.client = c.displayName || c.companyName;
      const contact = (c.contacts || [])[0];
      if (contact) {
        if (contact.email && !pr.email) pr.email = contact.email;
        if (contact.phone && !pr.phone) pr.phone = contact.phone;
      }
      return pr;
    });
    setClientOpen(false);
    setClientSearch("");
    notify(`Client: ${c.displayName || c.companyName}`);
  };

  const createNewClient = () => {
    const name = newClientForm.displayName.trim();
    if (!name) { notify("Enter a client name", "error"); return; }
    const c = clientsHook.create({
      displayName: name,
      companyName: newClientForm.companyName.trim(),
    });
    selectClient(c);
    setNewClientModal(false);
    setNewClientForm({ displayName: "", companyName: "" });
    log(`Client created: ${name}`);
  };

  // ─── Extras mutation helpers ───
  const addExclusion = (text) => { if (!text.trim()) return; up(pr => { pr.exclusions.push({ _id: uid(), text: text.trim(), on: true }); return pr; }); setExclInput(""); };
  const delExclusion = (idx) => up(pr => { pr.exclusions.splice(idx, 1); return pr; });
  const loadDefaultExclusions = () => up(pr => {
    const existing = new Set(pr.exclusions.map(e => e.text.toLowerCase()));
    DEFAULT_EXCLUSIONS.forEach(t => { if (!existing.has(t.toLowerCase())) pr.exclusions.push({ _id: uid(), text: t, on: true }); });
    return pr;
  });

  const addAllowance = (desc, amt) => { if (!desc.trim()) return; up(pr => { pr.allowances.push({ _id: uid(), description: desc.trim(), amount: parseFloat(amt) || 0, on: true }); return pr; }); setAllowInput({ description: "", amount: "" }); };
  const delAllowance = (idx) => up(pr => { pr.allowances.splice(idx, 1); return pr; });
  const loadDefaultAllowances = () => up(pr => {
    const existing = new Set(pr.allowances.map(e => e.description.toLowerCase()));
    DEFAULT_ALLOWANCES.forEach(a => { if (!existing.has(a.description.toLowerCase())) pr.allowances.push({ _id: uid(), description: a.description, amount: a.amount, on: true }); });
    return pr;
  });

  const addPcItem = (desc, amt) => { if (!desc.trim()) return; up(pr => { pr.pcItems.push({ _id: uid(), description: desc.trim(), amount: parseFloat(amt) || 0, on: true }); return pr; }); setPcInput({ description: "", amount: "" }); };
  const delPcItem = (idx) => up(pr => { pr.pcItems.splice(idx, 1); return pr; });
  const loadDefaultPcItems = () => up(pr => {
    const existing = new Set(pr.pcItems.map(e => e.description.toLowerCase()));
    DEFAULT_PC_ITEMS.forEach(a => { if (!existing.has(a.description.toLowerCase())) pr.pcItems.push({ _id: uid(), description: a.description, amount: a.amount, on: true }); });
    return pr;
  });

  const addQualification = (text) => { if (!text.trim()) return; up(pr => { pr.qualifications.push({ _id: uid(), text: text.trim(), on: true }); return pr; }); setQualInput(""); };
  const delQualification = (idx) => up(pr => { pr.qualifications.splice(idx, 1); return pr; });
  const loadDefaultQualifications = () => up(pr => {
    const existing = new Set(pr.qualifications.map(e => e.text.toLowerCase()));
    DEFAULT_QUALIFICATIONS.forEach(t => { if (!existing.has(t.toLowerCase())) pr.qualifications.push({ _id: uid(), text: t, on: true }); });
    return pr;
  });

  const addTerm = (text) => { if (!text.trim()) return; up(pr => { pr.terms.push({ _id: uid(), text: text.trim(), on: true }); return pr; }); setTermInput(""); };
  const delTerm = (idx) => up(pr => { pr.terms.splice(idx, 1); return pr; });
  const updateTerm = (idx, text) => up(pr => { pr.terms[idx].text = text; return pr; });
  const loadDefaultTerms = () => up(pr => {
    const fill = (t) => t
      .replace("{validDays}", String(pr.validDays || 30))
      .replace("{depositPct}", String(pr.depositPct ?? 5))
      .replace("{paymentDays}", String(pr.paymentDays ?? 14))
      .replace("{defectsWeeks}", String(pr.defectsWeeks ?? 13));
    const existing = new Set(pr.terms.map(e => e.text.toLowerCase()));
    DEFAULT_TERMS.forEach(t => {
      const filled = fill(t);
      if (!existing.has(filled.toLowerCase())) pr.terms.push({ _id: uid(), text: filled, on: true });
    });
    return pr;
  });

  // ─── Generate Proposal ───
  const generateProposal = () => {
    const version = (p.proposal?.version || 0) + 1;
    up(pr => {
      const t = calc(pr);
      pr.proposal = {
        status: "Generated",
        generatedAt: Date.now(),
        version,
        total: t.curr,
      };
      pr.quoteSummary = { subtotal: t.sub, margin: t.mar, contingency: t.con, total: t.curr };
      pr.contractValue = t.curr;
      pr.proposals.push({
        id: `PROP-${uid()}`,
        name: `Proposal v${version}`,
        date: ds(),
        scope: JSON.parse(JSON.stringify(pr.scope)),
        client: pr.client,
        address: pr.address,
        suburb: pr.suburb,
        type: pr.buildType || pr.type,
        stories: pr.storeys || pr.stories,
        area: pr.floorArea || pr.area,
        notes: pr.notes,
        validDays: pr.validDays,
        exclusions: JSON.parse(JSON.stringify(pr.exclusions || [])),
        allowances: JSON.parse(JSON.stringify(pr.allowances || [])),
        pcItems: JSON.parse(JSON.stringify(pr.pcItems || [])),
        qualifications: JSON.parse(JSON.stringify(pr.qualifications || [])),
        terms: JSON.parse(JSON.stringify(pr.terms || [])),
        depositPct: pr.depositPct ?? 5,
        paymentDays: pr.paymentDays ?? 14,
        defectsWeeks: pr.defectsWeeks ?? 13,
        pricing: { sub: t.sub, mar: t.mar, con: t.con, gst: t.gst, total: t.curr, margin: t.margin, contingency: t.contingency },
        sigData: null,
        status: "draft",
      });
      if (!Array.isArray(pr.activity)) pr.activity = [];
      pr.activity.unshift({ type: "proposal_generated", action: `Proposal v${version} generated`, message: "Proposal generated", time: ts(), date: ds(), at: Date.now() });
      if (pr.activity.length > 30) pr.activity = pr.activity.slice(0, 30);
      return pr;
    });
    notify("Proposal generated");
  };

  const generateQuoteDocument = () => {
    if (!quoteReady) {
      notify("Complete client details and scope first", "error");
      return;
    }
    up((pr) => {
      const cats = normalizeCategories((pr?.estimate && pr.estimate.categories) || pr.costCategories || []);
      const totals = calculateTotals(cats);
      pr.quoteDocument = {
        id: pr.quoteDocument?.id || `QDOC-${uid()}`,
        status: pr.quoteDocument?.status || "Draft",
        generatedAt: new Date().toISOString(),
        quoteDate: ds(),
        clientName: pr.client || clientName || "",
        projectName: pr.name || "Project",
        categories: cats.map((cat) => ({
          id: cat.id,
          name: cat.name,
          itemCount: (cat.items || []).length,
        })),
        pricing: {
          totalCost: totals.totalCost,
          marginPercent: Number(pr.marginPct ?? pr.margin ?? 0),
          totalQuotePrice: totals.totalSell > 0 ? totals.totalSell : T.curr,
        },
        terms: "This quote is valid for 30 days. Work proceeds after written acceptance and scheduling confirmation.",
      };
      return pr;
    });
    notify("Quote generated");
  };

  const setQuoteDocumentStatus = (status) => {
    up((pr) => {
      const cats = normalizeCategories((pr?.estimate && pr.estimate.categories) || pr.costCategories || []);
      const totals = calculateTotals(cats);
      if (!pr.quoteDocument) {
        pr.quoteDocument = {
          id: `QDOC-${uid()}`,
          status: "Draft",
          generatedAt: new Date().toISOString(),
          quoteDate: ds(),
          clientName: pr.client || "",
          projectName: pr.name || "Project",
          categories: cats.map((cat) => ({
            id: cat.id,
            name: cat.name,
            itemCount: (cat.items || []).length,
          })),
          pricing: {
            totalCost: totals.totalCost,
            marginPercent: Number(pr.marginPct ?? pr.margin ?? 0),
            totalQuotePrice: totals.totalSell > 0 ? totals.totalSell : 0,
          },
          terms: "This quote is valid for 30 days. Work proceeds after written acceptance and scheduling confirmation.",
        };
      }
      pr.quoteDocument.status = status;
      return pr;
    });
  };

  const updateQuoteStatus = (status) => {
    if (status === "Sent") {
      sendQuote();
      return;
    }
    if (status === "Accepted") {
      markAccepted();
      return;
    }
    if (status === "Rejected") {
      markRejected();
      return;
    }
    setQuoteDocumentStatus(status);
    notify(`Quote marked ${status}`);
  };

  const exportQuotePdf = () => {
    if (!quoteDoc) return;
    const ok = exportPrintPdf({
      title: "Quote",
      companyName: settings?.companyName || "",
      projectName: quoteDoc.projectName || p.name || "",
      clientName: quoteDoc.clientName || clientName || "",
      dateLabel: quoteDoc.quoteDate || ds(),
      sections: [
        {
          title: "Scope Summary",
          type: "table",
          headers: ["Category", "Items"],
          rows: (quoteDoc.categories || []).map((cat) => [cat.name, String(cat.itemCount || 0)]),
        },
        {
          title: "Pricing Summary",
          type: "table",
          headers: ["Item", "Value"],
          rows: [
            ["Total Cost", fmt(quoteDoc.pricing?.totalCost || 0)],
            ["Margin %", `${Number(quoteDoc.pricing?.marginPercent || 0).toFixed(2)}%`],
            ["Total Quote Price", fmt(quoteDoc.pricing?.totalQuotePrice || 0)],
          ],
        },
        {
          title: "Terms",
          type: "text",
          text: quoteDoc.terms || "Terms to be agreed.",
        },
      ],
    });
    if (!ok) {
      notify("Pop-up blocked — please allow pop-ups for this site", "error");
    }
  };

  // ─── Send Quote (Lead → Quoted) ───
  const sendQuote = () => {
    if (!quoteReady) {
      notify("Complete details and scope first", "error");
      return;
    }
    if (canTransition(stage, "Quoted")) {
      transitionStage("Quoted");
    }
    setQuoteDocumentStatus("Sent");
    log("Quote sent to client");
    notify("Quote marked Sent");
  };

  const markRejected = () => {
    if (canTransition(stage, "Quoted")) {
      transitionStage("Quoted");
    }
    setQuoteDocumentStatus("Rejected");
    log("Quote marked rejected");
    notify("Quote marked Rejected");
  };

  const markAccepted = () => {
    if (!quoteReady) {
      notify("Complete details and scope first", "error");
      return;
    }
    let converted = false;
    up((pr) => {
      const didConvert = applyConvertToJobBaseline(pr);
      converted = didConvert || String(pr.stage || pr.status || "").toLowerCase() === "active";

      const contractValue = Number(pr?.job?.contract?.currentContractValue || 0);
      const budgetCost = Number(pr?.job?.budget?.totals?.totalCost || 0);
      const marginValue = contractValue - budgetCost;
      const marginPercent = contractValue > 0 ? (marginValue / contractValue) * 100 : 0;

      if (pr.job) {
        pr.job.id = pr.job.id || `JOB-${pr.id}`;
        pr.job.name = pr.name || "Project";
        pr.job.client = pr.client || "";
        pr.job.contractValue = contractValue;
        pr.job.margin = marginPercent;
        pr.job.status = "Active";
      }
      pr.jobId = pr.jobId || (pr.job?.id || `JOB-${pr.id}`);
      pr.jobNumber = pr.jobNumber || `J-${String(pr.id).slice(-6).toUpperCase()}`;

      const cats = normalizeCategories((pr?.estimate && pr.estimate.categories) || pr.costCategories || []);
      const totals = calculateTotals(cats);
      if (!pr.quoteDocument) {
        pr.quoteDocument = {
          id: `QDOC-${uid()}`,
          generatedAt: new Date().toISOString(),
          quoteDate: ds(),
          clientName: pr.client || "",
          projectName: pr.name || "Project",
          categories: cats.map((cat) => ({
            id: cat.id,
            name: cat.name,
            itemCount: (cat.items || []).length,
          })),
          pricing: {
            totalCost: totals.totalCost,
            marginPercent: Number(pr.marginPct ?? pr.margin ?? 0),
            totalQuotePrice: totals.totalSell > 0 ? totals.totalSell : 0,
          },
          terms: "This quote is valid for 30 days. Work proceeds after written acceptance and scheduling confirmation.",
        };
      }
      pr.quoteDocument.status = "Accepted";
      return pr;
    });
    log("Quote marked accepted");
    if (converted) {
      notify("Quote accepted and converted to active job");
      navigate("../overview");
      return;
    }
    notify("Quote marked Accepted");
  };

  // ─── Rate Library picker ───
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

  return (
    <div style={{ animation: "fadeUp 0.2s ease", maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s2 }}>
        <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight }}>Quote</h1>
        {mobile && T.curr > 0 && <span style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: _.ink, letterSpacing: _.letterSpacing.tight, fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</span>}
      </div>

      {/* ─── Step Nav ─── */}
      <div style={{ display: "flex", gap: _.s6, marginBottom: _.s7, paddingBottom: _.s5, borderBottom: `1px solid ${_.line}` }}>
        {STEPS.map((s, i) => {
          const done = stepDone[s];
          const active = s === currentStep;
          return (
            <div key={s} onClick={() => setStep(s)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <div style={{
                width: 20, height: 20, borderRadius: 10,
                background: done ? _.green : active ? _.ac : _.well,
                border: done || active ? "none" : `1.5px solid ${_.line2}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
              }}>
                {done ? <Check size={11} strokeWidth={3} color="#fff" /> : <span style={{ fontSize: 10, fontWeight: _.fontWeight.bold, color: active ? "#fff" : _.muted }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: _.fontSize.base, fontWeight: active || done ? _.fontWeight.semi : _.fontWeight.normal, color: active ? _.ink : done ? _.ink : _.muted }}>{STEP_LABELS[s]}</span>
            </div>
          );
        })}
      </div>

      {/* Two-column: content + sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 280px", gap: mobile ? 0 : 32, alignItems: "start" }}>
        <div>
          {/* ═══════════════ DETAILS STEP ═══════════════ */}
          {currentStep === "details" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s5 }}>
                <div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, color: _.ink }}>Client & Project Details</div>
                {p.clientId && client && (
                  <button onClick={() => navigate(`/clients/${p.clientId}`)} style={btnGhost}>Edit client</button>
                )}
              </div>

              {/* Client picker */}
              <div style={{ marginBottom: _.s4, position: "relative" }} ref={clientDropRef}>
                <label style={label}>Select Client</label>
                <div
                  onClick={() => setClientOpen(!clientOpen)}
                  style={{ ...input, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: clientOpen ? _.ac : "transparent" }}
                >
                  <span style={{ color: clientName ? _.ink : _.muted }}>{clientName || "Choose a client…"}</span>
                  <ChevronDown size={14} color={_.muted} style={{ transform: clientOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </div>
                {clientOpen && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 40,
                    background: _.surface, border: `1.5px solid ${_.line}`, borderRadius: _.rSm,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 280, overflow: "hidden",
                    display: "flex", flexDirection: "column",
                  }}>
                    <div style={{ padding: "8px 10px", borderBottom: `1px solid ${_.line}`, display: "flex", alignItems: "center", gap: 6 }}>
                      <Search size={13} color={_.muted} />
                      <input autoFocus style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: _.fontSize.base, color: _.ink, fontFamily: "inherit" }}
                        value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Search clients…" />
                    </div>
                    <div style={{ overflowY: "auto", flex: 1 }}>
                      {filteredClients.map(c => (
                        <div key={c.id} onClick={() => selectClient(c)}
                          style={{ padding: "8px 12px", cursor: "pointer", fontSize: _.fontSize.base, color: _.ink, transition: `background ${_.tr}`, background: p.clientId === c.id ? `${_.ac}0A` : "transparent" }}
                          onMouseEnter={e => e.currentTarget.style.background = _.well}
                          onMouseLeave={e => e.currentTarget.style.background = p.clientId === c.id ? `${_.ac}0A` : "transparent"}
                        >
                          <div style={{ fontWeight: _.fontWeight.medium }}>{c.displayName || c.companyName}</div>
                          {c.companyName && c.displayName && <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{c.companyName}</div>}
                        </div>
                      ))}
                      {filteredClients.length === 0 && <div style={{ padding: "12px", fontSize: _.fontSize.sm, color: _.muted, textAlign: "center" }}>No matching clients</div>}
                    </div>
                    <div onClick={() => { setClientOpen(false); setNewClientModal(true); }}
                      style={{ padding: "10px 12px", borderTop: `1px solid ${_.line}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: _.fontSize.base, color: _.ac, fontWeight: _.fontWeight.semi, transition: `background ${_.tr}` }}
                      onMouseEnter={e => e.currentTarget.style.background = _.well}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <UserPlus size={14} /> Create new client
                    </div>
                  </div>
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
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: `${_.s3}px ${_.s4}px`, marginTop: _.s4 }}>
                <div>
                  <label style={label}>Margin %</label>
                  <input type="number" style={{ ...input, textAlign: "center", fontWeight: _.fontWeight.semi, fontSize: _.fontSize.unit }} value={margin} onChange={e => up(pr => { const v = parseFloat(e.target.value) || 0; pr.marginPct = v; pr.margin = v; if (pr.costAllowances) pr.costAllowances.margin.pct = v; return pr; })} />
                </div>
                <div>
                  <label style={label}>Contingency %</label>
                  <input type="number" style={{ ...input, textAlign: "center", fontWeight: _.fontWeight.semi, fontSize: _.fontSize.unit }} value={contingency} onChange={e => up(pr => { const v = parseFloat(e.target.value) || 0; pr.contingencyPct = v; pr.contingency = v; if (pr.costAllowances) pr.costAllowances.contingency.pct = v; return pr; })} />
                </div>
                <div>
                  <label style={label}>Deposit %</label>
                  <input type="number" style={{ ...input, textAlign: "center", fontWeight: _.fontWeight.semi, fontSize: _.fontSize.unit }} value={p.depositPct ?? 5} onChange={e => up(pr => { pr.depositPct = parseFloat(e.target.value) || 0; return pr; })} />
                </div>
                <div>
                  <label style={label}>Payment days</label>
                  <input type="number" style={{ ...input, textAlign: "center", fontWeight: _.fontWeight.semi, fontSize: _.fontSize.unit }} value={p.paymentDays ?? 14} onChange={e => up(pr => { pr.paymentDays = parseInt(e.target.value) || 0; return pr; })} />
                </div>
                <div>
                  <label style={label}>Defects weeks</label>
                  <input type="number" style={{ ...input, textAlign: "center", fontWeight: _.fontWeight.semi, fontSize: _.fontSize.unit }} value={p.defectsWeeks ?? 13} onChange={e => up(pr => { pr.defectsWeeks = parseInt(e.target.value) || 0; return pr; })} />
                </div>
                <div>
                  <label style={label}>Stage</label>
                  <select
                    style={{ ...input, cursor: "pointer" }}
                    value={stage}
                    onChange={e => {
                      const nv = e.target.value;
                      if (nv === stage) return;
                      if (canTransition(stage, nv)) {
                        transitionStage(nv);
                        log(`Stage → ${nv}`);
                        return;
                      }
                      if (needsQuoteToJobConversion(stage, nv) || (isQuote(stage) && isJob(nv))) {
                        navigate("../overview?action=convert");
                        return;
                      }
                      notify(`Invalid stage transition: ${stage} → ${nv}`, "error");
                    }}
                  >
                    {STAGES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Continue to Scope */}
              <div style={{ marginTop: _.s7, display: "flex", gap: _.s3 }}>
                <Button onClick={() => setStep("scope")} icon={ArrowRight}>Continue to Scope</Button>
              </div>
            </div>
          )}

          {/* ═══════════════ SCOPE STEP ═══════════════ */}
          {currentStep === "scope" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s5 }}>
                <div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, color: _.ink }}>Scope of Works</div>
                {T.items > 0 && <span style={{ fontSize: _.fontSize.md, color: _.body }}>{T.items} items · {fmt(T.sub)}</span>}
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
                          <input autoFocus style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink, background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, padding: "2px 6px", outline: "none", fontFamily: "inherit" }}
                            value={editCatName} onChange={e => setEditCatName(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            onKeyDown={e => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") { setEditCat(null); setEditCatName(""); } }}
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
                          <span onClick={e => { e.stopPropagation(); setEditCat(cat); setEditCatName(cat); }} style={{ fontSize: _.fontSize.md, fontWeight: n > 0 ? _.fontWeight.semi : _.fontWeight.normal, color: n > 0 ? _.ink : _.muted, cursor: "text" }}>{cat}</span>
                        )}
                        {n > 0 && <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.ac, marginLeft: 4 }}>{n}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: _.s3 }}>
                        {catT > 0 && <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", color: _.ink }}>{fmt(catT)}</span>}
                        <div onClick={e => { e.stopPropagation(); setDelCat(cat); }}
                          style={{ cursor: "pointer", color: _.faint, transition: `color ${_.tr}`, padding: 2 }}
                          onMouseEnter={e => e.currentTarget.style.color = _.red}
                          onMouseLeave={e => e.currentTarget.style.color = _.faint}
                        ><X size={13} /></div>
                      </div>
                    </div>
                    {open && (
                      <div style={{ paddingBottom: _.s4, paddingLeft: 24, borderLeft: `2px solid ${_.line}`, marginLeft: 0 }}>
                        {items.map((item, idx) => mobile ? (
                          /* ── Mobile: stacked card layout ── */
                          <div key={item._id} style={{ padding: `${_.s2}px 0`, borderBottom: `1px solid ${_.line}08` }}>
                            {/* Row 1: checkbox + name + delete */}
                            <div style={{ display: "flex", gap: _.s2, alignItems: "center" }}>
                              <div onClick={() => uI(cat, idx, "on", !item.on)} style={{
                                width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${item.on ? _.ac : _.line2}`,
                                background: item.on ? _.ac : "transparent", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                              }}>{item.on && <Check size={11} strokeWidth={3} color="#fff" />}</div>
                              <input style={{ flex: 1, fontSize: _.fontSize.md, color: item.on ? _.ink : _.muted, background: "transparent", border: "none", outline: "none", fontFamily: "inherit", padding: "4px 0", minWidth: 0 }}
                                value={item.item} onChange={e => uI(cat, idx, "item", e.target.value)} />
                              <div onClick={() => delI(cat, idx)} style={{ cursor: "pointer", color: _.faint, flexShrink: 0, padding: 4 }}>
                                <X size={14} />
                              </div>
                            </div>
                            {/* Row 2: qty / unit / rate / total — only when enabled */}
                            {item.on && (
                              <div style={{ marginTop: 6, paddingLeft: 28 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: _.s2 }}>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s2, minWidth: 0 }}>
                                    <input type="number" style={{ width: "100%", height: 36, padding: "0 6px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.base, textAlign: "center", outline: "none", fontWeight: _.fontWeight.semi, fontFamily: "inherit", minWidth: 0 }}
                                      value={item.qty} onChange={e => uI(cat, idx, "qty", parseFloat(e.target.value) || 0)} />
                                    <input style={{ width: "100%", height: 36, padding: "0 4px", background: "transparent", border: `1px solid ${_.line}`, borderRadius: _.rXs, outline: "none", fontSize: _.fontSize.sm, color: _.muted, fontFamily: "inherit", textAlign: "center", minWidth: 0 }}
                                      value={item.unit} onChange={e => uI(cat, idx, "unit", e.target.value)} />
                                  </div>
                                  <input type="number" style={{ width: "100%", height: 36, padding: "0 8px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.base, textAlign: "right", outline: "none", fontWeight: _.fontWeight.semi, fontFamily: "inherit", minWidth: 0 }}
                                    value={item.rate} onChange={e => uI(cat, idx, "rate", parseFloat(e.target.value) || 0)} />
                                  <span style={{ gridColumn: "1 / -1", fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold, textAlign: "right", fontVariantNumeric: "tabular-nums", color: _.ink, paddingTop: 2 }}>{fmt(item.rate * item.qty)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* ── Desktop: inline row (unchanged) ── */
                          <div key={item._id} style={{ display: "flex", gap: _.s2, alignItems: "center", padding: "5px 0" }}>
                            <div onClick={() => uI(cat, idx, "on", !item.on)} style={{
                              width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${item.on ? _.ac : _.line2}`,
                              background: item.on ? _.ac : "transparent", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>{item.on && <Check size={10} strokeWidth={3} color="#fff" />}</div>
                            <input style={{ flex: 1, fontSize: _.fontSize.base, color: item.on ? _.ink : _.muted, background: "transparent", border: "none", outline: "none", fontFamily: "inherit", padding: 0 }}
                              value={item.item} onChange={e => uI(cat, idx, "item", e.target.value)} />
                            {item.on && <>
                              <input type="number" style={{ width: 48, padding: "3px 5px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.sm, textAlign: "center", outline: "none", fontWeight: _.fontWeight.semi }}
                                value={item.qty} onChange={e => uI(cat, idx, "qty", parseFloat(e.target.value) || 0)} />
                              <input style={{ width: 40, padding: "3px 4px", background: "transparent", border: "none", outline: "none", fontSize: _.fontSize.caption, color: _.muted, fontFamily: "inherit", textAlign: "center" }}
                                value={item.unit} onChange={e => uI(cat, idx, "unit", e.target.value)} />
                              <input type="number" style={{ width: 60, padding: "3px 5px", background: _.well, border: `1px solid ${_.line}`, borderRadius: _.rXs, color: _.ink, fontSize: _.fontSize.sm, textAlign: "right", outline: "none", fontWeight: _.fontWeight.semi }}
                                value={item.rate} onChange={e => uI(cat, idx, "rate", parseFloat(e.target.value) || 0)} />
                              <span style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, minWidth: 56, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(item.rate * item.qty)}</span>
                            </>}
                            <div onClick={() => delI(cat, idx)}
                              style={{ cursor: "pointer", color: _.faint, transition: `color ${_.tr}`, flexShrink: 0, padding: 2 }}
                              onMouseEnter={e => e.currentTarget.style.color = _.red}
                              onMouseLeave={e => e.currentTarget.style.color = _.faint}
                            ><X size={12} /></div>
                          </div>
                        ))}
                        <div style={{ display: "flex", gap: _.s3, paddingTop: 4, flexWrap: "wrap" }}>
                          <div onClick={() => addC(cat)} style={{ padding: "6px 0", cursor: "pointer", color: _.ac, fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, display: "flex", alignItems: "center", gap: 4 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                          ><Plus size={13} /> Add custom</div>
                          <div onClick={() => setRatePickerCat(cat)} style={{ padding: "6px 0", cursor: "pointer", color: _.ac, fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, display: "flex", alignItems: "center", gap: 4 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                          ><Library size={12} /> From library</div>
                          <div onClick={() => setRfqCat(cat)} style={{ padding: "6px 0", cursor: "pointer", color: _.muted, fontSize: _.fontSize.sm, fontWeight: _.fontWeight.medium, display: "flex", alignItems: "center", gap: 4 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}
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

              {/* Nav */}
              <div style={{ marginTop: _.s7, display: "flex", gap: _.s3 }}>
                <Button variant="ghost" onClick={() => setStep("details")} icon={ArrowLeft}>Details</Button>
                <Button onClick={() => setStep("extras")} icon={ArrowRight}>Continue to Extras</Button>
              </div>
            </div>
          )}

          {/* ═══════════════ EXTRAS STEP ═══════════════ */}
          {currentStep === "extras" && (
            <div>
              <div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s5 }}>Exclusions, Allowances & Qualifications</div>

              {/* ── Exclusions ── */}
              <div style={{ marginBottom: _.s5, border: `1px solid ${_.line}`, borderRadius: _.rSm, overflow: "hidden" }}>
                <div onClick={() => setExtrasExp(e => ({ ...e, exclusions: !e.exclusions }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", background: _.well }}>
                  <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                    <span style={{ transform: extrasExp.exclusions ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={13} color={_.muted} /></span>
                    <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>Exclusions</span>
                    {p.exclusions.length > 0 && <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.ac }}>{p.exclusions.length}</span>}
                  </div>
                  <span onClick={e => { e.stopPropagation(); loadDefaultExclusions(); }} style={{ fontSize: _.fontSize.sm, color: _.ac, fontWeight: _.fontWeight.semi, cursor: "pointer" }}>Load defaults</span>
                </div>
                {extrasExp.exclusions && (
                  <div style={{ padding: "8px 14px 12px" }}>
                    {p.exclusions.map((item, idx) => (
                      <div key={item._id} style={{ display: "flex", alignItems: "center", gap: _.s2, padding: "5px 0", borderBottom: `1px solid ${_.line}08` }}>
                        <span style={{ flex: 1, fontSize: _.fontSize.base, color: _.ink }}>• {item.text}</span>
                        <div onClick={() => delExclusion(idx)} style={{ cursor: "pointer", color: _.faint, flexShrink: 0, padding: 2 }}
                          onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: _.s2, marginTop: 6 }}>
                      <input style={{ ...input, flex: 1 }} value={exclInput} onChange={e => setExclInput(e.target.value)} placeholder="Add exclusion…"
                        onKeyDown={e => { if (e.key === "Enter") addExclusion(exclInput); }} />
                      <Button size="sm" onClick={() => addExclusion(exclInput)} icon={Plus}>Add</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Allowances ── */}
              <div style={{ marginBottom: _.s5, border: `1px solid ${_.line}`, borderRadius: _.rSm, overflow: "hidden" }}>
                <div onClick={() => setExtrasExp(e => ({ ...e, allowances: !e.allowances }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", background: _.well }}>
                  <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                    <span style={{ transform: extrasExp.allowances ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={13} color={_.muted} /></span>
                    <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>Allowances / Provisional Sums</span>
                    {p.allowances.length > 0 && <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.ac }}>{p.allowances.length}</span>}
                  </div>
                  <span onClick={e => { e.stopPropagation(); loadDefaultAllowances(); }} style={{ fontSize: _.fontSize.sm, color: _.ac, fontWeight: _.fontWeight.semi, cursor: "pointer" }}>Load defaults</span>
                </div>
                {extrasExp.allowances && (
                  <div style={{ padding: "8px 14px 12px" }}>
                    {p.allowances.map((item, idx) => (
                      <div key={item._id} style={{ display: "flex", alignItems: "center", gap: _.s2, padding: "5px 0", borderBottom: `1px solid ${_.line}08` }}>
                        <span style={{ flex: 1, fontSize: _.fontSize.base, color: _.ink }}>{item.description}</span>
                        <span style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, color: _.ink, fontVariantNumeric: "tabular-nums", minWidth: 72, textAlign: "right" }}>{fmt(item.amount)}</span>
                        <div onClick={() => delAllowance(idx)} style={{ cursor: "pointer", color: _.faint, flexShrink: 0, padding: 2 }}
                          onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: _.s2, marginTop: 6 }}>
                      <input style={{ ...input, flex: 1 }} value={allowInput.description} onChange={e => setAllowInput(f => ({ ...f, description: e.target.value }))} placeholder="Description…" />
                      <input type="number" style={{ ...input, width: 100, textAlign: "right" }} value={allowInput.amount} onChange={e => setAllowInput(f => ({ ...f, amount: e.target.value }))} placeholder="Amount"
                        onKeyDown={e => { if (e.key === "Enter") addAllowance(allowInput.description, allowInput.amount); }} />
                      <Button size="sm" onClick={() => addAllowance(allowInput.description, allowInput.amount)} icon={Plus}>Add</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── PC Items ── */}
              <div style={{ marginBottom: _.s5, border: `1px solid ${_.line}`, borderRadius: _.rSm, overflow: "hidden" }}>
                <div onClick={() => setExtrasExp(e => ({ ...e, pcItems: !e.pcItems }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", background: _.well }}>
                  <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                    <span style={{ transform: extrasExp.pcItems ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={13} color={_.muted} /></span>
                    <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>Prime Cost Items</span>
                    {p.pcItems.length > 0 && <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.ac }}>{p.pcItems.length}</span>}
                  </div>
                  <span onClick={e => { e.stopPropagation(); loadDefaultPcItems(); }} style={{ fontSize: _.fontSize.sm, color: _.ac, fontWeight: _.fontWeight.semi, cursor: "pointer" }}>Load defaults</span>
                </div>
                {extrasExp.pcItems && (
                  <div style={{ padding: "8px 14px 12px" }}>
                    {p.pcItems.map((item, idx) => (
                      <div key={item._id} style={{ display: "flex", alignItems: "center", gap: _.s2, padding: "5px 0", borderBottom: `1px solid ${_.line}08` }}>
                        <span style={{ flex: 1, fontSize: _.fontSize.base, color: _.ink }}>{item.description}</span>
                        <span style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, color: _.ink, fontVariantNumeric: "tabular-nums", minWidth: 72, textAlign: "right" }}>{fmt(item.amount)}</span>
                        <div onClick={() => delPcItem(idx)} style={{ cursor: "pointer", color: _.faint, flexShrink: 0, padding: 2 }}
                          onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: _.s2, marginTop: 6 }}>
                      <input style={{ ...input, flex: 1 }} value={pcInput.description} onChange={e => setPcInput(f => ({ ...f, description: e.target.value }))} placeholder="Description…" />
                      <input type="number" style={{ ...input, width: 100, textAlign: "right" }} value={pcInput.amount} onChange={e => setPcInput(f => ({ ...f, amount: e.target.value }))} placeholder="Amount"
                        onKeyDown={e => { if (e.key === "Enter") addPcItem(pcInput.description, pcInput.amount); }} />
                      <Button size="sm" onClick={() => addPcItem(pcInput.description, pcInput.amount)} icon={Plus}>Add</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Qualifications ── */}
              <div style={{ marginBottom: _.s5, border: `1px solid ${_.line}`, borderRadius: _.rSm, overflow: "hidden" }}>
                <div onClick={() => setExtrasExp(e => ({ ...e, qualifications: !e.qualifications }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", background: _.well }}>
                  <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                    <span style={{ transform: extrasExp.qualifications ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={13} color={_.muted} /></span>
                    <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>Qualifications & Assumptions</span>
                    {p.qualifications.length > 0 && <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.ac }}>{p.qualifications.length}</span>}
                  </div>
                  <span onClick={e => { e.stopPropagation(); loadDefaultQualifications(); }} style={{ fontSize: _.fontSize.sm, color: _.ac, fontWeight: _.fontWeight.semi, cursor: "pointer" }}>Load defaults</span>
                </div>
                {extrasExp.qualifications && (
                  <div style={{ padding: "8px 14px 12px" }}>
                    {p.qualifications.map((item, idx) => (
                      <div key={item._id} style={{ display: "flex", alignItems: "center", gap: _.s2, padding: "5px 0", borderBottom: `1px solid ${_.line}08` }}>
                        <span style={{ flex: 1, fontSize: _.fontSize.base, color: _.ink }}>• {item.text}</span>
                        <div onClick={() => delQualification(idx)} style={{ cursor: "pointer", color: _.faint, flexShrink: 0, padding: 2 }}
                          onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: _.s2, marginTop: 6 }}>
                      <input style={{ ...input, flex: 1 }} value={qualInput} onChange={e => setQualInput(e.target.value)} placeholder="Add qualification…"
                        onKeyDown={e => { if (e.key === "Enter") addQualification(qualInput); }} />
                      <Button size="sm" onClick={() => addQualification(qualInput)} icon={Plus}>Add</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Terms & Conditions ── */}
              <div style={{ marginBottom: _.s5, border: `1px solid ${_.line}`, borderRadius: _.rSm, overflow: "hidden" }}>
                <div onClick={() => setExtrasExp(e => ({ ...e, terms: !e.terms }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", background: _.well }}>
                  <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                    <span style={{ transform: extrasExp.terms ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={13} color={_.muted} /></span>
                    <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>Terms & Conditions</span>
                    {p.terms.length > 0 && <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.ac }}>{p.terms.length}</span>}
                  </div>
                  <span onClick={e => { e.stopPropagation(); loadDefaultTerms(); }} style={{ fontSize: _.fontSize.sm, color: _.ac, fontWeight: _.fontWeight.semi, cursor: "pointer" }}>Load defaults</span>
                </div>
                {extrasExp.terms && (
                  <div style={{ padding: "8px 14px 12px" }}>
                    {p.terms.length === 0 && (
                      <div style={{ fontSize: _.fontSize.sm, color: _.muted, padding: "8px 0" }}>No terms added yet. Click "Load defaults" for standard builder terms.</div>
                    )}
                    {p.terms.map((item, idx) => (
                      <div key={item._id} style={{ display: "flex", alignItems: "flex-start", gap: _.s2, padding: "5px 0", borderBottom: `1px solid ${_.line}08` }}>
                        <input style={{ flex: 1, fontSize: _.fontSize.base, color: _.ink, background: "transparent", border: "none", outline: "none", fontFamily: "inherit", padding: "2px 0" }}
                          value={item.text} onChange={e => updateTerm(idx, e.target.value)} />
                        <div onClick={() => delTerm(idx)} style={{ cursor: "pointer", color: _.faint, flexShrink: 0, padding: 2, marginTop: 2 }}
                          onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: _.s2, marginTop: 6 }}>
                      <input style={{ ...input, flex: 1 }} value={termInput} onChange={e => setTermInput(e.target.value)} placeholder="Add term…"
                        onKeyDown={e => { if (e.key === "Enter") addTerm(termInput); }} />
                      <Button size="sm" onClick={() => addTerm(termInput)} icon={Plus}>Add</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Nav */}
              <div style={{ marginTop: _.s7, display: "flex", gap: _.s3 }}>
                <Button variant="ghost" onClick={() => setStep("scope")} icon={ArrowLeft}>Back to Scope</Button>
                <Button onClick={() => setStep("review")} icon={ArrowRight}>Continue to Review</Button>
              </div>
            </div>
          )}

          {/* ═══════════════ REVIEW STEP ═══════════════ */}
          {currentStep === "review" && (
            <div>
              <div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s5 }}>Review & Generate</div>
              <Card title="Quote Generator" subtitle="Generate, preview and export your quote document" style={{ marginBottom: _.s5 }}>
                <div style={{ display: "grid", gap: _.s4 }}>
                  <div>
                    <div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Quote Header</div>
                    <div style={{ fontSize: _.fontSize.base, color: _.body }}>Client: <strong>{quoteDoc?.clientName || clientName || "—"}</strong></div>
                    <div style={{ fontSize: _.fontSize.base, color: _.body }}>Project: <strong>{quoteDoc?.projectName || p.name || "—"}</strong></div>
                    <div style={{ fontSize: _.fontSize.base, color: _.body }}>Quote date: <strong>{quoteDoc?.quoteDate || ds()}</strong></div>
                  </div>

                  <div>
                    <div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Scope Summary</div>
                    {(quoteDoc?.categories || estimateCategories.map((cat) => ({ id: cat.id, name: cat.name, itemCount: (cat.items || []).length }))).length === 0 ? (
                      <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>No estimate categories yet.</div>
                    ) : (
                      <div style={{ display: "grid", gap: 4 }}>
                        {(quoteDoc?.categories || estimateCategories.map((cat) => ({ id: cat.id, name: cat.name, itemCount: (cat.items || []).length }))).map((cat) => (
                          <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.base, color: _.body }}>
                            <span>{cat.name}</span>
                            <span style={{ color: _.muted }}>{cat.itemCount} items</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Pricing Summary</div>
                    <div style={{ display: "grid", gap: 4, fontVariantNumeric: "tabular-nums" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span>Total Cost</span><strong>{fmt(quoteDoc?.pricing?.totalCost ?? estimateTotals.totalCost)}</strong></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span>Margin %</span><strong>{Number(quoteDoc?.pricing?.marginPercent ?? margin).toFixed(2)}%</strong></div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${_.line}`, paddingTop: 6, fontSize: _.fontSize.md }}><span>Total Quote Price</span><strong>{fmt(quoteDoc?.pricing?.totalQuotePrice ?? (estimateTotals.totalSell || T.curr))}</strong></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Terms</div>
                    <div style={{ fontSize: _.fontSize.sm, color: _.body }}>{quoteDoc?.terms || "This quote is valid for 30 days. Work proceeds after written acceptance and scheduling confirmation."}</div>
                  </div>

                  <div style={{ display: "flex", gap: _.s2, flexWrap: "wrap" }}>
                    <Button onClick={generateQuoteDocument} icon={FileCheck}>{quoteDoc ? "Regenerate Quote" : "Generate Quote"}</Button>
                    <Button variant="secondary" onClick={exportQuotePdf} disabled={!quoteDoc}>Download Quote PDF</Button>
                    <Button variant="secondary" icon={Send} onClick={sendQuote}>Send Quote</Button>
                    <Button variant="secondary" onClick={markAccepted}>Mark Accepted</Button>
                    <Button variant="secondary" onClick={markRejected}>Mark Rejected</Button>
                    <select
                      value={quoteDoc?.status || "Draft"}
                      onChange={(e) => updateQuoteStatus(e.target.value)}
                      style={{ ...input, minWidth: 140, maxWidth: 180, cursor: "pointer" }}
                    >
                      {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </Card>

              {/* Client & address summary */}
              {(clientName || p.address) && (
                <div style={{ marginBottom: 20, padding: "12px 16px", background: _.well, borderRadius: _.rSm }}>
                  {clientName && <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>{clientName}</div>}
                  {p.address && <div style={{ fontSize: _.fontSize.base, color: _.muted, marginTop: 2 }}>{p.address}{p.suburb ? `, ${p.suburb}` : ""}</div>}
                  {(p.buildType || p.type) && <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 2 }}>{p.buildType || p.type}{p.floorArea ? ` · ${p.floorArea}m²` : ""}{p.storeys ? ` · ${p.storeys}` : ""}</div>}
                </div>
              )}

              {/* Scope breakdown */}
              {Object.entries(p.scope).filter(([, items]) => items.some(i => i.on)).map(([cat, items]) => {
                const catItems = items.filter(i => i.on);
                const catTotal = catItems.reduce((t, i) => t + i.rate * i.qty, 0);
                return (
                  <div key={cat} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: 6, paddingBottom: 4, borderBottom: `1px solid ${_.line}` }}>
                      <span>{cat}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(catTotal)}</span>
                    </div>
                    {catItems.map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, color: _.body, padding: "2px 0 2px 12px" }}>
                        <span>{item.item} × {item.qty} {item.unit}</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(item.rate * item.qty)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Notes */}
              {p.notes && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: _.well, borderRadius: _.rSm, fontSize: _.fontSize.sm, color: _.body, lineHeight: _.lineHeight.body }}>
                  <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: 4 }}>Notes</div>
                  {p.notes}
                </div>
              )}

              {/* Extras summaries */}
              {p.exclusions.filter(e => e.on).length > 0 && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: _.well, borderRadius: _.rSm }}>
                  <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: 4 }}>Exclusions</div>
                  {p.exclusions.filter(e => e.on).map((e, i) => <div key={i} style={{ fontSize: _.fontSize.sm, color: _.body, lineHeight: _.lineHeight.body }}>• {e.text}</div>)}
                </div>
              )}
              {p.allowances.filter(e => e.on).length > 0 && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: _.well, borderRadius: _.rSm }}>
                  <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: 4 }}>Allowances / Provisional Sums</div>
                  {p.allowances.filter(e => e.on).map((a, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, color: _.body, padding: "2px 0" }}>
                      <span>{a.description}</span><span style={{ fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{fmt(a.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              {p.pcItems.filter(e => e.on).length > 0 && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: _.well, borderRadius: _.rSm }}>
                  <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: 4 }}>Prime Cost Items</div>
                  {p.pcItems.filter(e => e.on).map((pc, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.sm, color: _.body, padding: "2px 0" }}>
                      <span>{pc.description}</span><span style={{ fontVariantNumeric: "tabular-nums", fontWeight: _.fontWeight.semi }}>{fmt(pc.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              {p.qualifications.filter(e => e.on).length > 0 && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: _.well, borderRadius: _.rSm }}>
                  <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: 4 }}>Qualifications & Assumptions</div>
                  {p.qualifications.filter(e => e.on).map((q, i) => <div key={i} style={{ fontSize: _.fontSize.sm, color: _.body, lineHeight: _.lineHeight.body }}>• {q.text}</div>)}
                </div>
              )}
              {p.terms.filter(e => e.on).length > 0 && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: _.well, borderRadius: _.rSm }}>
                  <div style={{ fontSize: _.fontSize.xs, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: 4 }}>Terms & Conditions</div>
                  {p.terms.filter(e => e.on).map((t, i) => <div key={i} style={{ fontSize: _.fontSize.sm, color: _.body, lineHeight: _.lineHeight.body }}>• {t.text}</div>)}
                </div>
              )}

              {/* Totals */}
              <div style={{ borderTop: `2px solid ${_.ink}`, paddingTop: 12, marginTop: 8 }}>
                {[["Subtotal", fmt(T.sub)], [`Margin ${margin}%`, fmt(T.mar)], [`Contingency ${contingency}%`, fmt(T.con)], ["GST 10%", fmt(T.gst)]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: _.fontSize.base, color: _.muted }}>
                    <span>{l}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px", fontSize: _.fontSize.xl, fontWeight: _.fontWeight.bold, color: _.ink, borderTop: `1px solid ${_.line}`, marginTop: 8 }}>
                  <span>Contract Total</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</span>
                </div>
              </div>

              {/* Proposal status */}
              {proposalGenerated && (
                <div style={{ display: "flex", alignItems: "center", gap: _.s2, marginTop: _.s5, padding: "10px 14px", background: `${_.green}0A`, borderRadius: _.rSm, border: `1px solid ${_.green}30` }}>
                  <FileCheck size={16} color={_.green} />
                  <span style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, color: _.green }}>
                    Proposal v{p.proposal.version} generated · {fmt(p.proposal.total)}
                  </span>
                </div>
              )}

              {/* Primary CTA */}
              <div style={{ marginTop: _.s5, display: "flex", gap: _.s3, flexWrap: "wrap" }}>
                <Button variant="ghost" onClick={() => setStep("extras")} icon={ArrowLeft}>Back to Extras</Button>
                {!quoteReady && <Button disabled>Complete details & scope first</Button>}
                {quoteReady && !proposalGenerated && (
                  <Button onClick={generateProposal} icon={ArrowRight}>Generate Proposal</Button>
                )}
                {quoteReady && proposalGenerated && (
                  <Button onClick={generateProposal} variant="secondary" icon={ArrowRight}>Regenerate Proposal</Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Sticky sidebar (desktop only) */}
        {!mobile && (
          <div style={{ position: "sticky", top: 0 }}>
            <Card style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.muted, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: 8 }}>Quote Summary</div>
                <div style={{ fontSize: _.fontSize["3xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, fontVariantNumeric: "tabular-nums", color: T.curr > 0 ? _.ink : _.faint, lineHeight: 1 }}>
                  {fmt(T.curr)}
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${_.line}`, paddingTop: 12 }}>
                {[
                  ["Items", T.items],
                  ["Subtotal", fmt(T.sub)],
                  [`Margin ${margin}%`, fmt(T.mar)],
                  [`Contingency ${contingency}%`, fmt(T.con)],
                  ["GST", fmt(T.gst)],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: _.fontSize.base, color: _.body }}>
                    <span>{l}</span><span style={{ fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", fontSize: _.fontSize.md, fontWeight: _.fontWeight.bold, color: _.ink, borderTop: `1px solid ${_.line}`, marginTop: 8 }}>
                  <span>Total</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Mobile: floating summary bar — sits above bottom tabs + safe area */}
      {mobile && T.curr > 0 && (
        <div style={{
          position: "fixed", bottom: "var(--mobile-bottom-total)", left: 0, right: 0,
          background: _.surface, borderTop: `1px solid ${_.line}`,
          padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.06)", zIndex: 45,
        }}>
          <div>
            <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi }}>{T.items} items</div>
            <div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</div>
          </div>
          {currentStep !== "review" && <Button size="sm" onClick={() => setStep("review")} icon={ArrowRight}>Review</Button>}
        </div>
      )}

      {/* ─── New Client Modal ─── */}
      <Modal open={newClientModal} onClose={() => setNewClientModal(false)} title="Create New Client" width={420}>
        <div style={{ marginBottom: _.s3 }}>
          <label style={label}>Client name *</label>
          <input style={input} value={newClientForm.displayName} onChange={e => setNewClientForm(f => ({ ...f, displayName: e.target.value }))} placeholder="e.g. John Smith" autoFocus />
        </div>
        <div style={{ marginBottom: _.s5 }}>
          <label style={label}>Company name</label>
          <input style={input} value={newClientForm.companyName} onChange={e => setNewClientForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Optional" />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setNewClientModal(false)}>Cancel</Button>
          <Button onClick={createNewClient} icon={UserPlus}>Create & Select</Button>
        </div>
      </Modal>

      {/* Rate Library Picker Modal */}
      <Modal open={!!ratePickerCat} onClose={() => setRatePickerCat(null)} title={`Add from Rate Library — ${ratePickerCat}`}>
        {ratePickerItems.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center", color: _.muted, fontSize: _.fontSize.base }}>
            No matching items in rate library. Add items via <span style={{ color: _.ac, cursor: "pointer" }} onClick={() => { setRatePickerCat(null); navigate("/rate-library"); }}>Rate Library</span>.
          </div>
        ) : (
          <>
            <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginBottom: 12 }}>Click to add items to scope</div>
            {ratePickerItems.map(item => (
              <div key={item.id} onClick={() => addFromLibrary(item)} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: `1px solid ${_.line}`, cursor: "pointer", transition: `background ${_.tr}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <div style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium, color: _.ink }}>{item.name}</div>
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{item.unit} · {fmt(item.unitRate)}</div>
                </div>
                <Plus size={14} color={_.ac} />
              </div>
            ))}
          </>
        )}
        <div style={{ marginTop: 16 }}><Button variant="ghost" onClick={() => setRatePickerCat(null)}>Done</Button></div>
      </Modal>

      {/* RFQ Stub Modal */}
      <Modal open={!!rfqCat} onClose={() => setRfqCat(null)} title="Request for Quote" width={400}>
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <Send size={32} color={_.muted} style={{ marginBottom: 16 }} />
          <div style={{ fontSize: _.fontSize.md, color: _.body, marginBottom: 8 }}>RFQ feature coming soon</div>
          <div style={{ fontSize: _.fontSize.base, color: _.muted }}>You'll be able to send quote requests to trades for <strong>{rfqCat}</strong> directly from here.</div>
        </div>
        <div style={{ marginTop: 16, textAlign: "center" }}><Button variant="secondary" onClick={() => setRfqCat(null)}>Close</Button></div>
      </Modal>

      {/* Delete category modal */}
      <Modal open={!!delCat} onClose={() => setDelCat(null)} title="Delete Category" width={400}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, marginBottom: 24 }}>Delete <strong>{delCat}</strong> and all its items?</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDelCat(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { up(pr => { delete pr.scope[delCat]; return pr; }); setDelCat(null); }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
