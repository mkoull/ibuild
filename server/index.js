import { createApp } from "./app.js";

const PORT = process.env.PORT || 3001;
const app = createApp();

app.listen(PORT, () => {
  console.log(`iBuild server running on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("  → Stub mode (no ANTHROPIC_API_KEY). Set it for live AI analysis.");
  } else {
    console.log("  → Live mode (ANTHROPIC_API_KEY set)");
  }
});
