import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { btnPrimary, badge } from "../../theme/styles.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { Plus, Building2 } from "lucide-react";

export default function TradesListPage() {
  const { trades, tradesHook, mobile, notify } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleNew = () => {
    const t = tradesHook.create({ businessName: "New Trade" });
    navigate(`/trades/${t.id}`);
    notify("Trade created");
  };

  const filtered = trades.filter(tr => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (tr.businessName || "").toLowerCase().includes(q) || (tr.category || "").toLowerCase().includes(q);
  });

  return (
    <Section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: mobile ? 28 : 40, fontWeight: 700, letterSpacing: "-0.03em" }}>Trades</h1>
        <button onClick={handleNew} style={btnPrimary}><Plus size={14} /> New Trade</button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search trades..." style={{ marginBottom: 24, maxWidth: 320 }} />

      {filtered.length === 0 && <Empty icon={Building2} text={search ? "No matching trades" : "No trades yet"} action={!search ? handleNew : undefined} actionText="Add Trade" />}

      {filtered.map(tr => {
        const primaryContact = tr.contacts?.[0];
        return (
          <div key={tr.id} onClick={() => navigate(`/trades/${tr.id}`)} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: `${_.s4}px 0`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
            transition: "padding-left 0.12s",
          }}
          onMouseEnter={e => e.currentTarget.style.paddingLeft = "4px"}
          onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{tr.businessName}</div>
              <div style={{ fontSize: 12, color: _.muted, marginTop: 1 }}>
                {tr.category}{primaryContact?.phone ? ` · ${primaryContact.phone}` : ""}
                {(tr.regions || []).length > 0 ? ` · ${tr.regions.join(", ")}` : ""}
              </div>
            </div>
            <span style={badge(tr.status === "active" ? _.green : _.muted)}>{tr.status}</span>
          </div>
        );
      })}
    </Section>
  );
}
