import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, input, label, uid, ds, ts } from "../../theme/styles.js";
import { DEFAULT_EXCLUSIONS, DEFAULT_ALLOWANCES, DEFAULT_PC_ITEMS, DEFAULT_QUALIFICATIONS, DEFAULT_TERMS } from "../../data/defaults.js";
import { calc } from "../../lib/calc.js";
import { canTransition, isQuote, isJob, needsQuoteToJobConversion } from "../../lib/lifecycle.js";
import { usePageBottomBar } from "../../hooks/usePageBottomBar.js";
import { applyConvertToJobBaseline, calculateTotals, normalizeCategories } from "../../lib/costEngine.js";
import { exportPrintPdf } from "../../lib/pdfExport.js";
import Card from "../../components/ui/Card.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import { Check, ChevronRight, Plus, ArrowRight, ArrowLeft, X, Send, FileCheck } from "lucide-react";
import QuoteEditor from "./quote/QuoteEditor.jsx";

const STEPS = ["pricing", "review"];
const STEP_LABELS = { pricing: "Pricing", review: "Review" };
const QUOTE_STATUSES = ["Draft", "Sent", "Accepted", "Rejected"];

// Backwards-compat: map old step names to new ones
const STEP_COMPAT = { details: "pricing", scope: "pricing", extras: "review" };

function resolveStep(raw) {
  if (STEPS.includes(raw)) return raw;
  if (STEP_COMPAT[raw]) return STEP_COMPAT[raw];
  return "pricing";
}

export default function QuotePage() {
  const { project: p, update: up, T, client, log, transitionStage } = useProject();
  const { clients, clientsHook, rateLibrary, mobile, notify, settings, addNotification } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewportW, setViewportW] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1280));
  const [showSummarySheet, setShowSummarySheet] = useState(false);

  if (!p) {
    return (
      <Card title="Quote unavailable" subtitle="Project data is missing for this route.">
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => navigate("/projects")}>Back to Projects</Button>
        </div>
      </Card>
    );
  }

  const currentStep = resolveStep(searchParams.get("step"));
  const isNarrowLayout = viewportW < 1200;
  const isMobileLayout = viewportW < 900;
  const gotoStep = useCallback((step) => {
    const resolved = resolveStep(step);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("step", resolved);
      return params;
    }, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setSearchParams]);

  // Extras step state (now part of review)
  const [extrasExp, setExtrasExp] = useState({ exclusions: true, allowances: true, pcItems: true, qualifications: true, terms: true });
  const [exclInput, setExclInput] = useState("");
  const [allowInput, setAllowInput] = useState({ description: "", amount: "" });
  const [pcInput, setPcInput] = useState({ description: "", amount: "" });
  const [qualInput, setQualInput] = useState("");
  const [termInput, setTermInput] = useState("");
  const safeScope = p.scope && typeof p.scope === "object" ? p.scope : {};
  const exclusions = Array.isArray(p.exclusions) ? p.exclusions : [];
  const allowances = Array.isArray(p.allowances) ? p.allowances : [];
  const pcItems = Array.isArray(p.pcItems) ? p.pcItems : [];
  const qualifications = Array.isArray(p.qualifications) ? p.qualifications : [];
  const terms = Array.isArray(p.terms) ? p.terms : [];
  const safeEstimateCategories = normalizeCategories((p?.estimate && p.estimate.categories) || p.costCategories || []);

  useEffect(() => {
    up((pr) => {
      if (!pr.scope || typeof pr.scope !== "object") pr.scope = {};
      if (!Array.isArray(pr.exclusions)) pr.exclusions = [];
      if (!Array.isArray(pr.allowances)) pr.allowances = [];
      if (!Array.isArray(pr.pcItems)) pr.pcItems = [];
      if (!Array.isArray(pr.qualifications)) pr.qualifications = [];
      if (!Array.isArray(pr.terms)) pr.terms = [];
      if (!Array.isArray(pr.proposals)) pr.proposals = [];
      return pr;
    });
  }, [up]);

  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const stage = p.stage || p.status;
  const margin = p.marginPct ?? p.margin ?? 0;
  const contingency = p.contingencyPct ?? p.contingency ?? 0;

  const clientName = p.client || (client ? client.displayName : "");
  const hasScope = T.items > 0;
  const quoteReady = clientName && hasScope;
  const proposalGenerated = p.proposal && p.proposal.status === "Generated";
  const quoteDoc = p.quoteDocument || null;
  const estimateTotals = calculateTotals(safeEstimateCategories);
  usePageBottomBar(mobile && T.curr > 0 ? 64 : 0);

  // Step completeness
  const stepDone = {
    pricing: hasScope,
    review: proposalGenerated,
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
    if (T.items === 0) { notify("Add scope items before generating", "error"); return; }
    if (!clientName) { notify("Add a client before generating", "error"); return; }
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
    if (T.items === 0) { notify("Add scope items first", "error"); return; }
    if (!clientName) { notify("Add a client first", "error"); return; }
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
    if (status === "Sent") { sendQuote(); return; }
    if (status === "Accepted") { markAccepted(); return; }
    if (status === "Rejected") { markRejected(); return; }
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
    addNotification({
      message: `Quote accepted: ${p.name || "Project"}`,
      type: "quote_accepted",
      link: `/projects/${p.id}/overview`,
    });
    if (converted) {
      notify("Quote accepted and converted to active job");
      navigate("../overview");
      return;
    }
    notify("Quote marked Accepted");
  };

  return (
    <div style={{ animation: "fadeUp 0.2s ease", width: "100%", maxWidth: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s2 }}>
        <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight }}>Costings</h1>
        {mobile && T.curr > 0 && <span style={{ fontSize: _.fontSize["2xl"], fontWeight: _.fontWeight.bold, color: _.ink, letterSpacing: _.letterSpacing.tight, fontVariantNumeric: "tabular-nums" }}>{fmt(T.curr)}</span>}
      </div>

      {/* ─── Step Nav ─── */}
      <div style={{ display: "flex", gap: _.s6, marginBottom: _.s5, paddingBottom: _.s5, borderBottom: `1px solid ${_.line}` }}>
        {STEPS.map((s, i) => {
          const done = stepDone[s];
          const active = s === currentStep;
          return (
            <div key={s} onClick={() => gotoStep(s)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", minHeight: 44 }}>
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

      {/* ═══════════════ PRICING STEP ═══════════════ */}
      {currentStep === "pricing" && (
        <div>
          {/* Margin / Contingency toolbar */}
          <div style={{
            display: "flex", gap: _.s4, alignItems: "center", flexWrap: "wrap",
            marginBottom: _.s4, padding: "10px 14px",
            background: _.well, borderRadius: _.rSm,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, color: _.muted }}>Margin %</label>
              <input type="number" style={{ ...input, width: 72, textAlign: "center", fontWeight: _.fontWeight.semi, minHeight: 40 }}
                value={margin}
                onChange={e => up(pr => { const v = parseFloat(e.target.value) || 0; pr.marginPct = v; pr.margin = v; if (pr.costAllowances) pr.costAllowances.margin.pct = v; return pr; })} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label style={{ fontSize: _.fontSize.sm, fontWeight: _.fontWeight.semi, color: _.muted }}>Contingency %</label>
              <input type="number" style={{ ...input, width: 72, textAlign: "center", fontWeight: _.fontWeight.semi, minHeight: 40 }}
                value={contingency}
                onChange={e => up(pr => { const v = parseFloat(e.target.value) || 0; pr.contingencyPct = v; pr.contingency = v; if (pr.costAllowances) pr.costAllowances.contingency.pct = v; return pr; })} />
            </div>
            <div style={{ flex: 1 }} />
            {!isNarrowLayout && (
              <Button onClick={() => gotoStep("review")} icon={ArrowRight}>
                Review Quote
              </Button>
            )}
          </div>

          <QuoteEditor
            project={p} up={up} T={T}
            margin={margin} contingency={contingency}
            mobile={mobile} rateLibrary={rateLibrary}
            notify={notify} onNavigate={gotoStep}
          />
        </div>
      )}

      {/* ═══════════════ REVIEW STEP ═══════════════ */}
      {currentStep === "review" && (
        <div>
          <div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: _.s5 }}>Review & Generate</div>

          {/* Scope breakdown */}
          {Object.entries(safeScope).filter(([, items]) => Array.isArray(items) && items.some(i => i.on)).length > 0 ? (
            <div style={{ marginBottom: _.s5 }}>
              <div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Scope Summary</div>
              {Object.entries(safeScope).filter(([, items]) => Array.isArray(items) && items.some(i => i.on)).map(([cat, items]) => {
                const catItems = items.filter(i => i.on);
                const catTotal = catItems.reduce((t, i) => t + i.rate * i.qty, 0);
                return (
                  <div key={cat} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, color: _.ink, marginBottom: 4, paddingBottom: 4, borderBottom: `1px solid ${_.line}` }}>
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
            </div>
          ) : (
            <div style={{ padding: "16px", background: _.well, borderRadius: _.rSm, fontSize: _.fontSize.sm, color: _.muted, marginBottom: _.s5, textAlign: "center" }}>
              No scope items yet. <button type="button" onClick={() => gotoStep("pricing")} style={{ background: "none", border: "none", color: _.ac, cursor: "pointer", fontWeight: _.fontWeight.semi, fontSize: _.fontSize.sm, fontFamily: "inherit" }}>Go to Pricing</button> to add items.
            </div>
          )}

          {/* ── Exclusions ── */}
          <div style={{ marginBottom: _.s5, border: `1px solid ${_.line}`, borderRadius: _.rSm, overflow: "hidden" }}>
            <div onClick={() => setExtrasExp(e => ({ ...e, exclusions: !e.exclusions }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", background: _.well, minHeight: 52 }}>
              <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                <span style={{ transform: extrasExp.exclusions ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={13} color={_.muted} /></span>
                <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>Exclusions</span>
                {exclusions.length > 0 && <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.ac }}>{exclusions.length}</span>}
              </div>
              <span onClick={e => { e.stopPropagation(); loadDefaultExclusions(); }} style={{ fontSize: _.fontSize.sm, color: _.ac, fontWeight: _.fontWeight.semi, cursor: "pointer" }}>Load defaults</span>
            </div>
            {extrasExp.exclusions && (
              <div style={{ padding: "8px 14px 12px" }}>
                {exclusions.map((item, idx) => (
                  <div key={item._id} style={{ display: "flex", alignItems: "center", gap: _.s2, padding: "5px 0", borderBottom: `1px solid ${_.line}08` }}>
                    <span style={{ flex: 1, fontSize: _.fontSize.base, color: _.ink }}>• {item.text}</span>
                    <div onClick={() => delExclusion(idx)} style={{ cursor: "pointer", color: _.faint, flexShrink: 0, padding: 2 }}
                      onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: _.s2, marginTop: 6 }}>
                  <input style={{ ...input, flex: 1, minHeight: 40 }} value={exclInput} onChange={e => setExclInput(e.target.value)} placeholder="Add exclusion…"
                    onKeyDown={e => { if (e.key === "Enter") addExclusion(exclInput); }} />
                  <Button size="sm" onClick={() => addExclusion(exclInput)} icon={Plus}>Add</Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Allowances ── */}
          <div style={{ marginBottom: _.s5, border: `1px solid ${_.line}`, borderRadius: _.rSm, overflow: "hidden" }}>
            <div onClick={() => setExtrasExp(e => ({ ...e, allowances: !e.allowances }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", background: _.well, minHeight: 52 }}>
              <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                <span style={{ transform: extrasExp.allowances ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={13} color={_.muted} /></span>
                <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>Allowances / Provisional Sums</span>
                {allowances.length > 0 && <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.ac }}>{allowances.length}</span>}
              </div>
              <span onClick={e => { e.stopPropagation(); loadDefaultAllowances(); }} style={{ fontSize: _.fontSize.sm, color: _.ac, fontWeight: _.fontWeight.semi, cursor: "pointer" }}>Load defaults</span>
            </div>
            {extrasExp.allowances && (
              <div style={{ padding: "8px 14px 12px" }}>
                {allowances.map((item, idx) => (
                  <div key={item._id} style={{ display: "flex", alignItems: "center", gap: _.s2, padding: "5px 0", borderBottom: `1px solid ${_.line}08` }}>
                    <span style={{ flex: 1, fontSize: _.fontSize.base, color: _.ink }}>{item.description}</span>
                    <span style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, color: _.ink, fontVariantNumeric: "tabular-nums", minWidth: 72, textAlign: "right" }}>{fmt(item.amount)}</span>
                    <div onClick={() => delAllowance(idx)} style={{ cursor: "pointer", color: _.faint, flexShrink: 0, padding: 2 }}
                      onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: _.s2, marginTop: 6 }}>
                  <input style={{ ...input, flex: 1, minHeight: 40 }} value={allowInput.description} onChange={e => setAllowInput(f => ({ ...f, description: e.target.value }))} placeholder="Description…" />
                  <input type="number" style={{ ...input, width: 100, textAlign: "right", minHeight: 40 }} value={allowInput.amount} onChange={e => setAllowInput(f => ({ ...f, amount: e.target.value }))} placeholder="Amount"
                    onKeyDown={e => { if (e.key === "Enter") addAllowance(allowInput.description, allowInput.amount); }} />
                  <Button size="sm" onClick={() => addAllowance(allowInput.description, allowInput.amount)} icon={Plus}>Add</Button>
                </div>
              </div>
            )}
          </div>

          {/* ── PC Items ── */}
          <div style={{ marginBottom: _.s5, border: `1px solid ${_.line}`, borderRadius: _.rSm, overflow: "hidden" }}>
            <div onClick={() => setExtrasExp(e => ({ ...e, pcItems: !e.pcItems }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", background: _.well, minHeight: 52 }}>
              <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                <span style={{ transform: extrasExp.pcItems ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={13} color={_.muted} /></span>
                <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>Prime Cost Items</span>
                {pcItems.length > 0 && <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.ac }}>{pcItems.length}</span>}
              </div>
              <span onClick={e => { e.stopPropagation(); loadDefaultPcItems(); }} style={{ fontSize: _.fontSize.sm, color: _.ac, fontWeight: _.fontWeight.semi, cursor: "pointer" }}>Load defaults</span>
            </div>
            {extrasExp.pcItems && (
              <div style={{ padding: "8px 14px 12px" }}>
                {pcItems.map((item, idx) => (
                  <div key={item._id} style={{ display: "flex", alignItems: "center", gap: _.s2, padding: "5px 0", borderBottom: `1px solid ${_.line}08` }}>
                    <span style={{ flex: 1, fontSize: _.fontSize.base, color: _.ink }}>{item.description}</span>
                    <span style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, color: _.ink, fontVariantNumeric: "tabular-nums", minWidth: 72, textAlign: "right" }}>{fmt(item.amount)}</span>
                    <div onClick={() => delPcItem(idx)} style={{ cursor: "pointer", color: _.faint, flexShrink: 0, padding: 2 }}
                      onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: _.s2, marginTop: 6 }}>
                  <input style={{ ...input, flex: 1, minHeight: 40 }} value={pcInput.description} onChange={e => setPcInput(f => ({ ...f, description: e.target.value }))} placeholder="Description…" />
                  <input type="number" style={{ ...input, width: 100, textAlign: "right", minHeight: 40 }} value={pcInput.amount} onChange={e => setPcInput(f => ({ ...f, amount: e.target.value }))} placeholder="Amount"
                    onKeyDown={e => { if (e.key === "Enter") addPcItem(pcInput.description, pcInput.amount); }} />
                  <Button size="sm" onClick={() => addPcItem(pcInput.description, pcInput.amount)} icon={Plus}>Add</Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Qualifications ── */}
          <div style={{ marginBottom: _.s5, border: `1px solid ${_.line}`, borderRadius: _.rSm, overflow: "hidden" }}>
            <div onClick={() => setExtrasExp(e => ({ ...e, qualifications: !e.qualifications }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", background: _.well, minHeight: 52 }}>
              <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                <span style={{ transform: extrasExp.qualifications ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={13} color={_.muted} /></span>
                <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>Qualifications & Assumptions</span>
                {qualifications.length > 0 && <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.ac }}>{qualifications.length}</span>}
              </div>
              <span onClick={e => { e.stopPropagation(); loadDefaultQualifications(); }} style={{ fontSize: _.fontSize.sm, color: _.ac, fontWeight: _.fontWeight.semi, cursor: "pointer" }}>Load defaults</span>
            </div>
            {extrasExp.qualifications && (
              <div style={{ padding: "8px 14px 12px" }}>
                {qualifications.map((item, idx) => (
                  <div key={item._id} style={{ display: "flex", alignItems: "center", gap: _.s2, padding: "5px 0", borderBottom: `1px solid ${_.line}08` }}>
                    <span style={{ flex: 1, fontSize: _.fontSize.base, color: _.ink }}>• {item.text}</span>
                    <div onClick={() => delQualification(idx)} style={{ cursor: "pointer", color: _.faint, flexShrink: 0, padding: 2 }}
                      onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: _.s2, marginTop: 6 }}>
                  <input style={{ ...input, flex: 1, minHeight: 40 }} value={qualInput} onChange={e => setQualInput(e.target.value)} placeholder="Add qualification…"
                    onKeyDown={e => { if (e.key === "Enter") addQualification(qualInput); }} />
                  <Button size="sm" onClick={() => addQualification(qualInput)} icon={Plus}>Add</Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Terms & Conditions ── */}
          <div style={{ marginBottom: _.s5, border: `1px solid ${_.line}`, borderRadius: _.rSm, overflow: "hidden" }}>
            <div onClick={() => setExtrasExp(e => ({ ...e, terms: !e.terms }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", background: _.well, minHeight: 52 }}>
              <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                <span style={{ transform: extrasExp.terms ? "rotate(90deg)" : "none", display: "inline-flex", transition: "transform 0.15s" }}><ChevronRight size={13} color={_.muted} /></span>
                <span style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.semi, color: _.ink }}>Terms & Conditions</span>
                {terms.length > 0 && <span style={{ fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, color: _.ac }}>{terms.length}</span>}
              </div>
              <span onClick={e => { e.stopPropagation(); loadDefaultTerms(); }} style={{ fontSize: _.fontSize.sm, color: _.ac, fontWeight: _.fontWeight.semi, cursor: "pointer" }}>Load defaults</span>
            </div>
            {extrasExp.terms && (
              <div style={{ padding: "8px 14px 12px" }}>
                {terms.length === 0 && (
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted, padding: "8px 0" }}>No terms added yet. Click "Load defaults" for standard builder terms.</div>
                )}
                {terms.map((item, idx) => (
                  <div key={item._id} style={{ display: "flex", alignItems: "flex-start", gap: _.s2, padding: "5px 0", borderBottom: `1px solid ${_.line}08` }}>
                    <input style={{ flex: 1, fontSize: _.fontSize.base, color: _.ink, background: "transparent", border: "none", outline: "none", fontFamily: "inherit", padding: "2px 0", minHeight: 40 }}
                      value={item.text} onChange={e => updateTerm(idx, e.target.value)} />
                    <div onClick={() => delTerm(idx)} style={{ cursor: "pointer", color: _.faint, flexShrink: 0, padding: 2, marginTop: 2 }}
                      onMouseEnter={e => e.currentTarget.style.color = _.red} onMouseLeave={e => e.currentTarget.style.color = _.faint}><X size={13} /></div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: _.s2, marginTop: 6 }}>
                  <input style={{ ...input, flex: 1, minHeight: 40 }} value={termInput} onChange={e => setTermInput(e.target.value)} placeholder="Add term…"
                    onKeyDown={e => { if (e.key === "Enter") addTerm(termInput); }} />
                  <Button size="sm" onClick={() => addTerm(termInput)} icon={Plus}>Add</Button>
                </div>
              </div>
            )}
          </div>

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

          {/* Quote Generator actions */}
          <Card title="Quote Generator" subtitle="Generate, preview and export your quote document" style={{ marginTop: _.s5 }}>
            <div style={{ display: "grid", gap: _.s4 }}>
              <div>
                <div style={{ fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s2 }}>Quote Header</div>
                <div style={{ fontSize: _.fontSize.base, color: _.body }}>Client: <strong>{quoteDoc?.clientName || clientName || "—"}</strong></div>
                <div style={{ fontSize: _.fontSize.base, color: _.body }}>Project: <strong>{quoteDoc?.projectName || p.name || "—"}</strong></div>
                <div style={{ fontSize: _.fontSize.base, color: _.body }}>Quote date: <strong>{quoteDoc?.quoteDate || ds()}</strong></div>
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
                  style={{ ...input, minWidth: 140, maxWidth: 180, cursor: "pointer", minHeight: 40 }}
                >
                  {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </Card>

          {/* Primary CTA */}
          {!isNarrowLayout && (
            <div style={{ marginTop: _.s5, display: "flex", gap: _.s3, flexWrap: "wrap" }}>
              <Button variant="ghost" onClick={() => gotoStep("pricing")} icon={ArrowLeft}>Back to Pricing</Button>
              {!quoteReady && <Button disabled>Complete details & scope first</Button>}
              {quoteReady && !proposalGenerated && (
                <Button onClick={generateProposal} icon={ArrowRight}>Generate Proposal</Button>
              )}
              {quoteReady && proposalGenerated && (
                <Button onClick={generateProposal} variant="secondary" icon={ArrowRight}>Regenerate Proposal</Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Bottom bar (narrow layouts) ─── */}
      {isNarrowLayout && (
        <div style={{
          position: "sticky",
          bottom: "var(--mobile-bottom-total, 0px)",
          marginTop: _.s4,
          padding: "10px 0",
          background: _.surface,
          borderTop: `1px solid ${_.line}`,
          zIndex: 8,
          pointerEvents: "auto",
        }}>
          <div style={{ display: "flex", gap: _.s2, flexWrap: "wrap" }}>
            {currentStep === "pricing" && (
              <Button onClick={() => gotoStep("review")} icon={ArrowRight} style={{ minHeight: 44 }}>
                Review Quote
              </Button>
            )}
            {currentStep === "review" && (
              <>
                <Button variant="ghost" onClick={() => gotoStep("pricing")} icon={ArrowLeft} style={{ minHeight: 44 }}>Pricing</Button>
                {quoteReady && (
                  <Button onClick={generateProposal} icon={ArrowRight} style={{ minHeight: 44 }}>
                    {proposalGenerated ? "Regenerate Proposal" : "Generate Proposal"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <Modal
        open={showSummarySheet}
        onClose={() => setShowSummarySheet(false)}
        title="Quote Summary"
        width={isMobileLayout ? 420 : 520}
      >
        <div style={{ display: "grid", gap: 8 }}>
          {[
            ["Items", T.items],
            ["Subtotal", fmt(T.sub)],
            [`Margin ${margin}%`, fmt(T.mar)],
            [`Contingency ${contingency}%`, fmt(T.con)],
            ["GST", fmt(T.gst)],
            ["Total", fmt(T.curr)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 32 }}>
              <span style={{ color: _.muted }}>{k}</span>
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{v}</strong>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
