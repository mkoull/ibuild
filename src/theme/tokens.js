// ═══ DESIGN TOKENS ═══
const _ = {
  // Surfaces
  bg: "#F5F6F8",
  surface: "#ffffff",
  raised: "#ffffff",
  well: "#f0f1f3",
  sidebar: "#ECEDF0",
  // Borders
  line: "#e5e7eb",
  line2: "#d1d5db",
  // Text hierarchy
  ink: "#0f172a",
  body: "#475569",
  muted: "#94a3b8",
  faint: "#cbd5e1",
  // Accent
  ac: "#2563eb",
  acDark: "#1d4ed8",
  // Semantic
  green: "#10b981",
  red: "#ef4444",
  amber: "#f59e0b",
  blue: "#3b82f6",
  violet: "#8b5cf6",
  // Spacing
  s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s7: 32, s8: 40, s9: 48, s10: 64,
  // Radius
  r: "8px", rMd: "6px", rSm: "5px", rXs: "3px", rFull: "999px",
  // Shadows
  sh1: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
  sh2: "0 2px 6px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
  sh3: "0 4px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
  // Focus
  focusRing: "0 0 0 2px #2563eb30",
  // Transition
  tr: "0.15s ease",
  // Overlay
  overlay: "rgba(0,0,0,0.35)",

  // ─── Typography ───
  fontSize: {
    xs: 10,
    caption: 11,
    sm: 12,
    base: 13,
    md: 14,
    lg: 16,
    unit: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
    "4xl": 40,
    stat: 48,
    display: 72,
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semi: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.1,
    heading: 1.2,
    snug: 1.35,
    body: 1.5,
  },
  letterSpacing: {
    tight: "-0.03em",
    normal: "0",
    wide: "0.04em",
    wider: "0.06em",
  },
};

export default _;
