import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, btnPrimary, btnGhost, uid } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Button from "../../components/ui/Button.jsx";
import { Upload, ArrowRight, AlertTriangle, FileText, Image, X, Zap } from "lucide-react";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function PlansAIPage() {
  const { project: p, update: up, log } = useProject();
  const { mobile, notify } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [analysing, setAnalysing] = useState(false);
  const [planData, setPlanData] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  const isPdf = file?.type === "application/pdf";

  const handleFile = (f) => {
    setFileError(null);
    setPlanData(null);
    setAnalysisError(null);

    if (!ACCEPTED_TYPES.includes(f.type)) {
      setFileError(`Unsupported file type: ${f.type || "unknown"}. Use PNG, JPG, WebP, or PDF.`);
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setFileError(`File is too large (${formatSize(f.size)}). Maximum size is ${MAX_SIZE_MB}MB.`);
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setFile(f);
    if (f.type === "application/pdf") {
      setPreviewUrl(null);
    } else {
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setFileError(null);
    setPlanData(null);
    setAnalysisError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  };

  const analyse = async () => {
    const endpoint = import.meta.env.VITE_FLOORPLAN_ANALYSE_ENDPOINT;
    if (!endpoint) {
      setAnalysisError("Floorplan analysis needs a backend endpoint. Set VITE_FLOORPLAN_ANALYSE_ENDPOINT in your environment to enable.");
      notify("Backend endpoint not configured", "error");
      return;
    }

    setAnalysing(true);
    setAnalysisError(null);
    setPlanData(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch(endpoint, { method: "POST", body: fd });
      if (!resp.ok) throw new Error(`Server returned ${resp.status}: ${resp.statusText}`);
      const d = await resp.json();
      if (d.error) throw new Error(d.error);
      setPlanData(d);
    } catch (e) {
      const msg = e.message || "Analysis failed";
      setAnalysisError(msg);
      notify("Analysis failed", "error");
    }
    setAnalysing(false);
  };

  const addPlanItems = () => {
    if (!planData?.scope_items?.length) return;
    up(pr => {
      planData.scope_items.forEach(si => {
        const cat = si.category;
        if (!pr.scope[cat]) return;
        const exists = pr.scope[cat].find(x => x.item === si.item);
        if (exists) { exists.on = true; exists.qty = si.qty; exists.rate = si.rate; }
        else { pr.scope[cat].push({ item: si.item, unit: si.unit, rate: si.rate, qty: si.qty, on: true, actual: 0, custom: true, _id: uid() }); }
      });
      if (planData.total_m2) { pr.floorArea = String(planData.total_m2); pr.area = String(planData.total_m2); }
      return pr;
    });
    log("Plan items added: " + planData.scope_items.length + " items");
    notify(planData.scope_items.length + " items added to quote");
    navigate("../quote?step=scope");
  };

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight, marginBottom: 4 }}>Plans AI</h1>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: _.s3 }}>Upload floor plans for AI-powered scope extraction</div>
      <div style={{ fontSize: _.fontSize.sm, color: _.faint, marginBottom: _.s8 }}>Analyses your plan image and suggests construction line items with Australian rates.</div>

      {/* Upload zone (show when no file selected) */}
      {!file && !planData && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = _.ac; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = _.line2; }}
          style={{ textAlign: "center", padding: `${_.s9}px ${_.s7}px`, border: `1.5px dashed ${_.line2}`, borderRadius: _.r, marginBottom: _.s7, transition: `border-color ${_.tr}` }}
          onMouseEnter={e => e.currentTarget.style.borderColor = _.ink}
          onMouseLeave={e => e.currentTarget.style.borderColor = _.line2}
        >
          <Upload size={28} strokeWidth={1.5} color={_.muted} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: _.fontSize.md, color: _.ink, marginBottom: 4, fontWeight: _.fontWeight.medium }}>Upload a floor plan</div>
          <div style={{ fontSize: _.fontSize.base, color: _.muted, marginBottom: _.s5 }}>PNG, JPG, WebP, or PDF — up to {MAX_SIZE_MB}MB</div>
          <label style={{ ...btnPrimary, cursor: "pointer" }}>
            <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
            Choose file
          </label>
        </div>
      )}

      {/* File validation error */}
      {fileError && (
        <div style={{ padding: _.s4, border: `1px solid ${_.red}30`, borderRadius: _.r, background: `${_.red}08`, display: "flex", alignItems: "center", gap: _.s3, marginBottom: _.s5 }}>
          <AlertTriangle size={16} color={_.red} />
          <div style={{ flex: 1, fontSize: _.fontSize.md, color: _.red, fontWeight: _.fontWeight.medium }}>{fileError}</div>
          <div onClick={() => setFileError(null)} style={{ cursor: "pointer", color: _.faint, padding: 2 }}><X size={14} /></div>
        </div>
      )}

      {/* File preview (uploaded, not yet analysed) */}
      {file && !planData && (
        <div style={{ marginBottom: _.s7 }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: _.s7, marginBottom: _.s6 }}>
            {/* Preview */}
            <div>
              <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s3 }}>Preview</div>
              <div style={{ border: `1px solid ${_.line}`, borderRadius: _.r, overflow: "hidden", background: _.well, minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Floor plan" style={{ width: "100%", display: "block" }} />
                ) : (
                  <div style={{ padding: _.s8, textAlign: "center" }}>
                    <FileText size={40} color={_.muted} style={{ marginBottom: _.s3 }} />
                    <div style={{ fontSize: _.fontSize.md, color: _.body, fontWeight: _.fontWeight.medium }}>PDF uploaded</div>
                    <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 4 }}>Preview not available for PDF files</div>
                  </div>
                )}
              </div>
            </div>
            {/* File info + actions */}
            <div>
              <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s3 }}>File details</div>
              <div style={{ background: _.well, borderRadius: _.rSm, padding: _.s4, marginBottom: _.s5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: _.s3, marginBottom: _.s3 }}>
                  {isPdf ? <FileText size={20} color={_.ac} /> : <Image size={20} color={_.ac} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium, color: _.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                    <div style={{ fontSize: _.fontSize.sm, color: _.muted }}>{file.type} · {formatSize(file.size)}</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: _.s2, flexWrap: "wrap" }}>
                <Button icon={Zap} onClick={analyse} disabled={analysing}>
                  {analysing ? "Analysing…" : "Analyse floor plan"}
                </Button>
                <label style={{ ...btnGhost, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
                  Re-upload
                </label>
                <Button variant="ghost" onClick={clearFile}><X size={13} /> Remove</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading spinner */}
      {analysing && (
        <div style={{ textAlign: "center", padding: _.s9 }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${_.line}`, borderTopColor: _.ac, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <div style={{ fontSize: _.fontSize.md, color: _.body, fontWeight: _.fontWeight.medium }}>Analysing floor plan…</div>
          <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 4 }}>This may take a moment</div>
        </div>
      )}

      {/* Analysis error */}
      {analysisError && (
        <div style={{ padding: _.s4, border: `1px solid ${_.red}30`, borderRadius: _.r, background: `${_.red}08`, display: "flex", alignItems: "flex-start", gap: _.s3, marginBottom: _.s5 }}>
          <AlertTriangle size={16} color={_.red} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: _.fontSize.md, color: _.red, fontWeight: _.fontWeight.medium, marginBottom: 4 }}>Analysis failed</div>
            <div style={{ fontSize: _.fontSize.base, color: _.body }}>{analysisError}</div>
          </div>
          <div onClick={() => setAnalysisError(null)} style={{ cursor: "pointer", color: _.faint, padding: 2, flexShrink: 0 }}><X size={14} /></div>
        </div>
      )}

      {/* Results */}
      {planData && !planData.error && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: _.s7, marginBottom: _.s7 }}>
            {previewUrl && (
              <div>
                <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s3 }}>Floor Plan</div>
                <div style={{ border: `1px solid ${_.line}`, borderRadius: _.r, overflow: "hidden", background: _.well }}>
                  <img src={previewUrl} alt="Floor plan" style={{ width: "100%", display: "block" }} />
                </div>
              </div>
            )}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s5 }}>
                <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase" }}>AI Analysis</div>
              </div>
              <div style={{ display: "flex", gap: 0, marginBottom: _.s6, borderBottom: `1px solid ${_.line}` }}>
                <div style={{ flex: 1, padding: `${_.s4}px 0` }}>
                  <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: 4 }}>Total Area</div>
                  <div style={{ fontSize: _.fontSize["3xl"], fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", letterSpacing: _.letterSpacing.tight }}>{planData.total_m2 ?? "—"}m²</div>
                </div>
                <div style={{ width: 1, background: _.line, margin: `0 ${_.s5}px` }} />
                <div style={{ flex: 1, padding: `${_.s4}px 0` }}>
                  <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: 4 }}>Estimated Cost</div>
                  <div style={{ fontSize: _.fontSize["3xl"], fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums", letterSpacing: _.letterSpacing.tight }}>
                    {planData.scope_items?.length ? fmt(planData.scope_items.reduce((s, si) => s + si.rate * si.qty, 0)) : "—"}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: _.fontSize.caption, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase", marginBottom: _.s3 }}>Detected Rooms ({planData.rooms?.length || 0})</div>
              {planData.rooms?.map((rm, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${_.line}`, fontSize: _.fontSize.base }}>
                  <span style={{ color: _.body }}>{rm.name}</span>
                  <span style={{ fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums" }}>{rm.m2}m²</span>
                </div>
              ))}
              {planData.notes && <div style={{ marginTop: _.s5, fontSize: _.fontSize.base, color: _.muted, lineHeight: _.lineHeight.body }}>{planData.notes}</div>}
            </div>
          </div>

          {planData.scope_items?.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s4, paddingTop: _.s5, borderTop: `1px solid ${_.line}` }}>
                <div style={{ fontSize: _.fontSize.unit, fontWeight: _.fontWeight.semi, color: _.ink }}>Extracted Scope Items</div>
                <span style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.bold, fontVariantNumeric: "tabular-nums" }}>{fmt(planData.scope_items.reduce((s, si) => s + si.rate * si.qty, 0))}</span>
              </div>
              {planData.scope_items.map((si, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 100px", gap: 8, padding: "10px 0", borderBottom: `1px solid ${_.line}`, fontSize: _.fontSize.base, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: _.fontWeight.medium, color: _.ink }}>{si.item}</div>
                    <div style={{ fontSize: _.fontSize.caption, color: _.muted, marginTop: 1 }}>{si.category}</div>
                  </div>
                  <div style={{ color: _.muted, fontSize: _.fontSize.sm }}>{si.qty} {si.unit}</div>
                  <div style={{ color: _.muted, fontSize: _.fontSize.sm, textAlign: "right" }}>@ {fmt(si.rate)}</div>
                  <div style={{ fontWeight: _.fontWeight.semi, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(si.rate * si.qty)}</div>
                </div>
              ))}
              <div style={{ marginTop: _.s7, paddingTop: _.s6, borderTop: `1px solid ${_.line}`, display: "flex", alignItems: "center", gap: _.s3 }}>
                <Button onClick={addPlanItems} icon={ArrowRight}>Add {planData.scope_items.length} items to quote</Button>
                <Button variant="ghost" onClick={clearFile}>Re-upload</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {planData?.error && (
        <div style={{ padding: _.s4, border: `1px solid ${_.red}30`, borderRadius: _.r, background: `${_.red}08`, display: "flex", alignItems: "center", gap: _.s3 }}>
          <AlertTriangle size={16} color={_.red} />
          <div style={{ flex: 1, fontSize: _.fontSize.md, color: _.red, fontWeight: _.fontWeight.medium }}>{planData.error}</div>
        </div>
      )}
    </Section>
  );
}
