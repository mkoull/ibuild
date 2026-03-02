import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import _ from "../../theme/tokens.js";
import { fmt, pName, stCol, badge } from "../../theme/styles.js";
import { isJob, normaliseStage } from "../../lib/lifecycle.js";
import { getProjectValue, getOutstanding, getNextMilestone } from "../../lib/selectors.js";
import Section from "../../components/ui/Section.jsx";
import Empty from "../../components/ui/Empty.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import { Hammer, Trash2 } from "lucide-react";

const JOB_TABS = ["All", "Approved", "Active", "Invoiced", "Complete"];

export default function JobsListPage() {
  const { projects, clients, remove, mobile, notify } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const jobs = projects.filter(pr => isJob(pr.stage || pr.status));

  const filtered = jobs.filter(pr => {
    const stage = normaliseStage(pr.stage || pr.status);
    if (filter !== "All" && stage !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = pName(pr, clients).toLowerCase();
      const client = (pr.client || "").toLowerCase();
      if (!name.includes(q) && !client.includes(q)) return false;
    }
    return true;
  });

  return (
    <Section>
      <div style={{ marginBottom: _.s5 }}>
        <h1 style={{ fontSize: mobile ? _.fontSize["3xl"] : _.fontSize["4xl"], fontWeight: _.fontWeight.bold, letterSpacing: _.letterSpacing.tight }}>Jobs</h1>
        <div style={{ fontSize: _.fontSize.base, color: _.muted, marginTop: _.s1 }}>Approved projects in delivery</div>
      </div>

      <div style={{ display: "flex", gap: _.s3, marginBottom: _.s5, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search jobs\u2026" style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
        <Tabs tabs={JOB_TABS} active={filter} onChange={setFilter} />
      </div>

      {filtered.length === 0 && <Empty icon={Hammer} text={search ? "No matching jobs" : "No jobs yet. Convert a quote to create a job."} />}

      {filtered.length > 0 && (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: mobile ? "1fr auto 32px" : "1fr 100px 120px 100px 80px 32px", gap: _.s2,
            padding: `${_.s2}px 0`, borderBottom: `2px solid ${_.ink}`,
            fontSize: _.fontSize.xs, color: _.muted, fontWeight: _.fontWeight.semi, letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
          }}>
            <span>Job</span>
            {!mobile && <><span style={{ textAlign: "right" }}>Value</span><span>Next Milestone</span><span style={{ textAlign: "right" }}>Outstanding</span></>}
            <span style={{ textAlign: "center" }}>Stage</span>
            <span />
          </div>

          {filtered.map(pr => {
            const stage = pr.stage || pr.status;
            const value = getProjectValue(pr);
            const outstanding = getOutstanding(pr);
            const nextMs = getNextMilestone(pr);

            return (
              <div key={pr.id} onClick={() => navigate(`/projects/${pr.id}/overview`)} style={{
                display: "grid", gridTemplateColumns: mobile ? "1fr auto 32px" : "1fr 100px 120px 100px 80px 32px", gap: _.s2,
                padding: `${_.s3}px ${_.s1}px`, borderBottom: `1px solid ${_.line}`, cursor: "pointer",
                alignItems: "center", borderRadius: _.rXs, transition: `background ${_.tr}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = _.well}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: _.fontSize.md, fontWeight: _.fontWeight.medium, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pName(pr, clients)}</div>
                  <div style={{ fontSize: _.fontSize.sm, color: _.muted, marginTop: 1 }}>{pr.buildType || pr.type}</div>
                </div>
                {!mobile && (
                  <>
                    <span style={{ textAlign: "right", fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, fontVariantNumeric: "tabular-nums" }}>
                      {value ? fmt(value) : "\u2014"}
                    </span>
                    <span style={{ fontSize: _.fontSize.sm, color: nextMs ? _.body : _.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {nextMs ? nextMs.name : "\u2014"}
                    </span>
                    <span style={{ textAlign: "right", fontSize: _.fontSize.base, fontWeight: _.fontWeight.medium, fontVariantNumeric: "tabular-nums", color: outstanding ? _.red : _.faint }}>
                      {outstanding ? fmt(outstanding) : "\u2014"}
                    </span>
                  </>
                )}
                <div style={{ textAlign: "center" }}><span style={badge(stCol(stage))}>{stage}</span></div>
                <div onClick={e => { e.stopPropagation(); setDeleteTarget(pr); }}
                  style={{ cursor: "pointer", color: _.faint, transition: `color ${_.tr}`, padding: _.s1, display: "flex", justifyContent: "center" }}
                  onMouseEnter={e => e.currentTarget.style.color = _.red}
                  onMouseLeave={e => e.currentTarget.style.color = _.faint}
                ><Trash2 size={14} /></div>
              </div>
            );
          })}
        </>
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Job" width={400}>
        <div style={{ fontSize: _.fontSize.md, color: _.body, marginBottom: _.s6 }}>
          Delete <strong>{deleteTarget ? pName(deleteTarget, clients) : ""}</strong>? This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: _.s2, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { remove(deleteTarget.id); notify("Job deleted"); setDeleteTarget(null); }}>Delete</Button>
        </div>
      </Modal>
    </Section>
  );
}
