import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, badge, stCol } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Card from "../../components/ui/Card.jsx";
import { FileText, Receipt, ArrowUpRight, ChevronRight } from "lucide-react";

export default function DocumentsPage() {
  const { project: p } = useProject();
  const { mobile } = useApp();
  const navigate = useNavigate();

  const proposals = p.proposals || [];
  const invoices = p.invoices || [];
  const variations = p.variations || [];

  const total = proposals.length + invoices.length + variations.length;

  const DocRow = ({ icon: Icon, title, subtitle, status, statusColor, onClick }) => (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
      borderBottom: `1px solid ${_.line}`, cursor: "pointer", transition: "padding-left 0.12s",
    }}
      onMouseEnter={e => e.currentTarget.style.paddingLeft = "4px"}
      onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
    >
      <Icon size={16} color={_.muted} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: _.ink }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: _.muted, marginTop: 1 }}>{subtitle}</div>}
      </div>
      {status && <span style={badge(statusColor || _.muted)}>{status}</span>}
      <ChevronRight size={14} color={_.faint} />
    </div>
  );

  return (
    <Section>
      <h1 style={{ fontSize: mobile ? 28 : 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Documents</h1>
      <div style={{ fontSize: 14, color: _.muted, marginBottom: mobile ? 24 : 32 }}>{total} document{total !== 1 ? "s" : ""}</div>

      {total === 0 && (
        <div style={{ padding: 32, textAlign: "center", color: _.muted, fontSize: 14, border: `1.5px dashed ${_.line2}`, borderRadius: _.r }}>
          No documents yet. Create proposals, invoices, or variations to see them here.
        </div>
      )}

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
    </Section>
  );
}
