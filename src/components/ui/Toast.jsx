import _ from "../../theme/tokens.js";

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", top: _.s5, left: "50%", transform: "translateX(-50%)", zIndex: 1100,
      padding: `${_.s3}px ${_.s6}px`, borderRadius: _.rFull, fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, color: "#fff",
      background: toast.type === "error" ? _.red : _.ink, boxShadow: _.sh3, animation: "fadeUp 0.2s ease",
    }}>
      {toast.msg}
    </div>
  );
}
