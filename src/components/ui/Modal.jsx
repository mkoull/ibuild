import { useEffect } from "react";
import _ from "../../theme/tokens.js";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      background: _.overlay, animation: "fadeIn 0.15s ease",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: _.surface, borderRadius: _.r, width: "90%", maxWidth: width,
        maxHeight: "85vh", overflow: "auto", boxShadow: _.sh3,
        animation: "fadeUp 0.2s ease",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: `${_.s5}px ${_.s6}px`, borderBottom: `1px solid ${_.line}`,
        }}>
          <div style={{ fontSize: _.fontSize.lg, fontWeight: _.fontWeight.semi, color: _.ink }}>{title}</div>
          <div onClick={onClose} style={{ cursor: "pointer", color: _.muted, padding: _.s1, display: "flex", transition: `color ${_.tr}` }}
            onMouseEnter={e => e.currentTarget.style.color = _.ink}
            onMouseLeave={e => e.currentTarget.style.color = _.muted}
          ><X size={16} /></div>
        </div>
        <div style={{ padding: _.s6 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
