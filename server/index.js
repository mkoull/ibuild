import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// ─── POST /api/floorplan/analyse ───
app.post("/api/floorplan/analyse", upload.single("file"), async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // If no file uploaded
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const b64 = req.file.buffer.toString("base64");
  const mediaType = req.file.mimetype || "image/png";

  // ── Live mode: call Anthropic ──
  if (apiKey) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "base64", media_type: mediaType, data: b64 },
                },
                {
                  type: "text",
                  text: `Analyse this floor plan image. Return STRICT JSON only (no markdown, no code fences).

Format:
{
  "total_m2": <number>,
  "rooms": [{ "name": "<string>", "m2": <number> }],
  "notes": "<string>",
  "scope_items": [
    { "category": "<string>", "item": "<string>", "unit": "<string>", "rate": <number>, "qty": <number> }
  ]
}

For scope_items, suggest construction line items that would be needed based on what you see in the plan. Use realistic Australian construction rates. Categories should match: Preliminaries, Demolition & Earthworks, Concrete & Slab, Framing & Structure, Roofing & Cladding, Windows & Doors, Electrical, Plumbing & Gas, Internal Linings, Kitchen, Bathroom & Ensuite, Painting & Finishes, External & Landscaping.`,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Anthropic API error:", response.status, errText);
        return res.status(502).json({ error: `Anthropic API returned ${response.status}` });
      }

      const data = await response.json();
      const text = data.content?.map((b) => b.text || "").join("") || "";
      const cleaned = text.replace(/```json|```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return res.status(502).json({ error: "Failed to parse AI response", raw: cleaned });
      }

      return res.json(parsed);
    } catch (err) {
      console.error("Anthropic request failed:", err.message);
      return res.status(502).json({ error: "Request to Anthropic failed: " + err.message });
    }
  }

  // ── Stub mode: no API key ──
  console.log("Stub mode — ANTHROPIC_API_KEY not set");
  return res.json({
    total_m2: 185,
    rooms: [
      { name: "Living / Dining", m2: 42 },
      { name: "Kitchen", m2: 18 },
      { name: "Master Bedroom", m2: 16 },
      { name: "Bedroom 2", m2: 12 },
      { name: "Bedroom 3", m2: 12 },
      { name: "Bathroom", m2: 8 },
      { name: "Ensuite", m2: 6 },
      { name: "Laundry", m2: 5 },
      { name: "Entry / Hall", m2: 14 },
      { name: "Garage", m2: 36 },
      { name: "Alfresco", m2: 16 },
    ],
    notes: "Stub mode — set ANTHROPIC_API_KEY for real analysis. Sample 3-bed single-storey plan.",
    scope_items: [
      { category: "Concrete & Slab", item: "Waffle Pod Slab", unit: "m²", rate: 165, qty: 185 },
      { category: "Framing & Structure", item: "Timber Frame (Single)", unit: "m²", rate: 110, qty: 185 },
      { category: "Roofing & Cladding", item: "Colorbond Roofing", unit: "m²", rate: 68, qty: 210 },
      { category: "Windows & Doors", item: "Windows (Standard)", unit: "each", rate: 850, qty: 8 },
      { category: "Windows & Doors", item: "Sliding Doors (3m)", unit: "each", rate: 3500, qty: 1 },
      { category: "Electrical", item: "Rough-In", unit: "points", rate: 120, qty: 45 },
      { category: "Plumbing & Gas", item: "Rough-In", unit: "points", rate: 450, qty: 12 },
      { category: "Kitchen", item: "Cabinetry (Premium)", unit: "lm", rate: 2200, qty: 6 },
      { category: "Bathroom & Ensuite", item: "Bathroom (Premium)", unit: "each", rate: 32000, qty: 1 },
      { category: "Bathroom & Ensuite", item: "Ensuite (Premium)", unit: "each", rate: 28000, qty: 1 },
      { category: "Painting & Finishes", item: "Internal Paint", unit: "m²", rate: 18, qty: 420 },
    ],
  });
});

app.listen(PORT, () => {
  console.log(`iBuild server running on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("  → Stub mode (no ANTHROPIC_API_KEY). Set it for live AI analysis.");
  } else {
    console.log("  → Live mode (ANTHROPIC_API_KEY set)");
  }
});
