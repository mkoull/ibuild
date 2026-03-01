import _ from "../../theme/tokens.js";

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 999,
      padding: "10px 24px", borderRadius: _.rFull, fontSize: 13, fontWeight: 600, color: "#fff",
      background: toast.type === "error" ? _.red : _.ink, boxShadow: _.sh3, animation: "fadeUp 0.2s ease",
    }}>
      {toast.msg}
    </div>
  );
}
