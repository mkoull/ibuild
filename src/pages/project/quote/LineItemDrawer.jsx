import _ from "../../../theme/tokens.js";
import { input, label } from "../../../theme/styles.js";
import { toPositiveNumber } from "../../../lib/validation.js";
import Drawer from "../../../components/ui/Drawer.jsx";
import Button from "../../../components/ui/Button.jsx";

export default function LineItemDrawer({ open, onClose, project, cat, idx, uI, delI, filesToDataUrls, up }) {
  const item = project.scope?.[cat]?.[idx];
  if (!open || !item) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Line Item Details" width={360}>
      <div style={{ display: "grid", gap: _.s3 }}>
        <div>
          <label style={label}>Notes</label>
          <textarea
            style={{ ...input, minHeight: 70, resize: "vertical" }}
            value={item.notes || ""}
            onChange={(e) => uI(cat, idx, "notes", e.target.value)}
          />
        </div>
        <div>
          <label style={label}>Supplier</label>
          <input style={input} value={item.supplier || ""} onChange={(e) => uI(cat, idx, "supplier", e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: _.s2 }}>
          <div>
            <label style={label}>Labour Cost</label>
            <input type="number" style={input} value={item.labourCost || 0} onChange={(e) => uI(cat, idx, "labourCost", toPositiveNumber(e.target.value, 0))} />
          </div>
          <div>
            <label style={label}>Material Cost</label>
            <input type="number" style={input} value={item.materialCost || 0} onChange={(e) => uI(cat, idx, "materialCost", toPositiveNumber(e.target.value, 0))} />
          </div>
        </div>
        <div>
          <label style={label}>Attachments</label>
          <input
            type="file"
            multiple
            style={{ fontSize: _.fontSize.sm }}
            onChange={async (e) => {
              const files = await filesToDataUrls(e.target.files);
              up((pr) => {
                const row = pr.scope?.[cat]?.[idx];
                if (!row) return pr;
                if (!Array.isArray(row.attachments)) row.attachments = [];
                row.attachments.push(...files);
                return pr;
              });
            }}
          />
          {Array.isArray(item.attachments) && item.attachments.length > 0 && (
            <div style={{ marginTop: _.s2, display: "grid", gap: 4 }}>
              {item.attachments.map((f, aIdx) => (
                <div key={`${f.name}-${aIdx}`} style={{ fontSize: _.fontSize.sm, color: _.muted, display: "flex", justifyContent: "space-between", gap: _.s2 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name || `Attachment ${aIdx + 1}`}</span>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: _.red, cursor: "pointer", fontSize: _.fontSize.sm, fontFamily: "inherit", padding: "0 4px" }}
                    onClick={() => {
                      up((pr) => {
                        const row = pr.scope?.[cat]?.[idx];
                        if (!row || !Array.isArray(row.attachments)) return pr;
                        row.attachments.splice(aIdx, 1);
                        return pr;
                      });
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ marginTop: _.s6, paddingTop: _.s4, borderTop: `1px solid ${_.line}` }}>
        <Button variant="danger" onClick={() => { delI(cat, idx); onClose(); }}>Delete Item</Button>
      </div>
    </Drawer>
  );
}
