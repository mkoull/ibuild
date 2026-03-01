import { useEffect } from "react";
import _ from "../../theme/tokens.js";
import { X } from "lucide-react";

export default function Drawer({ open, onClose, title, children, width = 400 }) {
  useEffect(() => {
    if (!open) return;
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end",
      background: _.overlay, animation: "fadeIn 0.12s ease",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: _.surface, width: "90%", maxWidth: width,
        height: "100%", overflow: "auto", boxShadow: _.sh3,
        animation: "slideInRight 0.2s ease",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px", borderBottom: `1px solid ${_.line}`, position: "sticky", top: 0,
          background: _.surface, zIndex: 1,
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: _.ink }}>{title}</div>
          <div onClick={onClose} style={{ cursor: "pointer", color: _.muted, padding: 4, display: "flex", transition: `color ${_.tr}` }}
            onMouseEnter={e => e.currentTarget.style.color = _.ink}
            onMouseLeave={e => e.currentTarget.style.color = _.muted}
          ><X size={16} /></div>
        </div>
        <div style={{ padding: 24 }}>
          {children}
        </div>
      </div>
      <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    </div>
  );
}
