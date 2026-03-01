import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, btnPrimary, badge, uid, ds } from "../../theme/styles.js";
import { calc } from "../../lib/calc.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import { FileText, Plus, ChevronRight } from "lucide-react";

export default function ProposalsPage() {
  const { project: p, update: up, T, log } = useProject();
  const { clients, mobile, notify } = useApp();
  const navigate = useNavigate();

  const clientName = p.client || "";
  const quoteReady = clientName && T.items > 0;

  const createProp = () => {
    const name = `Proposal v${p.proposals.length + 1}`;
    const newIdx = p.proposals.length;
    up(pr => {
      const t = calc(pr);
      pr.proposals.push({
        id: `PROP-${uid()}`, name, date: ds(),
        scope: JSON.parse(JSON.stringify(pr.scope)),
        client: clientName, address: pr.address, suburb: pr.suburb,
        type: pr.buildType || pr.type, stories: pr.storeys || pr.stories,
        area: pr.floorArea || pr.area, notes: pr.notes, validDays: pr.validDays,
        pricing: { sub: t.sub, mar: t.mar, con: t.con, gst: t.gst, total: t.curr, margin: t.margin, contingency: t.contingency },
        sigData: null, status: "draft",
      });
      return pr;
    });
    log("Proposal saved: " + name);
    notify("Proposal saved");
    navigate(`${newIdx}`);
  };

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: _.s7 }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Proposals</h1>
        {quoteReady && <button onClick={createProp} style={btnPrimary}><Plus size={14} /> New from current scope</button>}
      </div>
      {!quoteReady && <Empty icon={FileText} text="Complete your quote first" action={() => navigate("../scope")} actionText="Go to Quote" />}
      {quoteReady && p.proposals.length === 0 && <Empty icon={FileText} text="No proposals yet — save one from your current scope" />}
      {p.proposals.map((prop, i) => (
        <div key={i} onClick={() => navigate(`${i}`)} style={{
          padding: `${_.s4}px 0`, cursor: "pointer", display: "flex", justifyContent: "space-between",
          alignItems: "center", borderBottom: `1px solid ${_.line}`, transition: "all 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.paddingLeft = "4px"}
        onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
        >
          <div><div style={{ fontSize: 14, fontWeight: 500 }}>{prop.name}</div><div style={{ fontSize: 12, color: _.muted, marginTop: 1 }}>{prop.id} · {prop.date}</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: _.s3 }}>
            <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(prop.pricing.total)}</span>
            <span style={badge(prop.status === "signed" ? _.green : prop.status === "declined" ? _.red : prop.status === "sent" ? _.blue : _.amber)}>{prop.status}</span>
            <ChevronRight size={14} color={_.faint} />
          </div>
        </div>
      ))}
    </Section>
  );
}
