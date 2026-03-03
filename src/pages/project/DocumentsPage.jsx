import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { uid, fmt, badge } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import Empty from "../../components/ui/Empty.jsx";
import { FileText, Receipt, ArrowUpRight, ChevronRight, Upload, FolderOpen, Image, File, Trash2, Download } from "lucide-react";

const CATEGORIES = ["All", "Plans", "Specs", "Contracts", "Permits", "Photos", "Correspondence", "Other"];
const CAT_COLORS = { Plans: _.blue, Specs: _.violet, Contracts: _.green, Permits: _.amber, Photos: _.ac, Correspondence: _.muted, Other: _.body };

export default function DocumentsPage() {
  const { project: p, update } = useProject();
  const { mobile, notify } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [tab, setTab] = useState("All");
  const [dragOver, setDragOver] = useState(false);

  const proposals = p.proposals || [];
  const invoices = p.invoices || [];
  const variations = p.variations || [];
  const documents = p.documents || [];

  const genTotal = proposals.length + invoices.length + variations.length;
  const filteredDocs = tab === "All" ? documents : documents.filter(d => d.category === tab);

  const handleFiles = (files) => {
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const doc = {
          id: uid(),
          name: file.name,
          mimeType: file.type,
          size: file.size,
          url: ev.target.result, // data URL for local storage
          category: guessCat(file),
          version: 1,
          createdAt: new Date().toISOString(),
        };
        update(draft => {
          if (!draft.documents) draft.documents = [];
          draft.documents.push(doc);
        });
        notify(`Uploaded: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const guessCat = (file) => {
    const name = file.name.toLowerCase();
    const type = file.type;
    if (type.startsWith("image/")) return "Photos";
    if (name.includes("plan") || name.includes("drawing")) return "Plans";
    if (name.includes("spec")) return "Specs";
    if (name.includes("contract")) return "Contracts";
    if (name.includes("permit") || name.includes("approval")) return "Permits";
    return "Other";
  };

  const deleteDoc = (id) => {
    update(draft => {
      draft.documents = (draft.documents || []).filter(d => d.id !== id);
    });
    notify("Document deleted");
  };

  const updateDocCategory = (id, category) => {
    update(draft => {
      const doc = (draft.documents || []).find(d => d.id === id);
      if (doc) doc.category = category;
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(Array.from(e.dataTransfer.files));
  };

  // eslint-disable-next-line no-unused-vars
  const DocRow = ({ icon: Ic, title, subtitle, status, statusColor, onClick }) => (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
      borderBottom: `1px solid ${_.line}`, cursor: "pointer", transition: "padding-left 0.12s",
    }}
      onMouseEnter={e => e.currentTarget.style.paddingLeft = "4px"}
      onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
    >
      <Ic size={16} color={_.muted} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium, color: _.ink }}>{title}</div>
        {subtitle && <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 1 }}>{subtitle}</div>}
      </div>
      {status && <span style={badge(statusColor || _.muted)}>{status}</span>}
      <ChevronRight size={14} color={_.faint} />
    </div>
  );

  const fmtSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (mime) => mime && mime.startsWith("image/");

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight }}>Documents</h1>
        <Button icon={Upload} onClick={() => fileRef.current?.click()}>Upload</Button>
        <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={e => handleFiles(Array.from(e.target.files))} />
      </div>
      <div style={{ fontSize: _.fontSize.md, color: _.muted, marginBottom: mobile ? 24 : 32 }}>
        {documents.length + genTotal} document{documents.length + genTotal !== 1 ? "s" : ""}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          padding: 24, textAlign: "center", borderRadius: _.r,
          border: `2px dashed ${dragOver ? _.ac : _.line2}`,
          background: dragOver ? `${_.ac}08` : "transparent",
          color: _.muted, fontSize: _.fontSize.md, marginBottom: 24,
          transition: `all ${_.tr}`,
        }}
      >
        <Upload size={20} style={{ marginBottom: 8 }} />
        <div>Drag & drop files here, or click Upload</div>
      </div>

      {/* Uploaded documents */}
      {documents.length > 0 && (
        <Card title="Uploaded Files" style={{ marginBottom: 24 }}>
          <Tabs tabs={CATEGORIES.map(c => ({ label: `${c}${c !== "All" ? ` (${documents.filter(d => d.category === c).length})` : ""}`, value: c }))} active={tab} onChange={setTab} />
          <div style={{ marginTop: _.s3 }}>
            {filteredDocs.length === 0 ? (
              <div style={{ padding: _.s4, textAlign: "center", color: _.muted, fontSize: _.fontSize.sm }}>No documents in this category</div>
            ) : filteredDocs.map(doc => (
              <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${_.line}` }}>
                {isImage(doc.mimeType) ? (
                  <img src={doc.url} alt="" style={{ width: 36, height: 36, borderRadius: _.rXs, objectFit: "cover" }} />
                ) : (
                  <File size={16} color={_.muted} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium, color: _.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
                  <div style={{ fontSize: _.fontSize.xs, color: _.muted }}>{fmtSize(doc.size)} &middot; v{doc.version || 1}</div>
                </div>
                <select style={{ border: "none", background: "none", fontSize: _.fontSize.xs, color: CAT_COLORS[doc.category] || _.muted, cursor: "pointer" }}
                  value={doc.category} onChange={e => updateDocCategory(doc.id, e.target.value)}>
                  {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {doc.url && <a href={doc.url} download={doc.name} style={{ color: _.muted, display: "flex" }}><Download size={14} /></a>}
                <div style={{ cursor: "pointer", color: _.red, display: "flex" }} onClick={() => deleteDoc(doc.id)}><Trash2 size={14} /></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Generated documents */}
      {proposals.length > 0 && (
        <Card title={`Proposals (${proposals.length})`} style={{ marginBottom: 16 }}>
          {proposals.map((doc, i) => (
            <DocRow key={doc.id} icon={FileText}
              title={doc.name || doc.id}
              subtitle={`${doc.date} · ${fmt(doc.pricing?.total || 0)}`}
              status={doc.status} statusColor={doc.status === "approved" ? _.green : doc.status === "draft" ? _.muted : _.amber}
              onClick={() => navigate(`../proposals/${i}`)}
            />
          ))}
        </Card>
      )}

      {invoices.length > 0 && (
        <Card title={`Invoices (${invoices.length})`} style={{ marginBottom: 16 }}>
          {invoices.map((doc, i) => (
            <DocRow key={doc.id || i} icon={Receipt}
              title={doc.desc || `Invoice #${i + 1}`}
              subtitle={`${doc.date || ""} · ${fmt(doc.amount || 0)}`}
              status={doc.status} statusColor={doc.status === "paid" ? _.green : _.red}
              onClick={() => navigate(`../invoices/${i}`)}
            />
          ))}
        </Card>
      )}

      {variations.length > 0 && (
        <Card title={`Variations (${variations.length})`} style={{ marginBottom: 16 }}>
          {variations.map((doc, i) => (
            <DocRow key={doc.id} icon={ArrowUpRight}
              title={doc.id || `Variation #${i + 1}`}
              subtitle={`${doc.date || ""} · ${fmt(doc.amount || 0)}`}
              status={doc.status} statusColor={doc.status === "approved" ? _.green : doc.status === "draft" ? _.muted : _.amber}
              onClick={() => navigate(`../variations/${i}`)}
            />
          ))}
        </Card>
      )}

      {documents.length === 0 && genTotal === 0 && (
        <Empty icon={FolderOpen} title="No documents" text="Upload files or create proposals, invoices, or variations to see them here." />
      )}
    </Section>
  );
}
