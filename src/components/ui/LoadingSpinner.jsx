import _ from "../../theme/tokens.js";

export default function LoadingSpinner() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 200,
      padding: _.s7,
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: `3px solid ${_.line}`,
        borderTopColor: _.ac,
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
