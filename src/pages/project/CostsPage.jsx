import { useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import { BarChart3 } from "lucide-react";

export default function CostsPage() {
  const { project: p, update: up, T } = useProject();
  const { mobile } = useApp();
  const navigate = useNavigate();

  const uI = (cat, idx, k, v) => up(pr => { pr.scope[cat][idx][k] = v; return pr; });

  return (
    <Section>
      <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: _.s7 }}>Cost Tracker</h1>
      {T.cats.length === 0 && <Empty icon={BarChart3} text="Add scope items in Quote to begin tracking" action={() => navigate("../scope")} actionText="Go to Quote" />}
      {T.cats.map(([cat, items]) => {
        const est = T.cT(p.scope, cat);
        const act = T.cA(p.scope, cat);
        const v = act - est;
        return (
          <div key={cat} style={{ marginBottom: _.s6, paddingBottom: _.s5, borderBottom: `1px solid ${_.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: _.s2 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{cat}</span>
              {v !== 0 && <span style={{ fontSize: 14, fontWeight: 600, color: v > 0 ? _.red : _.green }}>{v > 0 ? "+" : ""}{fmt(v)}</span>}
            </div>
            <div style={{ display: "flex", gap: _.s5, fontSize: 13, color: _.muted, marginBottom: _.s3 }}>
              <span>Budget <strong style={{ color: _.ink }}>{fmt(est)}</strong></span>
              <span>Actual <strong style={{ color: act > est ? _.red : _.green }}>{fmt(act)}</strong></span>
            </div>
            {act > 0 && <div style={{ height: 3, background: _.line, borderRadius: 2, marginBottom: _.s3 }}><div style={{ height: "100%", width: `${Math.min((act / est) * 100, 100)}%`, background: act > est ? _.red : _.green, borderRadius: 2, transition: "width 0.4s" }} /></div>}
            {items.filter(i => i.on).map(item => (
              <div key={item._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: 13 }}>
                <span style={{ color: _.body }}>{item.item}</span>
                <div style={{ display: "flex", alignItems: "center", gap: _.s2 }}>
                  <span style={{ color: _.muted, fontVariantNumeric: "tabular-nums" }}>{fmt(item.rate * item.qty)}</span>
                  <input type="number" placeholder="Actual" style={{ width: 76, padding: "3px 6px", background: _.well, border: `1px solid ${_.line}`, borderRadius: 5, color: _.ink, fontSize: 12, textAlign: "right", outline: "none" }}
                    value={item.actual || ""} onChange={e => uI(cat, p.scope[cat].indexOf(item), "actual", parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </Section>
  );
}
