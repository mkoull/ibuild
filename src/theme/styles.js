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
  let clientName = pr.client;
  if (!clientName && pr.clientId && clients) {
    const c = clients.find(cl => cl.id === pr.clientId);
    if (c) clientName = c.displayName;
  }
  return clientName ? (pr.suburb ? `${clientName} — ${pr.suburb}` : clientName) : "New Project";
};

export const input = {
  width: "100%", padding: "9px 12px", background: _.well, border: "1.5px solid transparent",
  borderRadius: _.rSm, color: _.ink, fontSize: _.fontSize.md, fontFamily: "inherit", outline: "none",
  transition: "border-color 0.15s ease",
};

export const label = {
  fontSize: _.fontSize.caption, color: _.muted, marginBottom: 5, display: "block", fontWeight: _.fontWeight.semi,
  letterSpacing: _.letterSpacing.wide, textTransform: "uppercase",
};

export const btnPrimary = {
  padding: "9px 18px", background: _.ac, color: "#fff", border: "none", borderRadius: _.rSm,
  fontSize: _.fontSize.base, fontWeight: _.fontWeight.semi, cursor: "pointer", transition: "background 0.15s ease",
  display: "inline-flex", alignItems: "center", gap: 6,
};

export const btnSecondary = {
  ...btnPrimary, background: _.surface, color: _.body, border: `1.5px solid ${_.line}`,
};

export const btnGhost = {
  ...btnPrimary, background: "transparent", color: _.body, padding: "9px 12px",
};

export const badge = (c) => ({
  fontSize: _.fontSize.caption, fontWeight: _.fontWeight.semi, padding: "3px 10px", borderRadius: _.rFull, background: `${c}14`, color: c,
});

export const stCol = s =>
  s === "Active" || s === "Invoiced" ? _.green
  : s === "Approved" ? _.blue
  : s === "Complete" ? _.ac
  : s === "Quoted" ? _.violet
  : s === "Quote" ? _.violet
  : _.amber;

export const stBg = () => _.well;

export const focusRing = {
  outline: "none",
  boxShadow: _.focusRing,
  borderColor: _.ac,
};

export const btnDanger = {
  ...btnPrimary, background: _.red,
};

export const card = {
  background: _.surface,
  border: `1px solid ${_.line}`,
  borderRadius: _.r,
  boxShadow: _.sh1,
  padding: _.s6,
};
