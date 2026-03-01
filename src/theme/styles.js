import _ from "./tokens.js";

export const fmt = n =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const ds = () =>
  new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

export const ts = () =>
  new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });

export const pName = (pr, clients) => {
  if (pr.name) return pr.name;
  // Fallback: derive from client + suburb
  let clientName = pr.client;
  if (!clientName && pr.clientId && clients) {
    const c = clients.find(cl => cl.id === pr.clientId);
    if (c) clientName = c.displayName;
  }
  return clientName ? (pr.suburb ? `${clientName} — ${pr.suburb}` : clientName) : "New Project";
};

export const input = {
  width: "100%", padding: "9px 12px", background: _.well, border: "1.5px solid transparent",
  borderRadius: _.rSm, color: _.ink, fontSize: 14, fontFamily: "inherit", outline: "none",
  transition: "border-color 0.15s ease",
};

export const label = {
  fontSize: 11, color: _.muted, marginBottom: 5, display: "block", fontWeight: 600,
  letterSpacing: "0.05em", textTransform: "uppercase",
};

export const btnPrimary = {
  padding: "9px 18px", background: _.ac, color: "#fff", border: "none", borderRadius: _.rSm,
  fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.15s ease",
  display: "inline-flex", alignItems: "center", gap: 6,
};

export const btnSecondary = {
  ...btnPrimary, background: _.surface, color: _.body, border: `1.5px solid ${_.line}`,
};

export const btnGhost = {
  ...btnPrimary, background: "transparent", color: _.body, padding: "9px 12px",
};

export const badge = (c) => ({
  fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: _.rFull, background: `${c}14`, color: c,
});

export const stCol = s =>
  s === "Active" || s === "Invoiced" ? _.green
  : s === "Approved" ? _.blue
  : s === "Complete" ? _.ac
  : s === "Quoted" ? _.violet
  // Legacy compat
  : s === "Quote" ? _.violet
  : _.amber;

export const stBg = () => _.well;
