import { Router } from "express";

const router = Router();

function fallbackFromDescription(description = "") {
  const d = String(description || "").toLowerCase();
  const hasGarage = d.includes("garage");
  const hasBedroom = d.includes("bedroom");
  const hasResidential = d.includes("residential") || hasBedroom;

  const base = [
    {
      name: "Concrete",
      items: [
        { description: "Slab", unit: "m²", rate: 165, qty: hasResidential ? 180 : 90 },
        { description: "Footings", unit: "lm", rate: 95, qty: hasResidential ? 120 : 60 },
      ],
    },
    {
      name: "Framing",
      items: [
        { description: "Timber framing", unit: "m²", rate: 120, qty: hasResidential ? 180 : 90 },
        { description: "Structural beams", unit: "unit", rate: 650, qty: 6 },
      ],
    },
    {
      name: "Electrical",
      items: [
        { description: "Wiring", unit: "hour", rate: 95, qty: hasResidential ? 45 : 24 },
        { description: "Switchboard", unit: "unit", rate: 2300, qty: 1 },
      ],
    },
  ];

  if (hasGarage) {
    base.push({
      name: "Garage",
      items: [
        { description: "Garage door", unit: "unit", rate: 2800, qty: 1 },
        { description: "Garage slab prep", unit: "m²", rate: 75, qty: 36 },
      ],
    });
  }

  return base;
}

function parseAiText(text) {
  if (!text) return [];
  const cleaned = String(text).replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed?.categories)) return parsed.categories;
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return [];
  }
  return [];
}

router.post("/generate", async (req, res) => {
  const description = String(req.body?.description || "").trim();
  if (!description) return res.status(400).json({ error: "Project description is required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.json({ categories: fallbackFromDescription(description), source: "stub" });
  }

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
        max_tokens: 1400,
        messages: [
          {
            role: "user",
            content: `Create an estimate structure for this project description: "${description}".

Return STRICT JSON only (no markdown):
{
  "categories": [
    {
      "name": "Category name",
      "items": [
        { "description": "Line item", "unit": "m²|m³|unit|hour", "rate": 0, "qty": 1 }
      ]
    }
  ]
}

Use realistic Australian-style category naming and keep it concise.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Estimate assistant API error:", response.status, errText);
      return res.status(502).json({ error: `Anthropic API returned ${response.status}` });
    }

    const data = await response.json();
    const text = data.content?.map((b) => b.text || "").join("") || "";
    const categories = parseAiText(text);
    if (!categories.length) {
      return res.json({ categories: fallbackFromDescription(description), source: "fallback" });
    }
    return res.json({ categories, source: "anthropic" });
  } catch (err) {
    console.error("Estimate assistant request failed:", err.message);
    return res.json({ categories: fallbackFromDescription(description), source: "fallback" });
  }
});

export default router;
